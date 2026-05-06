
-- ============================================================
-- DOCUMENT CONTROL SYSTEM UPGRADE
-- ============================================================

-- 1. Enums for Document Status
CREATE TYPE public.document_status AS ENUM (
  'draft',
  'submitted',
  'reviewing',
  'approved',
  'for_construction',
  'superseded'
);

-- 2. Enhance Documents Table
ALTER TABLE public.documents 
  ADD COLUMN IF NOT EXISTS wbs_node_id UUID REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS document_number TEXT,
  ADD COLUMN IF NOT EXISTS status public.document_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS discipline TEXT, -- e.g., 'ARC', 'STR', 'MEP'
  ADD COLUMN IF NOT EXISTS revision TEXT DEFAULT '00';

CREATE INDEX IF NOT EXISTS idx_documents_wbs ON public.documents(wbs_node_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);

-- 3. Transmittal System
CREATE TABLE public.transmittals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  transmittal_number TEXT NOT NULL,
  subject TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_id UUID NOT NULL REFERENCES public.stakeholders(id), -- Linked to a stakeholder organization/contact
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'received', 'acknowledged'
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, transmittal_number)
);

CREATE TABLE public.transmittal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transmittal_id UUID NOT NULL REFERENCES public.transmittals(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES public.document_versions(id) ON DELETE CASCADE,
  purpose TEXT, -- 'for_review', 'for_information', 'for_construction'
  UNIQUE(transmittal_id, document_id)
);

-- 4. RLS for Transmittals
ALTER TABLE public.transmittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transmittal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users view transmittals" 
  ON public.transmittals FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and PMs create transmittals" 
  ON public.transmittals FOR INSERT TO authenticated 
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'project_manager'));

CREATE POLICY "Authenticated users view transmittal items" 
  ON public.transmittal_items FOR SELECT TO authenticated USING (true);

-- 5. Audit Logging Triggers
CREATE TRIGGER trg_audit_transmittals
AFTER INSERT OR UPDATE OR DELETE ON public.transmittals
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER trg_audit_transmittal_items
AFTER INSERT OR UPDATE OR DELETE ON public.transmittal_items
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- 6. Trigger for updated_at
CREATE TRIGGER trg_transmittals_updated_at
BEFORE UPDATE ON public.transmittals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Add comments
COMMENT ON TABLE public.transmittals IS 'Formal document distribution records between project parties.';
COMMENT ON COLUMN public.documents.wbs_node_id IS 'Links document to a specific project location in the WBS.';
