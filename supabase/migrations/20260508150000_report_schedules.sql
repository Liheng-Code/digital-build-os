-- Report Schedules for automated report delivery (Phase 6 of Module 17)

create table if not exists public.report_schedules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  report_type text not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'quarterly')),
  day_of_week int check (day_of_week between 0 and 6),
  day_of_month int check (day_of_month between 1 and 31),
  recipients text[] not null default '{}',
  format text not null default 'pdf' check (format in ('pdf', 'csv', 'xlsx')),
  enabled boolean not null default true,
  label text not null,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_report_schedules_project on public.report_schedules (project_id);
create index idx_report_schedules_enabled on public.report_schedules (enabled) where enabled = true;

alter table public.report_schedules enable row level security;

create policy "Users can view schedules for their projects"
  on public.report_schedules for select
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = report_schedules.project_id
        and project_members.user_id = auth.uid()
    )
  );

create policy "Users can manage schedules for their projects"
  on public.report_schedules for insert
  with check (
    exists (
      select 1 from public.project_members
      where project_members.project_id = report_schedules.project_id
        and project_members.user_id = auth.uid()
    )
  );

create policy "Users can update schedules for their projects"
  on public.report_schedules for update
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = report_schedules.project_id
        and project_members.user_id = auth.uid()
    )
  );

create policy "Users can delete schedules for their projects"
  on public.report_schedules for delete
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = report_schedules.project_id
        and project_members.user_id = auth.uid()
    )
  );
