-- Migration: WBS Manpower Resource Management
-- Objective: Support linking labor roles to tasks and calculating man-hours.

-- 1. Labor Catalog (Project-scoped standardized roles)
CREATE TABLE IF NOT EXISTS public.labor_catalogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    standard_rate DECIMAL(12,2) DEFAULT 0, -- Standard hourly rate for this role
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for project filtering
CREATE INDEX IF NOT EXISTS idx_labor_catalogs_project ON public.labor_catalogs(project_id);

-- 2. Task Resource Assignments
CREATE TABLE IF NOT EXISTS public.task_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    labor_role_id UUID NOT NULL REFERENCES public.labor_catalogs(id) ON DELETE CASCADE,
    planned_count INTEGER NOT NULL DEFAULT 1, -- e.g., 2 Welders
    planned_man_hours DECIMAL(12,2) NOT NULL DEFAULT 0,
    actual_man_hours DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for task-based lookup
CREATE INDEX IF NOT EXISTS idx_task_resources_task ON public.task_resources(task_id);

-- 3. RLS Policies
ALTER TABLE public.labor_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_resources ENABLE ROW LEVEL SECURITY;

-- Policies for labor_catalogs
CREATE POLICY "Users can view labor catalogs for their projects"
    ON public.labor_catalogs FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_id = labor_catalogs.project_id AND user_id = auth.uid()));

CREATE POLICY "Admins and PMs can manage labor catalogs"
    ON public.labor_catalogs FOR ALL
    USING (EXISTS (SELECT 1 FROM public.project_members WHERE project_id = labor_catalogs.project_id AND user_id = auth.uid() AND role IN ('admin', 'project_manager')));

-- Policies for task_resources
CREATE POLICY "Users can view task resources for their projects"
    ON public.task_resources FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.tasks t
        JOIN public.project_members pm ON pm.project_id = t.project_id
        WHERE t.id = task_resources.task_id AND pm.user_id = auth.uid()
    ));

CREATE POLICY "Admins and PMs can manage task resources"
    ON public.task_resources FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.tasks t
        JOIN public.project_members pm ON pm.project_id = t.project_id
        WHERE t.id = task_resources.task_id AND pm.user_id = auth.uid() AND pm.role IN ('admin', 'project_manager')
    ));

-- 4. Automatic calculation of man-hours (optional trigger)
-- If duration * count = man_hours is a strict rule, we can automate it.
-- However, many industries have non-linear man-hour rules.
-- For now, we'll keep them as independent fields but provide a helper function.

CREATE OR REPLACE FUNCTION public.calculate_task_man_hours()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_task_resources_updated
    BEFORE UPDATE ON public.task_resources
    FOR EACH ROW EXECUTE FUNCTION public.calculate_task_man_hours();
