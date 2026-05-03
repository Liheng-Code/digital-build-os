
-- Enums
CREATE TYPE public.dsr_status AS ENUM ('draft','submitted','approved','rejected');
CREATE TYPE public.dsr_site_status AS ENUM ('working','partial','closed');
CREATE TYPE public.dsr_delay_category AS ENUM ('weather','material','inspection','design','labor','equipment','other');
CREATE TYPE public.dsr_severity AS ENUM ('low','med','high');

-- Helper: is editor (admin/PM/engineer/supervisor)
CREATE OR REPLACE FUNCTION public.is_dsr_editor(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT has_role(_uid,'admin'::app_role)
      OR has_role(_uid,'project_manager'::app_role)
      OR has_role(_uid,'engineer'::app_role)
      OR has_role(_uid,'supervisor'::app_role)
$$;

CREATE OR REPLACE FUNCTION public.is_dsr_approver(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT has_role(_uid,'admin'::app_role) OR has_role(_uid,'project_manager'::app_role)
$$;

-- Parent table
CREATE TABLE public.daily_site_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  report_date date NOT NULL,
  weather text,
  temperature_c numeric,
  site_status public.dsr_site_status NOT NULL DEFAULT 'working',
  general_notes text,
  status public.dsr_status NOT NULL DEFAULT 'draft',
  submitted_by uuid,
  submitted_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, report_date)
);
CREATE INDEX idx_dsr_project_date ON public.daily_site_reports(project_id, report_date DESC);

CREATE TABLE public.daily_manpower (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dsr_id uuid NOT NULL REFERENCES public.daily_site_reports(id) ON DELETE CASCADE,
  department department,
  trade_label text,
  planned_count int NOT NULL DEFAULT 0,
  actual_count int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_manpower_dsr ON public.daily_manpower(dsr_id);

CREATE TABLE public.daily_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dsr_id uuid NOT NULL REFERENCES public.daily_site_reports(id) ON DELETE CASCADE,
  equipment_name text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  hours_operated numeric NOT NULL DEFAULT 0,
  idle_hours numeric NOT NULL DEFAULT 0,
  idle_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_equipment_dsr ON public.daily_equipment(dsr_id);

CREATE TABLE public.daily_progress_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dsr_id uuid NOT NULL REFERENCES public.daily_site_reports(id) ON DELETE CASCADE,
  task_id uuid,
  wbs_node_id uuid,
  description text,
  qty_today numeric NOT NULL DEFAULT 0,
  qty_unit text,
  progress_pct_today int NOT NULL DEFAULT 0 CHECK (progress_pct_today BETWEEN 0 AND 100),
  cumulative_pct int NOT NULL DEFAULT 0 CHECK (cumulative_pct BETWEEN 0 AND 100),
  manpower_count int NOT NULL DEFAULT 0,
  hours_spent numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (task_id IS NOT NULL OR wbs_node_id IS NOT NULL)
);
CREATE INDEX idx_progress_dsr ON public.daily_progress_entries(dsr_id);
CREATE INDEX idx_progress_task ON public.daily_progress_entries(task_id);

CREATE TABLE public.daily_delays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dsr_id uuid NOT NULL REFERENCES public.daily_site_reports(id) ON DELETE CASCADE,
  category public.dsr_delay_category NOT NULL DEFAULT 'other',
  description text NOT NULL,
  impacted_task_id uuid,
  lost_hours numeric NOT NULL DEFAULT 0,
  severity public.dsr_severity NOT NULL DEFAULT 'low',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_delays_dsr ON public.daily_delays(dsr_id);

CREATE TABLE public.daily_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dsr_id uuid NOT NULL REFERENCES public.daily_site_reports(id) ON DELETE CASCADE,
  visitor_name text NOT NULL,
  organization text,
  purpose text,
  time_in time,
  time_out time,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_visitors_dsr ON public.daily_visitors(dsr_id);

