-- ============================================================
-- MODULE 24: CROSS-MODULE CORE ENGINES
-- Audit v2, notification matrix, delivery logs, and generic approvals
-- ============================================================

-- ---------- Shared enums ----------
DO $$ BEGIN
  CREATE TYPE public.audit_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.audit_source_channel AS ENUM ('web', 'mobile', 'system', 'api', 'telegram');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_channel AS ENUM ('in_app', 'email', 'telegram', 'push', 'sms');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_status AS ENUM ('generated', 'queued', 'sent', 'delivered', 'read', 'actioned', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_kind AS ENUM ('information', 'action_required', 'reminder', 'escalation', 'system_alert', 'digest');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'task_submitted_for_review';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'task_overdue';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'document_submitted_for_review';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'document_approved';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'document_rejected';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'rfi_created';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'rfi_overdue';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'pr_approval_required';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'po_approved';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'ncr_created';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'ncr_overdue';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'safety_incident_reported';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'failed_login_repeated';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'role_permission_changed';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'approval_required';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'approval_overdue';

DO $$ BEGIN
  CREATE TYPE public.notification_delivery_status AS ENUM ('pending', 'sent', 'failed', 'retried', 'failed_permanently');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.approval_instance_status AS ENUM ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'cancelled', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.approval_step_status AS ENUM ('pending', 'active', 'approved', 'rejected', 'skipped', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.approval_action_type AS ENUM ('submit', 'approve', 'reject', 'delegate', 'comment', 'cancel', 'close');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------- Audit Log v2 ----------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  wbs_node_id UUID REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  module_code TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  action_type TEXT NOT NULL,
  action_label TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name_snapshot TEXT,
  user_role_snapshot TEXT,
  department_snapshot TEXT,
  old_values JSONB,
  new_values JSONB,
  changed_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  status_from TEXT,
  status_to TEXT,
  comment TEXT,
  reason_code TEXT,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  source_channel public.audit_source_channel NOT NULL DEFAULT 'web',
  severity public.audit_severity NOT NULL DEFAULT 'low',
  is_system_generated BOOLEAN NOT NULL DEFAULT false,
  correlation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project_created ON public.audit_logs (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module_action ON public.audit_logs (module_code, action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs (severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation ON public.audit_logs (correlation_id);

DO $$ BEGIN
  CREATE POLICY "Admins can view audit_logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert audit_logs" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR is_system_generated = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- No UPDATE / DELETE policies: audit_logs is append-only through RLS.

-- Keep the legacy audit_log table queryable by adding optional v2-compatible columns.
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS wbs_node_id UUID REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS module_code TEXT,
  ADD COLUMN IF NOT EXISTS action_type TEXT,
  ADD COLUMN IF NOT EXISTS action_label TEXT,
  ADD COLUMN IF NOT EXISTS changed_fields JSONB,
  ADD COLUMN IF NOT EXISTS status_from TEXT,
  ADD COLUMN IF NOT EXISTS status_to TEXT,
  ADD COLUMN IF NOT EXISTS comment TEXT,
  ADD COLUMN IF NOT EXISTS reason_code TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS device_type TEXT,
  ADD COLUMN IF NOT EXISTS source_channel TEXT,
  ADD COLUMN IF NOT EXISTS severity TEXT,
  ADD COLUMN IF NOT EXISTS is_system_generated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS correlation_id TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_log_project_created ON public.audit_log (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_module_action ON public.audit_log (module_code, action);

CREATE OR REPLACE FUNCTION public.record_audit_event(
  _module_code TEXT,
  _entity_type TEXT,
  _entity_id TEXT,
  _action_type TEXT,
  _action_label TEXT,
  _project_id UUID DEFAULT NULL,
  _wbs_node_id UUID DEFAULT NULL,
  _old_values JSONB DEFAULT NULL,
  _new_values JSONB DEFAULT NULL,
  _changed_fields JSONB DEFAULT '[]'::jsonb,
  _status_from TEXT DEFAULT NULL,
  _status_to TEXT DEFAULT NULL,
  _comment TEXT DEFAULT NULL,
  _reason_code TEXT DEFAULT NULL,
  _severity public.audit_severity DEFAULT 'low',
  _source_channel public.audit_source_channel DEFAULT 'web',
  _correlation_id TEXT DEFAULT NULL,
  _is_system_generated BOOLEAN DEFAULT false
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_audit_id UUID;
  v_user_name TEXT;
  v_user_roles TEXT;
  v_department TEXT;
  v_entity_uuid UUID;
BEGIN
  SELECT full_name, department
    INTO v_user_name, v_department
  FROM public.profiles
  WHERE id = v_user_id;

  SELECT string_agg(role::text, ', ' ORDER BY role::text)
    INTO v_user_roles
  FROM public.user_roles
  WHERE user_id = v_user_id;

  INSERT INTO public.audit_logs (
    project_id, wbs_node_id, module_code, entity_type, entity_id,
    action_type, action_label, user_id, user_name_snapshot,
    user_role_snapshot, department_snapshot, old_values, new_values,
    changed_fields, status_from, status_to, comment, reason_code,
    source_channel, severity, is_system_generated, correlation_id
  ) VALUES (
    _project_id, _wbs_node_id, _module_code, _entity_type, _entity_id,
    _action_type, _action_label, v_user_id, v_user_name,
    v_user_roles, v_department, _old_values, _new_values,
    COALESCE(_changed_fields, '[]'::jsonb), _status_from, _status_to,
    _comment, _reason_code, _source_channel, _severity,
    _is_system_generated, _correlation_id
  )
  RETURNING id INTO v_audit_id;

  BEGIN
    v_entity_uuid := _entity_id::uuid;
  EXCEPTION WHEN others THEN
    v_entity_uuid := NULL;
  END;

  INSERT INTO public.audit_log (
    user_id, action, entity_type, entity_id, before_data, after_data,
    project_id, wbs_node_id, module_code, action_type, action_label,
    changed_fields, status_from, status_to, comment, reason_code,
    source_channel, severity, is_system_generated, correlation_id
  ) VALUES (
    v_user_id, lower(_action_type), _entity_type, v_entity_uuid,
    _old_values, _new_values, _project_id, _wbs_node_id, _module_code,
    _action_type, _action_label, COALESCE(_changed_fields, '[]'::jsonb),
    _status_from, _status_to, _comment, _reason_code,
    _source_channel::text, _severity::text, _is_system_generated, _correlation_id
  );

  RETURN v_audit_id;
END;
$$;

-- ---------- Notification Matrix ----------
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_code TEXT NOT NULL UNIQUE,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  module_code TEXT NOT NULL,
  event_code TEXT NOT NULL,
  default_priority public.notification_priority NOT NULL DEFAULT 'normal',
  supported_channels public.notification_channel[] NOT NULL DEFAULT ARRAY['in_app']::public.notification_channel[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON public.notification_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can view notification_templates" ON public.notification_templates
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage notification_templates" ON public.notification_templates
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.notification_rules
  ADD COLUMN IF NOT EXISTS tenant_id UUID,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS module_code TEXT,
  ADD COLUMN IF NOT EXISTS recipient_roles TEXT[],
  ADD COLUMN IF NOT EXISTS recipient_users UUID[],
  ADD COLUMN IF NOT EXISTS delay_minutes INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS digest_enabled BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
  ALTER TABLE public.notification_rules DROP CONSTRAINT notification_rules_event_code_key;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_rules_scope_event
  ON public.notification_rules (COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid), event_code);

CREATE INDEX IF NOT EXISTS idx_notification_rules_module_event ON public.notification_rules (module_code, event_code);
CREATE INDEX IF NOT EXISTS idx_notification_rules_project ON public.notification_rules (project_id);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS module_code TEXT,
  ADD COLUMN IF NOT EXISTS event_code TEXT,
  ADD COLUMN IF NOT EXISTS notification_kind public.notification_kind NOT NULL DEFAULT 'information',
  ADD COLUMN IF NOT EXISTS action_url TEXT,
  ADD COLUMN IF NOT EXISTS status public.notification_status NOT NULL DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actioned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_notifications_event ON public.notifications (event_code);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications (status);
CREATE INDEX IF NOT EXISTS idx_notifications_project_module ON public.notifications (project_id, module_code);

CREATE TABLE IF NOT EXISTS public.notification_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel public.notification_channel NOT NULL,
  delivery_status public.notification_delivery_status NOT NULL DEFAULT 'pending',
  provider_response JSONB,
  retry_count INT NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ,
  failed_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_notification ON public.notification_delivery_logs (notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_status ON public.notification_delivery_logs (delivery_status, created_at);

DO $$ BEGIN
  CREATE TRIGGER update_notification_delivery_logs_updated_at
    BEFORE UPDATE ON public.notification_delivery_logs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own notification delivery logs" ON public.notification_delivery_logs
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.id = notification_id AND n.user_id = auth.uid()
      )
      OR public.has_role(auth.uid(), 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage notification delivery logs" ON public.notification_delivery_logs
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------- Generic Approval Workflow Engine ----------
CREATE TABLE IF NOT EXISTS public.approval_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.approval_templates(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  module_code TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  current_step_order INT,
  status public.approval_instance_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_instance_id UUID NOT NULL REFERENCES public.approval_instances(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  step_name TEXT NOT NULL,
  assignee_role TEXT,
  assignee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL DEFAULT 'approve',
  status public.approval_step_status NOT NULL DEFAULT 'pending',
  due_at TIMESTAMPTZ,
  acted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acted_at TIMESTAMPTZ,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (approval_instance_id, step_order)
);

CREATE TABLE IF NOT EXISTS public.approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_instance_id UUID NOT NULL REFERENCES public.approval_instances(id) ON DELETE CASCADE,
  approval_step_id UUID REFERENCES public.approval_steps(id) ON DELETE SET NULL,
  action_type public.approval_action_type NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  from_status TEXT,
  to_status TEXT,
  comment TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_actions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_approval_instances_entity ON public.approval_instances (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_instances_project_status ON public.approval_instances (project_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_steps_instance_order ON public.approval_steps (approval_instance_id, step_order);
CREATE INDEX IF NOT EXISTS idx_approval_steps_assignee ON public.approval_steps (assignee_user_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_actions_instance ON public.approval_actions (approval_instance_id, created_at);

DO $$ BEGIN
  CREATE TRIGGER update_approval_instances_updated_at
    BEFORE UPDATE ON public.approval_instances
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_approval_steps_updated_at
    BEFORE UPDATE ON public.approval_steps
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view related approval_instances" ON public.approval_instances
    FOR SELECT TO authenticated
    USING (
      requested_by = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'project_manager')
      OR EXISTS (
        SELECT 1 FROM public.approval_steps s
        WHERE s.approval_instance_id = id
          AND s.assignee_user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Planners can create approval_instances" ON public.approval_instances
    FOR INSERT TO authenticated
    WITH CHECK (
      requested_by = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'project_manager')
      OR public.has_role(auth.uid(), 'engineer')
      OR public.has_role(auth.uid(), 'supervisor')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins and PMs can update approval_instances" ON public.approval_instances
    FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'project_manager'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view related approval_steps" ON public.approval_steps
    FOR SELECT TO authenticated
    USING (
      assignee_user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'project_manager')
      OR EXISTS (
        SELECT 1 FROM public.approval_instances ai
        WHERE ai.id = approval_instance_id
          AND ai.requested_by = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins and PMs can manage approval_steps" ON public.approval_steps
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'project_manager'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Assigned users can update approval_steps" ON public.approval_steps
    FOR UPDATE TO authenticated
    USING (assignee_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view related approval_actions" ON public.approval_actions
    FOR SELECT TO authenticated
    USING (
      actor_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'project_manager')
      OR EXISTS (
        SELECT 1 FROM public.approval_instances ai
        WHERE ai.id = approval_instance_id
          AND ai.requested_by = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert approval_actions" ON public.approval_actions
    FOR INSERT TO authenticated
    WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed MVP notification templates from section 24.5.16.
INSERT INTO public.notification_templates (
  template_code, title_template, message_template, module_code, event_code, default_priority, supported_channels
) VALUES
  ('task_assigned', 'New Task Assigned: {{task_code}}', 'You have been assigned to {{task_name}} at {{wbs_path}}. Planned finish date: {{planned_finish_date}}.', 'TASK', 'task_assigned', 'normal', ARRAY['in_app','telegram']::public.notification_channel[]),
  ('task_submitted_for_review', 'Task Awaiting Review: {{task_code}}', '{{task_name}} was submitted for review by {{submitter_name}}.', 'TASK', 'task_submitted_for_review', 'high', ARRAY['in_app','telegram']::public.notification_channel[]),
  ('task_rejected', 'Task Rejected: {{task_code}}', '{{task_name}} was rejected. Reason: {{rejection_reason}}', 'TASK', 'task_rejected', 'high', ARRAY['in_app','email']::public.notification_channel[]),
  ('task_overdue', 'Task Overdue: {{task_code}}', '{{task_name}} is overdue by {{overdue_days}} day(s).', 'TASK', 'task_overdue', 'high', ARRAY['in_app','email','telegram']::public.notification_channel[]),
  ('document_submitted_for_review', 'Document Submitted: {{document_number}}', '{{document_title}} is awaiting review.', 'DOC', 'document_submitted_for_review', 'high', ARRAY['in_app','email']::public.notification_channel[]),
  ('document_decision', 'Document {{decision}}: {{document_number}}', '{{document_title}} was {{decision}}.', 'DOC', 'document_decision', 'normal', ARRAY['in_app','email']::public.notification_channel[]),
  ('rfi_created', 'RFI Created: {{rfi_number}}', 'RFI {{rfi_number}} requires response from {{responsible_name}}.', 'RFI', 'rfi_created', 'high', ARRAY['in_app','email']::public.notification_channel[]),
  ('rfi_overdue', 'Critical RFI Overdue: {{rfi_number}}', 'RFI {{rfi_number}} is overdue by {{overdue_days}} day(s).', 'RFI', 'rfi_overdue', 'critical', ARRAY['in_app','email','telegram']::public.notification_channel[]),
  ('po_approved', 'PO Approved: {{po_number}}', 'Purchase Order {{po_number}} for {{supplier_name}} has been approved.', 'PROC', 'po_approved', 'high', ARRAY['in_app','email']::public.notification_channel[]),
  ('timesheet_submitted', 'Timesheet Submitted', '{{employee_name}} submitted a timesheet for {{work_date}}.', 'HR', 'timesheet_submitted', 'normal', ARRAY['in_app']::public.notification_channel[]),
  ('timesheet_rejected', 'Timesheet Rejected', 'Your timesheet for {{work_date}} was rejected. Reason: {{rejection_reason}}', 'HR', 'timesheet_rejected', 'high', ARRAY['in_app','email']::public.notification_channel[]),
  ('ncr_created', 'NCR Created: {{ncr_number}}', 'NCR {{ncr_number}} requires action by {{responsible_name}}.', 'QAQC', 'ncr_created', 'critical', ARRAY['in_app','email','telegram']::public.notification_channel[]),
  ('ncr_overdue', 'NCR Overdue: {{ncr_number}}', 'NCR {{ncr_number}} is overdue.', 'QAQC', 'ncr_overdue', 'critical', ARRAY['in_app','email','telegram']::public.notification_channel[]),
  ('failed_login_repeated', 'Repeated Failed Login', 'Repeated failed login attempts detected for {{user_identifier}}.', 'AUTH', 'failed_login_repeated', 'critical', ARRAY['in_app','email']::public.notification_channel[]),
  ('role_permission_changed', 'Role or Permission Changed', '{{target_user}} role/permission changed by {{actor_name}}.', 'ADMIN', 'role_permission_changed', 'critical', ARRAY['in_app','email']::public.notification_channel[]),
  ('approval_required', 'Approval Required: {{title}}', '{{entity_type}} is awaiting your approval.', 'APPROVAL', 'approval_required', 'high', ARRAY['in_app','email']::public.notification_channel[]),
  ('approval_overdue', 'Approval Overdue: {{title}}', '{{entity_type}} approval is overdue.', 'APPROVAL', 'approval_overdue', 'critical', ARRAY['in_app','email','telegram']::public.notification_channel[])
ON CONFLICT (template_code) DO NOTHING;
