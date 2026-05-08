-- Allow business modules to open and close generic approval workflows
-- from normal frontend flows while keeping approval history append-oriented.

CREATE OR REPLACE FUNCTION public.get_module_approvers(_project_id UUID, _roles TEXT[])
RETURNS SETOF UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ur.user_id
  FROM public.user_roles ur
  WHERE ur.role::text = ANY(_roles)
    AND (
      _project_id IS NULL
      OR ur.role = 'admin'
      OR EXISTS (
        SELECT 1
        FROM public.project_members pm
        WHERE pm.project_id = _project_id
          AND pm.user_id = ur.user_id
      )
    )
  ORDER BY ur.user_id;
$$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can create own approval_instances"
    ON public.approval_instances
    FOR INSERT TO authenticated
    WITH CHECK (requested_by = auth.uid() OR requested_by IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Requesters can create approval_steps"
    ON public.approval_steps
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.approval_instances ai
        WHERE ai.id = approval_instance_id
          AND (ai.requested_by = auth.uid() OR ai.requested_by IS NULL)
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Assigned approvers can update approval_instances"
    ON public.approval_instances
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.approval_steps s
        WHERE s.approval_instance_id = id
          AND s.assignee_user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
