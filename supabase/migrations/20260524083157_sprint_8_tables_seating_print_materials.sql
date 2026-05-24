-- Sprint 8 - Tables, Seating & Print Materials
-- Requirements: SEAT-001 through SEAT-012, RSVP-010, INV-014, FILE-008,
-- REP-006, TECH-004.
--
-- Scope guard: this migration creates only event table, seating assignment,
-- RSVP-aware occupancy support, table-card CSV export registration, printed
-- invitation status, invitation regeneration awareness, permissions, RLS, and
-- audit foundations. It intentionally does not implement check-in, WhatsApp
-- sending, contracts, pricing, payments, partner project creation, direct
-- Canva API integration, or automatic PDF regeneration.

do $$
begin
  create type public.seating_assignment_mode as enum (
    'table_level',
    'seat_level',
    'mixed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.event_table_status as enum (
    'draft',
    'active',
    'locked',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.event_table_seat_status as enum (
    'available',
    'reserved',
    'blocked',
    'assigned'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.guest_table_assignment_status as enum (
    'active',
    'removed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.seating_export_type as enum (
    'table_cards_csv'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.seating_export_status as enum (
    'generated',
    'failed',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.printed_invitation_status as enum (
    'not_required',
    'pending_print',
    'ready_for_print',
    'printed',
    'delivered',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.invitations
  add column if not exists printed_invitation_status public.printed_invitation_status
  not null default 'not_required';

create table if not exists public.event_tables (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null,
  table_code text not null,
  table_name text not null,
  description text,
  capacity integer not null,
  display_order integer not null default 0,
  status public.event_table_status not null default 'active',
  assignment_mode public.seating_assignment_mode not null default 'table_level',
  position_x numeric(8,2),
  position_y numeric(8,2),
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_tables_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint event_tables_code_not_blank check (length(trim(table_code)) > 0),
  constraint event_tables_name_not_blank check (length(trim(table_name)) > 0),
  constraint event_tables_capacity_positive check (capacity > 0),
  constraint event_tables_display_order_non_negative check (display_order >= 0)
);

create unique index if not exists event_tables_event_code_key
  on public.event_tables (event_id, lower(table_code));

create unique index if not exists event_tables_id_project_event_key
  on public.event_tables (id, project_id, event_id);

create index if not exists event_tables_project_event_status_idx
  on public.event_tables (project_id, event_id, status, display_order, table_code);

create table if not exists public.event_table_seats (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null,
  table_id uuid not null,
  seat_label text not null,
  seat_number integer,
  status public.event_table_seat_status not null default 'available',
  position jsonb not null default '{}'::jsonb,
  assigned_guest_id uuid,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_table_seats_table_project_event_match
    foreign key (table_id, project_id, event_id)
    references public.event_tables (id, project_id, event_id)
    on delete cascade,
  constraint event_table_seats_guest_project_match
    foreign key (assigned_guest_id, project_id)
    references public.guests (id, project_id)
    on delete restrict,
  constraint event_table_seats_label_not_blank check (length(trim(seat_label)) > 0),
  constraint event_table_seats_seat_number_positive check (
    seat_number is null or seat_number > 0
  ),
  constraint event_table_seats_position_object check (jsonb_typeof(position) = 'object')
);

create unique index if not exists event_table_seats_table_label_key
  on public.event_table_seats (table_id, lower(seat_label));

create unique index if not exists event_table_seats_id_table_project_event_key
  on public.event_table_seats (id, table_id, project_id, event_id);

create index if not exists event_table_seats_project_event_table_idx
  on public.event_table_seats (project_id, event_id, table_id, seat_number, seat_label);

create table if not exists public.guest_table_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null,
  table_id uuid not null,
  seat_id uuid,
  guest_id uuid not null,
  status public.guest_table_assignment_status not null default 'active',
  guest_count_at_assignment integer,
  seating_notes text,
  vip_protocol_notes text,
  assigned_by uuid references auth.users (id) on delete set null,
  removed_by uuid references auth.users (id) on delete set null,
  removal_reason text,
  assigned_at timestamptz not null default now(),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guest_table_assignments_table_project_event_match
    foreign key (table_id, project_id, event_id)
    references public.event_tables (id, project_id, event_id)
    on delete cascade,
  constraint guest_table_assignments_seat_table_project_event_match
    foreign key (seat_id, table_id, project_id, event_id)
    references public.event_table_seats (id, table_id, project_id, event_id)
    on delete restrict,
  constraint guest_table_assignments_guest_project_match
    foreign key (guest_id, project_id)
    references public.guests (id, project_id)
    on delete cascade,
  constraint guest_table_assignments_guest_event_invited
    foreign key (guest_id, event_id)
    references public.guest_event_assignments (guest_id, event_id)
    on delete cascade,
  constraint guest_table_assignments_count_positive check (
    guest_count_at_assignment is null or guest_count_at_assignment > 0
  ),
  constraint guest_table_assignments_removed_pair check (
    (status = 'active' and removed_at is null)
    or (status = 'removed' and removed_at is not null)
  )
);

create unique index if not exists guest_table_assignments_one_active_guest_event
  on public.guest_table_assignments (guest_id, event_id)
  where status = 'active';

create unique index if not exists guest_table_assignments_one_active_seat
  on public.guest_table_assignments (seat_id)
  where status = 'active' and seat_id is not null;

create index if not exists guest_table_assignments_project_event_table_idx
  on public.guest_table_assignments (project_id, event_id, table_id, status);

create index if not exists guest_table_assignments_guest_history_idx
  on public.guest_table_assignments (project_id, guest_id, event_id, updated_at desc);

create table if not exists public.seating_export_files (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null,
  export_type public.seating_export_type not null default 'table_cards_csv',
  status public.seating_export_status not null default 'generated',
  filename text not null,
  mime_type text not null default 'text/csv',
  storage_bucket text not null default 'seating-exports',
  storage_path text not null,
  version integer not null default 1,
  row_count integer not null default 0,
  csv_content text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seating_export_files_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint seating_export_files_filename_not_blank check (length(trim(filename)) > 0),
  constraint seating_export_files_storage_path_not_blank check (length(trim(storage_path)) > 0),
  constraint seating_export_files_csv_mime check (mime_type = 'text/csv'),
  constraint seating_export_files_version_positive check (version > 0),
  constraint seating_export_files_row_count_non_negative check (row_count >= 0),
  constraint seating_export_files_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create unique index if not exists seating_export_files_event_type_version_key
  on public.seating_export_files (event_id, export_type, version);

create index if not exists seating_export_files_project_event_idx
  on public.seating_export_files (project_id, event_id, created_at desc);

drop trigger if exists set_event_tables_updated_at on public.event_tables;
create trigger set_event_tables_updated_at
before update on public.event_tables
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_event_table_seats_updated_at on public.event_table_seats;
create trigger set_event_table_seats_updated_at
before update on public.event_table_seats
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_guest_table_assignments_updated_at on public.guest_table_assignments;
create trigger set_guest_table_assignments_updated_at
before update on public.guest_table_assignments
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_seating_export_files_updated_at on public.seating_export_files;
create trigger set_seating_export_files_updated_at
before update on public.seating_export_files
for each row
execute function app_private.set_updated_at();

create or replace function app_private.user_can_manage_guest_seating(
  p_user_id uuid,
  p_project_id uuid,
  p_guest_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.guests g
    where g.id = p_guest_id
      and g.project_id = p_project_id
      and app_private.user_can_access_project(p_user_id, p_project_id, 'seating.assign')
      and (
        app_private.user_can_access_project(p_user_id, p_project_id, 'guests.update')
        or (
          g.guest_side = 'bride'
          and app_private.user_can_access_project(p_user_id, p_project_id, 'guests.manage_bride_side')
        )
        or (
          g.guest_side = 'groom'
          and app_private.user_can_access_project(p_user_id, p_project_id, 'guests.manage_groom_side')
        )
        or (
          g.guest_side = 'both'
          and app_private.user_can_access_project(p_user_id, p_project_id, 'guests.manage_bride_side')
          and app_private.user_can_access_project(p_user_id, p_project_id, 'guests.manage_groom_side')
        )
      )
  );
$$;

revoke all on function app_private.user_can_manage_guest_seating(uuid, uuid, uuid) from public;

create or replace function app_private.event_uses_table_invitation_fields(
  p_project_id uuid,
  p_event_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.invitation_template_fields f
    where f.project_id = p_project_id
      and f.event_id = p_event_id
      and f.field_key in ('table.name', 'table.code')
  );
$$;

revoke all on function app_private.event_uses_table_invitation_fields(uuid, uuid) from public;

create or replace function app_private.mark_guest_invitation_needs_regeneration_for_seating(
  p_project_id uuid,
  p_event_id uuid,
  p_guest_id uuid,
  p_actor_user_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_updated_count integer := 0;
begin
  if not app_private.event_uses_table_invitation_fields(p_project_id, p_event_id) then
    return 0;
  end if;

  update public.invitations
  set
    status = 'needs_regeneration',
    updated_by = p_actor_user_id
  where project_id = p_project_id
    and event_id = p_event_id
    and guest_id = p_guest_id
    and status in ('generated', 'sent', 'resent');

  get diagnostics v_updated_count = row_count;
  return v_updated_count;
end;
$$;

revoke all on function app_private.mark_guest_invitation_needs_regeneration_for_seating(uuid, uuid, uuid, uuid) from public;

create or replace function app_private.redact_seating_audit_snapshot(p_snapshot jsonb)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_snapshot is null then null
    else p_snapshot - 'csv_content'
  end;
$$;

revoke all on function app_private.redact_seating_audit_snapshot(jsonb) from public;

create or replace function app_private.audit_seating_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  action_name text;
  changed_object_type text := tg_table_name;
  changed_object_id uuid;
  actor_id uuid;
  sanitized_old jsonb := null;
  sanitized_new jsonb := null;
begin
  if tg_op = 'INSERT' then
    changed_object_id := new.id;
    actor_id := coalesce(
      nullif(to_jsonb(new)->>'created_by', '')::uuid,
      nullif(to_jsonb(new)->>'assigned_by', '')::uuid,
      (select auth.uid())
    );
  elsif tg_op = 'UPDATE' then
    changed_object_id := new.id;
    actor_id := coalesce(
      nullif(to_jsonb(new)->>'updated_by', '')::uuid,
      nullif(to_jsonb(new)->>'removed_by', '')::uuid,
      (select auth.uid())
    );
    sanitized_old := app_private.redact_seating_audit_snapshot(to_jsonb(old));
  else
    changed_object_id := old.id;
    actor_id := (select auth.uid());
    sanitized_old := app_private.redact_seating_audit_snapshot(to_jsonb(old));
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    sanitized_new := app_private.redact_seating_audit_snapshot(to_jsonb(new));
  end if;

  if tg_table_name = 'event_tables' then
    if tg_op = 'INSERT' then
      action_name := 'event_tables.created';
    elsif tg_op = 'UPDATE' and new.status = 'archived' and old.status is distinct from new.status then
      action_name := 'event_tables.archived';
    elsif tg_op = 'UPDATE' and new.capacity is distinct from old.capacity then
      action_name := 'event_tables.capacity_changed';
    else
      action_name := 'event_tables.updated';
    end if;
    changed_object_type := 'event_table';
  elsif tg_table_name = 'guest_table_assignments' then
    if tg_op = 'INSERT' then
      action_name := 'guest_table_assignments.assigned';
    elsif tg_op = 'UPDATE' and new.status = 'removed' and old.status = 'active' then
      action_name := 'guest_table_assignments.removed';
    elsif tg_op = 'UPDATE' and new.table_id is distinct from old.table_id then
      action_name := 'guest_table_assignments.moved';
    else
      action_name := 'guest_table_assignments.updated';
    end if;
    changed_object_type := 'guest_table_assignment';
  elsif tg_table_name = 'seating_export_files' then
    action_name := case
      when tg_op = 'INSERT' then 'seating_exports.generated'
      else 'seating_exports.updated'
    end;
    changed_object_type := 'seating_export_file';
  else
    action_name := 'seating.updated';
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
    actor_id,
    action_name,
    changed_object_type,
    changed_object_id,
    coalesce(sanitized_old, '{}'::jsonb),
    coalesce(sanitized_new, '{}'::jsonb),
    'api'
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function app_private.audit_seating_change() from public;

drop trigger if exists audit_event_tables_insert on public.event_tables;
create trigger audit_event_tables_insert
after insert on public.event_tables
for each row
execute function app_private.audit_seating_change();

drop trigger if exists audit_event_tables_update on public.event_tables;
create trigger audit_event_tables_update
after update on public.event_tables
for each row
execute function app_private.audit_seating_change();

drop trigger if exists audit_guest_table_assignments_insert on public.guest_table_assignments;
create trigger audit_guest_table_assignments_insert
after insert on public.guest_table_assignments
for each row
execute function app_private.audit_seating_change();

drop trigger if exists audit_guest_table_assignments_update on public.guest_table_assignments;
create trigger audit_guest_table_assignments_update
after update on public.guest_table_assignments
for each row
execute function app_private.audit_seating_change();

drop trigger if exists audit_seating_export_files_insert on public.seating_export_files;
create trigger audit_seating_export_files_insert
after insert on public.seating_export_files
for each row
execute function app_private.audit_seating_change();

drop trigger if exists audit_seating_export_files_update on public.seating_export_files;
create trigger audit_seating_export_files_update
after update on public.seating_export_files
for each row
execute function app_private.audit_seating_change();

create or replace function public.assign_guest_to_event_table(
  p_project_id uuid,
  p_event_id uuid,
  p_table_id uuid,
  p_guest_id uuid,
  p_seat_id uuid default null,
  p_seating_notes text default null,
  p_vip_protocol_notes text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_table public.event_tables;
  v_guest_count integer := 1;
  v_previous_table_id uuid := null;
  v_previous_seat_id uuid := null;
  v_assignment public.guest_table_assignments;
  v_regeneration_count integer := 0;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  if not app_private.user_can_manage_guest_seating(v_actor_user_id, p_project_id, p_guest_id) then
    raise exception 'Seating assignment permission denied.'
      using errcode = '42501';
  end if;

  select *
    into v_table
  from public.event_tables
  where id = p_table_id
    and project_id = p_project_id
    and event_id = p_event_id
    and status <> 'archived'
  for update;

  if not found then
    raise exception 'Event table was not found.'
      using errcode = '02000';
  end if;

  if p_seat_id is not null and not exists (
    select 1
    from public.event_table_seats s
    where s.id = p_seat_id
      and s.table_id = p_table_id
      and s.project_id = p_project_id
      and s.event_id = p_event_id
      and s.status <> 'blocked'
  ) then
    raise exception 'Seat was not found or cannot be assigned.'
      using errcode = '02000';
  end if;

  if v_table.assignment_mode = 'table_level' and p_seat_id is not null then
    raise exception 'Table-level seating does not accept a seat ID.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.guests g
    join public.guest_event_assignments gea
      on gea.guest_id = g.id
     and gea.project_id = g.project_id
     and gea.event_id = p_event_id
    where g.id = p_guest_id
      and g.project_id = p_project_id
      and g.is_active = true
      and gea.invited = true
      and gea.status = 'assigned'
  ) then
    raise exception 'Guest must be active and invited to the selected event.'
      using errcode = '22023';
  end if;

  select coalesce(gtt.default_guest_count, 1)
    into v_guest_count
  from public.guests g
  left join public.guest_title_types gtt
    on gtt.id = g.guest_title_type_id
   and gtt.project_id = g.project_id
  where g.id = p_guest_id
    and g.project_id = p_project_id;

  update public.guest_table_assignments
  set
    status = 'removed',
    removed_at = now(),
    removed_by = v_actor_user_id,
    removal_reason = 'moved_or_reassigned'
  where project_id = p_project_id
    and event_id = p_event_id
    and guest_id = p_guest_id
    and status = 'active'
  returning table_id, seat_id into v_previous_table_id, v_previous_seat_id;

  if v_previous_seat_id is not null and v_previous_seat_id is distinct from p_seat_id then
    update public.event_table_seats
    set
      status = 'available',
      assigned_guest_id = null,
      updated_by = v_actor_user_id
    where id = v_previous_seat_id;
  end if;

  insert into public.guest_table_assignments (
    project_id,
    event_id,
    table_id,
    seat_id,
    guest_id,
    guest_count_at_assignment,
    seating_notes,
    vip_protocol_notes,
    assigned_by
  )
  values (
    p_project_id,
    p_event_id,
    p_table_id,
    p_seat_id,
    p_guest_id,
    greatest(coalesce(v_guest_count, 1), 1),
    nullif(trim(coalesce(p_seating_notes, '')), ''),
    nullif(trim(coalesce(p_vip_protocol_notes, '')), ''),
    v_actor_user_id
  )
  returning * into v_assignment;

  if p_seat_id is not null then
    update public.event_table_seats
    set
      status = 'assigned',
      assigned_guest_id = p_guest_id,
      updated_by = v_actor_user_id
    where id = p_seat_id;
  end if;

  v_regeneration_count := app_private.mark_guest_invitation_needs_regeneration_for_seating(
    p_project_id,
    p_event_id,
    p_guest_id,
    v_actor_user_id
  );

  return jsonb_build_object(
    'assignmentId', v_assignment.id,
    'projectId', v_assignment.project_id,
    'eventId', v_assignment.event_id,
    'tableId', v_assignment.table_id,
    'guestId', v_assignment.guest_id,
    'previousTableId', v_previous_table_id,
    'invitationsMarkedNeedsRegeneration', v_regeneration_count
  );
end;
$$;

revoke all on function public.assign_guest_to_event_table(uuid, uuid, uuid, uuid, uuid, text, text) from public;
grant execute on function public.assign_guest_to_event_table(uuid, uuid, uuid, uuid, uuid, text, text) to authenticated;

create or replace function public.remove_guest_from_event_table(
  p_project_id uuid,
  p_event_id uuid,
  p_guest_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_assignment public.guest_table_assignments;
  v_regeneration_count integer := 0;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  if not app_private.user_can_manage_guest_seating(v_actor_user_id, p_project_id, p_guest_id) then
    raise exception 'Seating assignment permission denied.'
      using errcode = '42501';
  end if;

  update public.guest_table_assignments
  set
    status = 'removed',
    removed_at = now(),
    removed_by = v_actor_user_id,
    removal_reason = nullif(trim(coalesce(p_reason, '')), '')
  where project_id = p_project_id
    and event_id = p_event_id
    and guest_id = p_guest_id
    and status = 'active'
  returning * into v_assignment;

  if not found then
    raise exception 'Active seating assignment was not found.'
      using errcode = '02000';
  end if;

  update public.event_table_seats
  set
    status = 'available',
    assigned_guest_id = null,
    updated_by = v_actor_user_id
  where id = v_assignment.seat_id;

  v_regeneration_count := app_private.mark_guest_invitation_needs_regeneration_for_seating(
    p_project_id,
    p_event_id,
    p_guest_id,
    v_actor_user_id
  );

  return jsonb_build_object(
    'assignmentId', v_assignment.id,
    'projectId', v_assignment.project_id,
    'eventId', v_assignment.event_id,
    'tableId', v_assignment.table_id,
    'guestId', v_assignment.guest_id,
    'invitationsMarkedNeedsRegeneration', v_regeneration_count
  );
end;
$$;

revoke all on function public.remove_guest_from_event_table(uuid, uuid, uuid, text) from public;
grant execute on function public.remove_guest_from_event_table(uuid, uuid, uuid, text) to authenticated;

alter table public.event_tables enable row level security;
alter table public.event_table_seats enable row level security;
alter table public.guest_table_assignments enable row level security;
alter table public.seating_export_files enable row level security;

drop policy if exists "Event tables visible to seating readers" on public.event_tables;
create policy "Event tables visible to seating readers"
on public.event_tables
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'seating.read')
  or app_private.user_can_access_event((select auth.uid()), event_id, 'seating.read')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'seating.tables.manage')
  or app_private.user_can_access_event((select auth.uid()), event_id, 'seating.tables.manage')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'seating.assign')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'seating.export')
);

drop policy if exists "Event tables managed by seating table managers" on public.event_tables;
create policy "Event tables managed by seating table managers"
on public.event_tables
for all
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'seating.tables.manage')
  or app_private.user_can_access_event((select auth.uid()), event_id, 'seating.tables.manage')
)
with check (
  app_private.user_can_access_project((select auth.uid()), project_id, 'seating.tables.manage')
  or app_private.user_can_access_event((select auth.uid()), event_id, 'seating.tables.manage')
);

