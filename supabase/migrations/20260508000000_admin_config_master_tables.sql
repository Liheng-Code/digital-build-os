
-- ============================================================
-- MODULE 18: ADMIN CONFIGURATION — Master Data Tables
-- Per DCOS System Architecture Section 23
-- ============================================================

-- 1. Disciplines
CREATE TABLE IF NOT EXISTS public.disciplines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Project Types
CREATE TABLE IF NOT EXISTS public.project_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. WBS Node Types
CREATE TABLE IF NOT EXISTS public.wbs_node_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Document Types
CREATE TABLE IF NOT EXISTS public.document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT, -- e.g. drawing, specification, report, letter
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Cost Codes (hierarchical)
CREATE TABLE IF NOT EXISTS public.cost_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.cost_codes(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Material Codes
CREATE TABLE IF NOT EXISTS public.material_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Equipment Types
CREATE TABLE IF NOT EXISTS public.equipment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Public Holidays (company-wide)
CREATE TABLE IF NOT EXISTS public.public_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date DATE NOT NULL,
  label TEXT NOT NULL,
  is_recurring_yearly BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(holiday_date, label)
);

-- 9. Notification Rules
CREATE TABLE IF NOT EXISTS public.notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_code TEXT NOT NULL UNIQUE,
  event_label TEXT,
  recipient_strategy TEXT NOT NULL,
  channels TEXT NOT NULL DEFAULT 'in_app',
  priority TEXT NOT NULL DEFAULT 'normal',
  escalation_enabled BOOLEAN NOT NULL DEFAULT false,
  escalation_after_hours INT,
  escalation_roles TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Approval Templates
CREATE TABLE IF NOT EXISTS public.approval_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Checklist Templates (QA/QC + HSE)
CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('QAQC', 'HSE')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Labor Rates (company-wide)
CREATE TABLE IF NOT EXISTS public.labor_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  labor_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wbs_node_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labor_rates ENABLE ROW LEVEL SECURITY;

-- updated_at triggers
DO $$ BEGIN
  CREATE TRIGGER update_disciplines_updated_at BEFORE UPDATE ON public.disciplines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_project_types_updated_at BEFORE UPDATE ON public.project_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_wbs_node_types_updated_at BEFORE UPDATE ON public.wbs_node_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_document_types_updated_at BEFORE UPDATE ON public.document_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_cost_codes_updated_at BEFORE UPDATE ON public.cost_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_material_codes_updated_at BEFORE UPDATE ON public.material_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_equipment_types_updated_at BEFORE UPDATE ON public.equipment_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_public_holidays_updated_at BEFORE UPDATE ON public.public_holidays FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_notification_rules_updated_at BEFORE UPDATE ON public.notification_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_approval_templates_updated_at BEFORE UPDATE ON public.approval_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_checklist_templates_updated_at BEFORE UPDATE ON public.checklist_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_labor_rates_updated_at BEFORE UPDATE ON public.labor_rates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies: authenticated read, admin write
CREATE POLICY "Authenticated users can view disciplines" ON public.disciplines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage disciplines" ON public.disciplines FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view project_types" ON public.project_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage project_types" ON public.project_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view wbs_node_types" ON public.wbs_node_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage wbs_node_types" ON public.wbs_node_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view document_types" ON public.document_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage document_types" ON public.document_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view cost_codes" ON public.cost_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage cost_codes" ON public.cost_codes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view material_codes" ON public.material_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage material_codes" ON public.material_codes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view equipment_types" ON public.equipment_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage equipment_types" ON public.equipment_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view public_holidays" ON public.public_holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage public_holidays" ON public.public_holidays FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view notification_rules" ON public.notification_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage notification_rules" ON public.notification_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view approval_templates" ON public.approval_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage approval_templates" ON public.approval_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view checklist_templates" ON public.checklist_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage checklist_templates" ON public.checklist_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view labor_rates" ON public.labor_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage labor_rates" ON public.labor_rates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed default disciplines (mirrors departmentMeta.ts)
INSERT INTO public.disciplines (code, name, sort_order) VALUES
  ('architecture', 'Architecture', 1),
  ('structure', 'Structural', 2),
  ('mep', 'MEP', 3),
  ('procurement', 'Procurement', 4),
  ('construction', 'Construction', 5)
ON CONFLICT (code) DO NOTHING;

-- Seed default project types
INSERT INTO public.project_types (code, name, sort_order) VALUES
  ('tender', 'Tender / Pre-Contract', 1),
  ('awarded', 'Awarded / Post-Contract', 2),
  ('internal', 'Internal', 3)
ON CONFLICT (code) DO NOTHING;

-- Seed default WBS node types
INSERT INTO public.wbs_node_types (code, name, icon, sort_order) VALUES
  ('building', 'Building', 'Building2', 1),
  ('level', 'Level', 'Layers', 2),
  ('zone', 'Zone', 'Grid3x3', 3),
  ('room', 'Room / Space', 'Door', 4),
  ('element', 'Element', 'Puzzle', 5),
  ('package', 'Work Package', 'Briefcase', 6),
  ('system', 'System', 'Folder', 7),
  ('area', 'Area', 'Map', 8),
  ('other', 'Other', 'Folder', 9)
ON CONFLICT (code) DO NOTHING;

-- Seed default document types (mirrors documentMeta.ts DOCUMENT_DISCIPLINES)
INSERT INTO public.document_types (code, name, category, sort_order) VALUES
  ('GEN', 'General', 'general', 1),
  ('ARC', 'Architecture', 'drawing', 2),
  ('STR', 'Structure', 'drawing', 3),
  ('MEP', 'MEP', 'drawing', 4),
  ('PLB', 'Plumbing', 'drawing', 5),
  ('ELC', 'Electrical', 'drawing', 6),
  ('CIV', 'Civil / Infrastructure', 'drawing', 7),
  ('QAQC', 'QA/QC', 'report', 8),
  ('HSE', 'Safety', 'report', 9),
  ('PRO', 'Procurement', 'report', 10),
  ('CON', 'Construction', 'report', 11)
ON CONFLICT (code) DO NOTHING;
