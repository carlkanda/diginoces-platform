-- Admin access-management UI support.
-- Requirements: UX-REDESIGN-001, ROLE-002, ROLE-004, PROJ-001, PROJ-002.
--
-- Scope guard: this migration exposes narrow, permission-gated functions for
-- project/event membership screens. It does not add auth invitation delivery,
-- global role management, custom role authoring, AI assistance, or integrations.

create or replace function app_private.ensure_auth_user_profile(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  auth_record record;
begin
  select
    u.id,
    u.email,
    coalesce(
      nullif(u.raw_user_meta_data ->> 'display_name', ''),
      nullif(u.raw_user_meta_data ->> 'full_name', ''),
      nullif(u.raw_user_meta_data ->> 'name', '')
    ) as display_name
  into auth_record
  from auth.users u
  where u.id = p_user_id;

  if auth_record.id is null or auth_record.email is null then
    return;
  end if;

  insert into public.app_users (id, email, display_name)
  values (auth_record.id, auth_record.email, auth_record.display_name)
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.app_users.display_name, excluded.display_name),
    updated_at = now();
end;
$$;

revoke all on function app_private.ensure_auth_user_profile(uuid) from public;

create or replace function public.find_auth_user_for_admin(p_email text)
returns table (
  user_id uuid,
  email text,
  display_name text
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_user_id uuid := (select auth.uid());
  normalized_email text := lower(trim(coalesce(p_email, '')));
begin
  if normalized_email = '' then
    raise exception 'Email is required.' using errcode = '22023';
  end if;

  if not app_private.user_has_permission(actor_user_id, 'users.read', 'global', null) then
    raise exception 'Permission denied.' using errcode = '42501';
  end if;

  return query
  select
    u.id as user_id,
    u.email::text as email,
    coalesce(
      au.display_name,
      nullif(u.raw_user_meta_data ->> 'display_name', ''),
      nullif(u.raw_user_meta_data ->> 'full_name', ''),
      nullif(u.raw_user_meta_data ->> 'name', '')
    ) as display_name
  from auth.users u
  left join public.app_users au on au.id = u.id
  where lower(u.email) = normalized_email
  limit 1;
end;
$$;

revoke all on function public.find_auth_user_for_admin(text) from public;
grant execute on function public.find_auth_user_for_admin(text) to authenticated;

create or replace function public.list_project_members_for_admin(p_project_id uuid)
returns table (
  member_id uuid,
  user_id uuid,
  email text,
  display_name text,
  role_id uuid,
  role_slug text,
  role_name text,
  role_scope public.role_scope_type,
  status public.membership_status,
  assigned_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_user_id uuid := (select auth.uid());
begin
  if not app_private.user_can_access_project(actor_user_id, p_project_id, 'project_members.read') then
    raise exception 'Permission denied.' using errcode = '42501';
  end if;

  return query
  select
    pm.id as member_id,
    pm.user_id,
    coalesce(au.email, u.email)::text as email,
    coalesce(
      au.display_name,
      nullif(u.raw_user_meta_data ->> 'display_name', ''),
      nullif(u.raw_user_meta_data ->> 'full_name', ''),
      nullif(u.raw_user_meta_data ->> 'name', '')
    ) as display_name,
    r.id as role_id,
    r.slug as role_slug,
    r.name as role_name,
    r.scope as role_scope,
    pm.status,
    pm.assigned_at
  from public.project_members pm
  join public.roles r on r.id = pm.role_id
  left join public.app_users au on au.id = pm.user_id
  left join auth.users u on u.id = pm.user_id
  where pm.project_id = p_project_id
  order by pm.assigned_at desc, r.name asc;
end;
$$;

revoke all on function public.list_project_members_for_admin(uuid) from public;
grant execute on function public.list_project_members_for_admin(uuid) to authenticated;

create or replace function public.assign_project_member_by_email(
  p_project_id uuid,
  p_email text,
  p_role_slug text,
  p_status public.membership_status default 'active'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_user_id uuid := (select auth.uid());
  normalized_email text := lower(trim(coalesce(p_email, '')));
  target_user_id uuid;
  target_role_id uuid;
  existing_member_id uuid;
  saved_member_id uuid;
begin
  if normalized_email = '' then
    raise exception 'Email is required.' using errcode = '22023';
  end if;

  if not app_private.user_can_access_project(actor_user_id, p_project_id, 'project_members.manage') then
    raise exception 'Permission denied.' using errcode = '42501';
  end if;

  select u.id into target_user_id
  from auth.users u
  where lower(u.email) = normalized_email
  limit 1;

  if target_user_id is null then
    raise exception 'User was not found.' using errcode = 'P0002';
  end if;

  select r.id into target_role_id
  from public.roles r
  where r.slug = p_role_slug
    and r.scope = 'project'
  limit 1;

  if target_role_id is null then
    raise exception 'Project role was not found.' using errcode = '22023';
  end if;

  perform app_private.ensure_auth_user_profile(target_user_id);
  perform pg_advisory_xact_lock(
    hashtext(
      'project_member:' || p_project_id::text || ':' || target_user_id::text
    )
  );

  select pm.id into existing_member_id
  from public.project_members pm
  where pm.project_id = p_project_id
    and pm.user_id = target_user_id
    and pm.role_id = target_role_id
  order by
    case when pm.status in ('active', 'invited') then 0 else 1 end,
    pm.assigned_at desc
  limit 1;

  if existing_member_id is null then
    insert into public.project_members (
      project_id,
      user_id,
      role_id,
      status,
      assigned_by
    )
    values (
      p_project_id,
      target_user_id,
      target_role_id,
      p_status,
      actor_user_id
    )
    returning id into saved_member_id;
  else
    update public.project_members
    set
      status = p_status,
      assigned_by = actor_user_id,
      assigned_at = now()
    where id = existing_member_id
    returning id into saved_member_id;
  end if;

  return saved_member_id;
end;
$$;

revoke all on function public.assign_project_member_by_email(uuid, text, text, public.membership_status) from public;
grant execute on function public.assign_project_member_by_email(uuid, text, text, public.membership_status) to authenticated;

create or replace function public.update_project_member_status_for_admin(
  p_member_id uuid,
  p_status public.membership_status
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_user_id uuid := (select auth.uid());
  target_project_id uuid;
begin
  select pm.project_id into target_project_id
  from public.project_members pm
  where pm.id = p_member_id;

  if target_project_id is null then
    raise exception 'Project member was not found.' using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(actor_user_id, target_project_id, 'project_members.manage') then
    raise exception 'Permission denied.' using errcode = '42501';
  end if;

  update public.project_members
  set status = p_status
  where id = p_member_id;

  return p_member_id;
end;
$$;

revoke all on function public.update_project_member_status_for_admin(uuid, public.membership_status) from public;
grant execute on function public.update_project_member_status_for_admin(uuid, public.membership_status) to authenticated;

create or replace function public.list_event_members_for_admin(p_event_id uuid)
returns table (
  member_id uuid,
  user_id uuid,
  email text,
  display_name text,
  role_id uuid,
  role_slug text,
  role_name text,
  role_scope public.role_scope_type,
  status public.membership_status,
  assigned_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_user_id uuid := (select auth.uid());
begin
  if not app_private.user_can_access_event(actor_user_id, p_event_id, 'event_members.read') then
    raise exception 'Permission denied.' using errcode = '42501';
  end if;

  return query
  select
    em.id as member_id,
    em.user_id,
    coalesce(au.email, u.email)::text as email,
    coalesce(
      au.display_name,
      nullif(u.raw_user_meta_data ->> 'display_name', ''),
      nullif(u.raw_user_meta_data ->> 'full_name', ''),
      nullif(u.raw_user_meta_data ->> 'name', '')
    ) as display_name,
    r.id as role_id,
    r.slug as role_slug,
    r.name as role_name,
    r.scope as role_scope,
    em.status,
    em.assigned_at
  from public.event_members em
  join public.roles r on r.id = em.role_id
  left join public.app_users au on au.id = em.user_id
  left join auth.users u on u.id = em.user_id
  where em.event_id = p_event_id
  order by em.assigned_at desc, r.name asc;
end;
$$;

revoke all on function public.list_event_members_for_admin(uuid) from public;
grant execute on function public.list_event_members_for_admin(uuid) to authenticated;

create or replace function public.assign_event_member_by_email(
  p_event_id uuid,
  p_email text,
  p_role_slug text,
  p_status public.membership_status default 'active'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_user_id uuid := (select auth.uid());
  normalized_email text := lower(trim(coalesce(p_email, '')));
  target_user_id uuid;
  target_role_id uuid;
  existing_member_id uuid;
  saved_member_id uuid;
begin
  if normalized_email = '' then
    raise exception 'Email is required.' using errcode = '22023';
  end if;

  if not app_private.user_can_access_event(actor_user_id, p_event_id, 'event_members.manage') then
    raise exception 'Permission denied.' using errcode = '42501';
  end if;

  select u.id into target_user_id
  from auth.users u
  where lower(u.email) = normalized_email
  limit 1;

  if target_user_id is null then
    raise exception 'User was not found.' using errcode = 'P0002';
  end if;

  select r.id into target_role_id
  from public.roles r
  where r.slug = p_role_slug
    and r.scope = 'event'
  limit 1;

  if target_role_id is null then
    raise exception 'Event role was not found.' using errcode = '22023';
  end if;

  perform app_private.ensure_auth_user_profile(target_user_id);
  perform pg_advisory_xact_lock(
    hashtext(
      'event_member:' || p_event_id::text || ':' || target_user_id::text
    )
  );

  select em.id into existing_member_id
  from public.event_members em
  where em.event_id = p_event_id
    and em.user_id = target_user_id
    and em.role_id = target_role_id
  order by
    case when em.status in ('active', 'invited') then 0 else 1 end,
    em.assigned_at desc
  limit 1;

  if existing_member_id is null then
    insert into public.event_members (
      event_id,
      user_id,
      role_id,
      status,
      assigned_by
    )
    values (
      p_event_id,
      target_user_id,
      target_role_id,
      p_status,
      actor_user_id
    )
    returning id into saved_member_id;
  else
    update public.event_members
    set
      status = p_status,
      assigned_by = actor_user_id,
      assigned_at = now()
    where id = existing_member_id
    returning id into saved_member_id;
  end if;

  return saved_member_id;
end;
$$;

revoke all on function public.assign_event_member_by_email(uuid, text, text, public.membership_status) from public;
grant execute on function public.assign_event_member_by_email(uuid, text, text, public.membership_status) to authenticated;

create or replace function public.update_event_member_status_for_admin(
  p_member_id uuid,
  p_status public.membership_status
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_user_id uuid := (select auth.uid());
  target_event_id uuid;
begin
  select em.event_id into target_event_id
  from public.event_members em
  where em.id = p_member_id;

  if target_event_id is null then
    raise exception 'Event member was not found.' using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_event(actor_user_id, target_event_id, 'event_members.manage') then
    raise exception 'Permission denied.' using errcode = '42501';
  end if;

  update public.event_members
  set status = p_status
  where id = p_member_id;

  return p_member_id;
end;
$$;

revoke all on function public.update_event_member_status_for_admin(uuid, public.membership_status) from public;
grant execute on function public.update_event_member_status_for_admin(uuid, public.membership_status) to authenticated;

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
  sanitized_new jsonb;
  sanitized_old jsonb;
begin
  changed_object_type := case tg_table_name
    when 'wedding_projects' then 'wedding_project'
    when 'events' then 'event'
    when 'project_members' then 'project_member'
    when 'event_members' then 'event_member'
    when 'workflow_tasks' then 'workflow_task'
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
    when tg_table_name = 'project_members' and tg_op = 'INSERT' then 'project_members.assigned'
    when tg_table_name = 'project_members' and tg_op = 'UPDATE' then 'project_members.updated'
    when tg_table_name = 'project_members' and tg_op = 'DELETE' then 'project_members.deleted'
    when tg_table_name = 'event_members' and tg_op = 'INSERT' then 'event_members.assigned'
    when tg_table_name = 'event_members' and tg_op = 'UPDATE' then 'event_members.updated'
    when tg_table_name = 'event_members' and tg_op = 'DELETE' then 'event_members.deleted'
    when tg_table_name = 'workflow_tasks' and tg_op = 'INSERT' then 'workflow_tasks.created'
    when tg_table_name = 'workflow_tasks' and tg_op = 'UPDATE' then 'workflow_tasks.updated'
    when tg_table_name = 'workflow_tasks' and tg_op = 'DELETE' then 'workflow_tasks.deleted'
    else lower(tg_table_name || '.' || tg_op)
  end;

  if tg_op in ('UPDATE', 'DELETE') then
    sanitized_old := app_private.redact_project_event_audit_snapshot(to_jsonb(old));
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    sanitized_new := app_private.redact_project_event_audit_snapshot(to_jsonb(new));
  end if;

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
    sanitized_old,
    sanitized_new,
    'api'
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists audit_project_members_insert on public.project_members;
create trigger audit_project_members_insert
after insert on public.project_members
for each row
execute function app_private.audit_project_event_change();

drop trigger if exists audit_project_members_update on public.project_members;
create trigger audit_project_members_update
after update on public.project_members
for each row
execute function app_private.audit_project_event_change();

drop trigger if exists audit_event_members_insert on public.event_members;
create trigger audit_event_members_insert
after insert on public.event_members
for each row
execute function app_private.audit_project_event_change();

drop trigger if exists audit_event_members_update on public.event_members;
create trigger audit_event_members_update
after update on public.event_members
for each row
execute function app_private.audit_project_event_change();