drop policy if exists "Event table seats visible to seating readers" on public.event_table_seats;
create policy "Event table seats visible to seating readers"
on public.event_table_seats
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'seating.read')
  or app_private.user_can_access_event((select auth.uid()), event_id, 'seating.read')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'seating.tables.manage')
  or app_private.user_can_access_event((select auth.uid()), event_id, 'seating.tables.manage')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'seating.assign')
);

drop policy if exists "Event table seats managed by seating table managers" on public.event_table_seats;
create policy "Event table seats managed by seating table managers"
on public.event_table_seats
for all
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'seating.tables.manage')
  or app_private.user_can_access_event((select auth.uid()), event_id, 'seating.tables.manage')
)
with check (
  app_private.user_can_access_project((select auth.uid()), project_id, 'seating.tables.manage')
  or app_private.user_can_access_event((select auth.uid()), event_id, 'seating.tables.manage')
);

drop policy if exists "Guest table assignments visible to seating readers" on public.guest_table_assignments;
create policy "Guest table assignments visible to seating readers"
on public.guest_table_assignments
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'seating.read')
  or app_private.user_can_access_event((select auth.uid()), event_id, 'seating.read')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'seating.assign')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'seating.export')
);

drop policy if exists "Guest table assignments managed by seating assigners" on public.guest_table_assignments;
create policy "Guest table assignments managed by seating assigners"
on public.guest_table_assignments
for all
to authenticated
using (app_private.user_can_manage_guest_seating((select auth.uid()), project_id, guest_id))
with check (app_private.user_can_manage_guest_seating((select auth.uid()), project_id, guest_id));

