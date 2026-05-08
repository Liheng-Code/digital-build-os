-- Migration: Architecture, Structural, and MEP Enhancements
-- Created: 2026-05-08

-- 1. Architecture Drawings Table
CREATE TABLE IF NOT EXISTS architecture_drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    wbs_node_id UUID REFERENCES wbs_nodes(id) ON DELETE SET NULL,
    drawing_number TEXT NOT NULL,
    title TEXT NOT NULL,
    revision TEXT DEFAULT '0',
    status TEXT DEFAULT 'preliminary',
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(project_id, drawing_number)
);

-- 2. Design Review Comments Table
CREATE TABLE IF NOT EXISTS design_review_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    comment TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    author_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Additional Structural Tables (if missing)
CREATE TABLE IF NOT EXISTS structural_design_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    parameter_name TEXT NOT NULL,
    parameter_value TEXT NOT NULL,
    unit TEXT,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS structural_load_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    wbs_node_id UUID REFERENCES wbs_nodes(id) ON DELETE SET NULL,
    load_case TEXT NOT NULL,
    magnitude_kn_m2 NUMERIC,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS structural_rebar_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    wbs_node_id UUID REFERENCES wbs_nodes(id) ON DELETE SET NULL,
    submittal_number TEXT NOT NULL,
    drawing_reference TEXT,
    status TEXT DEFAULT 'under_review',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Additional MEP Tables (if missing)
CREATE TABLE IF NOT EXISTS mep_load_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    wbs_node_id UUID REFERENCES wbs_nodes(id) ON DELETE SET NULL,
    discipline TEXT NOT NULL,
    board_reference TEXT NOT NULL,
    total_load_kw NUMERIC,
    connected_load_kw NUMERIC,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mep_system_schematics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    system_type TEXT NOT NULL,
    reference_number TEXT NOT NULL,
    title TEXT NOT NULL,
    revision TEXT DEFAULT '0',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, reference_number)
);

CREATE TABLE IF NOT EXISTS mep_material_submittals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    discipline TEXT NOT NULL,
    item_description TEXT NOT NULL,
    manufacturer TEXT,
    model_number TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE architecture_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE structural_design_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE structural_load_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE structural_rebar_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE mep_load_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE mep_system_schematics ENABLE ROW LEVEL SECURITY;
ALTER TABLE mep_material_submittals ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Allow authenticated access" ON architecture_drawings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON design_review_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON structural_design_criteria FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON structural_load_summaries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON structural_rebar_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON mep_load_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON mep_system_schematics FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON mep_material_submittals FOR ALL TO authenticated USING (true) WITH CHECK (true);
