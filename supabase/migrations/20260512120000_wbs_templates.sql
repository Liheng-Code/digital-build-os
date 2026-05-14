-- Migration: WBS Templates
-- Objective: Allow users to define standard WBS structures and reusable activity libraries.

-- 1. Root Template
CREATE TABLE IF NOT EXISTS public.wbs_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    industry_type TEXT, -- e.g., 'Residential', 'Infrastructure'
    created_by UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT false, -- If true, available to all projects in the organization
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Template Nodes (Hierarchy)
CREATE TABLE IF NOT EXISTS public.wbs_template_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.wbs_templates(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.wbs_template_nodes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    node_type TEXT NOT NULL DEFAULT 'zone',
    sort_order INTEGER DEFAULT 0,
    depth INTEGER DEFAULT 0,
    path TEXT[] DEFAULT '{}'::TEXT[]
);

-- Index for hierarchy traversal
CREATE INDEX IF NOT EXISTS idx_wbs_template_nodes_hierarchy ON public.wbs_template_nodes(template_id, parent_id);

-- 3. Template Tasks (Standard Activities)
CREATE TABLE IF NOT EXISTS public.wbs_template_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_node_id UUID NOT NULL REFERENCES public.wbs_template_nodes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    default_duration_days INTEGER DEFAULT 1,
    estimated_hours DECIMAL(12,2) DEFAULT 0,
    description TEXT,
    category TEXT
);

-- 4. RLS Policies
ALTER TABLE public.wbs_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wbs_template_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wbs_template_tasks ENABLE ROW LEVEL SECURITY;

-- Simple organization-wide access for templates (assuming organizations are handled via project memberships)
-- For now, all authenticated users can view/use templates, but only admins can create them.

CREATE POLICY "All users can view WBS templates"
    ON public.wbs_templates FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage WBS templates"
    ON public.wbs_templates FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "All users can view template nodes"
    ON public.wbs_template_nodes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage template nodes"
    ON public.wbs_template_nodes FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "All users can view template tasks"
    ON public.wbs_template_tasks FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage template tasks"
    ON public.wbs_template_tasks FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
