-- Sprint 4 post-merge hardening: guest import visibility and workflow guards.
-- Requirements: GM-004, GM-005, ROLE-005, TECH-004, REP-006.

create or replace function app_private.user_can_read_guest_import_session(
  p_user_id uuid,
  p_project_id uuid,
  p_import_side public.guest_side,
  p_uploaded_by uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_user_id is not null
    and (
      app_private.user_can_access_project(p_user_id, p_project_id, 'guest_imports.review')
      or app_private.user_can_access_project(p_user_id, p_project_id, 'guest_imports.apply')
      or (
        app_private.user_can_access_project(p_user_id, p_project_id, 'guest_imports.read')
        and (
          p_uploaded_by = p_user_id
          or app_private.user_can_manage_guest_side(p_user_id, p_project_id, p_import_side)
        )
      )
    );
$$;

revoke all on function app_private.user_can_read_guest_import_session(
  uuid,
  uuid,
  public.guest_side,
  uuid
) from public;

drop policy if exists "Guest import sessions visible to import readers" on public.guest_import_sessions;
create policy "Guest import sessions visible to import readers"
on public.guest_import_sessions
for select
to authenticated
using (
  app_private.user_can_read_guest_import_session(
    (select auth.uid()),
    project_id,
    import_side,
    uploaded_by
  )
);

drop policy if exists "Guest import rows visible to import readers" on public.guest_import_rows;
create policy "Guest import rows visible to import readers"
on public.guest_import_rows
for select
to authenticated
using (
  exists (
    select 1
    from public.guest_import_sessions gis
    where gis.id = guest_import_rows.import_session_id
      and gis.project_id = guest_import_rows.project_id
      and app_private.user_can_read_guest_import_session(
        (select auth.uid()),
        gis.project_id,
        gis.import_side,
        gis.uploaded_by
      )
  )
);

drop policy if exists "Guest import mappings visible to import readers" on public.guest_import_mappings;
create policy "Guest import mappings visible to import readers"
on public.guest_import_mappings
for select
to authenticated
using (
  exists (
    select 1
    from public.guest_import_sessions gis
    where gis.id = guest_import_mappings.import_session_id
      and gis.project_id = guest_import_mappings.project_id
      and app_private.user_can_read_guest_import_session(
        (select auth.uid()),
        gis.project_id,
        gis.import_side,
        gis.uploaded_by
      )
  )
);

create or replace function public.submit_guest_import_session(
  p_import_session_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_session public.guest_import_sessions%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  select *
  into v_session
  from public.guest_import_sessions
  where id = p_import_session_id
  for update;

  if v_session.id is null then
    raise exception 'Guest import session was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_session.project_id, 'guest_imports.submit')
    or not app_private.user_can_manage_guest_side(v_actor_user_id, v_session.project_id, v_session.import_side) then
    raise exception 'Guest import submit permission denied.'
      using errcode = '42501';
  end if;

  if v_session.status not in ('previewed', 'validation_failed') then
    raise exception 'Guest import session must be previewed before submission.'
      using errcode = '22023';
  end if;

  if v_session.row_count <= v_session.invalid_row_count then
    raise exception 'Guest import has no reviewable rows.'
      using errcode = '22023';
  end if;

  update public.guest_import_sessions
  set
    status = 'ready_for_review',
    submitted_at = coalesce(submitted_at, now()),
    updated_by = v_actor_user_id
  where id = p_import_session_id;
end;
$$;

create or replace function public.review_guest_import_rows(
  p_import_session_id uuid,
  p_approved_row_ids uuid[] default '{}'::uuid[],
  p_rejected_row_ids uuid[] default '{}'::uuid[],
  p_held_row_ids uuid[] default '{}'::uuid[],
  p_review_notes text default null
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_approved_count integer;
  v_held_count integer;
  v_invalid_approved_count integer;
  v_invalid_review_count integer;
  v_matched_row_count integer;
  v_pending_count integer;
  v_rejected_count integer;
  v_requested_distinct_count integer;
  v_requested_row_count integer;
  v_session public.guest_import_sessions%rowtype;
  v_status public.guest_import_session_status;
begin
  p_approved_row_ids := coalesce(p_approved_row_ids, '{}'::uuid[]);
  p_rejected_row_ids := coalesce(p_rejected_row_ids, '{}'::uuid[]);
  p_held_row_ids := coalesce(p_held_row_ids, '{}'::uuid[]);

  if v_actor_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  select *
  into v_session
  from public.guest_import_sessions
  where id = p_import_session_id
  for update;

  if v_session.id is null then
    raise exception 'Guest import session was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_session.project_id, 'guest_imports.review') then
    raise exception 'Guest import review permission denied.'
      using errcode = '42501';
  end if;

  if v_session.status not in ('ready_for_review', 'partially_approved') then
    raise exception 'Guest import session must be submitted for review.'
      using errcode = '22023';
  end if;

  with requested(row_id) as (
    select unnest(p_approved_row_ids)
    union all
    select unnest(p_rejected_row_ids)
    union all
    select unnest(p_held_row_ids)
  )
  select count(*)::integer, count(distinct row_id)::integer
  into v_requested_row_count, v_requested_distinct_count
  from requested;

  if v_requested_row_count <> v_requested_distinct_count then
    raise exception 'Each guest import row can have only one review outcome.'
      using errcode = '22023';
  end if;

  if v_requested_distinct_count > 0 then
    perform 1
    from public.guest_import_rows gir
    where gir.import_session_id = p_import_session_id
      and gir.id in (
        select distinct row_id
        from (
          select unnest(p_approved_row_ids) as row_id
          union all
          select unnest(p_rejected_row_ids) as row_id
          union all
          select unnest(p_held_row_ids) as row_id
        ) requested_rows
      )
    for update;

    select count(*)::integer
    into v_matched_row_count
    from public.guest_import_rows gir
    where gir.import_session_id = p_import_session_id
      and gir.id in (
        select distinct row_id
        from (
          select unnest(p_approved_row_ids) as row_id
          union all
          select unnest(p_rejected_row_ids) as row_id
          union all
          select unnest(p_held_row_ids) as row_id
        ) requested_rows
      );

    if v_matched_row_count <> v_requested_distinct_count then
      raise exception 'One or more requested review rows do not belong to this import session.'
        using errcode = '22023';
    end if;
  end if;

  select count(*)::integer
  into v_invalid_approved_count
  from public.guest_import_rows gir
  where gir.import_session_id = p_import_session_id
    and gir.id = any(p_approved_row_ids)
    and (
      gir.validation_status = 'blocked'
      or gir.approval_status = 'applied'
    );

  if v_invalid_approved_count > 0 then
    raise exception 'Blocked or applied import rows cannot be approved.'
      using errcode = '22023';
  end if;

  select count(*)::integer
  into v_invalid_review_count
  from public.guest_import_rows gir
  where gir.import_session_id = p_import_session_id
    and gir.id = any(p_rejected_row_ids || p_held_row_ids)
    and gir.approval_status = 'applied';

  if v_invalid_review_count > 0 then
    raise exception 'Applied import rows cannot be reviewed again.'
      using errcode = '22023';
  end if;

  update public.guest_import_rows
  set
    approval_status = 'approved',
    review_notes = coalesce(p_review_notes, review_notes)
  where import_session_id = p_import_session_id
    and id = any(p_approved_row_ids);

  update public.guest_import_rows
  set
    approval_status = 'rejected',
    review_notes = coalesce(p_review_notes, review_notes)
  where import_session_id = p_import_session_id
    and id = any(p_rejected_row_ids);

  update public.guest_import_rows
  set
    approval_status = 'held',
    review_notes = coalesce(p_review_notes, review_notes)
  where import_session_id = p_import_session_id
    and id = any(p_held_row_ids);

  select
    count(*) filter (where approval_status = 'approved'),
    count(*) filter (where approval_status = 'rejected'),
    count(*) filter (where approval_status = 'held'),
    count(*) filter (where approval_status = 'pending' and validation_status <> 'blocked')
  into v_approved_count, v_rejected_count, v_held_count, v_pending_count
  from public.guest_import_rows
  where import_session_id = p_import_session_id;

  v_status := case
    when v_approved_count > 0 and (v_rejected_count > 0 or v_held_count > 0 or v_pending_count > 0) then 'partially_approved'::public.guest_import_session_status
    when v_approved_count > 0 then 'approved'::public.guest_import_session_status
    when v_rejected_count > 0 and v_held_count = 0 and v_pending_count = 0 then 'rejected'::public.guest_import_session_status
    else 'ready_for_review'::public.guest_import_session_status
  end;

  update public.guest_import_sessions
  set
    approved_row_count = v_approved_count,
    rejected_row_count = v_rejected_count,
    reviewed_by = v_actor_user_id,
    reviewed_at = now(),
    review_notes = coalesce(p_review_notes, review_notes),
    status = v_status,
    updated_by = v_actor_user_id
  where id = p_import_session_id;
end;
$$;

create or replace function public.apply_guest_import_approved_rows(
  p_import_session_id uuid
)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_created_count integer := 0;
  v_guest_id uuid;
  v_row public.guest_import_rows%rowtype;
  v_session public.guest_import_sessions%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  select *
  into v_session
  from public.guest_import_sessions
  where id = p_import_session_id
  for update;

  if v_session.id is null then
    raise exception 'Guest import session was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_session.project_id, 'guest_imports.apply') then
    raise exception 'Guest import apply permission denied.'
      using errcode = '42501';
  end if;

  if v_session.status = 'applied' then
    return 0;
  end if;

  if v_session.status not in ('approved', 'partially_approved') then
    raise exception 'Guest import session must be approved before applying.'
      using errcode = '22023';
  end if;

  for v_row in
    select *
    from public.guest_import_rows
    where import_session_id = p_import_session_id
      and approval_status = 'approved'
      and validation_status <> 'blocked'
      and linked_guest_id is null
    order by row_number
    for update
  loop
    insert into public.guests (
      project_id,
      guest_title_type_id,
      display_name,
      guest_side,
      whatsapp_number,
      preferred_language,
      is_printed_only,
      internal_notes,
      created_by,
      updated_by
    )
    values (
      v_session.project_id,
      case
        when nullif(v_row.mapped_fields ->> 'guestTitleTypeId', '') ~ '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$'
          then (v_row.mapped_fields ->> 'guestTitleTypeId')::uuid
        else null
      end,
      v_row.mapped_fields ->> 'displayName',
      coalesce(nullif(v_row.mapped_fields ->> 'guestSide', '')::public.guest_side, v_session.import_side),
      nullif(v_row.mapped_fields ->> 'whatsappNumber', ''),
      nullif(v_row.mapped_fields ->> 'preferredLanguage', ''),
      coalesce((v_row.mapped_fields ->> 'isPrintedOnly')::boolean, false),
      nullif(v_row.mapped_fields ->> 'internalNotes', ''),
      v_actor_user_id,
      v_actor_user_id
    )
    returning id into v_guest_id;

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
      v_session.project_id,
      v_guest_id,
      valid_event_ids.event_id,
      true,
      'assigned',
      v_actor_user_id,
      v_actor_user_id
    from jsonb_array_elements_text(coalesce(v_row.mapped_fields -> 'eventIds', '[]'::jsonb)) as imported_event_ids(event_id)
    join lateral (
      select imported_event_ids.event_id::uuid as event_id
      where imported_event_ids.event_id ~ '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$'
    ) valid_event_ids on true
    join public.events e
      on e.id = valid_event_ids.event_id
     and e.project_id = v_session.project_id
    on conflict (guest_id, event_id) do nothing;

    insert into public.guest_tag_assignments (
      project_id,
      guest_id,
      tag_id,
      created_by
    )
    select
      v_session.project_id,
      v_guest_id,
      valid_tag_ids.tag_id,
      v_actor_user_id
    from jsonb_array_elements_text(coalesce(v_row.mapped_fields -> 'tagIds', '[]'::jsonb)) as imported_tag_ids(tag_id)
    join lateral (
      select imported_tag_ids.tag_id::uuid as tag_id
      where imported_tag_ids.tag_id ~ '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$'
    ) valid_tag_ids on true
    join public.guest_tags gt
      on gt.id = valid_tag_ids.tag_id
     and gt.project_id = v_session.project_id
    on conflict (guest_id, tag_id) do nothing;

    update public.guest_import_rows
    set
      approval_status = 'applied',
      linked_guest_id = v_guest_id
    where id = v_row.id
      and linked_guest_id is null;

    v_created_count := v_created_count + 1;
  end loop;

  update public.guest_import_sessions
  set
    applied_by = v_actor_user_id,
    applied_at = now(),
    created_guest_count = created_guest_count + v_created_count,
    status = 'applied',
    updated_by = v_actor_user_id
  where id = p_import_session_id;

  return v_created_count;
end;
$$;

revoke all on function public.submit_guest_import_session(uuid) from public;
revoke all on function public.review_guest_import_rows(uuid, uuid[], uuid[], uuid[], text) from public;
revoke all on function public.apply_guest_import_approved_rows(uuid) from public;
grant execute on function public.submit_guest_import_session(uuid) to authenticated;
grant execute on function public.review_guest_import_rows(uuid, uuid[], uuid[], uuid[], text) to authenticated;
grant execute on function public.apply_guest_import_approved_rows(uuid) to authenticated;
