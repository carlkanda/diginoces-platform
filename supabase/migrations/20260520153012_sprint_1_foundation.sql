-- Sprint 1 - Secure Platform Foundation
-- Requirements: PV-001, PV-002, ROLE-001, ROLE-002, ROLE-003, ROLE-007,
-- REP-006, FILE-001, TECH-001, TECH-003, TECH-004.
--
-- Scope guard: this migration creates only authentication-adjacent user,
-- RBAC, audit-log, and file registry foundations. It intentionally does not
-- create guest, RSVP, invitation, WhatsApp, seating, check-in, contract,
-- payment, partner project, or dashboard domain tables.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists app_private;
revoke all on schema app_private from public;

do $$
begin
  create type public.role_scope_type as enum ('global', 'project', 'event', 'custom');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.audit_source as enum ('api', 'auth', 'system', 'storage');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.file_scope_type as enum ('platform', 'project', 'event', 'guest');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.app_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_users_email_not_blank check (length(trim(email)) > 0)
);

create table if not exists public.roles (
  id uuid primary key default extensions.gen_random_uuid(),
  scope public.role_scope_type not null,
  slug text not null unique,
  name text not null,
  description text not null,
  requires_mfa boolean not null default false,
  is_system boolean not null default true,
  requirement_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint roles_slug_format check (slug ~ '^[a-z][a-z0-9_]*$')
);

create table if not exists public.permissions (
  slug text primary key,
  description text not null,
  requirement_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint permissions_slug_format check (slug ~ '^[a-z][a-z0-9_.]*$')
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_slug text not null references public.permissions (slug) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_slug)
);

create table if not exists public.role_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  scope public.role_scope_type not null,
  scope_id uuid,
  assigned_by uuid references auth.users (id) on delete set null,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz,
  constraint role_assignments_global_scope_has_no_id check (
    (scope = 'global' and scope_id is null)
    or scope <> 'global'
  )
);

create unique index if not exists role_assignments_unique_active
  on public.role_assignments (user_id, role_id, scope, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where expires_at is null;

create table if not exists public.audit_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  object_type text not null,
  object_id uuid,
  old_value jsonb,
  new_value jsonb,
  source public.audit_source not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_not_blank check (length(trim(action)) > 0),
  constraint audit_logs_object_type_not_blank check (length(trim(object_type)) > 0)
);

create index if not exists audit_logs_actor_created_at_idx
  on public.audit_logs (actor_user_id, created_at desc);

create index if not exists audit_logs_object_idx
  on public.audit_logs (object_type, object_id, created_at desc);

create table if not exists public.files (
  id uuid primary key default extensions.gen_random_uuid(),
  scope_type public.file_scope_type not null,
  scope_id uuid,
  bucket text not null,
  storage_path text not null,
  category text not null,
  version integer not null default 1,
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint files_bucket_not_blank check (length(trim(bucket)) > 0),
  constraint files_storage_path_not_blank check (length(trim(storage_path)) > 0),
  constraint files_version_positive check (version > 0)
);

create unique index if not exists files_bucket_path_version_idx
  on public.files (bucket, storage_path, version);

create index if not exists files_scope_idx
  on public.files (scope_type, scope_id, category, is_active);

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_app_users_updated_at on public.app_users;
create trigger set_app_users_updated_at
before update on public.app_users
for each row
execute function app_private.set_updated_at();

create or replace function app_private.prevent_audit_log_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'audit_logs are append-only';
end;
$$;

drop trigger if exists audit_logs_prevent_update on public.audit_logs;
create trigger audit_logs_prevent_update
before update on public.audit_logs
for each row
execute function app_private.prevent_audit_log_mutation();

drop trigger if exists audit_logs_prevent_delete on public.audit_logs;
create trigger audit_logs_prevent_delete
before delete on public.audit_logs
for each row
execute function app_private.prevent_audit_log_mutation();

