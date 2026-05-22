-- Sprint 1 post-merge hardening for scoped permission and file foundations.

do $$
begin
  if exists (
    select 1
    from public.role_assignments
    where scope <> 'global'
      and scope_id is null
  ) then
    raise exception 'Cannot enforce role assignment scope shape while scoped assignments with null scope_id exist.';
  end if;

  if exists (
    select 1
    from public.files
    where scope_type <> 'platform'
      and scope_id is null
  ) then
    raise exception 'Cannot enforce file scope shape while scoped files with null scope_id exist.';
  end if;
end $$;

alter table public.role_assignments
  drop constraint if exists role_assignments_global_scope_has_no_id;

alter table public.role_assignments
  drop constraint if exists role_assignments_scope_id_shape;

alter table public.role_assignments
  add constraint role_assignments_scope_id_shape check (
    (scope = 'global' and scope_id is null)
    or (scope <> 'global' and scope_id is not null)
  );

alter table public.files
  drop constraint if exists files_scope_id_shape;

alter table public.files
  add constraint files_scope_id_shape check (
    (scope_type = 'platform' and scope_id is null)
    or (scope_type <> 'platform' and scope_id is not null)
  );

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
    join public.roles r on r.id = ra.role_id
    join public.role_permissions rp on rp.role_id = ra.role_id
    where ra.user_id = p_user_id
      and ra.scope = r.scope
      and rp.permission_slug = p_permission
      and (ra.expires_at is null or ra.expires_at > now())
      and (
        ra.scope = 'global'
        or (
          p_scope <> 'global'
          and p_scope_id is not null
          and ra.scope = p_scope
          and ra.scope_id = p_scope_id
        )
      )
  );
$$;

revoke all on function app_private.user_has_permission(uuid, text, public.role_scope_type, uuid) from public;
