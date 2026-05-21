-- Sprint 2 - Wedding Projects & Events Foundation
-- Requirements: PROJ-001, PROJ-002, PROJ-003, PROJ-004, PROJ-007,
-- ROLE-001, ROLE-004, REP-006.
--
-- Scope guard: this migration creates only project, event, membership,
-- project/event permission, workflow checklist, and audit foundations.
-- It intentionally does not create guest, RSVP, invitation, WhatsApp,
-- seating, check-in, contract, pricing, payment, or partner workflow tables.

do $$
begin
  create type public.project_lifecycle_status as enum (
    'lead',
    'draft',
    'submitted',
    'approved',
    'active',
    'ready_for_invitations',
    'event_operations',
    'completed',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.event_lifecycle_status as enum (
    'draft',
    'scheduled',
    'ready',
    'in_progress',
    'completed',
    'cancelled',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.event_type as enum (
    'civil',
    'customary',
    'religious',
    'reception',
    'brunch',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.membership_status as enum (
    'active',
    'invited',
    'suspended',
    'removed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.workflow_task_scope as enum ('project', 'event');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.workflow_task_status as enum (
    'not_started',
    'in_progress',
    'blocked',
    'done',
    'not_applicable'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.wedding_projects (
  id uuid primary key default extensions.gen_random_uuid(),
  project_code text not null unique,
  bride_name text not null,
  groom_name text not null,
  project_year integer not null default extract(year from now())::integer,
  preferred_language text not null default 'en',
  status public.project_lifecycle_status not null default 'draft',
  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,
  timeline_notes text,
  internal_notes text,
  workflow_template_version integer not null default 1,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wedding_projects_bride_name_not_blank check (length(trim(bride_name)) > 0),
  constraint wedding_projects_groom_name_not_blank check (length(trim(groom_name)) > 0),
  constraint wedding_projects_project_year_reasonable check (project_year between 2020 and 2100),
  constraint wedding_projects_preferred_language_format check (preferred_language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  constraint wedding_projects_project_code_format check (project_code ~ '^[A-Z0-9]{3,8}-[0-9]{4}-[0-9]{3,}$'),
  constraint wedding_projects_workflow_template_version_positive check (workflow_template_version > 0)
);

create index if not exists wedding_projects_status_idx
  on public.wedding_projects (status, created_at desc);

create table if not exists public.events (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_code text not null unique,
  name text not null,
  event_type public.event_type not null,
  event_date date,
  starts_at time,
  ends_at time,
  venue_name text,
  venue_address text,
  status public.event_lifecycle_status not null default 'draft',
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_name_not_blank check (length(trim(name)) > 0),
  constraint events_event_code_format check (event_code ~ '^[A-Z0-9]{3,8}-[0-9]{4}-[0-9]{3,}-[A-Z]{3}(-[0-9]{2})?$'),
  constraint events_time_order check (starts_at is null or ends_at is null or ends_at > starts_at)
);

create index if not exists events_project_id_created_at_idx
  on public.events (project_id, created_at desc);

create index if not exists events_status_idx
  on public.events (status, event_date);

create table if not exists public.project_members (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  status public.membership_status not null default 'active',
  assigned_by uuid references auth.users (id) on delete set null,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists project_members_unique_active_role
  on public.project_members (project_id, user_id, role_id)
  where status in ('active', 'invited');

create index if not exists project_members_user_id_idx
  on public.project_members (user_id, status);

create table if not exists public.event_members (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  status public.membership_status not null default 'active',
  assigned_by uuid references auth.users (id) on delete set null,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists event_members_unique_active_role
  on public.event_members (event_id, user_id, role_id)
  where status in ('active', 'invited');

create index if not exists event_members_user_id_idx
  on public.event_members (user_id, status);

create table if not exists public.workflow_tasks (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid references public.events (id) on delete cascade,
  scope public.workflow_task_scope not null,
  task_key text not null,
  title text not null,
  status public.workflow_task_status not null default 'not_started',
  sort_order integer not null default 0,
  requirement_ids text[] not null default '{}',
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workflow_tasks_task_key_format check (task_key ~ '^[a-z][a-z0-9_.]*$'),
  constraint workflow_tasks_title_not_blank check (length(trim(title)) > 0),
  constraint workflow_tasks_event_scope_requires_event check (
    (scope = 'event' and event_id is not null)
    or (scope = 'project' and event_id is null)
  )
);

create unique index if not exists workflow_tasks_unique_scope_key
  on public.workflow_tasks (
    project_id,
    coalesce(event_id, '00000000-0000-0000-0000-000000000000'::uuid),
    task_key
  );

create index if not exists workflow_tasks_project_scope_idx
  on public.workflow_tasks (project_id, scope, status, sort_order);

create or replace function app_private.project_code_prefix(
  p_bride_name text,
  p_groom_name text
)
returns text
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  normalized text;
begin
  normalized := upper(
    regexp_replace(coalesce(p_bride_name, '') || coalesce(p_groom_name, ''), '[^a-zA-Z0-9]', '', 'g')
  );

  if length(normalized) < 3 then
    normalized := normalized || 'WED';
  end if;

  return left(normalized, 3);
end;
$$;

create or replace function app_private.generate_project_code(
  p_bride_name text,
  p_groom_name text,
  p_project_year integer
)
returns text
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  base_code text;
  candidate text;
  sequence_number integer := 1;
  selected_year integer;
begin
  selected_year := coalesce(p_project_year, extract(year from now())::integer);
  base_code := app_private.project_code_prefix(p_bride_name, p_groom_name) || '-' || selected_year::text || '-';

  loop
    candidate := base_code || lpad(sequence_number::text, 3, '0');

    if not exists (
      select 1
      from public.wedding_projects
      where project_code = candidate
    ) then
      return candidate;
    end if;

    sequence_number := sequence_number + 1;
  end loop;
end;
$$;

create or replace function app_private.event_type_code(p_event_type public.event_type)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case p_event_type
    when 'civil' then 'CIV'
    when 'customary' then 'TRD'
    when 'religious' then 'REL'
    when 'reception' then 'REC'
    when 'brunch' then 'BRU'
    else 'EVT'
  end;
$$;

create or replace function app_private.generate_event_code(
  p_project_id uuid,
  p_event_type public.event_type
)
returns text
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  base_code text;
  candidate text;
  project_code_value text;
  sequence_number integer := 1;
begin
  select project_code
  into project_code_value
  from public.wedding_projects
  where id = p_project_id;

  if project_code_value is null then
    raise exception 'Cannot generate an event code without a valid project';
  end if;

  base_code := project_code_value || '-' || app_private.event_type_code(p_event_type);

  loop
    candidate := case
      when sequence_number = 1 then base_code
      else base_code || '-' || lpad(sequence_number::text, 2, '0')
    end;

    if not exists (
      select 1
      from public.events
      where event_code = candidate
    ) then
      return candidate;
    end if;

    sequence_number := sequence_number + 1;
  end loop;
end;
$$;

create or replace function app_private.set_project_code()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.project_code is null or length(trim(new.project_code)) = 0 then
    new.project_code := app_private.generate_project_code(
      new.bride_name,
      new.groom_name,
      new.project_year
    );
  else
    new.project_code := upper(trim(new.project_code));
  end if;

  return new;
end;
$$;

drop trigger if exists set_wedding_projects_project_code on public.wedding_projects;
create trigger set_wedding_projects_project_code
before insert on public.wedding_projects
for each row
execute function app_private.set_project_code();

create or replace function app_private.set_event_code()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.event_code is null or length(trim(new.event_code)) = 0 then
    new.event_code := app_private.generate_event_code(new.project_id, new.event_type);
  else
    new.event_code := upper(trim(new.event_code));
  end if;

  return new;
end;
$$;

drop trigger if exists set_events_event_code on public.events;
create trigger set_events_event_code
before insert on public.events
for each row
execute function app_private.set_event_code();

create or replace function app_private.ensure_membership_role_scope()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  role_scope public.role_scope_type;
begin
  select scope
  into role_scope
  from public.roles
  where id = new.role_id;

  if tg_table_name = 'project_members' and role_scope not in ('project', 'custom') then
    raise exception 'project_members require a project or custom scoped role';
  end if;

  if tg_table_name = 'event_members' and role_scope not in ('event', 'custom') then
    raise exception 'event_members require an event or custom scoped role';
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_project_member_role_scope on public.project_members;
create trigger ensure_project_member_role_scope
before insert or update of role_id on public.project_members
for each row
execute function app_private.ensure_membership_role_scope();

drop trigger if exists ensure_event_member_role_scope on public.event_members;
create trigger ensure_event_member_role_scope
before insert or update of role_id on public.event_members
for each row
execute function app_private.ensure_membership_role_scope();

drop trigger if exists set_wedding_projects_updated_at on public.wedding_projects;
create trigger set_wedding_projects_updated_at
before update on public.wedding_projects
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
before update on public.events
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_project_members_updated_at on public.project_members;
create trigger set_project_members_updated_at
before update on public.project_members
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_event_members_updated_at on public.event_members;
create trigger set_event_members_updated_at
before update on public.event_members
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_workflow_tasks_updated_at on public.workflow_tasks;
create trigger set_workflow_tasks_updated_at
before update on public.workflow_tasks
for each row
execute function app_private.set_updated_at();

create or replace function app_private.create_project_workflow_tasks()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.workflow_tasks (
    project_id,
    scope,
    task_key,
    title,
    sort_order,
    requirement_ids,
    created_by
  )
  values
    (
      new.id,
      'project',
      'project.profile_review',
      'Review project profile',
      10,
      array['PROJ-001', 'PROJ-007'],
      new.created_by
    ),
    (
      new.id,
      'project',
      'project.event_plan',
      'Create initial event plan',
      20,
      array['PROJ-002', 'PROJ-007'],
      new.created_by
    ),
    (
      new.id,
      'project',
      'project.team_access',
      'Confirm project team access',
      30,
      array['ROLE-004', 'PROJ-007'],
      new.created_by
    )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists create_project_workflow_tasks on public.wedding_projects;
create trigger create_project_workflow_tasks
after insert on public.wedding_projects
for each row
execute function app_private.create_project_workflow_tasks();

create or replace function app_private.create_event_workflow_tasks()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.workflow_tasks (
    project_id,
    event_id,
    scope,
    task_key,
    title,
    sort_order,
    requirement_ids,
    created_by
  )
  values
    (
      new.project_id,
      new.id,
      'event',
      'event.details_review',
      'Review event details',
      10,
      array['PROJ-002', 'PROJ-007'],
      new.created_by
    ),
    (
      new.project_id,
      new.id,
      'event',
      'event.team_access',
      'Confirm event team access',
      20,
      array['ROLE-004', 'PROJ-007'],
      new.created_by
    )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists create_event_workflow_tasks on public.events;
create trigger create_event_workflow_tasks
after insert on public.events
for each row
execute function app_private.create_event_workflow_tasks();

create or replace function app_private.user_can_access_project(
  p_user_id uuid,
  p_project_id uuid,
  p_permission text default 'projects.read'
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_user_id is not null
    and (
      app_private.user_has_permission(p_user_id, p_permission, 'project', p_project_id)
      or exists (
        select 1
        from public.project_members pm
        join public.role_permissions rp on rp.role_id = pm.role_id
        where pm.project_id = p_project_id
          and pm.user_id = p_user_id
          and pm.status = 'active'
          and rp.permission_slug = p_permission
      )
    );
$$;

create or replace function app_private.user_can_access_event(
  p_user_id uuid,
  p_event_id uuid,
  p_permission text default 'events.read'
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_user_id is not null
    and exists (
      select 1
      from public.events e
      where e.id = p_event_id
        and (
          app_private.user_has_permission(p_user_id, p_permission, 'event', p_event_id)
          or app_private.user_has_permission(p_user_id, p_permission, 'project', e.project_id)
          or exists (
            select 1
            from public.event_members em
            join public.role_permissions rp on rp.role_id = em.role_id
            where em.event_id = p_event_id
              and em.user_id = p_user_id
              and em.status = 'active'
              and rp.permission_slug = p_permission
          )
          or exists (
            select 1
            from public.project_members pm
            join public.role_permissions rp on rp.role_id = pm.role_id
            where pm.project_id = e.project_id
              and pm.user_id = p_user_id
              and pm.status = 'active'
              and rp.permission_slug = p_permission
          )
        )
    );
$$;

revoke all on function app_private.project_code_prefix(text, text) from public;
revoke all on function app_private.generate_project_code(text, text, integer) from public;
revoke all on function app_private.event_type_code(public.event_type) from public;
revoke all on function app_private.generate_event_code(uuid, public.event_type) from public;
revoke all on function app_private.user_can_access_project(uuid, uuid, text) from public;
revoke all on function app_private.user_can_access_event(uuid, uuid, text) from public;

create or replace function public.current_user_has_permission(
  p_permission text,
  p_scope public.role_scope_type default 'global',
  p_scope_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app_private.user_has_permission((select auth.uid()), p_permission, p_scope, p_scope_id);
$$;

create or replace function public.current_user_can_access_project(
  p_project_id uuid,
  p_permission text default 'projects.read'
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app_private.user_can_access_project((select auth.uid()), p_project_id, p_permission);
$$;

create or replace function public.current_user_can_access_event(
  p_event_id uuid,
  p_permission text default 'events.read'
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app_private.user_can_access_event((select auth.uid()), p_event_id, p_permission);
$$;

revoke all on function public.current_user_has_permission(text, public.role_scope_type, uuid) from public;
revoke all on function public.current_user_can_access_project(uuid, text) from public;
revoke all on function public.current_user_can_access_event(uuid, text) from public;

grant execute on function public.current_user_has_permission(text, public.role_scope_type, uuid) to authenticated;
grant execute on function public.current_user_can_access_project(uuid, text) to authenticated;
grant execute on function public.current_user_can_access_event(uuid, text) to authenticated;

create or replace function app_private.audit_project_event_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  action_name text;
  changed_object_type text;
  changed_object_id uuid;
begin
  changed_object_type := case tg_table_name
    when 'wedding_projects' then 'wedding_project'
    else 'event'
  end;

  changed_object_id := case tg_op
    when 'DELETE' then old.id
    else new.id
  end;

  action_name := case
    when tg_table_name = 'wedding_projects' and tg_op = 'INSERT' then 'projects.created'
    when tg_table_name = 'wedding_projects' and tg_op = 'UPDATE' then 'projects.updated'
    when tg_table_name = 'events' and tg_op = 'INSERT' then 'events.created'
    when tg_table_name = 'events' and tg_op = 'UPDATE' then 'events.updated'
    else lower(tg_table_name || '.' || tg_op)
  end;

  insert into public.audit_logs (
    actor_user_id,
    action,
    object_type,
    object_id,
    old_value,
    new_value,
    source
  )
  values (
    (select auth.uid()),
    action_name,
    changed_object_type,
    changed_object_id,
    case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    'api'
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists audit_wedding_projects_insert on public.wedding_projects;
create trigger audit_wedding_projects_insert
after insert on public.wedding_projects
for each row
execute function app_private.audit_project_event_change();

drop trigger if exists audit_wedding_projects_update on public.wedding_projects;
create trigger audit_wedding_projects_update
after update on public.wedding_projects
for each row
execute function app_private.audit_project_event_change();

drop trigger if exists audit_events_insert on public.events;
create trigger audit_events_insert
after insert on public.events
for each row
execute function app_private.audit_project_event_change();

drop trigger if exists audit_events_update on public.events;
create trigger audit_events_update
after update on public.events
for each row
execute function app_private.audit_project_event_change();

alter table public.wedding_projects enable row level security;
alter table public.events enable row level security;
alter table public.project_members enable row level security;
alter table public.event_members enable row level security;
alter table public.workflow_tasks enable row level security;

drop policy if exists "Project access follows project permissions" on public.wedding_projects;
create policy "Project access follows project permissions"
on public.wedding_projects
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), id, 'projects.read'));

drop policy if exists "Project creation requires global permission" on public.wedding_projects;
create policy "Project creation requires global permission"
on public.wedding_projects
for insert
to authenticated
with check (app_private.user_has_permission((select auth.uid()), 'projects.create', 'global', null));

drop policy if exists "Project updates follow project permissions" on public.wedding_projects;
create policy "Project updates follow project permissions"
on public.wedding_projects
for update
to authenticated
using (app_private.user_can_access_project((select auth.uid()), id, 'projects.update'))
with check (app_private.user_can_access_project((select auth.uid()), id, 'projects.update'));

drop policy if exists "Event access follows event permissions" on public.events;
create policy "Event access follows event permissions"
on public.events
for select
to authenticated
using (app_private.user_can_access_event((select auth.uid()), id, 'events.read'));

drop policy if exists "Event creation follows project permissions" on public.events;
create policy "Event creation follows project permissions"
on public.events
for insert
to authenticated
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'events.create'));

drop policy if exists "Event updates follow event permissions" on public.events;
create policy "Event updates follow event permissions"
on public.events
for update
to authenticated
using (app_private.user_can_access_event((select auth.uid()), id, 'events.update'))
with check (app_private.user_can_access_event((select auth.uid()), id, 'events.update'));

drop policy if exists "Project members are visible to project managers" on public.project_members;
create policy "Project members are visible to project managers"
on public.project_members
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'project_members.read'));

drop policy if exists "Project member changes require manage permission" on public.project_members;
create policy "Project member changes require manage permission"
on public.project_members
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'project_members.manage'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'project_members.manage'));

drop policy if exists "Event members are visible to event managers" on public.event_members;
create policy "Event members are visible to event managers"
on public.event_members
for select
to authenticated
using (app_private.user_can_access_event((select auth.uid()), event_id, 'event_members.read'));

drop policy if exists "Event member changes require manage permission" on public.event_members;
create policy "Event member changes require manage permission"
on public.event_members
for all
to authenticated
using (app_private.user_can_access_event((select auth.uid()), event_id, 'event_members.manage'))
with check (app_private.user_can_access_event((select auth.uid()), event_id, 'event_members.manage'));

drop policy if exists "Workflow tasks are visible to project readers" on public.workflow_tasks;
create policy "Workflow tasks are visible to project readers"
on public.workflow_tasks
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'workflow_tasks.read'));

drop policy if exists "Workflow task updates require workflow permission" on public.workflow_tasks;
create policy "Workflow task updates require workflow permission"
on public.workflow_tasks
for update
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'workflow_tasks.update'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'workflow_tasks.update'));