drop policy if exists "Seating exports visible to seating exporters" on public.seating_export_files;
create policy "Seating exports visible to seating exporters"
on public.seating_export_files
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'seating.export')
  or app_private.user_can_access_event((select auth.uid()), event_id, 'seating.export')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'seating.read')
  or app_private.user_can_access_event((select auth.uid()), event_id, 'seating.read')
);

drop policy if exists "Seating exports generated by seating exporters" on public.seating_export_files;
create policy "Seating exports generated by seating exporters"
on public.seating_export_files
for insert
to authenticated
with check (
  app_private.user_can_access_project((select auth.uid()), project_id, 'seating.export')
  or app_private.user_can_access_event((select auth.uid()), event_id, 'seating.export')
);

drop policy if exists "Seating exports archived by seating exporters" on public.seating_export_files;
create policy "Seating exports archived by seating exporters"
on public.seating_export_files
for update
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'seating.export')
  or app_private.user_can_access_event((select auth.uid()), event_id, 'seating.export')
)
with check (
  app_private.user_can_access_project((select auth.uid()), project_id, 'seating.export')
  or app_private.user_can_access_event((select auth.uid()), event_id, 'seating.export')
);

grant select, insert, update on public.event_tables to authenticated;
grant select, insert, update on public.event_table_seats to authenticated;
grant select, insert, update on public.guest_table_assignments to authenticated;
grant select, insert, update on public.seating_export_files to authenticated;

