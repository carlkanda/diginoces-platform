-- Sprint 3 CodeRabbit review fixes.
-- Requirements: GM-003, GM-006, PROJ-005, REP-006, ROLE-005.

create or replace function public.replace_guest_foundation_assignments(
  p_guest_id uuid,
  p_event_ids uuid[] default null,
  p_tag_ids uuid[] default null
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_event_ids uuid[];
  v_project_id uuid;
  v_tag_ids uuid[];
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  select guests.project_id
  into v_project_id
  from public.guests
  where guests.id = p_guest_id;

  if v_project_id is null then
    raise exception 'Guest was not found.'
      using errcode = 'P0002';
  end if;

  if p_event_ids is not null then
    select coalesce(array_agg(distinct event_id), '{}'::uuid[])
    into v_event_ids
    from unnest(p_event_ids) as event_id
    where event_id is not null;

    insert into public.guest_event_assignments (
      project_id,
      guest_id,
      event_id,
      invited,
      status,
      created_by,
      updated_by
    )
    select
      v_project_id,
      p_guest_id,
      event_id,
      true,
      'assigned',
      v_actor_user_id,
      v_actor_user_id
    from unnest(v_event_ids) as event_id
    on conflict (guest_id, event_id) do update
    set
      invited = excluded.invited,
      status = excluded.status,
      updated_by = excluded.updated_by;

    delete from public.guest_event_assignments
    where guest_id = p_guest_id
      and not (event_id = any(v_event_ids));
  end if;

  if p_tag_ids is not null then
    select coalesce(array_agg(distinct tag_id), '{}'::uuid[])
    into v_tag_ids
    from unnest(p_tag_ids) as tag_id
    where tag_id is not null;

    insert into public.guest_tag_assignments (
      project_id,
      guest_id,
      tag_id,
      created_by
    )
    select
      v_project_id,
      p_guest_id,
      tag_id,
      v_actor_user_id
    from unnest(v_tag_ids) as tag_id
    on conflict (guest_id, tag_id) do nothing;

    delete from public.guest_tag_assignments
    where guest_id = p_guest_id
      and not (tag_id = any(v_tag_ids));
  end if;
end;
$$;

revoke all on function public.replace_guest_foundation_assignments(uuid, uuid[], uuid[]) from public;
grant execute on function public.replace_guest_foundation_assignments(uuid, uuid[], uuid[]) to authenticated;

drop policy if exists "Guests updated by side managers" on public.guests;
create policy "Guests updated by side managers"
on public.guests
for update
to authenticated
using (app_private.user_can_manage_guest_side((select auth.uid()), project_id, guest_side))
with check (
  app_private.user_can_manage_guest_side((select auth.uid()), project_id, guest_side)
  and (
    is_active
    or app_private.user_can_access_project((select auth.uid()), project_id, 'guests.deactivate')
  )
);