grant select, insert, update on public.wedding_projects to authenticated;
grant select, insert, update on public.events to authenticated;
grant select, insert, update on public.project_members to authenticated;
grant select, insert, update on public.event_members to authenticated;
grant select, update on public.workflow_tasks to authenticated;

grant select, insert, update on public.wedding_projects to service_role;
grant select, insert, update on public.events to service_role;
grant select, insert, update on public.project_members to service_role;
grant select, insert, update on public.event_members to service_role;
grant select, insert, update on public.workflow_tasks to service_role;

insert into public.permissions (slug, description, requirement_ids)
values
  ('projects.read', 'Read assigned wedding project records.', array['PROJ-001', 'ROLE-004']),
  ('projects.create', 'Create wedding project records through approved backend services.', array['PROJ-001', 'PROJ-003']),
  ('projects.update', 'Update assigned wedding project records through approved backend services.', array['PROJ-001', 'ROLE-004']),
  ('projects.manage_status', 'Manage wedding project lifecycle statuses.', array['PROJ-001']),
  ('project_members.read', 'Read assigned project membership records.', array['ROLE-004']),
  ('project_members.manage', 'Assign and update project memberships.', array['ROLE-004']),
  ('events.read', 'Read assigned event records.', array['PROJ-002', 'ROLE-004']),
  ('events.create', 'Create events inside authorized wedding projects.', array['PROJ-002', 'PROJ-004']),
  ('events.update', 'Update assigned event records.', array['PROJ-002', 'ROLE-004']),
  ('event_members.read', 'Read assigned event membership records.', array['ROLE-004']),
  ('event_members.manage', 'Assign and update event memberships.', array['ROLE-004']),
  ('workflow_tasks.read', 'Read generated project and event workflow tasks.', array['PROJ-007']),
  ('workflow_tasks.update', 'Update generated workflow task status.', array['PROJ-007'])
