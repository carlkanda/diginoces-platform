-- Sprint 13 - Partner / External Provider Model
-- Requirements: PART-001, PART-002, PART-003, PART-004, PART-005,
-- PART-006, PART-007, ROLE-004, REP-004, PAY-015, PV-003, REP-006, TECH-004.
--
-- Scope guard: this migration creates partner profile, partner user linkage,
-- partner-created project draft/submission/review, source tracking,
-- partner-visible comments, permission, RLS, RPC, and audit foundations.
-- It intentionally does not create commissions, referral fees, partner billing,
-- white-label tenanting, partner-controlled pricing/contracts, payouts, or a
-- public partner marketplace.

do $$
begin
  create type public.partner_status as enum (
    'pending',
    'active',
    'suspended',
    'inactive',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.partner_user_role as enum ('admin', 'member');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.partner_user_status as enum (
    'invited',
    'active',
    'suspended',
    'inactive'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.partner_project_submission_status as enum (
    'draft',
    'submitted',
    'changes_requested',
    'approved',
    'rejected',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.partner_project_source_type as enum (
    'partner_originated',
    'partner_assigned'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.partner_project_approval_status as enum (
    'draft',
    'submitted',
    'changes_requested',
    'approved',
    'rejected',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.partner_assignment_status as enum (
    'active',
    'removed',
    'suspended'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.project_comment_visibility as enum (
    'partner_visible',
    'internal_only'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.project_comment_actor_type as enum (
    'admin',
    'staff',
    'partner',
    'couple'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.partners (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_name text not null,
  primary_contact_name text,
  contact_email text not null,
  contact_phone text,
  whatsapp_phone text,
  status public.partner_status not null default 'pending',
  partner_type text not null default 'planner',
  internal_notes text,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  suspended_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partners_organization_name_not_blank check (length(trim(organization_name)) > 0),
  constraint partners_contact_email_not_blank check (length(trim(contact_email)) > 0),
  constraint partners_partner_type_not_blank check (length(trim(partner_type)) > 0),
  constraint partners_approval_fields_match_status check (
    (status = 'active' and approved_at is not null and approved_by is not null)
    or status <> 'active'
  ),
  constraint partners_archive_fields_match_status check (
    (status = 'archived' and archived_at is not null)
    or status <> 'archived'
  )
);

create index if not exists partners_status_created_idx
  on public.partners (status, created_at desc);

create index if not exists partners_contact_email_idx
  on public.partners (lower(contact_email));

create table if not exists public.partner_users (
  id uuid primary key default extensions.gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.partner_user_role not null default 'member',
  status public.partner_user_status not null default 'invited',
  invited_by uuid references auth.users (id) on delete set null,
  invited_at timestamptz,
  active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_users_active_timestamp check (
    (status = 'active' and active_at is not null)
    or status <> 'active'
  )
);

create unique index if not exists partner_users_unique_partner_user
  on public.partner_users (partner_id, user_id);

create index if not exists partner_users_user_status_idx
  on public.partner_users (user_id, status);

create table if not exists public.partner_project_sources (
  id uuid primary key default extensions.gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete restrict,
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  source_type public.partner_project_source_type not null,
  approval_status public.partner_project_approval_status not null default 'draft',
  operational_role text,
  source_notes text,
  created_by uuid references auth.users (id) on delete set null,
  submitted_by uuid references auth.users (id) on delete set null,
  submitted_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_project_sources_one_per_project unique (project_id),
  constraint partner_project_sources_approval_fields_match_status check (
    (approval_status = 'approved' and approved_at is not null and approved_by is not null)
    or approval_status <> 'approved'
  )
);

create index if not exists partner_project_sources_partner_idx
  on public.partner_project_sources (partner_id, approval_status, created_at desc);

create table if not exists public.partner_project_submissions (
  id uuid primary key default extensions.gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete restrict,
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  bride_name text not null,
  groom_name text not null,
  primary_contact_email text,
  primary_contact_phone text,
  planned_guest_count integer,
  event_notes text,
  partner_notes text,
  status public.partner_project_submission_status not null default 'draft',
  created_by uuid references auth.users (id) on delete set null,
  submitted_by uuid references auth.users (id) on delete set null,
  submitted_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  review_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_project_submissions_bride_name_not_blank check (length(trim(bride_name)) > 0),
  constraint partner_project_submissions_groom_name_not_blank check (length(trim(groom_name)) > 0),
  constraint partner_project_submissions_guest_count_non_negative check (
    planned_guest_count is null or planned_guest_count >= 0
  ),
  constraint partner_project_submissions_approval_fields_match_status check (
    (status = 'approved' and approved_at is not null and approved_by is not null)
    or status <> 'approved'
  ),
  constraint partner_project_submissions_submitted_fields_match_status check (
    (status in ('submitted', 'changes_requested', 'approved', 'rejected', 'archived') and submitted_at is not null)
    or status = 'draft'
  )
);

create index if not exists partner_project_submissions_partner_status_idx
  on public.partner_project_submissions (partner_id, status, created_at desc);

create index if not exists partner_project_submissions_project_idx
  on public.partner_project_submissions (project_id, status);

create table if not exists public.partner_project_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete restrict,
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  assigned_role text not null default 'project_operator',
  status public.partner_assignment_status not null default 'active',
  assigned_by uuid references auth.users (id) on delete set null,
  assigned_at timestamptz not null default now(),
  removed_by uuid references auth.users (id) on delete set null,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_project_assignments_role_not_blank check (length(trim(assigned_role)) > 0),
  constraint partner_project_assignments_removed_fields_match_status check (
    (status = 'removed' and removed_at is not null)
    or status <> 'removed'
  )
);

create unique index if not exists partner_project_assignments_unique_active
  on public.partner_project_assignments (partner_id, project_id, assigned_role)
  where status = 'active';

create index if not exists partner_project_assignments_project_idx
  on public.partner_project_assignments (project_id, status);

create table if not exists public.project_comments (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  body text not null,
  visibility public.project_comment_visibility not null default 'partner_visible',
  author_user_id uuid references auth.users (id) on delete set null,
  author_type public.project_comment_actor_type not null,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_comments_body_not_blank check (length(trim(body)) > 0)
);

create index if not exists project_comments_project_created_idx
  on public.project_comments (project_id, visibility, created_at desc)
  where deleted_at is null;

drop trigger if exists set_partners_updated_at on public.partners;
create trigger set_partners_updated_at
before update on public.partners
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_partner_users_updated_at on public.partner_users;
create trigger set_partner_users_updated_at
before update on public.partner_users
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_partner_project_sources_updated_at on public.partner_project_sources;
create trigger set_partner_project_sources_updated_at
before update on public.partner_project_sources
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_partner_project_submissions_updated_at on public.partner_project_submissions;
create trigger set_partner_project_submissions_updated_at
before update on public.partner_project_submissions
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_partner_project_assignments_updated_at on public.partner_project_assignments;
create trigger set_partner_project_assignments_updated_at
before update on public.partner_project_assignments
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_project_comments_updated_at on public.project_comments;
create trigger set_project_comments_updated_at
before update on public.project_comments
for each row
execute function app_private.set_updated_at();

create or replace function app_private.partner_user_is_active(
  p_user_id uuid,
  p_partner_id uuid
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
      from public.partner_users pu
      join public.partners p on p.id = pu.partner_id
      where pu.user_id = p_user_id
        and pu.partner_id = p_partner_id
        and pu.status = 'active'
        and p.status = 'active'
    );
$$;

create or replace function app_private.user_can_access_partner(
  p_user_id uuid,
  p_partner_id uuid,
  p_permission text default 'partners.read'
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_user_id is not null
    and (
      app_private.user_has_permission(p_user_id, p_permission, 'global', null)
      or app_private.user_has_permission(p_user_id, p_permission, 'custom', p_partner_id)
      or (
        app_private.partner_user_is_active(p_user_id, p_partner_id)
        and p_permission in (
          'partners.read',
          'partner_projects.create',
          'partner_projects.submit',
          'dashboards.partner.read'
        )
      )
    );
$$;

create or replace function app_private.user_can_access_partner_project(
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
      app_private.user_can_access_project(p_user_id, p_project_id, p_permission)
      or exists (
        select 1
        from public.partner_project_sources pps
        where pps.project_id = p_project_id
          and app_private.user_can_access_partner(p_user_id, pps.partner_id, 'partners.read')
          and p_permission in (
            'projects.read',
            'events.read',
            'workflow_tasks.read',
            'dashboards.partner.read',
            'project_comments.read',
            'project_comments.create'
          )
      )
      or exists (
        select 1
        from public.partner_project_assignments ppa
        where ppa.project_id = p_project_id
          and ppa.status = 'active'
          and app_private.user_can_access_partner(p_user_id, ppa.partner_id, 'partners.read')
          and p_permission in (
            'projects.read',
            'events.read',
            'workflow_tasks.read',
            'dashboards.partner.read',
            'project_comments.read',
            'project_comments.create'
          )
      )
    );
$$;

revoke all on function app_private.partner_user_is_active(uuid, uuid) from public;
revoke all on function app_private.user_can_access_partner(uuid, uuid, text) from public;
revoke all on function app_private.user_can_access_partner_project(uuid, uuid, text) from public;

create or replace function public.current_user_can_access_partner(
  p_partner_id uuid,
  p_permission text default 'partners.read'
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app_private.user_can_access_partner((select auth.uid()), p_partner_id, p_permission);
$$;

revoke all on function public.current_user_can_access_partner(uuid, text) from public;
grant execute on function public.current_user_can_access_partner(uuid, text) to authenticated;

create or replace function app_private.redact_partner_audit_snapshot(
  p_snapshot jsonb
)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_snapshot is null then null
    else p_snapshot
      - 'internal_notes'
      - 'contact_email'
      - 'contact_phone'
      - 'whatsapp_phone'
      - 'primary_contact_email'
      - 'primary_contact_phone'
      - 'partner_notes'
      - 'review_reason'
  end;
$$;

revoke all on function app_private.redact_partner_audit_snapshot(jsonb) from public;

create or replace function app_private.audit_partner_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  action_name text;
  changed_object_type text;
  changed_object_id uuid;
  actor_id uuid;
  project_id uuid;
begin
  changed_object_type := case tg_table_name
    when 'partners' then 'partner'
    when 'partner_users' then 'partner_user'
    when 'partner_project_sources' then 'partner_project_source'
    when 'partner_project_submissions' then 'partner_project_submission'
    when 'partner_project_assignments' then 'partner_project_assignment'
    when 'project_comments' then 'project_comment'
    else tg_table_name
  end;
  changed_object_id := coalesce(new.id, old.id);
  project_id := case
    when tg_table_name in (
      'partner_project_sources',
      'partner_project_submissions',
      'partner_project_assignments',
      'project_comments'
    ) then coalesce(new.project_id, old.project_id)
    else null
  end;
  actor_id := case tg_table_name
    when 'partners' then coalesce(new.updated_by, new.created_by, old.updated_by, old.created_by, (select auth.uid()))
    when 'partner_users' then coalesce(new.invited_by, old.invited_by, (select auth.uid()))
    when 'partner_project_sources' then coalesce(new.approved_by, new.submitted_by, new.created_by, old.approved_by, old.submitted_by, old.created_by, (select auth.uid()))
    when 'partner_project_submissions' then coalesce(new.reviewed_by, new.submitted_by, new.created_by, old.reviewed_by, old.submitted_by, old.created_by, (select auth.uid()))
    when 'partner_project_assignments' then coalesce(new.removed_by, new.assigned_by, old.removed_by, old.assigned_by, (select auth.uid()))
    when 'project_comments' then coalesce(new.updated_by, new.created_by, new.author_user_id, old.updated_by, old.created_by, old.author_user_id, (select auth.uid()))
    else (select auth.uid())
  end;

  action_name := case
    when tg_table_name = 'partners' and tg_op = 'INSERT' then 'partners.created'
    when tg_table_name = 'partners' and tg_op = 'UPDATE' and old.status <> 'active' and new.status = 'active' then 'partners.activated'
    when tg_table_name = 'partners' and tg_op = 'UPDATE' and new.status = 'suspended' and old.status <> 'suspended' then 'partners.suspended'
    when tg_table_name = 'partners' and tg_op = 'UPDATE' and old.status = 'suspended' and new.status = 'active' then 'partners.reactivated'
    when tg_table_name = 'partners' and tg_op = 'UPDATE' and new.status = 'archived' and old.status <> 'archived' then 'partners.archived'
    when tg_table_name = 'partners' and tg_op = 'UPDATE' then 'partners.updated'
    when tg_table_name = 'partner_users' and tg_op = 'INSERT' then 'partner_users.linked'
    when tg_table_name = 'partner_users' and tg_op = 'UPDATE' then 'partner_users.updated'
    when tg_table_name = 'partner_project_sources' and tg_op = 'INSERT' then 'partner_project_sources.created'
    when tg_table_name = 'partner_project_sources' and tg_op = 'UPDATE' then 'partner_project_sources.updated'
    when tg_table_name = 'partner_project_submissions' and tg_op = 'INSERT' then 'partner_project_submissions.created'
    when tg_table_name = 'partner_project_submissions' and tg_op = 'UPDATE' and new.status = 'submitted' and old.status <> 'submitted' then 'partner_project_submissions.submitted'
    when tg_table_name = 'partner_project_submissions' and tg_op = 'UPDATE' and new.status = 'approved' and old.status <> 'approved' then 'partner_project_submissions.approved'
    when tg_table_name = 'partner_project_submissions' and tg_op = 'UPDATE' and new.status = 'rejected' and old.status <> 'rejected' then 'partner_project_submissions.rejected'
    when tg_table_name = 'partner_project_submissions' and tg_op = 'UPDATE' and new.status = 'changes_requested' and old.status <> 'changes_requested' then 'partner_project_submissions.changes_requested'
    when tg_table_name = 'partner_project_submissions' and tg_op = 'UPDATE' and new.status = 'archived' and old.status <> 'archived' then 'partner_project_submissions.archived'
    when tg_table_name = 'partner_project_submissions' and tg_op = 'UPDATE' then 'partner_project_submissions.updated'
    when tg_table_name = 'partner_project_assignments' and tg_op = 'INSERT' then 'partner_project_assignments.created'
    when tg_table_name = 'partner_project_assignments' and tg_op = 'UPDATE' and new.status = 'removed' and old.status <> 'removed' then 'partner_project_assignments.removed'
    when tg_table_name = 'partner_project_assignments' and tg_op = 'UPDATE' then 'partner_project_assignments.updated'
    when tg_table_name = 'project_comments' and tg_op = 'INSERT' then 'project_comments.created'
    when tg_table_name = 'project_comments' and tg_op = 'UPDATE' and new.deleted_at is not null and old.deleted_at is null then 'project_comments.deleted'
    when tg_table_name = 'project_comments' and tg_op = 'UPDATE' then 'project_comments.updated'
    else tg_table_name || '.' || lower(tg_op)
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
    actor_id,
    action_name,
    changed_object_type,
    changed_object_id,
    app_private.redact_partner_audit_snapshot(to_jsonb(old)),
    app_private.redact_partner_audit_snapshot(to_jsonb(new)),
    'api',
    case
      when tg_table_name = 'partner_project_submissions' then coalesce(new.review_reason, old.review_reason)
      when tg_table_name = 'partner_project_sources' then coalesce(new.source_notes, old.source_notes)
      when project_id is not null then 'project_id=' || project_id::text
      else null
    end
  );

  return coalesce(new, old);
end;
$$;

revoke all on function app_private.audit_partner_change() from public;

drop trigger if exists audit_partners_insert on public.partners;
create trigger audit_partners_insert
after insert on public.partners
for each row
execute function app_private.audit_partner_change();

drop trigger if exists audit_partners_update on public.partners;
create trigger audit_partners_update
after update on public.partners
for each row
execute function app_private.audit_partner_change();

drop trigger if exists audit_partner_users_insert on public.partner_users;
create trigger audit_partner_users_insert
after insert on public.partner_users
for each row
execute function app_private.audit_partner_change();

drop trigger if exists audit_partner_users_update on public.partner_users;
create trigger audit_partner_users_update
after update on public.partner_users
for each row
execute function app_private.audit_partner_change();

drop trigger if exists audit_partner_project_sources_insert on public.partner_project_sources;
create trigger audit_partner_project_sources_insert
after insert on public.partner_project_sources
for each row
execute function app_private.audit_partner_change();

drop trigger if exists audit_partner_project_sources_update on public.partner_project_sources;
create trigger audit_partner_project_sources_update
after update on public.partner_project_sources
for each row
execute function app_private.audit_partner_change();

drop trigger if exists audit_partner_project_submissions_insert on public.partner_project_submissions;
create trigger audit_partner_project_submissions_insert
after insert on public.partner_project_submissions
for each row
execute function app_private.audit_partner_change();

drop trigger if exists audit_partner_project_submissions_update on public.partner_project_submissions;
create trigger audit_partner_project_submissions_update
after update on public.partner_project_submissions
for each row
execute function app_private.audit_partner_change();

drop trigger if exists audit_partner_project_assignments_insert on public.partner_project_assignments;
create trigger audit_partner_project_assignments_insert
after insert on public.partner_project_assignments
for each row
execute function app_private.audit_partner_change();

drop trigger if exists audit_partner_project_assignments_update on public.partner_project_assignments;
create trigger audit_partner_project_assignments_update
after update on public.partner_project_assignments
for each row
execute function app_private.audit_partner_change();

drop trigger if exists audit_project_comments_insert on public.project_comments;
create trigger audit_project_comments_insert
after insert on public.project_comments
for each row
execute function app_private.audit_partner_change();

drop trigger if exists audit_project_comments_update on public.project_comments;
create trigger audit_project_comments_update
after update on public.project_comments
for each row
execute function app_private.audit_partner_change();

create or replace function public.link_partner_user(
  p_partner_id uuid,
  p_user_id uuid,
  p_role text default 'admin'
)
returns public.partner_users
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_partner_user public.partner_users%rowtype;
  v_role_id uuid;
begin
  if not app_private.user_has_permission(v_actor_user_id, 'partner_users.manage', 'global', null) then
    raise exception 'Partner user management permission denied.';
  end if;

  if p_role not in ('admin', 'member') then
    raise exception 'Partner user role is not supported.';
  end if;

  insert into public.partner_users (
    partner_id,
    user_id,
    role,
    status,
    invited_by,
    invited_at,
    active_at
  )
  values (
    p_partner_id,
    p_user_id,
    p_role::public.partner_user_role,
    'active',
    v_actor_user_id,
    now(),
    now()
  )
  on conflict (partner_id, user_id) do update
  set
    role = excluded.role,
    status = 'active',
    invited_by = excluded.invited_by,
    invited_at = excluded.invited_at,
    active_at = excluded.active_at
  returning * into v_partner_user;

  if p_role = 'admin' then
    select id into v_role_id
    from public.roles
    where slug = 'partner_admin';

    if v_role_id is not null then
      insert into public.role_assignments (
        user_id,
        role_id,
        scope,
        scope_id,
        assigned_by
      )
      values (
        p_user_id,
        v_role_id,
        'custom',
        p_partner_id,
        v_actor_user_id
      )
      on conflict do nothing;
    end if;
  end if;

  return v_partner_user;
end;
$$;

create or replace function public.create_partner_project_draft(
  p_partner_id uuid,
  p_bride_name text,
  p_groom_name text,
  p_primary_contact_email text default null,
  p_primary_contact_phone text default null,
  p_planned_guest_count integer default null,
  p_event_notes text default null,
  p_partner_notes text default null,
  p_project_year integer default null
)
returns public.partner_project_submissions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_project public.wedding_projects%rowtype;
  v_submission public.partner_project_submissions%rowtype;
  v_partner public.partners%rowtype;
  v_role_id uuid;
begin
  if not app_private.user_can_access_partner(v_actor_user_id, p_partner_id, 'partner_projects.create') then
    raise exception 'Partner project creation permission denied.';
  end if;

  select * into v_partner
  from public.partners
  where id = p_partner_id
  for update;

  if not found or v_partner.status <> 'active' then
    raise exception 'Active partner status is required before creating projects.';
  end if;

  if not app_private.partner_user_is_active(v_actor_user_id, p_partner_id) then
    raise exception 'Active partner user link is required before creating projects.';
  end if;

  if length(trim(coalesce(p_bride_name, ''))) = 0 or length(trim(coalesce(p_groom_name, ''))) = 0 then
    raise exception 'Bride and groom names are required.';
  end if;

  if p_planned_guest_count is not null and p_planned_guest_count < 0 then
    raise exception 'Planned guest count must be non-negative.';
  end if;

  insert into public.wedding_projects (
    bride_name,
    groom_name,
    project_year,
    status,
    primary_contact_email,
    primary_contact_phone,
    timeline_notes,
    created_by,
    updated_by
  )
  values (
    trim(p_bride_name),
    trim(p_groom_name),
    coalesce(p_project_year, extract(year from now())::integer),
    'draft',
    nullif(trim(coalesce(p_primary_contact_email, '')), ''),
    nullif(trim(coalesce(p_primary_contact_phone, '')), ''),
    nullif(trim(coalesce(p_event_notes, '')), ''),
    v_actor_user_id,
    v_actor_user_id
  )
  returning * into v_project;

  insert into public.partner_project_sources (
    partner_id,
    project_id,
    source_type,
    approval_status,
    operational_role,
    source_notes,
    created_by
  )
  values (
    p_partner_id,
    v_project.id,
    'partner_originated',
    'draft',
    'originating_partner',
    nullif(trim(coalesce(p_partner_notes, '')), ''),
    v_actor_user_id
  );

  insert into public.partner_project_submissions (
    partner_id,
    project_id,
    bride_name,
    groom_name,
    primary_contact_email,
    primary_contact_phone,
    planned_guest_count,
    event_notes,
    partner_notes,
    status,
    created_by
  )
  values (
    p_partner_id,
    v_project.id,
    trim(p_bride_name),
    trim(p_groom_name),
    nullif(trim(coalesce(p_primary_contact_email, '')), ''),
    nullif(trim(coalesce(p_primary_contact_phone, '')), ''),
    p_planned_guest_count,
    nullif(trim(coalesce(p_event_notes, '')), ''),
    nullif(trim(coalesce(p_partner_notes, '')), ''),
    'draft',
    v_actor_user_id
  )
  returning * into v_submission;

  select id into v_role_id
  from public.roles
  where slug = 'partner_project_operator';

  if v_role_id is not null then
    insert into public.project_members (
      project_id,
      user_id,
      role_id,
      status,
      assigned_by
    )
    values (
      v_project.id,
      v_actor_user_id,
      v_role_id,
      'active',
      v_actor_user_id
    )
    on conflict do nothing;
  end if;

  return v_submission;
end;
$$;

create or replace function public.submit_partner_project_submission(
  p_submission_id uuid
)
returns public.partner_project_submissions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_submission public.partner_project_submissions%rowtype;
begin
  select * into v_submission
  from public.partner_project_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Partner project submission not found.';
  end if;

  if not app_private.user_can_access_partner(v_actor_user_id, v_submission.partner_id, 'partner_projects.submit') then
    raise exception 'Partner project submission permission denied.';
  end if;

  if v_submission.status not in ('draft', 'changes_requested') then
    raise exception 'Only draft or changes-requested submissions can be submitted.';
  end if;

  if not app_private.partner_user_is_active(v_actor_user_id, v_submission.partner_id) then
    raise exception 'Active partner user link is required before submitting projects.';
  end if;

  update public.partner_project_submissions
  set
    status = 'submitted',
    submitted_by = v_actor_user_id,
    submitted_at = now(),
    reviewed_by = null,
    reviewed_at = null,
    review_reason = null
  where id = v_submission.id
  returning * into v_submission;

  update public.partner_project_sources
  set
    approval_status = 'submitted',
    submitted_by = v_actor_user_id,
    submitted_at = now()
  where project_id = v_submission.project_id;

  update public.wedding_projects
  set
    status = 'submitted',
    updated_by = v_actor_user_id
  where id = v_submission.project_id;

  return v_submission;
end;
$$;

create or replace function public.review_partner_project_submission(
  p_submission_id uuid,
  p_action text,
  p_reason text
)
returns public.partner_project_submissions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_submission public.partner_project_submissions%rowtype;
  v_next_status public.partner_project_submission_status;
  v_next_project_status public.project_lifecycle_status;
begin
  if not app_private.user_has_permission(v_actor_user_id, 'partner_projects.review', 'global', null) then
    raise exception 'Partner project review permission denied.';
  end if;

  select * into v_submission
  from public.partner_project_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Partner project submission not found.';
  end if;

  if v_submission.status <> 'submitted' then
    raise exception 'Only submitted partner projects can be reviewed.';
  end if;

  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Review reason is required.';
  end if;

  v_next_status := case p_action
    when 'approve' then 'approved'::public.partner_project_submission_status
    when 'reject' then 'rejected'::public.partner_project_submission_status
    when 'request_changes' then 'changes_requested'::public.partner_project_submission_status
    when 'archive' then 'archived'::public.partner_project_submission_status
    else null
  end;

  if v_next_status is null then
    raise exception 'Partner project review action is not supported.';
  end if;

  v_next_project_status := case
    when v_next_status = 'approved' then 'approved'::public.project_lifecycle_status
    else 'draft'::public.project_lifecycle_status
  end;

  update public.partner_project_submissions
  set
    status = v_next_status,
    reviewed_by = v_actor_user_id,
    reviewed_at = now(),
    approved_by = case when v_next_status = 'approved' then v_actor_user_id else null end,
    approved_at = case when v_next_status = 'approved' then now() else null end,
    review_reason = trim(p_reason)
  where id = v_submission.id
  returning * into v_submission;

  update public.partner_project_sources
  set
    approval_status = v_next_status::text::public.partner_project_approval_status,
    approved_by = case when v_next_status = 'approved' then v_actor_user_id else null end,
    approved_at = case when v_next_status = 'approved' then now() else null end,
    source_notes = trim(p_reason)
  where project_id = v_submission.project_id;

  update public.wedding_projects
  set
    status = v_next_project_status,
    updated_by = v_actor_user_id
  where id = v_submission.project_id;

  return v_submission;
end;
$$;

create or replace function public.create_project_comment(
  p_project_id uuid,
  p_body text,
  p_visibility text default 'partner_visible'
)
returns public.project_comments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_comment public.project_comments%rowtype;
  v_visibility public.project_comment_visibility;
  v_author_type public.project_comment_actor_type := 'staff';
begin
  if p_visibility not in ('partner_visible', 'internal_only') then
    raise exception 'Project comment visibility is not supported.';
  end if;

  v_visibility := p_visibility::public.project_comment_visibility;

  if length(trim(coalesce(p_body, ''))) = 0 then
    raise exception 'Project comment body is required.';
  end if;

  if v_visibility = 'internal_only' then
    if not app_private.user_can_access_project(v_actor_user_id, p_project_id, 'project_comments.internal.read') then
      raise exception 'Internal project comment permission denied.';
    end if;
    v_author_type := 'staff';
  else
    if not app_private.user_can_access_partner_project(v_actor_user_id, p_project_id, 'project_comments.create') then
      raise exception 'Project comment permission denied.';
    end if;

    if exists (
      select 1
      from public.partner_project_sources pps
      where pps.project_id = p_project_id
        and app_private.partner_user_is_active(v_actor_user_id, pps.partner_id)
    ) then
      v_author_type := 'partner';
    elsif app_private.user_can_access_project(v_actor_user_id, p_project_id, 'guest_messages.couple_review') then
      v_author_type := 'couple';
    else
      v_author_type := 'staff';
    end if;
  end if;

  insert into public.project_comments (
    project_id,
    body,
    visibility,
    author_user_id,
    author_type,
    created_by,
    updated_by
  )
  values (
    p_project_id,
    trim(p_body),
    v_visibility,
    v_actor_user_id,
    v_author_type,
    v_actor_user_id,
    v_actor_user_id
  )
  returning * into v_comment;

  return v_comment;
end;
$$;

revoke all on function public.link_partner_user(uuid, uuid, text) from public;
revoke all on function public.create_partner_project_draft(uuid, text, text, text, text, integer, text, text, integer) from public;
revoke all on function public.submit_partner_project_submission(uuid) from public;
revoke all on function public.review_partner_project_submission(uuid, text, text) from public;
revoke all on function public.create_project_comment(uuid, text, text) from public;

grant execute on function public.link_partner_user(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.create_partner_project_draft(uuid, text, text, text, text, integer, text, text, integer) to authenticated, service_role;
grant execute on function public.submit_partner_project_submission(uuid) to authenticated, service_role;
grant execute on function public.review_partner_project_submission(uuid, text, text) to authenticated, service_role;
grant execute on function public.create_project_comment(uuid, text, text) to authenticated, service_role;

alter table public.partners enable row level security;
alter table public.partner_users enable row level security;
alter table public.partner_project_sources enable row level security;
alter table public.partner_project_submissions enable row level security;
alter table public.partner_project_assignments enable row level security;
alter table public.project_comments enable row level security;

drop policy if exists "Partners visible to authorized partner or internal users" on public.partners;
create policy "Partners visible to authorized partner or internal users"
on public.partners
for select
to authenticated
using (app_private.user_can_access_partner((select auth.uid()), id, 'partners.read'));

drop policy if exists "Partners managed by internal partner managers" on public.partners;
create policy "Partners managed by internal partner managers"
on public.partners
for all
to authenticated
using (app_private.user_has_permission((select auth.uid()), 'partners.manage', 'global', null))
with check (app_private.user_has_permission((select auth.uid()), 'partners.manage', 'global', null));

drop policy if exists "Partner users visible to partner readers" on public.partner_users;
create policy "Partner users visible to partner readers"
on public.partner_users
for select
to authenticated
using (app_private.user_can_access_partner((select auth.uid()), partner_id, 'partners.read'));

drop policy if exists "Partner users managed by internal managers" on public.partner_users;
create policy "Partner users managed by internal managers"
on public.partner_users
for all
to authenticated
using (app_private.user_has_permission((select auth.uid()), 'partner_users.manage', 'global', null))
with check (app_private.user_has_permission((select auth.uid()), 'partner_users.manage', 'global', null));

drop policy if exists "Partner project sources visible to partner readers" on public.partner_project_sources;
create policy "Partner project sources visible to partner readers"
on public.partner_project_sources
for select
to authenticated
using (
  app_private.user_can_access_partner((select auth.uid()), partner_id, 'partners.read')
  or app_private.user_has_permission((select auth.uid()), 'partner_projects.review', 'global', null)
);

drop policy if exists "Partner project sources managed by review services" on public.partner_project_sources;
create policy "Partner project sources managed by review services"
on public.partner_project_sources
for all
to authenticated
using (app_private.user_has_permission((select auth.uid()), 'partner_projects.review', 'global', null))
with check (app_private.user_has_permission((select auth.uid()), 'partner_projects.review', 'global', null));

drop policy if exists "Partner submissions visible to partner and reviewers" on public.partner_project_submissions;
create policy "Partner submissions visible to partner and reviewers"
on public.partner_project_submissions
for select
to authenticated
using (
  app_private.user_can_access_partner((select auth.uid()), partner_id, 'partners.read')
  or app_private.user_has_permission((select auth.uid()), 'partner_projects.review', 'global', null)
);

drop policy if exists "Partner submissions created by active partners" on public.partner_project_submissions;
create policy "Partner submissions created by active partners"
on public.partner_project_submissions
for insert
to authenticated
with check (app_private.user_can_access_partner((select auth.uid()), partner_id, 'partner_projects.create'));

drop policy if exists "Partner submissions reviewed by internal users" on public.partner_project_submissions;
create policy "Partner submissions reviewed by internal users"
on public.partner_project_submissions
for update
to authenticated
using (
  app_private.user_can_access_partner((select auth.uid()), partner_id, 'partner_projects.submit')
  or app_private.user_has_permission((select auth.uid()), 'partner_projects.review', 'global', null)
)
with check (
  app_private.user_can_access_partner((select auth.uid()), partner_id, 'partner_projects.submit')
  or app_private.user_has_permission((select auth.uid()), 'partner_projects.review', 'global', null)
);

drop policy if exists "Partner project assignments visible to partner readers" on public.partner_project_assignments;
create policy "Partner project assignments visible to partner readers"
on public.partner_project_assignments
for select
to authenticated
using (
  app_private.user_can_access_partner((select auth.uid()), partner_id, 'partners.read')
  or app_private.user_has_permission((select auth.uid()), 'partner_projects.assign', 'global', null)
);

drop policy if exists "Partner project assignments managed by internal assigners" on public.partner_project_assignments;
create policy "Partner project assignments managed by internal assigners"
on public.partner_project_assignments
for all
to authenticated
using (app_private.user_has_permission((select auth.uid()), 'partner_projects.assign', 'global', null))
with check (app_private.user_has_permission((select auth.uid()), 'partner_projects.assign', 'global', null));

drop policy if exists "Project comments visible by comment permissions" on public.project_comments;
create policy "Project comments visible by comment permissions"
on public.project_comments
for select
to authenticated
using (
  deleted_at is null
  and (
    (
      visibility = 'partner_visible'
      and app_private.user_can_access_partner_project((select auth.uid()), project_id, 'project_comments.read')
    )
    or (
      visibility = 'internal_only'
      and app_private.user_can_access_project((select auth.uid()), project_id, 'project_comments.internal.read')
    )
  )
);

drop policy if exists "Project comments created by authorized participants" on public.project_comments;
create policy "Project comments created by authorized participants"
on public.project_comments
for insert
to authenticated
with check (
  (
    visibility = 'partner_visible'
    and app_private.user_can_access_partner_project((select auth.uid()), project_id, 'project_comments.create')
  )
  or (
    visibility = 'internal_only'
    and app_private.user_can_access_project((select auth.uid()), project_id, 'project_comments.internal.read')
  )
);

drop policy if exists "Project comments updated by internal comment readers" on public.project_comments;
create policy "Project comments updated by internal comment readers"
on public.project_comments
for update
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'project_comments.internal.read'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'project_comments.internal.read'));

grant select, insert, update on public.partners to authenticated;
grant select, insert, update on public.partner_users to authenticated;
grant select, insert, update on public.partner_project_sources to authenticated;
grant select, insert, update on public.partner_project_submissions to authenticated;
grant select, insert, update on public.partner_project_assignments to authenticated;
grant select, insert, update on public.project_comments to authenticated;

grant select, insert, update on public.partners to service_role;
grant select, insert, update on public.partner_users to service_role;
grant select, insert, update on public.partner_project_sources to service_role;
grant select, insert, update on public.partner_project_submissions to service_role;
grant select, insert, update on public.partner_project_assignments to service_role;
grant select, insert, update on public.project_comments to service_role;

insert into public.permissions (slug, description, requirement_ids)
values
  ('partners.read', 'Read own or authorized partner profile records.', array['PART-001', 'PART-002', 'ROLE-004']),
  ('partners.manage', 'Create, update, activate, suspend, inactive, or archive partner profiles.', array['PART-002', 'ROLE-002', 'ROLE-004']),
  ('partner_users.manage', 'Link and manage users for partner profiles.', array['PART-002', 'ROLE-004', 'TECH-004']),
  ('partner_projects.create', 'Create partner-originated draft wedding projects.', array['PART-003', 'TECH-004']),
  ('partner_projects.submit', 'Submit partner-originated draft projects for Diginoces review.', array['PART-003', 'PART-004']),
  ('partner_projects.review', 'Approve, reject, request changes, or archive partner-originated project submissions.', array['PART-004', 'TECH-004']),
  ('partner_projects.assign', 'Assign partners to project-scoped operational roles.', array['PART-005', 'ROLE-004']),
  ('project_comments.read', 'Read project comments visible to partners, couples, and Diginoces/admin.', array['PART-006']),
  ('project_comments.create', 'Create project comments visible to partners, couples, and Diginoces/admin.', array['PART-006']),
  ('project_comments.internal.read', 'Read and manage internal-only project comments/notes.', array['PART-005', 'ROLE-004'])
on conflict (slug) do update
set
  description = excluded.description,
  requirement_ids = excluded.requirement_ids;

insert into public.roles (scope, slug, name, description, requires_mfa, is_system, requirement_ids)
values
  (
    'custom',
    'partner_admin',
    'Partner Admin',
    'Restricted partner administrator for own profile and partner-created project submissions.',
    true,
    true,
    array['PART-001', 'PART-002', 'PART-003', 'PART-004', 'PART-005', 'ROLE-004', 'ROLE-007']
  ),
  (
    'project',
    'partner_project_operator',
    'Partner Project Operator',
    'Project-scoped partner operator with non-commercial project progress and comment access.',
    true,
    true,
    array['PART-005', 'PART-006', 'ROLE-004', 'REP-004']
  )
on conflict (slug) do update
set
  scope = excluded.scope,
  name = excluded.name,
  description = excluded.description,
  requires_mfa = excluded.requires_mfa,
  is_system = excluded.is_system,
  requirement_ids = excluded.requirement_ids;

with sprint_13_grants(role_slug, permission_slug) as (
  values
    ('diginoces_admin', 'partners.read'),
    ('diginoces_admin', 'partners.manage'),
    ('diginoces_admin', 'partner_users.manage'),
    ('diginoces_admin', 'partner_projects.create'),
    ('diginoces_admin', 'partner_projects.submit'),
    ('diginoces_admin', 'partner_projects.review'),
    ('diginoces_admin', 'partner_projects.assign'),
    ('diginoces_admin', 'project_comments.read'),
    ('diginoces_admin', 'project_comments.create'),
    ('diginoces_admin', 'project_comments.internal.read'),
    ('operations_manager', 'partners.read'),
    ('operations_manager', 'partners.manage'),
    ('operations_manager', 'partner_users.manage'),
    ('operations_manager', 'partner_projects.create'),
    ('operations_manager', 'partner_projects.submit'),
    ('operations_manager', 'partner_projects.review'),
    ('operations_manager', 'partner_projects.assign'),
    ('operations_manager', 'project_comments.read'),
    ('operations_manager', 'project_comments.create'),
    ('operations_manager', 'project_comments.internal.read'),
    ('partner_admin', 'partners.read'),
    ('partner_admin', 'partner_projects.create'),
    ('partner_admin', 'partner_projects.submit'),
    ('partner_admin', 'dashboards.partner.read'),
    ('partner_project_operator', 'projects.read'),
    ('partner_project_operator', 'events.read'),
    ('partner_project_operator', 'workflow_tasks.read'),
    ('partner_project_operator', 'dashboards.partner.read'),
    ('partner_project_operator', 'project_comments.read'),
    ('partner_project_operator', 'project_comments.create'),
    ('couple', 'project_comments.read'),
    ('couple', 'project_comments.create'),
    ('bride', 'project_comments.read'),
    ('bride', 'project_comments.create'),
    ('groom', 'project_comments.read'),
    ('groom', 'project_comments.create')
)
insert into public.role_permissions (role_id, permission_slug)
select r.id, g.permission_slug
from sprint_13_grants g
join public.roles r on r.slug = g.role_slug
join public.permissions p on p.slug = g.permission_slug
on conflict (role_id, permission_slug) do nothing;
