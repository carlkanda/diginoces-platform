-- Sprint 4 - Guest Import & Approval Workflow
-- Requirements: GM-004, GM-005, GM-006, GM-008, GM-013, GM-014, GM-015,
-- ROLE-001, ROLE-005, REP-006, TECH-004.
--
-- Scope guard: CSV import only. Source upload files are not persisted in this
-- sprint; parsed row JSON, mapping JSON, filename, and file type metadata are
-- stored for staging, review, and approved guest creation.

do $$
begin
  create type public.guest_import_session_status as enum (
    'draft',
    'mapping_saved',
    'previewed',
    'validation_failed',
    'ready_for_review',
    'partially_approved',
    'approved',
    'rejected',
    'applied',
    'cancelled',
    'failed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.guest_import_row_validation_status as enum (
    'pending',
    'valid',
    'warning',
    'blocked'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.guest_import_duplicate_severity as enum (
    'clear',
    'warning',
    'needs_review',
    'blocked'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.guest_import_row_approval_status as enum (
    'pending',
    'approved',
    'rejected',
    'held',
    'applied'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.guest_import_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  uploaded_by uuid references auth.users (id) on delete set null,
  import_side public.guest_side not null,
  source_filename text not null,
  source_file_type text not null default 'csv',
  status public.guest_import_session_status not null default 'draft',
  row_count integer not null default 0,
  valid_row_count integer not null default 0,
  invalid_row_count integer not null default 0,
  duplicate_warning_count integer not null default 0,
  approved_row_count integer not null default 0,
  rejected_row_count integer not null default 0,
  created_guest_count integer not null default 0,
  submitted_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  applied_by uuid references auth.users (id) on delete set null,
  applied_at timestamptz,
  review_notes text,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guest_import_sessions_csv_only check (source_file_type = 'csv'),
  constraint guest_import_sessions_filename_not_blank check (length(trim(source_filename)) > 0),
  constraint guest_import_sessions_counts_non_negative check (
    row_count >= 0
    and valid_row_count >= 0
    and invalid_row_count >= 0
    and duplicate_warning_count >= 0
    and approved_row_count >= 0
    and rejected_row_count >= 0
    and created_guest_count >= 0
  )
);

create unique index if not exists guest_import_sessions_id_project_id_key
  on public.guest_import_sessions (id, project_id);

create index if not exists guest_import_sessions_project_status_idx
  on public.guest_import_sessions (project_id, status, created_at desc);

create table if not exists public.guest_import_rows (
  id uuid primary key default extensions.gen_random_uuid(),
  import_session_id uuid not null,
  project_id uuid not null,
  row_number integer not null,
  raw_row_data jsonb not null default '{}'::jsonb,
  mapped_fields jsonb not null default '{}'::jsonb,
  validation_status public.guest_import_row_validation_status not null default 'pending',
  validation_errors jsonb not null default '[]'::jsonb,
  duplicate_warnings jsonb not null default '[]'::jsonb,
  duplicate_severity public.guest_import_duplicate_severity not null default 'clear',
  approval_status public.guest_import_row_approval_status not null default 'pending',
  review_notes text,
  linked_guest_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guest_import_rows_session_project_match
    foreign key (import_session_id, project_id)
    references public.guest_import_sessions (id, project_id)
    on delete cascade,
  constraint guest_import_rows_linked_guest_project_match
    foreign key (linked_guest_id, project_id)
    references public.guests (id, project_id)
    on delete set null,
  constraint guest_import_rows_row_number_positive check (row_number > 1),
  constraint guest_import_rows_raw_object check (jsonb_typeof(raw_row_data) = 'object'),
  constraint guest_import_rows_mapped_object check (jsonb_typeof(mapped_fields) = 'object'),
  constraint guest_import_rows_validation_errors_array check (jsonb_typeof(validation_errors) = 'array'),
  constraint guest_import_rows_duplicate_warnings_array check (jsonb_typeof(duplicate_warnings) = 'array')
);

create unique index if not exists guest_import_rows_session_row_number_key
  on public.guest_import_rows (import_session_id, row_number);

create index if not exists guest_import_rows_session_status_idx
  on public.guest_import_rows (
    import_session_id,
    validation_status,
    approval_status,
    duplicate_severity
  );

create table if not exists public.guest_import_mappings (
  id uuid primary key default extensions.gen_random_uuid(),
  import_session_id uuid not null,
  project_id uuid not null,
  source_headers jsonb not null default '[]'::jsonb,
  target_mapping jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guest_import_mappings_session_project_match
    foreign key (import_session_id, project_id)
    references public.guest_import_sessions (id, project_id)
    on delete cascade,
  constraint guest_import_mappings_source_headers_array check (jsonb_typeof(source_headers) = 'array'),
  constraint guest_import_mappings_target_mapping_object check (jsonb_typeof(target_mapping) = 'object')
);

create unique index if not exists guest_import_mappings_session_key
  on public.guest_import_mappings (import_session_id);

drop trigger if exists set_guest_import_sessions_updated_at on public.guest_import_sessions;
create trigger set_guest_import_sessions_updated_at
before update on public.guest_import_sessions
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_guest_import_rows_updated_at on public.guest_import_rows;
create trigger set_guest_import_rows_updated_at
before update on public.guest_import_rows
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_guest_import_mappings_updated_at on public.guest_import_mappings;
create trigger set_guest_import_mappings_updated_at
before update on public.guest_import_mappings
for each row
execute function app_private.set_updated_at();

create or replace function app_private.redact_guest_import_audit_snapshot(
  p_table_name text,
  p_snapshot jsonb
)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_snapshot is null then null
    when p_table_name = 'guest_import_rows' then p_snapshot
      - 'raw_row_data'
      - 'mapped_fields'
      - 'validation_errors'
      - 'duplicate_warnings'
      - 'review_notes'
    when p_table_name = 'guest_import_mappings' then p_snapshot
      - 'source_headers'
      - 'target_mapping'
    when p_table_name = 'guest_import_sessions' then p_snapshot
      - 'review_notes'
    else p_snapshot
  end;
$$;

revoke all on function app_private.redact_guest_import_audit_snapshot(text, jsonb) from public;

create or replace function app_private.audit_guest_import_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  action_name text;
  changed_object_id uuid;
  changed_object_type text;
  sanitized_new jsonb;
  sanitized_old jsonb;
begin
  changed_object_type := case tg_table_name
    when 'guest_import_sessions' then 'guest_import_session'
    when 'guest_import_rows' then 'guest_import_row'
    when 'guest_import_mappings' then 'guest_import_mapping'
  end;

  changed_object_id := case tg_op
    when 'DELETE' then old.id
    else new.id
  end;

  action_name := case
    when tg_table_name = 'guest_import_sessions' and tg_op = 'INSERT' then 'guest_imports.created'
    when tg_table_name = 'guest_import_sessions' and tg_op = 'UPDATE' and new.status in ('previewed', 'validation_failed') then 'guest_imports.validation_completed'
    when tg_table_name = 'guest_import_sessions' and tg_op = 'UPDATE' and new.status = 'ready_for_review' then 'guest_imports.submitted'
    when tg_table_name = 'guest_import_sessions' and tg_op = 'UPDATE' and new.status in ('partially_approved', 'approved', 'rejected') then 'guest_imports.reviewed'
    when tg_table_name = 'guest_import_sessions' and tg_op = 'UPDATE' and new.status = 'applied' then 'guest_imports.applied'
    when tg_table_name = 'guest_import_sessions' and tg_op = 'UPDATE' then 'guest_imports.updated'
    when tg_table_name = 'guest_import_mappings' then 'guest_imports.mapping_saved'
    when tg_table_name = 'guest_import_rows' and tg_op = 'INSERT' then 'guest_import_rows.staged'
    when tg_table_name = 'guest_import_rows' and tg_op = 'UPDATE' and new.approval_status = 'applied' then 'guest_import_rows.applied'
    when tg_table_name = 'guest_import_rows' and tg_op = 'UPDATE' and old.approval_status is distinct from new.approval_status then 'guest_import_rows.reviewed'
    when tg_table_name = 'guest_import_rows' and tg_op = 'UPDATE' then 'guest_import_rows.validation_updated'
    else lower(tg_table_name || '.' || tg_op)
  end;

  if tg_op in ('UPDATE', 'DELETE') then
    sanitized_old := app_private.redact_guest_import_audit_snapshot(tg_table_name, to_jsonb(old));
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    sanitized_new := app_private.redact_guest_import_audit_snapshot(tg_table_name, to_jsonb(new));
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

drop trigger if exists audit_guest_import_sessions_insert on public.guest_import_sessions;
create trigger audit_guest_import_sessions_insert
after insert on public.guest_import_sessions
for each row
execute function app_private.audit_guest_import_change();

drop trigger if exists audit_guest_import_sessions_update on public.guest_import_sessions;
create trigger audit_guest_import_sessions_update
after update on public.guest_import_sessions
for each row
execute function app_private.audit_guest_import_change();

drop trigger if exists audit_guest_import_rows_insert on public.guest_import_rows;
create trigger audit_guest_import_rows_insert
after insert on public.guest_import_rows
for each row
execute function app_private.audit_guest_import_change();

drop trigger if exists audit_guest_import_rows_update on public.guest_import_rows;
create trigger audit_guest_import_rows_update
after update on public.guest_import_rows
for each row
execute function app_private.audit_guest_import_change();

drop trigger if exists audit_guest_import_mappings_insert on public.guest_import_mappings;
create trigger audit_guest_import_mappings_insert
after insert on public.guest_import_mappings
for each row
execute function app_private.audit_guest_import_change();

drop trigger if exists audit_guest_import_mappings_update on public.guest_import_mappings;
create trigger audit_guest_import_mappings_update
after update on public.guest_import_mappings
for each row
execute function app_private.audit_guest_import_change();

alter table public.guest_import_sessions enable row level security;
alter table public.guest_import_rows enable row level security;
alter table public.guest_import_mappings enable row level security;

drop policy if exists "Guest import sessions visible to import readers" on public.guest_import_sessions;
create policy "Guest import sessions visible to import readers"
on public.guest_import_sessions
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_imports.read'));

drop policy if exists "Guest import sessions created by side importers" on public.guest_import_sessions;
create policy "Guest import sessions created by side importers"
on public.guest_import_sessions
for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and app_private.user_can_access_project((select auth.uid()), project_id, 'guest_imports.create')
  and app_private.user_can_manage_guest_side((select auth.uid()), project_id, import_side)
);

drop policy if exists "Guest import sessions updated by import actors" on public.guest_import_sessions;
create policy "Guest import sessions updated by import actors"
on public.guest_import_sessions
for update
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'guest_imports.review')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'guest_imports.apply')
  or (
    app_private.user_can_access_project((select auth.uid()), project_id, 'guest_imports.create')
    and app_private.user_can_manage_guest_side((select auth.uid()), project_id, import_side)
  )
  or (
    app_private.user_can_access_project((select auth.uid()), project_id, 'guest_imports.submit')
    and app_private.user_can_manage_guest_side((select auth.uid()), project_id, import_side)
  )
)
with check (
  app_private.user_can_access_project((select auth.uid()), project_id, 'guest_imports.review')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'guest_imports.apply')
  or (
    app_private.user_can_access_project((select auth.uid()), project_id, 'guest_imports.create')
    and app_private.user_can_manage_guest_side((select auth.uid()), project_id, import_side)
  )
  or (
    app_private.user_can_access_project((select auth.uid()), project_id, 'guest_imports.submit')
    and app_private.user_can_manage_guest_side((select auth.uid()), project_id, import_side)
  )
);

