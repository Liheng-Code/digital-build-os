
-- ============================================================
-- RFI (REQUEST FOR INFORMATION) MODULE
-- ============================================================

-- 1. RFI Status Enum
CREATE TYPE public.rfi_status AS ENUM ('draft', 'open', 'answered', 'closed', 'void');
CREATE TYPE public.rfi_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- 2. RFI Table
CREATE TABLE public.rfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  wbs_node_id UUID REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  rfi_number TEXT NOT NULL, -- e.g. RFI-ARC-001
  subject TEXT NOT NULL,
  question TEXT NOT NULL,
  suggested_solution TEXT,
  discipline TEXT NOT NULL, -- ARC, STR, MEP, etc.
  priority public.rfi_priority NOT NULL DEFAULT 'medium',
  status public.rfi_status NOT NULL DEFAULT 'open',
  
  -- Impact Flags
  schedule_impact BOOLEAN DEFAULT false,
  cost_impact BOOLEAN DEFAULT false,
  
  due_date DATE,
  assigned_to_stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  UNIQUE(project_id, rfi_number)
);

-- 3. RFI Responses (The thread)
CREATE TABLE public.rfi_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfi_id UUID NOT NULL REFERENCES public.rfis(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  is_official_answer BOOLEAN DEFAULT false,
  responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. RFI Attachments
CREATE TABLE public.rfi_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfi_id UUID NOT NULL REFERENCES public.rfis(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. RLS Policies
ALTER TABLE public.rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfi_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfi_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view RFIs" 
  ON public.rfis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized users can manage RFIs" 
  ON public.rfis FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'project_manager') OR has_role(auth.uid(), 'engineer') OR has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Authenticated users can view RFI responses" 
  ON public.rfi_responses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized users can add responses" 
  ON public.rfi_responses FOR INSERT TO authenticated 
  WITH CHECK (true); -- Filtered by app logic for specific stakeholders

CREATE POLICY "Authenticated users can view RFI attachments" 
  ON public.rfi_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized users can upload RFI attachments" 
  ON public.rfi_attachments FOR INSERT TO authenticated 
  WITH CHECK (true);

-- 6. Audit Triggers
CREATE TRIGGER trg_audit_rfis AFTER INSERT OR UPDATE OR DELETE ON public.rfis FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
CREATE TRIGGER trg_rfis_updated_at BEFORE UPDATE ON public.rfis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Add Comments
COMMENT ON TABLE public.rfis IS 'Request for Information tracking system linking site queries to design teams.';
COMMENT ON COLUMN public.rfis.schedule_impact IS 'Flag indicating if this RFI will cause a delay to the baseline schedule.';
