insert into public.permissions (slug, description, requirement_ids)
values
  ('guest_duplicates.manage', 'Manage guest duplicate candidate review state.', array['GM-008'])
on conflict (slug) do update
set
  description = excluded.description,
  requirement_ids = excluded.requirement_ids;

with grants(role_slug, permission_slug) as (
  values
    ('diginoces_admin', 'guest_duplicates.manage'),
    ('operations_manager', 'guest_duplicates.manage')
)
insert into public.role_permissions (role_id, permission_slug)
select r.id, g.permission_slug
from grants g
join public.roles r on r.slug = g.role_slug
join public.permissions p on p.slug = g.permission_slug
on conflict (role_id, permission_slug) do nothing;

drop policy if exists "Guest duplicates managed by duplicate readers" on public.guest_duplicate_candidates;
drop policy if exists "Guest duplicates managed by duplicate managers" on public.guest_duplicate_candidates;
create policy "Guest duplicates managed by duplicate managers"
on public.guest_duplicate_candidates
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_duplicates.manage'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_duplicates.manage'));

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
  v_invalid_event_ids uuid[];
  v_invalid_tag_ids uuid[];
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

    select coalesce(array_agg(incoming_event_id), '{}'::uuid[])
    into v_invalid_event_ids
    from unnest(v_event_ids) as incoming_event_id
    left join public.events e
      on e.id = incoming_event_id
     and e.project_id = v_project_id
    where e.id is null;

    if coalesce(array_length(v_invalid_event_ids, 1), 0) > 0 then
      raise exception 'One or more event IDs are invalid for this project: %', v_invalid_event_ids
        using errcode = '42501';
    end if;

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

    select coalesce(array_agg(incoming_tag_id), '{}'::uuid[])
    into v_invalid_tag_ids
    from unnest(v_tag_ids) as incoming_tag_id
    left join public.guest_tags gt
      on gt.id = incoming_tag_id
     and gt.project_id = v_project_id
    where gt.id is null;

    if coalesce(array_length(v_invalid_tag_ids, 1), 0) > 0 then
      raise exception 'One or more tag IDs are invalid for this project: %', v_invalid_tag_ids
        using errcode = '42501';
    end if;

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