drop policy if exists "Guest import rows visible to import readers" on public.guest_import_rows;
create policy "Guest import rows visible to import readers"
on public.guest_import_rows
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_imports.read'));

drop policy if exists "Guest import rows inserted by side importers" on public.guest_import_rows;
create policy "Guest import rows inserted by side importers"
on public.guest_import_rows
for insert
to authenticated
with check (
  exists (
    select 1
    from public.guest_import_sessions gis
    where gis.id = guest_import_rows.import_session_id
      and gis.project_id = guest_import_rows.project_id
      and app_private.user_can_access_project((select auth.uid()), gis.project_id, 'guest_imports.create')
      and app_private.user_can_manage_guest_side((select auth.uid()), gis.project_id, gis.import_side)
  )
);

drop policy if exists "Guest import rows updated by import actors" on public.guest_import_rows;
create policy "Guest import rows updated by import actors"
on public.guest_import_rows
for update
to authenticated
using (
  exists (
    select 1
    from public.guest_import_sessions gis
    where gis.id = guest_import_rows.import_session_id
      and gis.project_id = guest_import_rows.project_id
      and (
        app_private.user_can_access_project((select auth.uid()), gis.project_id, 'guest_imports.review')
        or app_private.user_can_access_project((select auth.uid()), gis.project_id, 'guest_imports.apply')
        or (
          app_private.user_can_access_project((select auth.uid()), gis.project_id, 'guest_imports.create')
          and app_private.user_can_manage_guest_side((select auth.uid()), gis.project_id, gis.import_side)
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.guest_import_sessions gis
    where gis.id = guest_import_rows.import_session_id
      and gis.project_id = guest_import_rows.project_id
      and (
        app_private.user_can_access_project((select auth.uid()), gis.project_id, 'guest_imports.review')
        or app_private.user_can_access_project((select auth.uid()), gis.project_id, 'guest_imports.apply')
        or (
          app_private.user_can_access_project((select auth.uid()), gis.project_id, 'guest_imports.create')
          and app_private.user_can_manage_guest_side((select auth.uid()), gis.project_id, gis.import_side)
        )
      )
  )
);

drop policy if exists "Guest import mappings visible to import readers" on public.guest_import_mappings;
create policy "Guest import mappings visible to import readers"
on public.guest_import_mappings
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_imports.read'));

drop policy if exists "Guest import mappings managed by side importers" on public.guest_import_mappings;
create policy "Guest import mappings managed by side importers"
on public.guest_import_mappings
for all
to authenticated
using (
  exists (
    select 1
    from public.guest_import_sessions gis
    where gis.id = guest_import_mappings.import_session_id
      and gis.project_id = guest_import_mappings.project_id
      and app_private.user_can_access_project((select auth.uid()), gis.project_id, 'guest_imports.create')
      and app_private.user_can_manage_guest_side((select auth.uid()), gis.project_id, gis.import_side)
  )
)
with check (
  exists (
    select 1
    from public.guest_import_sessions gis
    where gis.id = guest_import_mappings.import_session_id
      and gis.project_id = guest_import_mappings.project_id
      and app_private.user_can_access_project((select auth.uid()), gis.project_id, 'guest_imports.create')
      and app_private.user_can_manage_guest_side((select auth.uid()), gis.project_id, gis.import_side)
  )
);

grant select, insert, update on public.guest_import_sessions to authenticated;
grant select, insert, update on public.guest_import_rows to authenticated;
grant select, insert, update on public.guest_import_mappings to authenticated;

grant select, insert, update on public.guest_import_sessions to service_role;
grant select, insert, update on public.guest_import_rows to service_role;
grant select, insert, update on public.guest_import_mappings to service_role;

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
  where id = p_import_session_id;

  if v_session.id is null then
    raise exception 'Guest import session was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_session.project_id, 'guest_imports.submit')
    or not app_private.user_can_manage_guest_side(v_actor_user_id, v_session.project_id, v_session.import_side) then
    raise exception 'Guest import submit permission denied.'
      using errcode = '42501';
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
  v_rejected_count integer;
  v_session public.guest_import_sessions%rowtype;
  v_status public.guest_import_session_status;
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

  if not app_private.user_can_access_project(v_actor_user_id, v_session.project_id, 'guest_imports.review') then
    raise exception 'Guest import review permission denied.'
      using errcode = '42501';
  end if;

  update public.guest_import_rows
  set
    approval_status = 'approved',
    review_notes = coalesce(p_review_notes, review_notes)
  where import_session_id = p_import_session_id
    and id = any(p_approved_row_ids)
    and validation_status <> 'blocked'
    and approval_status <> 'applied';

  update public.guest_import_rows
  set
    approval_status = 'rejected',
    review_notes = coalesce(p_review_notes, review_notes)
  where import_session_id = p_import_session_id
    and id = any(p_rejected_row_ids)
    and approval_status <> 'applied';

  update public.guest_import_rows
  set
    approval_status = 'held',
    review_notes = coalesce(p_review_notes, review_notes)
  where import_session_id = p_import_session_id
    and id = any(p_held_row_ids)
    and approval_status <> 'applied';

  select
    count(*) filter (where approval_status = 'approved'),
    count(*) filter (where approval_status = 'rejected'),
    count(*) filter (where approval_status = 'held')
  into v_approved_count, v_rejected_count, v_held_count
  from public.guest_import_rows
  where import_session_id = p_import_session_id;

  v_status := case
    when v_approved_count > 0 and (v_rejected_count > 0 or v_held_count > 0) then 'partially_approved'::public.guest_import_session_status
    when v_approved_count > 0 then 'approved'::public.guest_import_session_status
    when v_rejected_count > 0 and v_held_count = 0 then 'rejected'::public.guest_import_session_status
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
  where id = p_import_session_id;

  if v_session.id is null then
    raise exception 'Guest import session was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_session.project_id, 'guest_imports.apply') then
    raise exception 'Guest import apply permission denied.'
      using errcode = '42501';
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

revoke all on function public.submit_guest_import_session(uuid) from public;
revoke all on function public.review_guest_import_rows(uuid, uuid[], uuid[], uuid[], text) from public;
revoke all on function public.apply_guest_import_approved_rows(uuid) from public;
grant execute on function public.submit_guest_import_session(uuid) to authenticated;
grant execute on function public.review_guest_import_rows(uuid, uuid[], uuid[], uuid[], text) to authenticated;
grant execute on function public.apply_guest_import_approved_rows(uuid) to authenticated;

insert into public.permissions (slug, description, requirement_ids)
values
  ('guest_imports.read', 'Read project guest import sessions and staged rows.', array['GM-004', 'ROLE-005']),
  ('guest_imports.create', 'Create CSV guest import sessions for an assigned side.', array['GM-004', 'GM-013', 'ROLE-005']),
  ('guest_imports.submit', 'Submit staged guest import sessions for Diginoces review.', array['GM-005', 'ROLE-005']),
  ('guest_imports.review', 'Review staged import rows for approval, rejection, or hold.', array['GM-005', 'ROLE-001']),
  ('guest_imports.apply', 'Apply approved import rows into project guests.', array['GM-005', 'TECH-004', 'REP-006'])
on conflict (slug) do update
set
  description = excluded.description,
  requirement_ids = excluded.requirement_ids;

with grants(role_slug, permission_slug) as (
  values
    ('diginoces_admin', 'guest_imports.read'),
    ('diginoces_admin', 'guest_imports.create'),
    ('diginoces_admin', 'guest_imports.submit'),
    ('diginoces_admin', 'guest_imports.review'),
    ('diginoces_admin', 'guest_imports.apply'),
    ('operations_manager', 'guest_imports.read'),
    ('operations_manager', 'guest_imports.create'),
    ('operations_manager', 'guest_imports.submit'),
    ('operations_manager', 'guest_imports.review'),
    ('operations_manager', 'guest_imports.apply'),
    ('bride', 'guest_imports.read'),
    ('bride', 'guest_imports.create'),
    ('bride', 'guest_imports.submit'),
    ('groom', 'guest_imports.read'),
    ('groom', 'guest_imports.create'),
    ('groom', 'guest_imports.submit')
)
insert into public.role_permissions (role_id, permission_slug)
select r.id, g.permission_slug
from grants g
join public.roles r on r.slug = g.role_slug
join public.permissions p on p.slug = g.permission_slug
on conflict (role_id, permission_slug) do nothing;