create or replace function app_private.user_has_permission(
  p_user_id uuid,
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
  select exists (
    select 1
    from public.role_assignments ra
    join public.role_permissions rp on rp.role_id = ra.role_id
    where ra.user_id = p_user_id
      and rp.permission_slug = p_permission
      and (ra.expires_at is null or ra.expires_at > now())
      and (
        ra.scope = 'global'
        or (
          ra.scope = p_scope
          and (p_scope_id is null or ra.scope_id = p_scope_id)
        )
      )
  );
$$;

revoke all on function app_private.user_has_permission(uuid, text, public.role_scope_type, uuid) from public;

alter table public.app_users enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.role_assignments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.files enable row level security;

drop policy if exists "Users can read own profile" on public.app_users;
create policy "Users can read own profile"
on public.app_users
for select
to authenticated
using (id = (select auth.uid()));

drop policy if exists "Authenticated users can read role definitions" on public.roles;
create policy "Authenticated users can read role definitions"
on public.roles
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read permissions" on public.permissions;
create policy "Authenticated users can read permissions"
on public.permissions
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read role permission links" on public.role_permissions;
create policy "Authenticated users can read role permission links"
on public.role_permissions
for select
to authenticated
using (true);

drop policy if exists "Users can read own role assignments" on public.role_assignments;
create policy "Users can read own role assignments"
on public.role_assignments
for select
to authenticated
using (user_id = (select auth.uid()));

revoke all on public.audit_logs from anon, authenticated;
revoke all on public.files from anon, authenticated;

grant usage on schema public to authenticated;
grant select on public.app_users to authenticated;
grant select on public.roles to authenticated;
grant select on public.permissions to authenticated;
grant select on public.role_permissions to authenticated;
grant select on public.role_assignments to authenticated;
grant insert on public.audit_logs to service_role;
grant select, insert, update on public.files to service_role;

insert into public.permissions (slug, description, requirement_ids)
values
  ('platform.foundation.access', 'Access the Sprint 1 platform shell.', array['PV-001', 'PV-002', 'TECH-001']),
  ('auth.session.read', 'Read authenticated session state.', array['PV-001', 'ROLE-001']),
  ('auth.session.write', 'Request or clear authenticated sessions.', array['PV-001', 'ROLE-001']),
  ('users.read', 'Read user profile records.', array['ROLE-001']),
  ('roles.read', 'Read role and permission definitions.', array['ROLE-001', 'ROLE-002', 'ROLE-003']),
  ('roles.manage', 'Assign and revoke roles through approved backend services.', array['ROLE-001', 'ROLE-007']),
  ('audit.read', 'Read sensitive audit log records.', array['REP-006', 'ROLE-007']),
  ('audit.write', 'Append sensitive audit log records.', array['REP-006']),
  ('files.read', 'Read file registry records through authorized backend services.', array['FILE-001']),
  ('files.write', 'Register files through authorized backend services.', array['FILE-001']),
  ('storage.configure', 'Configure app-owned storage providers and buckets.', array['FILE-001', 'TECH-004'])
on conflict (slug) do update
set
  description = excluded.description,
  requirement_ids = excluded.requirement_ids;

insert into public.roles (scope, slug, name, description, requires_mfa, is_system, requirement_ids)
values
  ('global', 'diginoces_admin', 'Diginoces Admin', 'Internal administrator with foundation-level access.', true, true, array['PV-001', 'ROLE-001', 'ROLE-007']),
  ('global', 'operations_manager', 'Operations Manager', 'Operates foundation services without sensitive admin controls.', false, true, array['PV-001', 'PV-002', 'ROLE-001']),
  ('global', 'role_manager', 'Role Manager', 'Manages roles and permissions through approved backend services.', true, true, array['ROLE-001', 'ROLE-007']),
  ('global', 'audit_viewer', 'Audit Viewer', 'Reviews foundation audit records.', true, true, array['REP-006', 'ROLE-007']),
  ('global', 'file_manager', 'File Manager', 'Manages app-owned operational files through approved services.', false, true, array['FILE-001']),
  ('project', 'couple', 'Couple', 'Future project-level wedding couple role.', false, true, array['PV-002', 'ROLE-002']),
  ('event', 'event_staff', 'Event Staff', 'Future event-level staff role with limited foundation access.', false, true, array['ROLE-003']),
  ('custom', 'partner_admin', 'Partner Admin', 'Future restricted partner administrator role.', true, true, array['ROLE-002', 'ROLE-007'])
on conflict (slug) do update
set
  scope = excluded.scope,
  name = excluded.name,
  description = excluded.description,
  requires_mfa = excluded.requires_mfa,
  is_system = excluded.is_system,
  requirement_ids = excluded.requirement_ids;

with grants(role_slug, permission_slug) as (
  values
    ('diginoces_admin', 'platform.foundation.access'),
    ('diginoces_admin', 'auth.session.read'),
    ('diginoces_admin', 'auth.session.write'),
    ('diginoces_admin', 'users.read'),
    ('diginoces_admin', 'roles.read'),
    ('diginoces_admin', 'roles.manage'),
    ('diginoces_admin', 'audit.read'),
    ('diginoces_admin', 'audit.write'),
    ('diginoces_admin', 'files.read'),
    ('diginoces_admin', 'files.write'),
    ('diginoces_admin', 'storage.configure'),
    ('operations_manager', 'platform.foundation.access'),
    ('operations_manager', 'auth.session.read'),
    ('operations_manager', 'users.read'),
    ('operations_manager', 'roles.read'),
    ('operations_manager', 'files.read'),
    ('role_manager', 'roles.read'),
    ('role_manager', 'roles.manage'),
    ('role_manager', 'audit.write'),
    ('audit_viewer', 'audit.read'),
    ('file_manager', 'files.read'),
    ('file_manager', 'files.write'),
    ('file_manager', 'storage.configure'),
    ('couple', 'platform.foundation.access'),
    ('event_staff', 'platform.foundation.access'),
    ('partner_admin', 'platform.foundation.access')
)
insert into public.role_permissions (role_id, permission_slug)
select r.id, g.permission_slug
from grants g
join public.roles r on r.slug = g.role_slug
join public.permissions p on p.slug = g.permission_slug
on conflict (role_id, permission_slug) do nothing;
