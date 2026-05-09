-- WBS Phase 1: Scheduling Core (reduced scope: constraints, CPM, saved views)

-- 1. Constraint type enum
DO $$ BEGIN
  CREATE TYPE schedule_constraint_type AS ENUM (
    'ASAP', 'ALAP', 'SNET', 'SNLT', 'FNET', 'FNLT', 'MSO', 'MFO'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add constraint columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS constraint_type schedule_constraint_type;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS constraint_date date;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline_date date;

-- 3. Saved views table
CREATE TABLE IF NOT EXISTS wbs_saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}',
  zoom text NOT NULL DEFAULT 'day',
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wbs_saved_views ENABLE ROW LEVEL SECURITY;

-- RLS: users can read own views + shared views; insert/update/delete own
DO $$ BEGIN
  CREATE POLICY wbs_saved_views_select ON wbs_saved_views
    FOR SELECT USING (user_id = auth.uid() OR is_shared = true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY wbs_saved_views_insert ON wbs_saved_views
    FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY wbs_saved_views_update ON wbs_saved_views
    FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY wbs_saved_views_delete ON wbs_saved_views
    FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_wbs_saved_views_project ON wbs_saved_views(project_id);
CREATE INDEX IF NOT EXISTS idx_wbs_saved_views_user ON wbs_saved_views(user_id);
