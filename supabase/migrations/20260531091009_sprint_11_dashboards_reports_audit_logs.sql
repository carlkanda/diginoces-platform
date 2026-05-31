-- Sprint 11 - Dashboards, Reports & Audit Logs
-- Requirements: REP-001, REP-002, REP-003, REP-004, REP-005, REP-006,
-- REP-007, ROLE-002, ROLE-003, ROLE-004, ROLE-005, PAY-014, PART-005,
-- FILE-002, FILE-008, TECH-004.
--
-- Scope guard: this migration creates only dashboard/report/audit-log export
-- foundations. It intentionally does not create guest wishes, post-event
-- feedback, partner SaaS scaling, partner commissions, advanced BI,
-- accounting, or tax/VAT reporting tables.

do $$
begin
  create type public.report_scope_type as enum ('global', 'project', 'event');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_export_format as enum (
    'csv',
    'excel_placeholder',
    'pdf_placeholder'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_export_status as enum (
    'generated',
    'failed',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.dashboard_scope_type as enum (
    'global',
    'project',
    'event',
    'couple',
    'partner'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.report_definitions (
  id uuid primary key default extensions.gen_random_uuid(),
  report_key text not null unique,
  name text not null,
  description text not null,
  scope public.report_scope_type not null,
  format public.report_export_format not null default 'csv',
  status text not null default 'available',
  internal_only boolean not null default false,
  required_permissions text[] not null default '{}',
  requirement_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_definitions_key_format check (report_key ~ '^[a-z][a-z0-9_]*$'),
  constraint report_definitions_name_not_blank check (length(trim(name)) > 0),
  constraint report_definitions_status_valid check (status in ('available', 'placeholder', 'post_mvp'))
);

create table if not exists public.report_exports (
  id uuid primary key default extensions.gen_random_uuid(),
  report_definition_id uuid references public.report_definitions (id) on delete set null,
  report_key text not null,
  scope public.report_scope_type not null,
  project_id uuid references public.wedding_projects (id) on delete cascade,
  event_id uuid,
  format public.report_export_format not null default 'csv',
  status public.report_export_status not null default 'generated',
  requested_by uuid references auth.users (id) on delete set null,
  generated_at timestamptz not null default now(),
  filename text,
  mime_type text not null default 'text/csv',
  storage_bucket text,
  storage_path text,
  file_id uuid references public.files (id) on delete set null,
  row_count integer not null default 0,
  filters jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_exports_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint report_exports_scope_requires_ids check (
    (scope = 'global' and project_id is null and event_id is null)
    or (scope = 'project' and project_id is not null and event_id is null)
    or (scope = 'event' and project_id is not null and event_id is not null)
  ),
  constraint report_exports_row_count_non_negative check (row_count >= 0),
  constraint report_exports_csv_mime check (
    format <> 'csv' or mime_type = 'text/csv'
  ),
  constraint report_exports_file_pair check (
    (storage_bucket is null and storage_path is null)
    or (storage_bucket is not null and storage_path is not null)
  )
);

create table if not exists public.audit_log_exports (
  id uuid primary key default extensions.gen_random_uuid(),
  report_export_id uuid not null references public.report_exports (id) on delete cascade,
  requested_by uuid references auth.users (id) on delete set null,
  filters jsonb not null default '{}'::jsonb,
  redacted_fields text[] not null default array['old_value', 'new_value'],
  row_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint audit_log_exports_row_count_non_negative check (row_count >= 0)
);

create table if not exists public.dashboard_widget_preferences (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dashboard_scope public.dashboard_scope_type not null,
  scope_id uuid,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dashboard_widget_preferences_scope_pair check (
    (dashboard_scope = 'global' and scope_id is null)
    or (dashboard_scope <> 'global' and scope_id is not null)
  ),
  constraint dashboard_widget_preferences_object check (jsonb_typeof(preferences) = 'object')
);

create unique index if not exists dashboard_widget_preferences_unique_scope
  on public.dashboard_widget_preferences (
    user_id,
    dashboard_scope,
    coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists report_exports_project_created_idx
  on public.report_exports (project_id, created_at desc)
  where project_id is not null;

create index if not exists report_exports_event_created_idx
  on public.report_exports (event_id, created_at desc)
  where event_id is not null;

create index if not exists audit_logs_action_created_idx
  on public.audit_logs (action, created_at desc);

drop trigger if exists set_report_definitions_updated_at on public.report_definitions;
create trigger set_report_definitions_updated_at
before update on public.report_definitions
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_report_exports_updated_at on public.report_exports;
create trigger set_report_exports_updated_at
before update on public.report_exports
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_dashboard_widget_preferences_updated_at on public.dashboard_widget_preferences;
create trigger set_dashboard_widget_preferences_updated_at
before update on public.dashboard_widget_preferences
for each row
execute function app_private.set_updated_at();

create or replace function app_private.audit_report_export()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  action_name text;
begin
  action_name := case
    when tg_op = 'INSERT' then 'reports.exported'
    else 'reports.updated'
  end;

  insert into public.audit_logs (
    actor_user_id,
    action,
    object_type,
    object_id,
    old_value,
    new_value,
    source,
    reason
  )
  values (
    coalesce(new.requested_by, (select auth.uid())),
    action_name,
    'report_exports',
    new.id,
    case
      when tg_op = 'UPDATE' then to_jsonb(old) - 'filters' - 'metadata'
      else null
    end,
    to_jsonb(new) - 'filters' - 'metadata',
    'api',
    new.report_key
  );

  return new;
end;
$$;

create or replace function app_private.audit_audit_log_export()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.audit_logs (
    actor_user_id,
    action,
    object_type,
    object_id,
    old_value,
    new_value,
    source,
    reason
  )
  values (
    coalesce(new.requested_by, (select auth.uid())),
    'audit_logs.exported',
    'audit_log_exports',
    new.id,
    null,
    jsonb_build_object(
      'report_export_id', new.report_export_id,
      'row_count', new.row_count,
      'redacted_fields', new.redacted_fields
    ),
    'api',
    'Filtered audit log export'
  );

  return new;
end;
$$;

revoke all on function app_private.audit_report_export() from public;
revoke all on function app_private.audit_audit_log_export() from public;

drop trigger if exists audit_report_exports_insert on public.report_exports;
create trigger audit_report_exports_insert
after insert on public.report_exports
for each row
execute function app_private.audit_report_export();

drop trigger if exists audit_report_exports_update on public.report_exports;
create trigger audit_report_exports_update
after update on public.report_exports
for each row
execute function app_private.audit_report_export();

drop trigger if exists audit_audit_log_exports_insert on public.audit_log_exports;
create trigger audit_audit_log_exports_insert
after insert on public.audit_log_exports
for each row
execute function app_private.audit_audit_log_export();

alter table public.report_definitions enable row level security;
alter table public.report_exports enable row level security;
alter table public.audit_log_exports enable row level security;
alter table public.dashboard_widget_preferences enable row level security;

drop policy if exists "Report definitions readable by authenticated users" on public.report_definitions;
create policy "Report definitions readable by authenticated users"
on public.report_definitions
for select
to authenticated
using (true);

drop policy if exists "Report exports readable by scoped report readers" on public.report_exports;
create policy "Report exports readable by scoped report readers"
on public.report_exports
for select
to authenticated
using (
  (
    scope = 'global'
    and (
      app_private.user_has_permission((select auth.uid()), 'reports.internal.read', 'global', null)
      or app_private.user_has_permission((select auth.uid()), 'audit.export', 'global', null)
    )
  )
  or (
    project_id is not null
    and app_private.user_can_access_project((select auth.uid()), project_id, 'reports.export')
  )
  or (
    event_id is not null
    and app_private.user_can_access_event((select auth.uid()), event_id, 'reports.export')
  )
);

drop policy if exists "Report exports inserted by scoped exporters" on public.report_exports;
create policy "Report exports inserted by scoped exporters"
on public.report_exports
for insert
to authenticated
with check (
  requested_by = (select auth.uid())
  and (
    (
      scope = 'global'
      and (
        app_private.user_has_permission((select auth.uid()), 'reports.internal.read', 'global', null)
        or app_private.user_has_permission((select auth.uid()), 'audit.export', 'global', null)
      )
    )
    or (
      project_id is not null
      and app_private.user_can_access_project((select auth.uid()), project_id, 'reports.export')
    )
    or (
      event_id is not null
      and app_private.user_can_access_event((select auth.uid()), event_id, 'reports.export')
    )
  )
);

drop policy if exists "audit_logs.read_internal" on public.audit_logs;
create policy "audit_logs.read_internal"
on public.audit_logs
for select
to authenticated
using (app_private.user_has_permission((select auth.uid()), 'audit.read', 'global', null));

drop policy if exists "Audit log exports readable by audit exporters" on public.audit_log_exports;
create policy "Audit log exports readable by audit exporters"
on public.audit_log_exports
for select
to authenticated
using (app_private.user_has_permission((select auth.uid()), 'audit.export', 'global', null));

drop policy if exists "Audit log exports inserted by audit exporters" on public.audit_log_exports;
create policy "Audit log exports inserted by audit exporters"
on public.audit_log_exports
for insert
to authenticated
with check (
  requested_by = (select auth.uid())
  and app_private.user_has_permission((select auth.uid()), 'audit.export', 'global', null)
);

drop policy if exists "Users manage own dashboard widget preferences" on public.dashboard_widget_preferences;
create policy "Users manage own dashboard widget preferences"
on public.dashboard_widget_preferences
for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

grant select on public.audit_logs to authenticated;
grant select on public.report_definitions to authenticated;
grant select, insert on public.report_exports to authenticated;
grant select, insert on public.audit_log_exports to authenticated;
grant select, insert, update on public.dashboard_widget_preferences to authenticated;

grant select on public.audit_logs to service_role;
grant select, insert, update on public.report_definitions to service_role;
grant select, insert, update on public.report_exports to service_role;
grant select, insert on public.audit_log_exports to service_role;
grant select, insert, update on public.dashboard_widget_preferences to service_role;

insert into public.permissions (slug, description, requirement_ids)
values
  ('dashboards.global.read', 'Read global Diginoces dashboard metrics.', array['REP-001', 'REP-002', 'ROLE-002']),
  ('dashboards.project.read', 'Read authorized project dashboard metrics.', array['REP-001', 'ROLE-003', 'ROLE-005']),
  ('dashboards.event.read', 'Read authorized event dashboard metrics.', array['REP-001', 'ROLE-003']),
  ('dashboards.couple.read', 'Read simplified couple dashboard metrics without internal, audit, revenue, or partner data.', array['REP-003', 'ROLE-005']),
  ('dashboards.partner.read', 'Read restricted partner dashboard placeholder data without revenue, payments, or audit logs.', array['REP-004', 'PART-005']),
  ('reports.catalog.read', 'Read the role-filtered report catalog.', array['REP-005', 'TECH-004']),
  ('reports.export', 'Generate CSV report exports for authorized scope.', array['REP-005', 'FILE-008', 'TECH-004']),
  ('reports.internal.read', 'Read internal report definitions and exports.', array['REP-002', 'REP-005', 'ROLE-004']),
  ('audit.export', 'Export filtered audit logs without old/new value payloads.', array['REP-006', 'REP-007'])
on conflict (slug) do update
set
  description = excluded.description,
  requirement_ids = excluded.requirement_ids;

with sprint_11_grants(role_slug, permission_slug) as (
  values
    ('diginoces_admin', 'dashboards.global.read'),
    ('diginoces_admin', 'dashboards.project.read'),
    ('diginoces_admin', 'dashboards.event.read'),
    ('diginoces_admin', 'dashboards.couple.read'),
    ('diginoces_admin', 'dashboards.partner.read'),
    ('diginoces_admin', 'reports.catalog.read'),
    ('diginoces_admin', 'reports.export'),
    ('diginoces_admin', 'reports.internal.read'),
    ('diginoces_admin', 'audit.export'),
    ('operations_manager', 'dashboards.global.read'),
    ('operations_manager', 'dashboards.project.read'),
    ('operations_manager', 'dashboards.event.read'),
    ('operations_manager', 'reports.catalog.read'),
    ('operations_manager', 'reports.export'),
    ('operations_manager', 'reports.internal.read'),
    ('audit_viewer', 'reports.catalog.read'),
    ('audit_viewer', 'audit.export'),
    ('couple', 'dashboards.project.read'),
    ('couple', 'dashboards.couple.read'),
    ('couple', 'reports.catalog.read'),
    ('couple', 'reports.export'),
    ('bride', 'dashboards.project.read'),
    ('bride', 'dashboards.couple.read'),
    ('bride', 'reports.catalog.read'),
    ('bride', 'reports.export'),
    ('groom', 'dashboards.project.read'),
    ('groom', 'dashboards.couple.read'),
    ('groom', 'reports.catalog.read'),
    ('groom', 'reports.export'),
    ('event_staff', 'dashboards.event.read'),
    ('event_staff', 'reports.catalog.read'),
    ('event_staff', 'reports.export'),
    ('check_in_supervisor', 'dashboards.event.read'),
    ('check_in_supervisor', 'reports.catalog.read'),
    ('check_in_supervisor', 'reports.export'),
    ('partner_admin', 'dashboards.partner.read')
)
insert into public.role_permissions (role_id, permission_slug)
select r.id, g.permission_slug
from sprint_11_grants g
join public.roles r on r.slug = g.role_slug
join public.permissions p on p.slug = g.permission_slug
on conflict (role_id, permission_slug) do nothing;

insert into public.report_definitions (
  report_key,
  name,
  description,
  scope,
  format,
  status,
  internal_only,
  required_permissions,
  requirement_ids
)
values
  (
    'project_guest_summary',
    'Project guest summary',
    'Project guest count, side, printed-only, and event assignment summary.',
    'project',
    'csv',
    'available',
    false,
    array['reports.catalog.read', 'reports.export'],
    array['REP-001', 'REP-003', 'REP-005', 'GM-001']
  ),
  (
    'rsvp_summary',
    'RSVP summary',
    'Event-level RSVP Yes/No/Maybe/Pending summary by project.',
    'project',
    'csv',
    'available',
    false,
    array['reports.catalog.read', 'reports.export'],
    array['REP-001', 'REP-003', 'REP-005', 'RSVP-010']
  ),
  (
    'seating_summary',
    'Seating summary',
    'Event table count, assigned guests, unassigned guests, and capacity summary.',
    'event',
    'csv',
    'available',
    false,
    array['reports.catalog.read', 'reports.export'],
    array['REP-001', 'REP-005', 'SEAT-001']
  ),
  (
    'check_in_summary',
    'Check-in summary',
    'Expected, arrived, remaining, and unexpected guest request summary.',
    'event',
    'csv',
    'available',
    false,
    array['reports.catalog.read', 'reports.export'],
    array['REP-001', 'REP-005', 'CHK-014']
  ),
  (
    'payment_contract_summary',
    'Payment and contract summary',
    'Internal contract, balance, payment gate, and exception summary.',
    'project',
    'csv',
    'available',
    true,
    array['reports.catalog.read', 'reports.export', 'reports.internal.read', 'revenue.read'],
    array['REP-002', 'REP-005', 'PAY-014', 'ROLE-004']
  ),
  (
    'audit_log_export',
    'Audit log export',
    'Filtered internal audit-log export without old/new value payloads.',
    'global',
    'csv',
    'available',
    true,
    array['reports.catalog.read', 'audit.read', 'audit.export'],
    array['REP-006', 'REP-007', 'TECH-004']
  )
on conflict (report_key) do update
set
  name = excluded.name,
  description = excluded.description,
  scope = excluded.scope,
  format = excluded.format,
  status = excluded.status,
  internal_only = excluded.internal_only,
  required_permissions = excluded.required_permissions,
  requirement_ids = excluded.requirement_ids,
  updated_at = now();
