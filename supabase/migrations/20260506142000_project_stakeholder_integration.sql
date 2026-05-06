
-- ============================================================
-- PROJECT-STAKEHOLDER INTEGRATION
-- ============================================================

-- Add client_id to projects
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'client_id') THEN
    ALTER TABLE public.projects ADD COLUMN client_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Migration script: Match existing client_name strings to stakeholders
UPDATE public.projects p
SET client_id = s.id
FROM public.stakeholders s
WHERE p.client_id IS NULL 
  AND LOWER(TRIM(p.client_name)) = LOWER(TRIM(s.organization_name))
  AND s.type = 'client';

-- Comment: client_name is kept for legacy/audit purposes but client_id becomes the source of truth.