grant select, insert, update on public.event_tables to service_role;
grant select, insert, update on public.event_table_seats to service_role;
grant select, insert, update on public.guest_table_assignments to service_role;
grant select, insert, update on public.seating_export_files to service_role;

insert into public.permissions (slug, description, requirement_ids)
values
  ('seating.read', 'Read authorized project/event seating plans, tables, assignments, occupancy, and unassigned guest state.', array['SEAT-001', 'SEAT-005', 'SEAT-006', 'SEAT-007', 'RSVP-010']),
  ('seating.tables.manage', 'Create, update, lock, and archive event tables and table-seat structure.', array['SEAT-001', 'SEAT-002', 'SEAT-003', 'SEAT-004', 'REP-006']),
  ('seating.assign', 'Assign, move, or remove invited guests from event tables with side-aware checks.', array['SEAT-006', 'SEAT-007', 'SEAT-008', 'SEAT-009', 'TECH-004']),
  ('seating.export', 'Generate and read Canva Bulk Create CSV exports for seating and table cards.', array['SEAT-011', 'FILE-008', 'REP-006'])
on conflict (slug) do update
set
  description = excluded.description,
  requirement_ids = excluded.requirement_ids;

with grants(role_slug, permission_slug) as (
  values
    ('diginoces_admin', 'seating.read'),
    ('diginoces_admin', 'seating.tables.manage'),
    ('diginoces_admin', 'seating.assign'),
    ('diginoces_admin', 'seating.export'),
    ('operations_manager', 'seating.read'),
    ('operations_manager', 'seating.tables.manage'),
    ('operations_manager', 'seating.assign'),
    ('operations_manager', 'seating.export'),
    ('bride', 'seating.read'),
    ('bride', 'seating.assign'),
    ('groom', 'seating.read'),
    ('groom', 'seating.assign'),
    ('event_staff', 'seating.read')
)
insert into public.role_permissions (role_id, permission_slug)
select r.id, g.permission_slug
from grants g
join public.roles r on r.slug = g.role_slug
join public.permissions p on p.slug = g.permission_slug
on conflict (role_id, permission_slug) do nothing;
