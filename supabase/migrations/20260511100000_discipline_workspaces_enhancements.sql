-- Discipline Workspaces Enhancements (ARC/STR/MEP)

-- 1. Architecture Enhancements
ALTER TABLE architecture_room_data 
ADD COLUMN IF NOT EXISTS sanitary_fixtures text,
ADD COLUMN IF NOT EXISTS ironmongery_set text,
ADD COLUMN IF NOT EXISTS acoustic_rating text;

CREATE TABLE IF NOT EXISTS architecture_material_boards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    wbs_node_id uuid REFERENCES wbs_nodes(id) ON DELETE CASCADE,
    category text NOT NULL, -- Floor, Wall, Ceiling, Joinery, etc.
    material_name text NOT NULL,
    sample_reference text,
    photo_url text,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS architecture_window_schedule (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wbs_node_id uuid REFERENCES wbs_nodes(id) ON DELETE CASCADE,
    mark_number text NOT NULL,
    window_type text NOT NULL,
    width_mm integer,
    height_mm integer,
    glazing_type text,
    frame_finish text,
    status text DEFAULT 'draft',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Structural Enhancements
CREATE TABLE IF NOT EXISTS structural_calculation_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    wbs_node_id uuid REFERENCES wbs_nodes(id) ON DELETE CASCADE,
    reference_number text NOT NULL,
    title text NOT NULL,
    author text,
    revision text DEFAULT '0',
    status text DEFAULT 'draft',
    file_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS structural_model_register (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    software text NOT NULL, -- ETABS, SAFE, SAP2000, Revit, etc.
    model_name text NOT NULL,
    version text,
    last_run_date timestamptz,
    file_url text,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS structural_technical_queries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    wbs_node_id uuid REFERENCES wbs_nodes(id) ON DELETE CASCADE,
    query_number text NOT NULL,
    subject text NOT NULL,
    description text,
    response text,
    status text DEFAULT 'open',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. MEP Enhancements
CREATE TABLE IF NOT EXISTS mep_load_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    wbs_node_id uuid REFERENCES wbs_nodes(id) ON DELETE CASCADE,
    discipline text NOT NULL, -- E, M, P
    board_reference text NOT NULL,
    total_load_kw numeric,
    connected_load_kw numeric,
    diversity_factor numeric,
    status text DEFAULT 'draft',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mep_system_schematics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    system_type text NOT NULL, -- Single Line, Riser, Schematic, etc.
    reference_number text NOT NULL,
    title text NOT NULL,
    revision text DEFAULT '0',
    file_url text,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE architecture_material_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE architecture_window_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE structural_calculation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE structural_model_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE structural_technical_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mep_load_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE mep_system_schematics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view architecture_material_boards for their projects" ON architecture_material_boards
    FOR SELECT USING (project_id IN (SELECT id FROM projects));

CREATE POLICY "Users can view architecture_window_schedule for their projects" ON architecture_window_schedule
    FOR SELECT USING (wbs_node_id IN (SELECT id FROM wbs_nodes));

CREATE POLICY "Users can view structural_calculation_notes for their projects" ON structural_calculation_notes
    FOR SELECT USING (project_id IN (SELECT id FROM projects));

CREATE POLICY "Users can view structural_model_register for their projects" ON structural_model_register
    FOR SELECT USING (project_id IN (SELECT id FROM projects));

CREATE POLICY "Users can view structural_technical_queries for their projects" ON structural_technical_queries
    FOR SELECT USING (project_id IN (SELECT id FROM projects));

CREATE POLICY "Users can view mep_load_schedules for their projects" ON mep_load_schedules
    FOR SELECT USING (project_id IN (SELECT id FROM projects));

CREATE POLICY "Users can view mep_system_schematics for their projects" ON mep_system_schematics
    FOR SELECT USING (project_id IN (SELECT id FROM projects));

-- (Add similar INSERT/UPDATE policies if needed, typically PMs/Admins/Discipline Leads)
-- For now, allow authenticated users to insert/update for simplicity in MVP, 
-- but ideally restricted by role.
CREATE POLICY "Authenticated users can manage architecture_material_boards" ON architecture_material_boards
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage architecture_window_schedule" ON architecture_window_schedule
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage structural_calculation_notes" ON structural_calculation_notes
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage structural_model_register" ON structural_model_register
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage structural_technical_queries" ON structural_technical_queries
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage mep_load_schedules" ON mep_load_schedules
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage mep_system_schematics" ON mep_system_schematics
    FOR ALL USING (auth.role() = 'authenticated');
