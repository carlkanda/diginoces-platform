-- Sprint 14 post-merge database lint fix.
-- Requirements: FILE-001, FILE-008, FILE-009, WISH-008, TECH-004.
--
-- After the Sprint 14 migration was applied to the linked dev project,
-- db:lint exposed two cross-sprint SQL compatibility issues:
-- 1. Sprint 12 guest-book exports still inserted the pre-Sprint-14
--    `guest_book_exports` file category into public.files.
-- 2. Sprint 14 register_project_file computed a text scope_type value
--    instead of explicitly casting it to public.file_scope_type.

create or replace function public.register_project_file(
  p_project_id uuid,
  p_category public.file_category,
  p_filename text,
  p_mime_type text,
  p_file_size_bytes bigint,
  p_visibility public.file_visibility default 'internal',
  p_event_id uuid default null,
  p_guest_id uuid default null,
  p_invitation_id uuid default null,
  p_storage_bucket text default 'project-files',
  p_storage_path text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.files
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_category public.file_categories%rowtype;
  v_file public.files;
  v_safe_filename text;
  v_storage_path text;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, p_project_id, 'files.write') then
    raise exception 'File registration permission denied.' using errcode = '42501';
  end if;

  if length(trim(coalesce(p_filename, ''))) = 0 then
    raise exception 'File name is required.' using errcode = '23514';
  end if;

  if p_file_size_bytes < 0 or p_file_size_bytes > 52428800 then
    raise exception 'Project files must be between 0 bytes and 50 MB.' using errcode = '23514';
  end if;

  if length(trim(coalesce(p_mime_type, ''))) = 0 then
    raise exception 'File MIME type is required.' using errcode = '23514';
  end if;

  select *
  into v_category
  from public.file_categories fc
  where fc.slug = p_category;

  if not found then
    raise exception 'File category configuration not found.' using errcode = 'P0002';
  end if;

  if coalesce(array_length(v_category.allowed_mime_types, 1), 0) > 0
    and lower(p_mime_type) <> all(v_category.allowed_mime_types) then
    raise exception 'MIME type is not allowed for this category.' using errcode = '23514';
  end if;

  if p_visibility = 'guest_visible' and (p_guest_id is null or not v_category.guest_visible_allowed) then
    raise exception 'Guest-visible files require a guest and an allowed category.' using errcode = '23514';
  end if;

  if p_event_id is not null and not exists (
    select 1 from public.events e where e.id = p_event_id and e.project_id = p_project_id
  ) then
    raise exception 'File event must belong to the selected project.' using errcode = '23503';
  end if;

  if p_guest_id is not null and not exists (
    select 1 from public.guests g where g.id = p_guest_id and g.project_id = p_project_id
  ) then
    raise exception 'File guest must belong to the selected project.' using errcode = '23503';
  end if;

  if p_invitation_id is not null and not exists (
    select 1 from public.invitations i where i.id = p_invitation_id and i.project_id = p_project_id
  ) then
    raise exception 'File invitation must belong to the selected project.' using errcode = '23503';
  end if;

  v_safe_filename := regexp_replace(lower(trim(p_filename)), '[^a-z0-9._-]+', '-', 'g');
  v_safe_filename := trim(both '-' from v_safe_filename);
  if length(v_safe_filename) = 0 then
    v_safe_filename := 'project-file';
  end if;

  v_storage_path := coalesce(
    nullif(trim(p_storage_path), ''),
    'projects/' || p_project_id::text || '/files/' || extensions.gen_random_uuid()::text || '-' || v_safe_filename
  );

  insert into public.files (
    scope_type,
    scope_id,
    project_id,
    event_id,
    guest_id,
    invitation_id,
    bucket,
    storage_path,
    category,
    filename,
    mime_type,
    file_size_bytes,
    visibility,
    status,
    version,
    is_active,
    is_latest,
    version_group_id,
    metadata,
    created_by
  )
  values (
    case
      when p_guest_id is not null then 'guest'::public.file_scope_type
      when p_event_id is not null then 'event'::public.file_scope_type
      else 'project'::public.file_scope_type
    end,
    coalesce(p_guest_id, p_event_id, p_project_id),
    p_project_id,
    p_event_id,
    p_guest_id,
    p_invitation_id,
    p_storage_bucket,
    v_storage_path,
    p_category,
    p_filename,
    lower(p_mime_type),
    p_file_size_bytes,
    p_visibility,
    'active',
    1,
    true,
    true,
    extensions.gen_random_uuid(),
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'storageUploadPending', true,
      'registeredBySprint', 14
    ),
    v_actor_user_id
  )
  returning * into v_file;

  return v_file;
