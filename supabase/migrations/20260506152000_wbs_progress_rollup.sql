
-- ============================================================
-- WBS PROGRESS ROLL-UP SYSTEM
-- ============================================================

-- 1. Add progress column to WBS nodes
ALTER TABLE public.wbs_nodes 
  ADD COLUMN IF NOT EXISTS progress_pct NUMERIC(5,2) DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100);

-- 2. Function to roll up progress from children (Tasks and Child Nodes)
CREATE OR REPLACE FUNCTION public.wbs_roll_up_node_progress(v_node_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id UUID;
  v_task_avg NUMERIC;
  v_node_avg NUMERIC;
  v_total_avg NUMERIC;
  v_task_count INT;
  v_node_count INT;
BEGIN
  -- 1. Get averages from children
  SELECT AVG(progress_pct), COUNT(*) INTO v_task_avg, v_task_count 
  FROM public.tasks WHERE wbs_node_id = v_node_id;

  SELECT AVG(progress_pct), COUNT(*) INTO v_node_avg, v_node_count 
  FROM public.wbs_nodes WHERE parent_id = v_node_id;

  -- 2. Combine averages (weighted by count of children)
  IF (v_task_count + v_node_count) > 0 THEN
    v_total_avg := (COALESCE(v_task_avg * v_task_count, 0) + COALESCE(v_node_avg * v_node_count, 0)) 
                   / (v_task_count + v_node_count);
  ELSE
    v_total_avg := 0;
  END IF;

  -- 3. Update the current node
  UPDATE public.wbs_nodes 
  SET progress_pct = ROUND(v_total_avg, 2),
      updated_at = now()
  WHERE id = v_node_id;

  -- 4. Recursively roll up to parent
  SELECT parent_id INTO v_parent_id FROM public.wbs_nodes WHERE id = v_node_id;
  IF v_parent_id IS NOT NULL THEN
    PERFORM public.wbs_roll_up_node_progress(v_parent_id);
  END IF;
END;
$$;

-- 3. Trigger Function for Tasks
CREATE OR REPLACE FUNCTION public.trg_fn_task_progress_rollup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.progress_pct IS DISTINCT FROM NEW.progress_pct) OR (TG_OP = 'INSERT') THEN
    IF NEW.wbs_node_id IS NOT NULL THEN
      PERFORM public.wbs_roll_up_node_progress(NEW.wbs_node_id);
    END IF;
  ELSIF (TG_OP = 'DELETE' AND OLD.wbs_node_id IS NOT NULL) THEN
    PERFORM public.wbs_roll_up_node_progress(OLD.wbs_node_id);
  END IF;
  RETURN NULL;
END;
$$;

-- 4. Trigger Function for WBS Nodes (when a child node's progress changes)
CREATE OR REPLACE FUNCTION public.trg_fn_wbs_progress_rollup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- We only trigger if the progress_pct itself changed. 
  -- The function handles recursion, so we only need to call it for the PARENT.
  IF (OLD.progress_pct IS DISTINCT FROM NEW.progress_pct) AND NEW.parent_id IS NOT NULL THEN
    -- Note: We don't call roll_up on NEW.id because NEW.id is what just changed.
    -- We call it on the parent to reflect this change upwards.
    PERFORM public.wbs_roll_up_node_progress(NEW.parent_id);
  END IF;
  RETURN NULL;
END;
$$;

-- 5. Attach Triggers
DROP TRIGGER IF EXISTS trg_task_progress_rollup ON public.tasks;
CREATE TRIGGER trg_task_progress_rollup
AFTER INSERT OR UPDATE OF progress_pct OR DELETE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_task_progress_rollup();

DROP TRIGGER IF EXISTS trg_wbs_progress_rollup ON public.wbs_nodes;
CREATE TRIGGER trg_wbs_progress_rollup
AFTER UPDATE OF progress_pct ON public.wbs_nodes
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_wbs_progress_rollup();

-- 6. Initial Roll-up (Optional: run this to sync existing data)
-- SELECT public.wbs_roll_up_node_progress(id) FROM public.wbs_nodes WHERE parent_id IS NULL;

COMMENT ON COLUMN public.wbs_nodes.progress_pct IS 'Automated completion percentage rolled up from tasks and child nodes.';
