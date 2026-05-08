-- Migration: Project Closure (Handover & DLP)
-- Created: 2026-05-08

-- 1. Handover Packages
CREATE TABLE IF NOT EXISTS handover_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft', -- draft, submitted, approved, closed
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Handover Items / Checklist
CREATE TABLE IF NOT EXISTS handover_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES handover_packages(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- om_manual, as_built, warranty, spare_part, training, key
    title TEXT NOT NULL,
    reference_id UUID, -- Optional link to a document or other entity
    status TEXT DEFAULT 'pending', -- pending, provided, verified, rejected
    remarks TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Defect Liability Period (DLP) Defects
CREATE TABLE IF NOT EXISTS dlp_defects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    wbs_node_id UUID REFERENCES wbs_nodes(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'reported', -- reported, in_progress, fixed, verified, closed
    priority TEXT DEFAULT 'medium', -- low, medium, high, critical
    reported_by UUID REFERENCES auth.users(id),
    contractor_id UUID REFERENCES stakeholders(id),
    due_date DATE,
    fixed_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Warranty Register
CREATE TABLE IF NOT EXISTS warranty_register (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    provider_id UUID REFERENCES stakeholders(id),
    start_date DATE,
    duration_months INTEGER,
    end_date DATE,
    status TEXT DEFAULT 'active', -- active, expired, void
    certificate_url TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE handover_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlp_defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_register ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Allow authenticated access" ON handover_packages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON handover_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON dlp_defects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON warranty_register FOR ALL TO authenticated USING (true) WITH CHECK (true);