on conflict (slug) do update
set
  description = excluded.description,
  requirement_ids = excluded.requirement_ids;

with sprint_2_grants(role_slug, permission_slug) as (
  values
    ('diginoces_admin', 'projects.read'),
    ('diginoces_admin', 'projects.create'),
    ('diginoces_admin', 'projects.update'),
    ('diginoces_admin', 'projects.manage_status'),
    ('diginoces_admin', 'project_members.read'),
    ('diginoces_admin', 'project_members.manage'),
    ('diginoces_admin', 'events.read'),
    ('diginoces_admin', 'events.create'),
    ('diginoces_admin', 'events.update'),
    ('diginoces_admin', 'event_members.read'),
    ('diginoces_admin', 'event_members.manage'),
    ('diginoces_admin', 'workflow_tasks.read'),
    ('diginoces_admin', 'workflow_tasks.update'),
    ('operations_manager', 'projects.read'),
    ('operations_manager', 'projects.create'),
    ('operations_manager', 'projects.update'),
    ('operations_manager', 'events.read'),
    ('operations_manager', 'events.create'),
    ('operations_manager', 'events.update'),
    ('operations_manager', 'workflow_tasks.read'),
    ('operations_manager', 'workflow_tasks.update'),
    ('couple', 'projects.read'),
    ('couple', 'events.read'),
    ('couple', 'workflow_tasks.read'),
    ('event_staff', 'events.read')
)
insert into public.role_permissions (role_id, permission_slug)
select r.id, g.permission_slug
from sprint_2_grants g
join public.roles r on r.slug = g.role_slug
join public.permissions p on p.slug = g.permission_slug
on conflict (role_id, permission_slug) do nothing;
