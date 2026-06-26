-- Global access-management UI support.
-- Requirements: UX-REDESIGN-001, ROLE-001, ROLE-002, ROLE-007.
--
-- Scope guard: this migration exposes narrow, permission-gated functions for
-- assigning existing auth users to global roles. It does not create users,
-- send invitations, author custom roles, or implement future integrations.

create or replace function public.list_global_role_assignments_for_admin()
returns table (
  assignment_id uuid,
  user_id uuid,
  email text,
  display_name text,
  role_id uuid,
  role_slug text,
  role_name text,
  requires_mfa boolean,
  assigned_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_user_id uuid := (select auth.uid());
begin
  if not app_private.user_has_permission(actor_user_id, 'roles.manage', 'global', null) then
    raise exception 'Permission denied.' using errcode = '42501';
  end if;

  return query
  select
    ra.id as assignment_id,
    ra.user_id,
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
    r.requires_mfa,
    ra.assigned_at,
    ra.expires_at
  from public.role_assignments ra
  join public.roles r on r.id = ra.role_id
  left join public.app_users au on au.id = ra.user_id
  left join auth.users u on u.id = ra.user_id
  where ra.scope = 'global'
  order by
    case when ra.expires_at is null or ra.expires_at > now() then 0 else 1 end,
    ra.assigned_at desc,
    r.name asc;
end;
$$;

revoke all on function public.list_global_role_assignments_for_admin() from public;
grant execute on function public.list_global_role_assignments_for_admin() to authenticated;

create or replace function public.assign_global_role_by_email(
  p_email text,
  p_role_slug text
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
  existing_assignment_id uuid;
  saved_assignment_id uuid;
begin
  if normalized_email = '' then
    raise exception 'Email is required.' using errcode = '22023';
  end if;

  if not app_private.user_has_permission(actor_user_id, 'roles.manage', 'global', null) then
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
    and r.scope = 'global'
  limit 1;

  if target_role_id is null then
    raise exception 'Global role was not found.' using errcode = '22023';
  end if;

  perform app_private.ensure_auth_user_profile(target_user_id);

  select ra.id into existing_assignment_id
  from public.role_assignments ra
  where ra.user_id = target_user_id
    and ra.role_id = target_role_id
    and ra.scope = 'global'
  order by
    case when ra.expires_at is null or ra.expires_at > now() then 0 else 1 end,
    ra.assigned_at desc
  limit 1;

  if existing_assignment_id is null then
    insert into public.role_assignments (
      user_id,
      role_id,
      scope,
      assigned_by
    )
    values (
      target_user_id,
      target_role_id,
      'global',
      actor_user_id
    )
    returning id into saved_assignment_id;
  else
    update public.role_assignments
    set
      assigned_by = actor_user_id,
      assigned_at = now(),
      expires_at = null
    where id = existing_assignment_id
    returning id into saved_assignment_id;
  end if;

  return saved_assignment_id;
end;
$$;

revoke all on function public.assign_global_role_by_email(text, text) from public;
grant execute on function public.assign_global_role_by_email(text, text) to authenticated;

create or replace function public.revoke_global_role_assignment_for_admin(
  p_assignment_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_user_id uuid := (select auth.uid());
  assignment_scope public.role_scope_type;
begin
  select ra.scope into assignment_scope
  from public.role_assignments ra
  where ra.id = p_assignment_id;

  if assignment_scope is null then
    raise exception 'Role assignment was not found.' using errcode = 'P0002';
  end if;

  if assignment_scope <> 'global' then
    raise exception 'Only global assignments can be revoked here.' using errcode = '22023';
  end if;

  if not app_private.user_has_permission(actor_user_id, 'roles.manage', 'global', null) then
    raise exception 'Permission denied.' using errcode = '42501';
  end if;

  update public.role_assignments
  set
    assigned_by = actor_user_id,
    expires_at = now()
  where id = p_assignment_id;

  return p_assignment_id;
end;
$$;

revoke all on function public.revoke_global_role_assignment_for_admin(uuid) from public;
grant execute on function public.revoke_global_role_assignment_for_admin(uuid) to authenticated;

create or replace function app_private.audit_role_assignment_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  action_name text;
  old_snapshot jsonb;
  new_snapshot jsonb;
begin
  action_name := case
    when tg_op = 'INSERT' then 'roles.assigned'
    when tg_op = 'UPDATE' and old.expires_at is null and new.expires_at is not null then 'roles.revoked'
    when tg_op = 'UPDATE' then 'roles.updated'
    when tg_op = 'DELETE' then 'roles.deleted'
    else lower(tg_table_name || '.' || tg_op)
  end;

  if tg_op in ('UPDATE', 'DELETE') then
    old_snapshot := to_jsonb(old);
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    new_snapshot := to_jsonb(new);
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
    'role_assignment',
    case when tg_op = 'DELETE' then old.id else new.id end,
    old_snapshot,
    new_snapshot,
    'api'
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists audit_role_assignments_insert on public.role_assignments;
create trigger audit_role_assignments_insert
after insert on public.role_assignments
for each row
execute function app_private.audit_role_assignment_change();

drop trigger if exists audit_role_assignments_update on public.role_assignments;
create trigger audit_role_assignments_update
after update on public.role_assignments
for each row
execute function app_private.audit_role_assignment_change();