end;
$$;

create or replace function public.create_guest_book_export(
  p_project_id uuid
)
returns public.guest_book_exports
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_export public.guest_book_exports;
  v_file_id uuid;
  v_version integer;
  v_row_count integer;
  v_excluded_count integer;
  v_filename text;
  v_storage_path text;
  v_version_group_id uuid;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '28000';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, p_project_id, 'guest_book_exports.create') then
    raise exception 'Guest-book export permission denied.'
      using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(
    ('x' || substr(md5(p_project_id::text), 1, 16))::bit(64)::bigint
  );

  select coalesce(max(version), 0) + 1
  into v_version
  from public.guest_book_exports
  where project_id = p_project_id;

  select f.version_group_id
  into v_version_group_id
  from public.guest_book_exports gbe
  join public.files f on f.id = gbe.file_id
  where gbe.project_id = p_project_id
  order by gbe.version desc
  limit 1;

  v_version_group_id := coalesce(v_version_group_id, extensions.gen_random_uuid());

  select count(*)::integer
  into v_row_count
  from public.guest_messages
  where project_id = p_project_id
    and status = 'couple_approved'
    and approved_text is not null;

  select count(*)::integer
  into v_excluded_count
  from public.guest_messages
  where project_id = p_project_id
    and status in ('excluded', 'flagged', 'pending_review', 'admin_approved', 'admin_edited', 'couple_correction_requested');

  v_filename := 'guest-book-messages-v' || v_version::text || '.csv';
  v_storage_path := 'guest-book/' || p_project_id::text || '/' || v_filename;

  update public.guest_book_exports
  set is_active = false
  where project_id = p_project_id
    and is_active = true;

  update public.files f
  set
    is_active = false,
    is_latest = false,
    status = 'superseded'::public.file_status
  from public.guest_book_exports gbe
  where gbe.file_id = f.id
    and gbe.project_id = p_project_id
    and f.status in ('active', 'generated');

  insert into public.files (
    scope_type,
    scope_id,
    project_id,
    bucket,
    storage_path,
    category,
    filename,
    mime_type,
    file_size_bytes,
    file_size_unknown,
    visibility,
    status,
    version,
    is_active,
    is_latest,
    version_group_id,
    metadata,
    created_by
  )
  values (
    'project'::public.file_scope_type,
    p_project_id,
    p_project_id,
    'project-files',
    v_storage_path,
    'guest_book_export'::public.file_category,
    v_filename,
    'text/csv',
    0,
    true,
    'couple_visible'::public.file_visibility,
    'active'::public.file_status,
    v_version,
    true,
    true,
    v_version_group_id,
    jsonb_build_object(
      'storageUploadPending', true,
      'source', 'Sprint 12 Canva CSV export foundation',
      'normalizedBySprint14PostMergeFix', true
    ),
    v_actor_user_id
  )
  returning id into v_file_id;

  insert into public.guest_book_exports (
    project_id,
    version,
    filename,
    storage_bucket,
    storage_path,
    file_id,
    row_count,
    excluded_count,
    requested_by,
    metadata
  )
  values (
    p_project_id,
    v_version,
    v_filename,
    'project-files',
    v_storage_path,
    v_file_id,
    v_row_count,
    v_excluded_count,
    v_actor_user_id,
    jsonb_build_object(
      'storageUploadPending', true,
      'source', 'Sprint 12 Canva CSV export foundation',
      'normalizedBySprint14PostMergeFix', true
    )
  )
  returning * into v_export;

  return v_export;
end;
$$;
