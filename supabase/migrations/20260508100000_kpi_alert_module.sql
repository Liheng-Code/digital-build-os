-- KPI Alert Thresholds & Events (Phase 5 of Module 17)
-- Each project can define custom thresholds; alerts fire when breached.

create table if not exists public.kpi_alert_thresholds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  kpi_name text not null,
  kpi_category text not null check (kpi_category in ('project', 'department', 'financial')),
  operator text not null check (operator in ('gt', 'lt', 'gte', 'lte', 'eq')),
  threshold_value numeric not null,
  severity text not null default 'warning' check (severity in ('info', 'warning', 'critical')),
  enabled boolean not null default true,
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, kpi_name, operator)
);

create table if not exists public.kpi_alert_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  kpi_name text not null,
  kpi_category text not null check (kpi_category in ('project', 'department', 'financial')),
  actual_value numeric not null,
  threshold_value numeric not null,
  operator text not null check (operator in ('gt', 'lt', 'gte', 'lte', 'eq')),
  severity text not null default 'warning' check (severity in ('info', 'warning', 'critical')),
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_kpi_alert_thresholds_project on public.kpi_alert_thresholds (project_id);
create index idx_kpi_alert_events_project on public.kpi_alert_events (project_id, created_at desc);
create index idx_kpi_alert_events_unread on public.kpi_alert_events (project_id, read_at) where read_at is null;

alter table public.kpi_alert_thresholds enable row level security;
alter table public.kpi_alert_events enable row level security;

create policy "Users can view thresholds for their projects"
  on public.kpi_alert_thresholds for select
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = kpi_alert_thresholds.project_id
        and project_members.user_id = auth.uid()
    )
  );

create policy "Users can manage thresholds for their projects"
  on public.kpi_alert_thresholds for insert
  with check (
    exists (
      select 1 from public.project_members
      where project_members.project_id = kpi_alert_thresholds.project_id
        and project_members.user_id = auth.uid()
    )
  );

create policy "Users can update thresholds for their projects"
  on public.kpi_alert_thresholds for update
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = kpi_alert_thresholds.project_id
        and project_members.user_id = auth.uid()
    )
  );

create policy "Users can delete thresholds for their projects"
  on public.kpi_alert_thresholds for delete
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = kpi_alert_thresholds.project_id
        and project_members.user_id = auth.uid()
    )
  );

create policy "Users can view alert events for their projects"
  on public.kpi_alert_events for select
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = kpi_alert_events.project_id
        and project_members.user_id = auth.uid()
    )
  );

create policy "Users can update alert events for their projects"
  on public.kpi_alert_events for update
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = kpi_alert_events.project_id
        and project_members.user_id = auth.uid()
    )
  );

create policy "Users can delete alert events for their projects"
  on public.kpi_alert_events for delete
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = kpi_alert_events.project_id
        and project_members.user_id = auth.uid()
    )
  );

alter publication supabase_realtime add table public.kpi_alert_events;
