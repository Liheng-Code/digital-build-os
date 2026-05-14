-- Migration: EVM Support
-- Objective: Add budgeted and actual cost fields to tasks and keep them updated via triggers.

-- 1. Add cost fields to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS budgeted_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(12,2) DEFAULT 0;

-- 2. Function to update task costs based on resources
CREATE OR REPLACE FUNCTION public.sync_task_costs_from_resources()
RETURNS TRIGGER AS $$
DECLARE
    v_task_id UUID;
BEGIN
    -- Determine which task to update
    IF TG_OP = 'DELETE' THEN
        v_task_id := OLD.task_id;
    ELSE
        v_task_id := NEW.task_id;
    END IF;

    -- Calculate total costs
    -- PV = planned_man_hours * standard_rate
    -- AC = actual_man_hours * standard_rate (simplified for now)
    UPDATE public.tasks
    SET 
        budgeted_cost = (
            SELECT COALESCE(SUM(tr.planned_man_hours * lc.standard_rate), 0)
            FROM public.task_resources tr
            JOIN public.labor_catalogs lc ON lc.id = tr.labor_role_id
            WHERE tr.task_id = v_task_id
        ),
        actual_cost = (
            SELECT COALESCE(SUM(COALESCE(tr.actual_man_hours, 0) * lc.standard_rate), 0)
            FROM public.task_resources tr
            JOIN public.labor_catalogs lc ON lc.id = tr.labor_role_id
            WHERE tr.task_id = v_task_id
        )
    WHERE id = v_task_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Triggers for task_resources
DROP TRIGGER IF EXISTS tr_sync_task_costs_on_resource_change ON public.task_resources;
CREATE TRIGGER tr_sync_task_costs_on_resource_change
    AFTER INSERT OR UPDATE OR DELETE ON public.task_resources
    FOR EACH ROW EXECUTE FUNCTION public.sync_task_costs_from_resources();

-- 4. Trigger for labor_catalogs (if standard_rate changes)
CREATE OR REPLACE FUNCTION public.sync_all_task_costs_on_rate_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.standard_rate IS DISTINCT FROM NEW.standard_rate THEN
        -- This is expensive but necessary if rates change
        UPDATE public.tasks t
        SET 
            budgeted_cost = (
                SELECT COALESCE(SUM(tr.planned_man_hours * lc.standard_rate), 0)
                FROM public.task_resources tr
                JOIN public.labor_catalogs lc ON lc.id = tr.labor_role_id
                WHERE tr.task_id = t.id
            ),
            actual_cost = (
                SELECT COALESCE(SUM(COALESCE(tr.actual_man_hours, 0) * lc.standard_rate), 0)
                FROM public.task_resources tr
                JOIN public.labor_catalogs lc ON lc.id = tr.labor_role_id
                WHERE tr.task_id = t.id
            )
        WHERE EXISTS (
            SELECT 1 FROM public.task_resources tr 
            WHERE tr.task_id = t.id AND tr.labor_role_id = NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_all_task_costs_on_rate_change ON public.labor_catalogs;
CREATE TRIGGER tr_sync_all_task_costs_on_rate_change
    AFTER UPDATE ON public.labor_catalogs
    FOR EACH ROW EXECUTE FUNCTION public.sync_all_task_costs_on_rate_change();
