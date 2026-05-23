-- Cross-sprint integration hardening for Sprints 1-5.
-- Traceability: Sprint 2 issue #3 / PR #4, Sprint 3 issue #5 / PR #6,
-- cross-sprint review PR #17.

create or replace function app_private.generate_project_code(
  p_bride_name text,
  p_groom_name text,
  p_project_year integer
)
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  base_code text;
  candidate text;
  max_sequence integer := 999;
  sequence_number integer := 1;
  selected_year integer;
begin
  selected_year := coalesce(p_project_year, extract(year from now())::integer);
  base_code := app_private.project_code_prefix(p_bride_name, p_groom_name) || '-' || selected_year::text || '-';
  perform pg_advisory_xact_lock(hashtext(base_code));

  while sequence_number <= max_sequence loop
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

  raise exception 'Unable to generate a unique project code after % attempts for prefix %', max_sequence, base_code
    using errcode = '54000';
end;
$$;

revoke all on function app_private.generate_project_code(text, text, integer) from public;

create or replace function app_private.generate_event_code(
  p_project_id uuid,
  p_event_type public.event_type
)
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  base_code text;
  candidate text;
  max_sequence integer := 99;
  project_exists boolean := false;
  project_code_value text;
  sequence_number integer := 1;
begin
  select wp.project_code, true
  into project_code_value, project_exists
  from public.wedding_projects wp
  where wp.id = p_project_id;

  if not coalesce(project_exists, false) then
    raise exception 'Project not found: %', p_project_id
      using errcode = 'P0002';
  end if;

  if project_code_value is null then
    raise exception 'Project % has no project_code assigned', p_project_id
      using errcode = '22023';
  end if;

  base_code := project_code_value || '-' || app_private.event_type_code(p_event_type);
  perform pg_advisory_xact_lock(hashtext(base_code));

  while sequence_number <= max_sequence loop
    -- The first event of a type intentionally uses the compact base code.
    -- Duplicate event types receive -02 through -99 suffixes.
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

  raise exception 'Unable to generate a unique event code after % attempts for prefix %', max_sequence, base_code
    using errcode = '54000';
end;
$$;

revoke all on function app_private.generate_event_code(uuid, public.event_type) from public;

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
  v_guest_side public.guest_side;
  v_invalid_event_ids uuid[];
  v_invalid_tag_ids uuid[];
  v_project_id uuid;
  v_tag_ids uuid[];
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  select guests.project_id, guests.guest_side
  into v_project_id, v_guest_side
  from public.guests
  where guests.id = p_guest_id;

  if v_project_id is null then
    raise exception 'Guest was not found.'
      using errcode = 'P0002';
  end if;

  if p_event_ids is not null
    and (
      not app_private.user_can_access_project(v_actor_user_id, v_project_id, 'guest_event_assignments.manage')
      or not app_private.user_can_manage_guest_side(v_actor_user_id, v_project_id, v_guest_side)
    ) then
    raise exception 'Permission denied for guest event assignment updates.'
      using errcode = '42501';
  end if;

  if p_tag_ids is not null
    and (
      not app_private.user_can_access_project(v_actor_user_id, v_project_id, 'guest_tags.manage')
      or not app_private.user_can_manage_guest_side(v_actor_user_id, v_project_id, v_guest_side)
    ) then
    raise exception 'Permission denied for guest tag assignment updates.'
      using errcode = '42501';
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
        using errcode = '22023';
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
      status = case
        when public.guest_event_assignments.status = 'assigned'::public.guest_event_assignment_status then excluded.status
        else public.guest_event_assignments.status
      end,
      updated_at = now(),
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
        using errcode = '22023';
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
