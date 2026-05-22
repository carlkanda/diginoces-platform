-- Sprint 4 CodeRabbit review fixes.
-- Requirements: GM-004, GM-005, ROLE-005, TECH-004.
--
-- Adds transactional import creation/preview RPCs and reinforces the apply
-- review gate for environments where the first Sprint 4 migration already ran.

create or replace function public.create_guest_import_session(
  p_project_id uuid,
  p_import_side public.guest_side,
  p_source_filename text,
  p_source_file_type text,
  p_source_headers jsonb,
  p_target_mapping jsonb,
  p_rows jsonb
)
returns public.guest_import_sessions
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_inserted_count integer;
  v_row_count integer;
  v_session public.guest_import_sessions%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  if p_source_file_type <> 'csv' then
    raise exception 'Sprint 4 supports CSV files only.'
      using errcode = '22023';
  end if;

  if p_source_filename is null or length(trim(p_source_filename)) = 0 then
    raise exception 'CSV filename is required.'
      using errcode = '22023';
  end if;

  if coalesce(jsonb_typeof(p_source_headers), 'null') <> 'array' then
    raise exception 'CSV headers must be a JSON array.'
      using errcode = '22023';
  end if;

  if coalesce(jsonb_typeof(p_target_mapping), 'null') <> 'object' then
    raise exception 'Import mapping must be a JSON object.'
      using errcode = '22023';
  end if;

  if coalesce(jsonb_typeof(p_rows), 'null') <> 'array' then
    raise exception 'Import rows must be a JSON array.'
      using errcode = '22023';
  end if;

  v_row_count := jsonb_array_length(p_rows);

  if v_row_count = 0 then
    raise exception 'CSV must include at least one data row.'
      using errcode = '22023';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, p_project_id, 'guest_imports.create')
    or not app_private.user_can_manage_guest_side(v_actor_user_id, p_project_id, p_import_side) then
    raise exception 'Guest import create permission denied.'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_rows) as row_payload(payload)
    where coalesce(row_payload.payload ->> 'rowNumber', '') !~ '^[0-9]+$'
      or (row_payload.payload ->> 'rowNumber')::integer <= 1
      or coalesce(jsonb_typeof(row_payload.payload -> 'rawRowData'), 'null') <> 'object'
  ) then
    raise exception 'Import rows must include rowNumber and rawRowData.'
      using errcode = '22023';
  end if;

  insert into public.guest_import_sessions (
    project_id,
    uploaded_by,
    import_side,
    source_filename,
    source_file_type,
    status,
    row_count,
    created_by,
    updated_by
  )
  values (
    p_project_id,
    v_actor_user_id,
    p_import_side,
    trim(p_source_filename),
    p_source_file_type,
    'draft',
    v_row_count,
    v_actor_user_id,
    v_actor_user_id
  )
  returning * into v_session;

  insert into public.guest_import_mappings (
    import_session_id,
    project_id,
    source_headers,
    target_mapping,
    created_by,
    updated_by
  )
  values (
    v_session.id,
    p_project_id,
    p_source_headers,
    p_target_mapping,
    v_actor_user_id,
    v_actor_user_id
  );

  insert into public.guest_import_rows (
    import_session_id,
    project_id,
    row_number,
    raw_row_data
  )
  select
    v_session.id,
    p_project_id,
    (row_payload.payload ->> 'rowNumber')::integer,
    row_payload.payload -> 'rawRowData'
  from jsonb_array_elements(p_rows) as row_payload(payload);

  get diagnostics v_inserted_count = row_count;

  if v_inserted_count <> v_row_count then
    raise exception 'Not all import rows were staged.'
      using errcode = '22023';
  end if;

  return v_session;
end;
$$;

