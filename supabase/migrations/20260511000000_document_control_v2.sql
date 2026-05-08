-- ============================================================
-- DOCUMENT CONTROL SYSTEM V2 UPGRADE
-- Refining status, types, and engine integration
-- ============================================================

-- 1. Update Document Status Enum
-- Note: We add values to the existing public.document_status enum.
ALTER TYPE public.document_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.document_status ADD VALUE IF NOT EXISTS 'approved_with_comment';
ALTER TYPE public.document_status ADD VALUE IF NOT EXISTS 'archived';

-- 2. Link Documents to Master Tables
ALTER TABLE public.documents 
  ADD COLUMN IF NOT EXISTS document_type_id UUID REFERENCES public.document_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discipline_id UUID REFERENCES public.disciplines(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_documents_discipline_id ON public.documents(discipline_id);

-- 3. Enhance Document Versions (Revisions)
ALTER TABLE public.document_versions
  ADD COLUMN IF NOT EXISTS status public.document_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revision_code TEXT; -- e.g. '01', 'A', 'P1'

CREATE INDEX IF NOT EXISTS idx_document_versions_status ON public.document_versions(status);

-- 4. Utility Function for Document Numbering (Basic implementation)
-- This can be expanded based on specific project rules later.
CREATE OR REPLACE FUNCTION public.generate_document_number(
  _project_id UUID,
  _discipline_code TEXT,
  _type_code TEXT,
  _wbs_code TEXT,
  _sequence INT
) RETURNS TEXT AS $$
DECLARE
  v_project_code TEXT;
BEGIN
  SELECT project_code INTO v_project_code FROM public.projects WHERE id = _project_id;
  RETURN v_project_code || '-' || _discipline_code || '-' || _type_code || '-' || COALESCE(_wbs_code, 'GEN') || '-' || LPAD(_sequence::text, 4, '0');
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Data Migration (Optional/Best Effort)
-- Try to map existing text discipline/category to IDs
UPDATE public.documents d
SET discipline_id = disc.id
FROM public.disciplines disc
WHERE d.discipline = disc.name OR d.discipline = disc.code
AND d.discipline_id IS NULL;

UPDATE public.documents d
SET document_type_id = dt.id
FROM public.document_types dt
WHERE d.category = dt.name OR d.category = dt.code
AND d.document_type_id IS NULL;

-- 6. Transmittal Enhancement
ALTER TABLE public.transmittals
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 7. Add Comments
COMMENT ON COLUMN public.document_versions.status IS 'The status of this specific revision.';
COMMENT ON COLUMN public.document_versions.revision_code IS 'The alphanumeric code for this revision (e.g., 01, A).';