CREATE TABLE public.dsr_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dsr_id uuid NOT NULL REFERENCES public.daily_site_reports(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  caption text,
  related_task_id uuid,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dsr_att_dsr ON public.dsr_attachments(dsr_id);

-- updated_at trigger on parent
CREATE TRIGGER trg_dsr_updated
BEFORE UPDATE ON public.daily_site_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lock approved reports against edits (except admin)
CREATE OR REPLACE FUNCTION public.dsr_lock_when_approved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF OLD.status = 'approved' AND NOT has_role(auth.uid(),'admin'::app_role) THEN
    -- allow no-op or only status going back through admin path
    IF NEW.status = 'approved' THEN
      RAISE EXCEPTION 'Approved daily reports are read-only';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_dsr_lock
BEFORE UPDATE ON public.daily_site_reports
FOR EACH ROW EXECUTE FUNCTION public.dsr_lock_when_approved();

-- Apply progress to tasks when DSR transitions to approved
CREATE OR REPLACE FUNCTION public.dsr_apply_progress_on_approve()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  rec RECORD;
  affected int := 0;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    FOR rec IN
      SELECT task_id, MAX(cumulative_pct) AS pct
      FROM public.daily_progress_entries
      WHERE dsr_id = NEW.id AND task_id IS NOT NULL
      GROUP BY task_id
    LOOP
      UPDATE public.tasks
      SET progress_pct = GREATEST(progress_pct, rec.pct),
          actual_start = COALESCE(actual_start, CASE WHEN rec.pct > 0 THEN NEW.report_date::timestamptz END),
          actual_end   = CASE WHEN rec.pct >= 100 THEN COALESCE(actual_end, NEW.report_date::timestamptz) ELSE actual_end END,
          updated_at   = now()
      WHERE id = rec.task_id;
      affected := affected + 1;
    END LOOP;

    INSERT INTO public.schedule_calculation_logs(project_id, triggered_by_user, trigger_reason, affected_count, payload)
    VALUES (NEW.project_id, auth.uid(), 'dsr_approved:'||NEW.id::text, affected, jsonb_build_object('dsr_id', NEW.id, 'report_date', NEW.report_date));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_dsr_apply_progress
AFTER UPDATE ON public.daily_site_reports
FOR EACH ROW EXECUTE FUNCTION public.dsr_apply_progress_on_approve();

-- RLS
ALTER TABLE public.daily_site_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_manpower ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_delays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dsr_attachments ENABLE ROW LEVEL SECURITY;

-- Parent policies
CREATE POLICY "DSR view all authed" ON public.daily_site_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "DSR insert by editors" ON public.daily_site_reports FOR INSERT TO authenticated
  WITH CHECK (public.is_dsr_editor(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "DSR update by editors when not locked, approve by approvers" ON public.daily_site_reports FOR UPDATE TO authenticated
  USING (
    (status <> 'approved' AND public.is_dsr_editor(auth.uid()))
    OR public.is_dsr_approver(auth.uid())
    OR has_role(auth.uid(),'admin'::app_role)
  );
CREATE POLICY "DSR delete admin/PM" ON public.daily_site_reports FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'project_manager'::app_role));

-- Child policy generator (same rules for all child tables)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['daily_manpower','daily_equipment','daily_progress_entries','daily_delays','daily_visitors','dsr_attachments']
  LOOP
    EXECUTE format($f$
      CREATE POLICY "%1$s view" ON public.%1$I FOR SELECT TO authenticated USING (true);
      CREATE POLICY "%1$s insert" ON public.%1$I FOR INSERT TO authenticated
        WITH CHECK (public.is_dsr_editor(auth.uid())
          AND EXISTS (SELECT 1 FROM public.daily_site_reports d WHERE d.id = dsr_id AND d.status <> 'approved'));
      CREATE POLICY "%1$s update" ON public.%1$I FOR UPDATE TO authenticated
        USING (public.is_dsr_editor(auth.uid())
          AND EXISTS (SELECT 1 FROM public.daily_site_reports d WHERE d.id = dsr_id AND d.status <> 'approved'));
      CREATE POLICY "%1$s delete" ON public.%1$I FOR DELETE TO authenticated
        USING (public.is_dsr_editor(auth.uid())
          AND EXISTS (SELECT 1 FROM public.daily_site_reports d WHERE d.id = dsr_id AND d.status <> 'approved'));
    $f$, t);
  END LOOP;
END $$;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('dsr-attachments','dsr-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "dsr att view" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'dsr-attachments');
CREATE POLICY "dsr att upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dsr-attachments' AND public.is_dsr_editor(auth.uid()));
CREATE POLICY "dsr att delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'dsr-attachments' AND public.is_dsr_editor(auth.uid()));
