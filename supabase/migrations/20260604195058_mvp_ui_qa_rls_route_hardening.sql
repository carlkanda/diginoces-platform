-- Sprint 15 MVP UI QA hardening:
-- RLS policies must not call private helpers that authenticated users cannot
-- execute, and guest-assignment policies must avoid guest/assignment recursion
-- introduced by later check-in read policies.

begin;

revoke execute on function app_private.user_can_manage_guest_side(
  uuid,
  uuid,
  public.guest_side
) from public;
revoke execute on function app_private.user_can_manage_guest_side(
  uuid,
  uuid,
  public.guest_side
) from anon;
grant execute on function app_private.user_can_manage_guest_side(
  uuid,
  uuid,
  public.guest_side
) to authenticated, service_role;

revoke execute on function app_private.user_can_read_guest_import_session(
  uuid,
  uuid,
  public.guest_side,
  uuid
) from public;
revoke execute on function app_private.user_can_read_guest_import_session(
  uuid,
  uuid,
  public.guest_side,
  uuid
) from anon;
grant execute on function app_private.user_can_read_guest_import_session(
  uuid,
  uuid,
  public.guest_side,
  uuid
) to authenticated, service_role;

revoke execute on function app_private.user_can_access_file(
  uuid,
  uuid,
  text
) from public;
revoke execute on function app_private.user_can_access_file(
  uuid,
  uuid,
  text
) from anon;
grant execute on function app_private.user_can_access_file(
  uuid,
  uuid,
  text
) to authenticated, service_role;

revoke execute on function app_private.user_can_access_check_in_event(
  uuid,
  uuid,
  uuid,
  text
) from public;
revoke execute on function app_private.user_can_access_check_in_event(
  uuid,
  uuid,
  uuid,
  text
) from anon;
grant execute on function app_private.user_can_access_check_in_event(
  uuid,
  uuid,
  uuid,
  text
) to authenticated, service_role;

create or replace function app_private.user_can_manage_guest_assignment(
  p_user_id uuid,
  p_project_id uuid,
  p_guest_id uuid,
  p_permission text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_user_id is not null
    and app_private.user_can_access_project(
      p_user_id,
      p_project_id,
      p_permission
    )
    and exists (
      select 1
      from public.guests g
      where g.id = p_guest_id
        and g.project_id = p_project_id
        and app_private.user_can_manage_guest_side(
          p_user_id,
          p_project_id,
          g.guest_side
        )
    );
$$;

revoke execute on function app_private.user_can_manage_guest_assignment(
  uuid,
  uuid,
  uuid,
  text
) from public;
revoke execute on function app_private.user_can_manage_guest_assignment(
  uuid,
  uuid,
  uuid,
  text
) from anon;
grant execute on function app_private.user_can_manage_guest_assignment(
  uuid,
  uuid,
  uuid,
  text
) to authenticated, service_role;

drop policy if exists "Guest event assignments managed by assignment managers"
on public.guest_event_assignments;
create policy "Guest event assignments managed by assignment managers"
on public.guest_event_assignments
for all
to authenticated
using (
  app_private.user_can_manage_guest_assignment(
    (select auth.uid()),
    project_id,
    guest_id,
    'guest_event_assignments.manage'
  )
)
with check (
  app_private.user_can_manage_guest_assignment(
    (select auth.uid()),
    project_id,
    guest_id,
    'guest_event_assignments.manage'
  )
);

drop policy if exists "Guest tag assignments managed by tag managers"
on public.guest_tag_assignments;
create policy "Guest tag assignments managed by tag managers"
on public.guest_tag_assignments
for all
to authenticated
using (
  app_private.user_can_manage_guest_assignment(
    (select auth.uid()),
    project_id,
    guest_id,
    'guest_tags.manage'
  )
)
with check (
  app_private.user_can_manage_guest_assignment(
    (select auth.uid()),
    project_id,
    guest_id,
    'guest_tags.manage'
  )
);

commit;