create or replace function public.save_guest_import_preview(
  p_import_session_id uuid,
  p_project_id uuid,
  p_source_headers jsonb,
  p_target_mapping jsonb,
  p_rows jsonb,
  p_summary jsonb
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_distinct_row_numbers integer;
  v_duplicate_warning_count integer;
  v_invalid_row_count integer;
  v_payload_row_count integer;
  v_session public.guest_import_sessions%rowtype;
  v_status public.guest_import_session_status;
  v_total_rows integer;
  v_updated_count integer;
  v_valid_row_count integer;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  select *
  into v_session
  from public.guest_import_sessions
  where id = p_import_session_id
    and project_id = p_project_id;

  if v_session.id is null then
    raise exception 'Guest import session was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_session.project_id, 'guest_imports.create')
    or not app_private.user_can_manage_guest_side(v_actor_user_id, v_session.project_id, v_session.import_side) then
    raise exception 'Guest import preview permission denied.'
      using errcode = '42501';
  end if;

  if v_session.status not in ('draft', 'mapping_saved', 'previewed', 'validation_failed') then
    raise exception 'Guest import can no longer be edited.'
      using errcode = '22023';
  end if;

  if coalesce(jsonb_typeof(p_source_headers), 'null') <> 'array' then
    raise exception 'CSV headers must be a JSON array.'
      using errcode = '22023';
  end if;

  if coalesce(jsonb_typeof(p_target_mapping), 'null') <> 'object' then
    raise exception 'Import mapping must be a JSON object.'
      using errcode = '22023';
  end if;

  if coalesce(jsonb_typeof(p_rows), 'null') <> 'array' then
    raise exception 'Import rows must be a JSON array.'
      using errcode = '22023';
  end if;

  if coalesce(jsonb_typeof(p_summary), 'null') <> 'object' then
    raise exception 'Import summary must be a JSON object.'
      using errcode = '22023';
  end if;

  v_payload_row_count := jsonb_array_length(p_rows);

  select count(distinct (row_payload.payload ->> 'rowNumber')::integer)
  into v_distinct_row_numbers
  from jsonb_array_elements(p_rows) as row_payload(payload)
  where coalesce(row_payload.payload ->> 'rowNumber', '') ~ '^[0-9]+$';

  if v_payload_row_count <> v_distinct_row_numbers then
    raise exception 'Import preview rows must have unique row numbers.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_rows) as row_payload(payload)
    where coalesce(row_payload.payload ->> 'rowNumber', '') !~ '^[0-9]+$'
      or coalesce(jsonb_typeof(row_payload.payload -> 'mappedFields'), 'null') <> 'object'
      or coalesce(jsonb_typeof(row_payload.payload -> 'validationErrors'), 'null') <> 'array'
      or coalesce(jsonb_typeof(row_payload.payload -> 'duplicateWarnings'), 'null') <> 'array'
      or coalesce(row_payload.payload ->> 'validationStatus', '') not in ('pending', 'valid', 'warning', 'blocked')
      or coalesce(row_payload.payload ->> 'duplicateSeverity', '') not in ('clear', 'warning', 'needs_review', 'blocked')
  ) then
    raise exception 'Import preview rows are invalid.'
      using errcode = '22023';
  end if;

  v_total_rows := coalesce((p_summary ->> 'totalRows')::integer, v_payload_row_count);
  v_valid_row_count := coalesce((p_summary ->> 'validRows')::integer, 0);
  v_invalid_row_count := coalesce((p_summary ->> 'invalidRows')::integer, 0);
  v_duplicate_warning_count := coalesce((p_summary ->> 'duplicateWarnings')::integer, 0);

  if v_total_rows <> v_session.row_count
    or v_total_rows <> v_payload_row_count then
    raise exception 'Import preview row count does not match the staged session.'
      using errcode = '22023';
  end if;

  insert into public.guest_import_mappings (
    import_session_id,
    project_id,
    source_headers,
    target_mapping,
    created_by,
    updated_by
  )
  values (
    p_import_session_id,
    p_project_id,
    p_source_headers,
    p_target_mapping,
    v_actor_user_id,
    v_actor_user_id
  )
  on conflict (import_session_id) do update
  set
    source_headers = excluded.source_headers,
    target_mapping = excluded.target_mapping,
    updated_by = v_actor_user_id;

  with incoming as (
    select
      (row_payload.payload ->> 'rowNumber')::integer as row_number,
      row_payload.payload -> 'mappedFields' as mapped_fields,
      (row_payload.payload ->> 'validationStatus')::public.guest_import_row_validation_status as validation_status,
      row_payload.payload -> 'validationErrors' as validation_errors,
      row_payload.payload -> 'duplicateWarnings' as duplicate_warnings,
      (row_payload.payload ->> 'duplicateSeverity')::public.guest_import_duplicate_severity as duplicate_severity
    from jsonb_array_elements(p_rows) as row_payload(payload)
  )
  update public.guest_import_rows gir
  set
    approval_status = 'pending',
    duplicate_severity = incoming.duplicate_severity,
    duplicate_warnings = incoming.duplicate_warnings,
    linked_guest_id = null,
    mapped_fields = incoming.mapped_fields,
    review_notes = null,
    validation_errors = incoming.validation_errors,
    validation_status = incoming.validation_status
  from incoming
  where gir.import_session_id = p_import_session_id
    and gir.project_id = p_project_id
    and gir.row_number = incoming.row_number;

  get diagnostics v_updated_count = row_count;

  if v_updated_count <> v_payload_row_count then
    raise exception 'Not all import rows were updated during preview.'
      using errcode = '22023';
  end if;

  v_status := case
    when v_invalid_row_count > 0 then 'validation_failed'::public.guest_import_session_status
    else 'previewed'::public.guest_import_session_status
  end;

  update public.guest_import_sessions
  set
    approved_row_count = 0,
    duplicate_warning_count = v_duplicate_warning_count,
    invalid_row_count = v_invalid_row_count,
    rejected_row_count = 0,
    reviewed_at = null,
    reviewed_by = null,
    review_notes = null,
    status = v_status,
    updated_by = v_actor_user_id,
    valid_row_count = v_valid_row_count
  where id = p_import_session_id
    and project_id = p_project_id;
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
  where id = p_import_session_id;

  if v_session.id is null then
    raise exception 'Guest import session was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_session.project_id, 'guest_imports.apply') then
    raise exception 'Guest import apply permission denied.'
      using errcode = '42501';
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
      nullif(v_row.mapped_fields ->> 'guestTitleTypeId', '')::uuid,
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
      imported_event_ids.event_id::uuid,
      true,
      'assigned',
      v_actor_user_id,
      v_actor_user_id
    from jsonb_array_elements_text(coalesce(v_row.mapped_fields -> 'eventIds', '[]'::jsonb)) as imported_event_ids(event_id)
    join public.events e
      on e.id = imported_event_ids.event_id::uuid
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
      imported_tag_ids.tag_id::uuid,
      v_actor_user_id
    from jsonb_array_elements_text(coalesce(v_row.mapped_fields -> 'tagIds', '[]'::jsonb)) as imported_tag_ids(tag_id)
    join public.guest_tags gt
      on gt.id = imported_tag_ids.tag_id::uuid
     and gt.project_id = v_session.project_id
    on conflict (guest_id, tag_id) do nothing;

    update public.guest_import_rows
    set
      approval_status = 'applied',
      linked_guest_id = v_guest_id
    where id = v_row.id;

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

revoke all on function public.create_guest_import_session(
  uuid,
  public.guest_side,
  text,
  text,
  jsonb,
  jsonb,
  jsonb
) from public;
revoke all on function public.save_guest_import_preview(
  uuid,
  uuid,
  jsonb,
  jsonb,
  jsonb,
  jsonb
) from public;
revoke all on function public.apply_guest_import_approved_rows(uuid) from public;

grant execute on function public.create_guest_import_session(
  uuid,
  public.guest_side,
  text,
  text,
  jsonb,
  jsonb,
  jsonb
) to authenticated;
grant execute on function public.save_guest_import_preview(
  uuid,
  uuid,
  jsonb,
  jsonb,
  jsonb,
  jsonb
) to authenticated;
grant execute on function public.apply_guest_import_approved_rows(uuid) to authenticated;
