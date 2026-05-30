-- Sprint 9 - Check-in & Wedding-Day Operations
-- Requirements: CHK-001 through CHK-014, INV-007, INV-008, MSG-007,
-- SEAT-010, REP-006, TECH-007, TECH-010.
--
-- Scope guard: this migration creates only event-specific check-in settings,
-- staff-only check-in tokens, check-in records, devices/stations, unexpected
-- guest requests, offline preload/sync/conflict foundations, permissions, RLS,
-- and audit foundations. It intentionally does not implement contracts,
-- pricing, payments, partner project creation, full WhatsApp automation,
-- report dashboards, post-event guest-book workflows, invitation PDF
-- generation, or guest import workflows.

do $$
begin
  create type public.check_in_setting_status as enum (
    'active',
    'inactive'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.check_in_unexpected_guest_mode as enum (
    'disabled',
    'supervisor_approval_required',
    'manual_recording_only'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.check_in_token_status as enum (
    'active',
    'revoked',
    'expired'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.check_in_method as enum (
    'qr_scan',
    'manual_name_search',
    'manual_invitation_id',
    'manual_phone_search',
    'manual_table_search',
    'unexpected_guest_approval',
    'offline_sync'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.check_in_sync_status as enum (
    'online_synced',
    'offline_pending',
    'sync_conflict',
    'sync_failed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.check_in_device_status as enum (
    'active',
    'inactive'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.check_in_preload_status as enum (
    'not_preloaded',
    'preloaded',
    'expired',
    'failed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.unexpected_guest_request_status as enum (
    'pending',
    'approved',
    'rejected',
    'manual_approved'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.unexpected_guest_approval_mode as enum (
    'in_app',
    'manual_external'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.check_in_sync_batch_status as enum (
    'received',
    'processed',
    'partial_conflict',
    'failed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.check_in_conflict_type as enum (
    'duplicate_check_in',
    'arrival_count_conflict',
    'stale_guest_data',
    'unexpected_guest_decision_conflict',
    'permission_denied',
    'feature_disabled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.check_in_conflict_status as enum (
    'open',
    'resolved',
    'ignored'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.check_in_settings (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null,
  enabled boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text not null default 'UTC',
  allowed_methods jsonb not null default '["qr_scan", "manual_name_search", "manual_invitation_id", "manual_phone_search", "manual_table_search"]'::jsonb,
  offline_preload_enabled boolean not null default false,
  unexpected_guest_mode public.check_in_unexpected_guest_mode not null default 'supervisor_approval_required',
  supervisor_approval_required boolean not null default true,
  status public.check_in_setting_status not null default 'active',
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_in_settings_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint check_in_settings_time_range check (
    starts_at is null or ends_at is null or starts_at < ends_at
  ),
  constraint check_in_settings_timezone_not_blank check (length(trim(timezone)) > 0),
  constraint check_in_settings_allowed_methods_array check (jsonb_typeof(allowed_methods) = 'array')
);

create unique index if not exists check_in_settings_event_key
  on public.check_in_settings (event_id);

create index if not exists check_in_settings_project_event_status_idx
  on public.check_in_settings (project_id, event_id, status, enabled);

create table if not exists public.check_in_devices (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null,
  station_name text not null,
  device_label text,
  assigned_staff_user_id uuid references auth.users (id) on delete set null,
  mode text not null default 'entrance',
  status public.check_in_device_status not null default 'active',
  sync_status public.check_in_sync_status not null default 'online_synced',
  preload_status public.check_in_preload_status not null default 'not_preloaded',
  last_activity_at timestamptz,
  activity_count integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_in_devices_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint check_in_devices_station_name_not_blank check (length(trim(station_name)) > 0),
  constraint check_in_devices_activity_count_non_negative check (activity_count >= 0)
);

create unique index if not exists check_in_devices_event_station_key
  on public.check_in_devices (event_id, lower(station_name));

create index if not exists check_in_devices_project_event_status_idx
  on public.check_in_devices (project_id, event_id, status, assigned_staff_user_id);

create table if not exists public.check_in_tokens (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null,
  guest_id uuid not null,
  guest_event_assignment_id uuid,
  invitation_id uuid,
  token_hash text not null unique,
  token_preview text not null,
  status public.check_in_token_status not null default 'active',
  last_scanned_at timestamptz,
  regenerated_at timestamptz,
  regenerated_from_token_id uuid references public.check_in_tokens (id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_in_tokens_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint check_in_tokens_guest_project_match
    foreign key (guest_id, project_id)
    references public.guests (id, project_id)
    on delete cascade,
  constraint check_in_tokens_guest_event_match
    foreign key (guest_id, event_id)
    references public.guest_event_assignments (guest_id, event_id)
    on delete cascade,
  constraint check_in_tokens_assignment_fk
    foreign key (guest_event_assignment_id)
    references public.guest_event_assignments (id)
    on delete set null,
  constraint check_in_tokens_invitation_project_match
    foreign key (invitation_id, project_id)
    references public.invitations (id, project_id)
    on delete set null (invitation_id),
  constraint check_in_tokens_hash_sha256_hex check (token_hash ~ '^[a-f0-9]{64}$'),
  constraint check_in_tokens_preview_not_blank check (length(trim(token_preview)) >= 6),
  constraint check_in_tokens_revoked_timestamp check (
    (status <> 'revoked' and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null)
  )
);

create unique index if not exists check_in_tokens_active_guest_event_key
  on public.check_in_tokens (guest_id, event_id)
  where status = 'active';

create index if not exists check_in_tokens_project_event_status_idx
  on public.check_in_tokens (project_id, event_id, status, updated_at desc);

create table if not exists public.check_in_records (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null,
  guest_id uuid,
  guest_event_assignment_id uuid,
  invitation_id uuid,
  token_id uuid references public.check_in_tokens (id) on delete set null,
  staff_user_id uuid not null references auth.users (id) on delete restrict,
  device_id uuid references public.check_in_devices (id) on delete set null,
  method public.check_in_method not null,
  arrival_count integer not null default 1,
  total_expected_count integer not null default 1,
  attendance_before integer not null default 0,
  attendance_after integer not null default 1,
  sync_status public.check_in_sync_status not null default 'online_synced',
  is_duplicate_scan boolean not null default false,
  supervisor_override_used boolean not null default false,
  welcome_message_action text not null default 'none',
  welcome_message_suppressed_reason text,
  source_offline_record_id text,
  notes text,
  checked_in_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint check_in_records_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint check_in_records_guest_project_match
    foreign key (guest_id, project_id)
    references public.guests (id, project_id)
    on delete set null (guest_id),
  constraint check_in_records_guest_event_match
    foreign key (guest_id, event_id)
    references public.guest_event_assignments (guest_id, event_id)
    on delete set null (guest_id),
  constraint check_in_records_assignment_fk
    foreign key (guest_event_assignment_id)
    references public.guest_event_assignments (id)
    on delete set null,
  constraint check_in_records_invitation_project_match
    foreign key (invitation_id, project_id)
    references public.invitations (id, project_id)
    on delete set null (invitation_id),
  constraint check_in_records_arrival_count_non_negative check (arrival_count >= 0),
  constraint check_in_records_total_expected_positive check (total_expected_count > 0),
  constraint check_in_records_attendance_non_negative check (
    attendance_before >= 0 and attendance_after >= 0
  ),
  constraint check_in_records_arrival_math check (
    attendance_after = attendance_before + arrival_count
  ),
  constraint check_in_records_expected_limit check (
    attendance_after <= total_expected_count or supervisor_override_used
  )
);

create index if not exists check_in_records_project_event_checked_idx
  on public.check_in_records (project_id, event_id, checked_in_at desc);

create index if not exists check_in_records_guest_event_idx
  on public.check_in_records (guest_id, event_id, checked_in_at desc);

create unique index if not exists check_in_records_event_source_offline_record_key
  on public.check_in_records (event_id, source_offline_record_id)
  where source_offline_record_id is not null;

create index if not exists check_in_records_staff_device_idx
  on public.check_in_records (project_id, event_id, staff_user_id, device_id);

create table if not exists public.unexpected_guest_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null,
  requested_name text not null,
  guest_side public.guest_side,
  reason text,
  status public.unexpected_guest_request_status not null default 'pending',
  requested_by uuid not null references auth.users (id) on delete restrict,
  device_id uuid references public.check_in_devices (id) on delete set null,
  supervisor_user_id uuid references auth.users (id) on delete set null,
  approval_mode public.unexpected_guest_approval_mode,
  decision_reason text,
  decision_at timestamptz,
  approved_arrival_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unexpected_guest_requests_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint unexpected_guest_requests_name_not_blank check (length(trim(requested_name)) > 0),
  constraint unexpected_guest_requests_approval_count_positive check (
    approved_arrival_count is null or approved_arrival_count > 0
  ),
  constraint unexpected_guest_requests_decision_pair check (
    (status = 'pending' and decision_at is null and supervisor_user_id is null)
    or (status <> 'pending' and decision_at is not null and supervisor_user_id is not null)
  )
);

create index if not exists unexpected_guest_requests_project_event_status_idx
  on public.unexpected_guest_requests (project_id, event_id, status, created_at desc);

create table if not exists public.check_in_preload_snapshots (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null,
  device_id uuid references public.check_in_devices (id) on delete set null,
  generated_by uuid not null references auth.users (id) on delete restrict,
  snapshot_version integer not null default 1,
  guest_count integer not null default 0,
  token_count integer not null default 0,
  payload_hash text,
  expires_at timestamptz,
  generated_at timestamptz not null default now(),
  constraint check_in_preload_snapshots_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint check_in_preload_snapshots_version_positive check (snapshot_version > 0),
  constraint check_in_preload_snapshots_counts_non_negative check (
    guest_count >= 0 and token_count >= 0
  ),
  constraint check_in_preload_snapshots_payload_hash_hex check (
    payload_hash is null or payload_hash ~ '^[a-f0-9]{64}$'
  )
);

create index if not exists check_in_preload_snapshots_project_event_idx
  on public.check_in_preload_snapshots (project_id, event_id, generated_at desc);

create table if not exists public.check_in_sync_batches (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null,
  device_id uuid references public.check_in_devices (id) on delete set null,
  submitted_by uuid not null references auth.users (id) on delete restrict,
  status public.check_in_sync_batch_status not null default 'received',
  record_count integer not null default 0,
  conflict_count integer not null default 0,
  offline_started_at timestamptz,
  offline_ended_at timestamptz,
  submitted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint check_in_sync_batches_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint check_in_sync_batches_counts_non_negative check (
    record_count >= 0 and conflict_count >= 0
  ),
  constraint check_in_sync_batches_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index if not exists check_in_sync_batches_project_event_status_idx
  on public.check_in_sync_batches (project_id, event_id, status, submitted_at desc);

create table if not exists public.check_in_sync_conflicts (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null,
  sync_batch_id uuid references public.check_in_sync_batches (id) on delete cascade,
  guest_id uuid,
  check_in_record_id uuid references public.check_in_records (id) on delete set null,
  conflict_type public.check_in_conflict_type not null,
  status public.check_in_conflict_status not null default 'open',
  conflict_payload jsonb not null default '{}'::jsonb,
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_in_sync_conflicts_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint check_in_sync_conflicts_guest_project_match
    foreign key (guest_id, project_id)
    references public.guests (id, project_id)
    on delete set null (guest_id),
  constraint check_in_sync_conflicts_payload_object check (jsonb_typeof(conflict_payload) = 'object'),
  constraint check_in_sync_conflicts_resolved_pair check (
    (status = 'open' and resolved_at is null)
    or (status <> 'open' and resolved_at is not null and resolved_by is not null)
  )
);

create index if not exists check_in_sync_conflicts_project_event_status_idx
  on public.check_in_sync_conflicts (project_id, event_id, status, created_at desc);

drop trigger if exists set_check_in_settings_updated_at on public.check_in_settings;
create trigger set_check_in_settings_updated_at
before update on public.check_in_settings
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_check_in_devices_updated_at on public.check_in_devices;
create trigger set_check_in_devices_updated_at
before update on public.check_in_devices
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_check_in_tokens_updated_at on public.check_in_tokens;
create trigger set_check_in_tokens_updated_at
before update on public.check_in_tokens
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_unexpected_guest_requests_updated_at on public.unexpected_guest_requests;
create trigger set_unexpected_guest_requests_updated_at
before update on public.unexpected_guest_requests
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_check_in_sync_conflicts_updated_at on public.check_in_sync_conflicts;
create trigger set_check_in_sync_conflicts_updated_at
before update on public.check_in_sync_conflicts
for each row
execute function app_private.set_updated_at();

create or replace function app_private.user_can_access_check_in_event(
  p_user_id uuid,
  p_project_id uuid,
  p_event_id uuid,
  p_permission text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_user_id is not null
    and (
      app_private.user_can_access_event(p_user_id, p_event_id, p_permission)
      or app_private.user_can_access_project(p_user_id, p_project_id, p_permission)
    );
$$;

revoke all on function app_private.user_can_access_check_in_event(uuid, uuid, uuid, text) from public;

create or replace function app_private.user_can_access_check_in_event_any(
  p_user_id uuid,
  p_project_id uuid,
  p_event_id uuid,
  p_permissions text[]
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_user_id is not null
    and exists (
      select 1
      from unnest(p_permissions) as permission_slug
      where app_private.user_can_access_check_in_event(
        p_user_id,
        p_project_id,
        p_event_id,
        permission_slug
      )
    );
$$;

revoke all on function app_private.user_can_access_check_in_event_any(uuid, uuid, uuid, text[]) from public;

create or replace function app_private.check_in_settings_permit_method(
  p_project_id uuid,
  p_event_id uuid,
  p_method public.check_in_method default null
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((
    select
      cis.enabled
      and cis.status = 'active'
      and (cis.starts_at is null or now() >= cis.starts_at)
      and (cis.ends_at is null or now() <= cis.ends_at)
      and (
        p_method is null
        or p_method not in (
          'qr_scan',
          'manual_name_search',
          'manual_invitation_id',
          'manual_phone_search',
          'manual_table_search'
        )
        or coalesce(
          cis.allowed_methods,
          '["qr_scan", "manual_name_search", "manual_invitation_id", "manual_phone_search", "manual_table_search"]'::jsonb
        ) ? p_method::text
      )
    from public.check_in_settings cis
    where cis.project_id = p_project_id
      and cis.event_id = p_event_id
  ), false);
$$;

revoke all on function app_private.check_in_settings_permit_method(
  uuid,
  uuid,
  public.check_in_method
) from public;

create or replace function app_private.redact_check_in_audit_snapshot(
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
    when p_table_name = 'check_in_tokens' then p_snapshot - 'token_hash'
    else p_snapshot
  end;
$$;

revoke all on function app_private.redact_check_in_audit_snapshot(text, jsonb) from public;

create or replace function app_private.audit_check_in_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid;
  v_action text;
  v_object_id uuid;
  v_object_type text;
  v_old jsonb;
  v_new jsonb;
begin
  v_actor_user_id := coalesce(
    case
      when tg_op in ('INSERT', 'UPDATE') then
        coalesce(
          (to_jsonb(new)->>'updated_by')::uuid,
          (to_jsonb(new)->>'created_by')::uuid,
          (to_jsonb(new)->>'staff_user_id')::uuid,
          (to_jsonb(new)->>'requested_by')::uuid,
          (to_jsonb(new)->>'submitted_by')::uuid,
          (to_jsonb(new)->>'generated_by')::uuid,
          (to_jsonb(new)->>'supervisor_user_id')::uuid
        )
      else null
    end,
    (select auth.uid())
  );

  v_object_id := case
    when tg_op = 'DELETE' then old.id
    else new.id
  end;

  v_object_type := case tg_table_name
    when 'check_in_settings' then 'check_in_setting'
    when 'check_in_devices' then 'check_in_device'
    when 'check_in_tokens' then 'check_in_token'
    when 'check_in_records' then 'check_in_record'
    when 'unexpected_guest_requests' then 'unexpected_guest_request'
    when 'check_in_preload_snapshots' then 'check_in_preload_snapshot'
    when 'check_in_sync_batches' then 'check_in_sync_batch'
    when 'check_in_sync_conflicts' then 'check_in_sync_conflict'
    else tg_table_name
  end;

  v_action := case
    when tg_table_name = 'check_in_settings' and tg_op = 'INSERT' then 'check_in_settings.created'
    when tg_table_name = 'check_in_settings' and tg_op = 'UPDATE' then 'check_in_settings.updated'
    when tg_table_name = 'check_in_devices' and tg_op = 'INSERT' then 'check_in_devices.assigned'
    when tg_table_name = 'check_in_devices' and tg_op = 'UPDATE' then 'check_in_devices.updated'
    when tg_table_name = 'check_in_tokens' and tg_op = 'INSERT' and new.regenerated_from_token_id is not null then 'check_in_tokens.regenerated'
    when tg_table_name = 'check_in_tokens' and tg_op = 'INSERT' then 'check_in_tokens.created'
    when tg_table_name = 'check_in_tokens' and tg_op = 'UPDATE' and old.status <> 'revoked' and new.status = 'revoked' then 'check_in_tokens.revoked'
    when tg_table_name = 'check_in_tokens' and tg_op = 'UPDATE' then 'check_in_tokens.updated'
    when tg_table_name = 'check_in_records' and tg_op = 'INSERT' and new.is_duplicate_scan then 'check_in.duplicate_scan_detected'
    when tg_table_name = 'check_in_records' and tg_op = 'INSERT' and new.method = 'offline_sync' then 'check_in.offline_synced'
    when tg_table_name = 'check_in_records' and tg_op = 'INSERT' and new.attendance_before > 0 then 'check_in.partial_arrival_updated'
    when tg_table_name = 'check_in_records' and tg_op = 'INSERT' then 'check_in.guest_checked_in'
    when tg_table_name = 'unexpected_guest_requests' and tg_op = 'INSERT' then 'unexpected_guest_requests.created'
    when tg_table_name = 'unexpected_guest_requests' and tg_op = 'UPDATE' and old.status = 'pending' and new.status in ('approved', 'manual_approved') then 'unexpected_guest_requests.approved'
    when tg_table_name = 'unexpected_guest_requests' and tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'rejected' then 'unexpected_guest_requests.rejected'
    when tg_table_name = 'unexpected_guest_requests' and tg_op = 'UPDATE' then 'unexpected_guest_requests.updated'
    when tg_table_name = 'check_in_preload_snapshots' and tg_op = 'INSERT' then 'check_in.preload_snapshot.created'
    when tg_table_name = 'check_in_sync_batches' and tg_op = 'INSERT' then 'check_in.sync_batch.created'
    when tg_table_name = 'check_in_sync_batches' and tg_op = 'UPDATE' then 'check_in.sync_batch.updated'
    when tg_table_name = 'check_in_sync_conflicts' and tg_op = 'INSERT' then 'check_in.sync_conflict.detected'
    when tg_table_name = 'check_in_sync_conflicts' and tg_op = 'UPDATE' then 'check_in.sync_conflict.updated'
    else concat(tg_table_name, '.', lower(tg_op))
  end;

  v_old := case
    when tg_op = 'INSERT' then null
    else app_private.redact_check_in_audit_snapshot(tg_table_name, to_jsonb(old))
  end;
  v_new := case
    when tg_op = 'DELETE' then null
    else app_private.redact_check_in_audit_snapshot(tg_table_name, to_jsonb(new))
  end;

  insert into public.audit_logs (
    actor_user_id,
    action,
    object_type,
    object_id,
    old_value,
    new_value,
    source,
    reason
  )
  values (
    v_actor_user_id,
    v_action,
    v_object_type,
    v_object_id,
    v_old,
    v_new,
    'api',
    coalesce(v_new->>'decision_reason', v_new->>'notes', v_old->>'notes')
  );

  return case
    when tg_op = 'DELETE' then old
    else new
  end;
end;
$$;

revoke all on function app_private.audit_check_in_change() from public;

drop trigger if exists audit_check_in_settings_insert on public.check_in_settings;
create trigger audit_check_in_settings_insert
after insert on public.check_in_settings
for each row execute function app_private.audit_check_in_change();

drop trigger if exists audit_check_in_settings_update on public.check_in_settings;
create trigger audit_check_in_settings_update
after update on public.check_in_settings
for each row execute function app_private.audit_check_in_change();

drop trigger if exists audit_check_in_devices_insert on public.check_in_devices;
create trigger audit_check_in_devices_insert
after insert on public.check_in_devices
for each row execute function app_private.audit_check_in_change();

drop trigger if exists audit_check_in_devices_update on public.check_in_devices;
create trigger audit_check_in_devices_update
after update on public.check_in_devices
for each row execute function app_private.audit_check_in_change();

drop trigger if exists audit_check_in_tokens_insert on public.check_in_tokens;
create trigger audit_check_in_tokens_insert
after insert on public.check_in_tokens
for each row execute function app_private.audit_check_in_change();

drop trigger if exists audit_check_in_tokens_update on public.check_in_tokens;
create trigger audit_check_in_tokens_update
after update on public.check_in_tokens
for each row execute function app_private.audit_check_in_change();

drop trigger if exists audit_check_in_records_insert on public.check_in_records;
create trigger audit_check_in_records_insert
after insert on public.check_in_records
for each row execute function app_private.audit_check_in_change();

drop trigger if exists audit_unexpected_guest_requests_insert on public.unexpected_guest_requests;
create trigger audit_unexpected_guest_requests_insert
after insert on public.unexpected_guest_requests
for each row execute function app_private.audit_check_in_change();

drop trigger if exists audit_unexpected_guest_requests_update on public.unexpected_guest_requests;
create trigger audit_unexpected_guest_requests_update
after update on public.unexpected_guest_requests
for each row execute function app_private.audit_check_in_change();

drop trigger if exists audit_check_in_preload_snapshots_insert on public.check_in_preload_snapshots;
create trigger audit_check_in_preload_snapshots_insert
after insert on public.check_in_preload_snapshots
for each row execute function app_private.audit_check_in_change();

drop trigger if exists audit_check_in_sync_batches_insert on public.check_in_sync_batches;
create trigger audit_check_in_sync_batches_insert
after insert on public.check_in_sync_batches
for each row execute function app_private.audit_check_in_change();

drop trigger if exists audit_check_in_sync_batches_update on public.check_in_sync_batches;
create trigger audit_check_in_sync_batches_update
after update on public.check_in_sync_batches
for each row execute function app_private.audit_check_in_change();

drop trigger if exists audit_check_in_sync_conflicts_insert on public.check_in_sync_conflicts;
create trigger audit_check_in_sync_conflicts_insert
after insert on public.check_in_sync_conflicts
for each row execute function app_private.audit_check_in_change();

drop trigger if exists audit_check_in_sync_conflicts_update on public.check_in_sync_conflicts;
create trigger audit_check_in_sync_conflicts_update
after update on public.check_in_sync_conflicts
for each row execute function app_private.audit_check_in_change();

create or replace function public.create_check_in_token(
  p_event_id uuid,
  p_guest_id uuid,
  p_invitation_id uuid default null
)
returns table (
  token_id uuid,
  token text,
  token_preview text,
  project_id uuid,
  event_id uuid,
  guest_id uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_event_project_id uuid;
  v_assignment_id uuid;
  v_existing_token_id uuid;
  v_token text;
  v_token_hash text;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.';
  end if;

  select e.project_id
  into v_event_project_id
  from public.events e
  where e.id = p_event_id;

  if v_event_project_id is null then
    raise exception 'Event was not found.';
  end if;

  if not app_private.user_can_access_check_in_event(
    v_actor_user_id,
    v_event_project_id,
    p_event_id,
    'check_in.tokens.manage'
  ) then
    raise exception 'Check-in token permission denied.'
      using errcode = '42501';
  end if;

  select gea.id
  into v_assignment_id
  from public.guest_event_assignments gea
  where gea.project_id = v_event_project_id
    and gea.event_id = p_event_id
    and gea.guest_id = p_guest_id
    and gea.invited
    and gea.status = 'assigned';

  if v_assignment_id is null then
    raise exception 'Guest is not assigned to this event.';
  end if;

  if p_invitation_id is not null and not exists (
    select 1
    from public.invitations i
    where i.id = p_invitation_id
      and i.project_id = v_event_project_id
      and i.event_id = p_event_id
      and i.guest_id = p_guest_id
  ) then
    raise exception 'Invitation does not match this event guest.';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_event_id::text), hashtext(p_guest_id::text));

  select cit.id
  into v_existing_token_id
  from public.check_in_tokens cit
  where cit.event_id = p_event_id
    and cit.guest_id = p_guest_id
    and cit.status = 'active'
  for update;

  v_token := encode(extensions.gen_random_bytes(18), 'hex');
  v_token_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');

  if v_existing_token_id is not null then
    update public.check_in_tokens
    set
      status = 'revoked',
      revoked_at = now(),
      revoked_by = v_actor_user_id,
      updated_by = v_actor_user_id
    where id = v_existing_token_id;
  end if;

  insert into public.check_in_tokens (
    project_id,
    event_id,
    guest_id,
    guest_event_assignment_id,
    invitation_id,
    token_hash,
    token_preview,
    regenerated_at,
    regenerated_from_token_id,
    created_by,
    updated_by
  )
  values (
    v_event_project_id,
    p_event_id,
    p_guest_id,
    v_assignment_id,
    p_invitation_id,
    v_token_hash,
    left(v_token, 8),
    case when v_existing_token_id is null then null else now() end,
    v_existing_token_id,
    v_actor_user_id,
    v_actor_user_id
  )
  returning id, public.check_in_tokens.token_preview
  into token_id, token_preview;

  token := v_token;
  project_id := v_event_project_id;
  event_id := p_event_id;
  guest_id := p_guest_id;
  return next;
end;
$$;

revoke all on function public.create_check_in_token(uuid, uuid, uuid) from public;
grant execute on function public.create_check_in_token(uuid, uuid, uuid) to authenticated;

create or replace function public.resolve_check_in_token(
  p_event_id uuid,
  p_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_event_project_id uuid;
  v_token public.check_in_tokens%rowtype;
  v_hash text := encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
begin
  if v_actor_user_id is null then
    return jsonb_build_object('status', 'unauthenticated');
  end if;

  select e.project_id
  into v_event_project_id
  from public.events e
  where e.id = p_event_id;

  if v_event_project_id is null then
    return jsonb_build_object('status', 'invalid_event');
  end if;

  if not app_private.user_can_access_check_in_event(
    v_actor_user_id,
    v_event_project_id,
    p_event_id,
    'check_in.perform'
  ) then
    return jsonb_build_object('status', 'permission_denied');
  end if;

  if not app_private.check_in_settings_permit_method(
    v_event_project_id,
    p_event_id,
    'qr_scan'
  ) then
    return jsonb_build_object('status', 'check_in_unavailable');
  end if;

  select *
  into v_token
  from public.check_in_tokens cit
  where cit.token_hash = v_hash
  limit 1;

  if v_token.id is null then
    return jsonb_build_object('status', 'invalid');
  end if;

  if v_token.event_id <> p_event_id then
    return jsonb_build_object('status', 'wrong_event');
  end if;

  if v_token.status <> 'active' then
    return jsonb_build_object('status', v_token.status);
  end if;

  update public.check_in_tokens
  set last_scanned_at = now()
  where id = v_token.id;

  return jsonb_build_object(
    'status', 'ok',
    'tokenId', v_token.id,
    'projectId', v_token.project_id,
    'eventId', v_token.event_id,
    'guestId', v_token.guest_id,
    'invitationId', v_token.invitation_id
  );
end;
$$;

revoke all on function public.resolve_check_in_token(uuid, text) from public;
grant execute on function public.resolve_check_in_token(uuid, text) to authenticated;

create or replace function public.perform_guest_check_in(
  p_event_id uuid,
  p_guest_id uuid,
  p_method public.check_in_method,
  p_arrival_count integer default 1,
  p_device_id uuid default null,
  p_token_id uuid default null,
  p_invitation_id uuid default null,
  p_sync_status public.check_in_sync_status default 'online_synced',
  p_checked_in_at timestamptz default now(),
  p_notes text default null,
  p_supervisor_override boolean default false,
  p_source_offline_record_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_event_project_id uuid;
  v_assignment public.guest_event_assignments%rowtype;
  v_guest record;
  v_rsvp_status public.rsvp_status;
  v_current_arrival_count integer;
  v_total_expected_count integer;
  v_after_count integer;
  v_is_duplicate boolean := false;
  v_welcome_action text := 'none';
  v_welcome_suppressed_reason text;
  v_record_id uuid;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if p_arrival_count is null or p_arrival_count < 1 then
    raise exception 'Arrival count must be at least 1.';
  end if;

  select e.project_id
  into v_event_project_id
  from public.events e
  where e.id = p_event_id;

  if v_event_project_id is null then
    raise exception 'Event was not found.';
  end if;

  if not app_private.user_can_access_check_in_event(
    v_actor_user_id,
    v_event_project_id,
    p_event_id,
    'check_in.perform'
  ) then
    raise exception 'Check-in permission denied.'
      using errcode = '42501';
  end if;

  if not app_private.check_in_settings_permit_method(
    v_event_project_id,
    p_event_id,
    p_method
  ) then
    raise exception 'Check-in is not open for this event or method.'
      using errcode = 'P0403';
  end if;

  select *
  into v_assignment
  from public.guest_event_assignments gea
  where gea.project_id = v_event_project_id
    and gea.event_id = p_event_id
    and gea.guest_id = p_guest_id
    and gea.invited
    and gea.status = 'assigned'
  for update;

  if v_assignment.id is null then
    raise exception 'Guest is not assigned to this event.';
  end if;

  select
    g.id,
    g.guest_title_type_id,
    coalesce(gtt.default_guest_count, 1) as total_expected_count
  into v_guest
  from public.guests g
  left join public.guest_title_types gtt
    on gtt.id = g.guest_title_type_id
    and gtt.project_id = g.project_id
  where g.id = p_guest_id
    and g.project_id = v_event_project_id
    and g.is_active;

  if v_guest.id is null then
    raise exception 'Guest was not found.';
  end if;

  if p_device_id is not null and not exists (
    select 1
    from public.check_in_devices d
    where d.id = p_device_id
      and d.project_id = v_event_project_id
      and d.event_id = p_event_id
      and d.status = 'active'
  ) then
    raise exception 'Check-in device does not match this event.';
  end if;

  if p_token_id is not null and not exists (
    select 1
    from public.check_in_tokens t
    where t.id = p_token_id
      and t.project_id = v_event_project_id
      and t.event_id = p_event_id
      and t.guest_id = p_guest_id
      and t.status = 'active'
  ) then
    raise exception 'Check-in token does not match this event guest.';
  end if;

  if p_invitation_id is not null and not exists (
    select 1
    from public.invitations i
    where i.id = p_invitation_id
      and i.project_id = v_event_project_id
      and i.event_id = p_event_id
      and i.guest_id = p_guest_id
  ) then
    raise exception 'Invitation does not match this event guest.';
  end if;

  select rr.status
  into v_rsvp_status
  from public.rsvp_records rr
  where rr.project_id = v_event_project_id
    and rr.event_id = p_event_id
    and rr.guest_id = p_guest_id
  order by rr.updated_at desc
  limit 1;

  select coalesce(sum(cr.arrival_count) filter (where not cr.is_duplicate_scan), 0)
  into v_current_arrival_count
  from public.check_in_records cr
  where cr.project_id = v_event_project_id
    and cr.event_id = p_event_id
    and cr.guest_id = p_guest_id;

  v_total_expected_count := greatest(coalesce(v_guest.total_expected_count, 1), 1);

  if v_current_arrival_count >= v_total_expected_count
    and not p_supervisor_override then
    -- Duplicate scans intentionally force p_arrival_count to zero so
    -- attendance_after stays at v_current_arrival_count and the non-negative
    -- arrival count constraint remains satisfied.
    v_is_duplicate := true;
    p_arrival_count := 0;
  end if;

  v_after_count := v_current_arrival_count + p_arrival_count;

  if v_after_count > v_total_expected_count then
    if not p_supervisor_override then
      raise exception 'Arrival count exceeds expected count.';
    end if;

    if not app_private.user_can_access_check_in_event(
      v_actor_user_id,
      v_event_project_id,
      p_event_id,
      'check_in.unexpected_guests.review'
    ) then
      raise exception 'Supervisor override permission denied.'
        using errcode = '42501';
    end if;
  end if;

  if p_arrival_count > 0 and v_current_arrival_count = 0 then
    v_welcome_action := 'prepare';
  elsif p_arrival_count > 0
    and v_current_arrival_count > 0
    and not (p_supervisor_override and v_after_count > v_total_expected_count) then
    -- First arrivals prepare a welcome message, normal repeat arrivals suppress
    -- it as not_first_arrival, and duplicate scans at capacity suppress it as
    -- duplicate_scan. Supervisor-approved over-capacity arrivals are deliberate
    -- manual exceptions, so this branch leaves v_welcome_action as none instead
    -- of treating the arrival as an automatic duplicate suppression case.
    v_welcome_action := 'suppress_duplicate';
    v_welcome_suppressed_reason := 'not_first_arrival';
  elsif v_is_duplicate then
    v_welcome_action := 'suppress_duplicate';
    v_welcome_suppressed_reason := 'duplicate_scan';
  end if;

  insert into public.check_in_records (
    project_id,
    event_id,
    guest_id,
    guest_event_assignment_id,
    invitation_id,
    token_id,
    staff_user_id,
    device_id,
    method,
    arrival_count,
    total_expected_count,
    attendance_before,
    attendance_after,
    sync_status,
    is_duplicate_scan,
    supervisor_override_used,
    welcome_message_action,
    welcome_message_suppressed_reason,
    source_offline_record_id,
    notes,
    checked_in_at
  )
  values (
    v_event_project_id,
    p_event_id,
    p_guest_id,
    v_assignment.id,
    p_invitation_id,
    p_token_id,
    v_actor_user_id,
    p_device_id,
    p_method,
    p_arrival_count,
    v_total_expected_count,
    v_current_arrival_count,
    v_after_count,
    p_sync_status,
    v_is_duplicate,
    p_supervisor_override,
    v_welcome_action,
    v_welcome_suppressed_reason,
    p_source_offline_record_id,
    p_notes,
    coalesce(p_checked_in_at, now())
  )
  returning id into v_record_id;

  if p_device_id is not null then
    update public.check_in_devices
    set
      activity_count = activity_count + 1,
      last_activity_at = now(),
      sync_status = p_sync_status,
      updated_by = v_actor_user_id
    where id = p_device_id;
  end if;

  return jsonb_build_object(
    'status', case when v_is_duplicate then 'duplicate' else 'checked_in' end,
    'recordId', v_record_id,
    'projectId', v_event_project_id,
    'eventId', p_event_id,
    'guestId', p_guest_id,
    'arrivalCount', p_arrival_count,
    'attendanceBefore', v_current_arrival_count,
    'attendanceAfter', v_after_count,
    'totalExpectedCount', v_total_expected_count,
    'isDuplicateScan', v_is_duplicate,
    'rsvpStatus', coalesce(v_rsvp_status::text, 'pending'),
    'rsvpNoWarning', coalesce(v_rsvp_status::text, 'pending') = 'no',
    'welcomeMessageAction', v_welcome_action
  );
end;
$$;

revoke all on function public.perform_guest_check_in(
  uuid,
  uuid,
  public.check_in_method,
  integer,
  uuid,
  uuid,
  uuid,
  public.check_in_sync_status,
  timestamptz,
  text,
  boolean,
  text
) from public;
grant execute on function public.perform_guest_check_in(
  uuid,
  uuid,
  public.check_in_method,
  integer,
  uuid,
  uuid,
  uuid,
  public.check_in_sync_status,
  timestamptz,
  text,
  boolean,
  text
) to authenticated;

create or replace function public.submit_offline_check_in_sync_batch(
  p_event_id uuid,
  p_device_id uuid default null,
  p_offline_records jsonb default '[]'::jsonb,
  p_conflicts jsonb default '[]'::jsonb,
  p_status public.check_in_sync_batch_status default 'processed',
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_project_id uuid;
  v_batch_id uuid;
  v_applied_records jsonb := '[]'::jsonb;
  v_failed_records jsonb := '[]'::jsonb;
  v_failure_count integer := 0;
  v_failure_conflict_type public.check_in_conflict_type;
  v_final_status public.check_in_sync_batch_status := p_status;
  v_conflict jsonb;
  v_conflict_guest_id uuid;
  v_conflict_record_ids text[] := array[]::text[];
  v_conflict_type public.check_in_conflict_type;
  v_record jsonb;
  v_record_arrival_count integer;
  v_record_arrived_at timestamptz;
  v_record_guest_id uuid;
  v_record_result jsonb;
  v_offline_record_id text;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if jsonb_typeof(coalesce(p_offline_records, '[]'::jsonb)) <> 'array' then
    raise exception 'Offline records must be a JSON array.';
  end if;

  if jsonb_typeof(coalesce(p_conflicts, '[]'::jsonb)) <> 'array' then
    raise exception 'Offline sync conflicts must be a JSON array.';
  end if;

  if jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object' then
    raise exception 'Offline sync metadata must be a JSON object.';
  end if;

  select e.project_id
  into v_project_id
  from public.events e
  where e.id = p_event_id;

  if v_project_id is null then
    raise exception 'Event was not found.';
  end if;

  if not app_private.user_can_access_check_in_event(
    v_actor_user_id,
    v_project_id,
    p_event_id,
    'check_in.offline_sync'
  ) then
    raise exception 'Offline sync permission denied.'
      using errcode = '42501';
  end if;

  if p_device_id is not null and not exists (
    select 1
    from public.check_in_devices d
    where d.id = p_device_id
      and d.project_id = v_project_id
      and d.event_id = p_event_id
      and d.status = 'active'
  ) then
    raise exception 'Check-in device does not match this event.';
  end if;

  insert into public.check_in_sync_batches (
    project_id,
    event_id,
    device_id,
    submitted_by,
    record_count,
    conflict_count,
    status,
    metadata
  )
  values (
    v_project_id,
    p_event_id,
    p_device_id,
    v_actor_user_id,
    jsonb_array_length(coalesce(p_offline_records, '[]'::jsonb)),
    jsonb_array_length(coalesce(p_conflicts, '[]'::jsonb)),
    p_status,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_batch_id;

  for v_conflict in
    select value
    from jsonb_array_elements(coalesce(p_conflicts, '[]'::jsonb)) as conflict(value)
  loop
    v_offline_record_id := nullif(v_conflict->>'offlineRecordId', '');

    if v_offline_record_id is not null then
      v_conflict_record_ids := array_append(v_conflict_record_ids, v_offline_record_id);
    end if;

    if nullif(v_conflict->>'conflictType', '') is null then
      raise exception 'Offline sync conflict type is required.';
    end if;

    if not exists (
      select 1
      from unnest(enum_range(null::public.check_in_conflict_type)) as conflict_type(value)
      where conflict_type.value::text = v_conflict->>'conflictType'
    ) then
      raise exception 'Offline sync conflict type is not supported.';
    end if;

    v_conflict_type := (v_conflict->>'conflictType')::public.check_in_conflict_type;

    if nullif(v_conflict->>'guestId', '') is null then
      v_conflict_guest_id := null;
    else
      begin
        v_conflict_guest_id := (v_conflict->>'guestId')::uuid;
      exception
        when invalid_text_representation then
          raise exception 'Offline sync conflict guest ID must be a valid UUID.';
      end;
    end if;

    insert into public.check_in_sync_conflicts (
      project_id,
      event_id,
      sync_batch_id,
      guest_id,
      conflict_type,
      conflict_payload
    )
    values (
      v_project_id,
      p_event_id,
      v_batch_id,
      v_conflict_guest_id,
      v_conflict_type,
      jsonb_build_object(
        'offlineRecordId', v_offline_record_id,
        'reason', nullif(v_conflict->>'reason', '')
      )
    );
  end loop;

  for v_record in
    select value
    from jsonb_array_elements(coalesce(p_offline_records, '[]'::jsonb)) as record(value)
  loop
    v_offline_record_id := nullif(v_record->>'offlineRecordId', '');

    if v_offline_record_id is not null
      and v_offline_record_id = any(v_conflict_record_ids) then
      continue;
    end if;

    begin
      v_record_arrival_count := null;
      v_record_arrived_at := null;
      v_record_guest_id := null;

      if v_offline_record_id is null then
        raise exception 'Offline record ID is required.';
      end if;

      if nullif(v_record->>'eventId', '') is not null
        and (v_record->>'eventId') <> p_event_id::text then
        raise exception 'Offline check-in records must match the sync batch event.';
      end if;

      if exists (
        select 1
        from public.check_in_records cr
        where cr.event_id = p_event_id
          and cr.source_offline_record_id = v_offline_record_id
      ) then
        continue;
      end if;

      if nullif(v_record->>'guestId', '') is null then
        raise exception 'Offline record guest ID is required.';
      end if;

      begin
        v_record_guest_id := (v_record->>'guestId')::uuid;
      exception
        when invalid_text_representation then
          raise exception 'Offline record guest ID must be a valid UUID.';
      end;

      if nullif(v_record->>'arrivalCount', '') is null then
        raise exception 'Offline record arrival count is required.';
      end if;

      begin
        v_record_arrival_count := (v_record->>'arrivalCount')::integer;
      exception
        when invalid_text_representation then
          raise exception 'Offline record arrival count must be an integer.';
      end;

      if v_record_arrival_count < 1 then
        raise exception 'Offline record arrival count must be positive.';
      end if;

      if nullif(v_record->>'arrivedAt', '') is null then
        raise exception 'Offline record arrival timestamp is required.';
      end if;

      begin
        v_record_arrived_at := (v_record->>'arrivedAt')::timestamptz;
      exception
        when datetime_field_overflow or invalid_datetime_format then
          raise exception 'Offline record arrival timestamp must be valid.';
      end;

      v_record_result := public.perform_guest_check_in(
        p_event_id => p_event_id,
        p_guest_id => v_record_guest_id,
        p_method => 'offline_sync',
        p_arrival_count => v_record_arrival_count,
        p_device_id => p_device_id,
        p_token_id => null,
        p_invitation_id => null,
        p_sync_status => 'online_synced',
        p_checked_in_at => v_record_arrived_at,
        p_notes => null,
        p_supervisor_override => false,
        p_source_offline_record_id => v_offline_record_id
      );

      v_applied_records := v_applied_records || jsonb_build_array(v_record_result);
    exception
      when others then
        v_failure_conflict_type := case
          when sqlstate in ('28000', '42501') then 'permission_denied'::public.check_in_conflict_type
          when sqlstate in ('0A000', '42883', 'P0403') then 'feature_disabled'::public.check_in_conflict_type
          else 'stale_guest_data'::public.check_in_conflict_type
        end;
        v_failure_count := v_failure_count + 1;
        v_failed_records := v_failed_records || jsonb_build_array(
          jsonb_build_object(
            'offlineRecordId', v_offline_record_id,
            'guestId', nullif(v_record->>'guestId', ''),
            'eventId', p_event_id,
            'sqlState', sqlstate,
            'errorMessage', sqlerrm
          )
        );

        insert into public.check_in_sync_conflicts (
          project_id,
          event_id,
          sync_batch_id,
          guest_id,
          conflict_type,
          conflict_payload
        )
        values (
          v_project_id,
          p_event_id,
          v_batch_id,
          case
            when exists (
              select 1
              from public.guests g
              where g.id = v_record_guest_id
                and g.project_id = v_project_id
            ) then v_record_guest_id
            else null
          end,
          v_failure_conflict_type,
          jsonb_build_object(
            'offlineRecordId', v_offline_record_id,
            'reason', sqlerrm,
            'sqlState', sqlstate,
            'errorMessage', sqlerrm
          )
        );

        continue;
    end;
  end loop;

  if v_failure_count > 0 then
    v_final_status := case
      when jsonb_array_length(v_applied_records) = 0 then 'failed'::public.check_in_sync_batch_status
      else 'partial_conflict'::public.check_in_sync_batch_status
    end;

    update public.check_in_sync_batches
    set
      status = v_final_status,
      conflict_count = conflict_count + v_failure_count,
      metadata = metadata || jsonb_build_object('failedRecords', v_failed_records)
    where id = v_batch_id;
  end if;

  return jsonb_build_object(
    'status', v_final_status,
    'batchId', v_batch_id,
    'projectId', v_project_id,
    'eventId', p_event_id,
    'recordCount', jsonb_array_length(coalesce(p_offline_records, '[]'::jsonb)),
    'conflictCount', jsonb_array_length(coalesce(p_conflicts, '[]'::jsonb)) + v_failure_count,
    'failedRecords', v_failed_records,
    'appliedRecords', v_applied_records
  );
end;
$$;

revoke all on function public.submit_offline_check_in_sync_batch(
  uuid,
  uuid,
  jsonb,
  jsonb,
  public.check_in_sync_batch_status,
  jsonb
) from public;
grant execute on function public.submit_offline_check_in_sync_batch(
  uuid,
  uuid,
  jsonb,
  jsonb,
  public.check_in_sync_batch_status,
  jsonb
) to authenticated;

create or replace function public.create_unexpected_guest_request(
  p_event_id uuid,
  p_requested_name text,
  p_guest_side public.guest_side default null,
  p_reason text default null,
  p_device_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_unexpected_guest_mode public.check_in_unexpected_guest_mode;
  v_project_id uuid;
  v_request_id uuid;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if nullif(trim(coalesce(p_requested_name, '')), '') is null then
    raise exception 'Requested guest name is required.';
  end if;

  select e.project_id
  into v_project_id
  from public.events e
  where e.id = p_event_id;

  if v_project_id is null then
    raise exception 'Event was not found.';
  end if;

  select coalesce(cis.unexpected_guest_mode, 'supervisor_approval_required')
  into v_unexpected_guest_mode
  from public.check_in_settings cis
  where cis.project_id = v_project_id
    and cis.event_id = p_event_id;

  if coalesce(v_unexpected_guest_mode, 'supervisor_approval_required') = 'disabled' then
    raise exception 'Unexpected guest requests are disabled for this event.'
      using errcode = 'P0403';
  end if;

  if not app_private.user_can_access_check_in_event(
    v_actor_user_id,
    v_project_id,
    p_event_id,
    'check_in.unexpected_guests.create'
  ) then
    raise exception 'Unexpected guest request permission denied.'
      using errcode = '42501';
  end if;

  if p_device_id is not null and not exists (
    select 1
    from public.check_in_devices d
    where d.id = p_device_id
      and d.project_id = v_project_id
      and d.event_id = p_event_id
      and d.status = 'active'
  ) then
    raise exception 'Check-in device does not match this event.';
  end if;

  insert into public.unexpected_guest_requests (
    project_id,
    event_id,
    requested_name,
    guest_side,
    reason,
    requested_by,
    device_id
  )
  values (
    v_project_id,
    p_event_id,
    trim(p_requested_name),
    p_guest_side,
    nullif(trim(coalesce(p_reason, '')), ''),
    v_actor_user_id,
    p_device_id
  )
  returning id into v_request_id;

  return jsonb_build_object(
    'status', 'pending',
    'requestId', v_request_id,
    'projectId', v_project_id,
    'eventId', p_event_id
  );
end;
$$;

revoke all on function public.create_unexpected_guest_request(
  uuid,
  text,
  public.guest_side,
  text,
  uuid
) from public;
grant execute on function public.create_unexpected_guest_request(
  uuid,
  text,
  public.guest_side,
  text,
  uuid
) to authenticated;

create or replace function public.review_unexpected_guest_request(
  p_request_id uuid,
  p_next_status public.unexpected_guest_request_status,
  p_decision_reason text,
  p_approval_mode public.unexpected_guest_approval_mode default 'in_app',
  p_approved_arrival_count integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_unexpected_guest_mode public.check_in_unexpected_guest_mode;
  v_request public.unexpected_guest_requests%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if p_next_status = 'pending' then
    raise exception 'Unexpected guest review must approve or reject.';
  end if;

  select *
  into v_request
  from public.unexpected_guest_requests ugr
  where ugr.id = p_request_id
  for update;

  if v_request.id is null then
    raise exception 'Unexpected guest request was not found.';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Unexpected guest request was already reviewed.';
  end if;

  select coalesce(cis.unexpected_guest_mode, 'supervisor_approval_required')
  into v_unexpected_guest_mode
  from public.check_in_settings cis
  where cis.project_id = v_request.project_id
    and cis.event_id = v_request.event_id;

  if coalesce(v_unexpected_guest_mode, 'supervisor_approval_required') = 'disabled' then
    raise exception 'Unexpected guest requests are disabled for this event.'
      using errcode = 'P0403';
  end if;

  if coalesce(v_unexpected_guest_mode, 'supervisor_approval_required') <> 'supervisor_approval_required' then
    raise exception 'In-app unexpected guest review is disabled for this event.'
      using errcode = 'P0403';
  end if;

  if not app_private.user_can_access_check_in_event(
    v_actor_user_id,
    v_request.project_id,
    v_request.event_id,
    'check_in.unexpected_guests.review'
  ) then
    raise exception 'Unexpected guest review permission denied.'
      using errcode = '42501';
  end if;

  if p_next_status in ('approved', 'manual_approved')
    and coalesce(p_approved_arrival_count, 1) < 1 then
    raise exception 'Approved arrival count must be positive.';
  end if;

  update public.unexpected_guest_requests
  set
    status = p_next_status,
    supervisor_user_id = v_actor_user_id,
    approval_mode = p_approval_mode,
    decision_reason = nullif(trim(coalesce(p_decision_reason, '')), ''),
    decision_at = now(),
    approved_arrival_count = case
      when p_next_status in ('approved', 'manual_approved') then coalesce(p_approved_arrival_count, 1)
      else null
    end
  where id = p_request_id;

  return jsonb_build_object(
    'status', p_next_status,
    'requestId', p_request_id,
    'projectId', v_request.project_id,
    'eventId', v_request.event_id
  );
end;
$$;

revoke all on function public.review_unexpected_guest_request(
  uuid,
  public.unexpected_guest_request_status,
  text,
  public.unexpected_guest_approval_mode,
  integer
) from public;
grant execute on function public.review_unexpected_guest_request(
  uuid,
  public.unexpected_guest_request_status,
  text,
  public.unexpected_guest_approval_mode,
  integer
) to authenticated;

alter table public.check_in_settings enable row level security;
alter table public.check_in_devices enable row level security;
alter table public.check_in_tokens enable row level security;
alter table public.check_in_records enable row level security;
alter table public.unexpected_guest_requests enable row level security;
alter table public.check_in_preload_snapshots enable row level security;
alter table public.check_in_sync_batches enable row level security;
alter table public.check_in_sync_conflicts enable row level security;

drop policy if exists "Projects visible to check-in actors" on public.wedding_projects;
create policy "Projects visible to check-in actors"
on public.wedding_projects
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), id, 'check_in.read')
  or exists (
    select 1
    from public.events e
    where e.project_id = wedding_projects.id
      and app_private.user_can_access_check_in_event_any(
        (select auth.uid()),
        e.project_id,
        e.id,
        array[
          'check_in.read',
          'check_in.settings.manage',
          'check_in.tokens.manage',
          'check_in.search',
          'check_in.perform',
          'check_in.unexpected_guests.create',
          'check_in.unexpected_guests.review',
          'check_in.devices.manage',
          'check_in.offline_sync',
          'check_in.dashboard'
        ]
      )
  )
);

drop policy if exists "Events visible to check-in actors" on public.events;
create policy "Events visible to check-in actors"
on public.events
for select
to authenticated
using (
  app_private.user_can_access_check_in_event_any(
    (select auth.uid()),
    project_id,
    id,
    array[
      'check_in.read',
      'check_in.settings.manage',
      'check_in.tokens.manage',
      'check_in.search',
      'check_in.perform',
      'check_in.unexpected_guests.create',
      'check_in.unexpected_guests.review',
      'check_in.devices.manage',
      'check_in.offline_sync',
      'check_in.dashboard'
    ]
  )
);

drop policy if exists "Check-in settings visible to check-in readers" on public.check_in_settings;
create policy "Check-in settings visible to check-in readers"
on public.check_in_settings
for select
to authenticated
using (
  app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.read')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.settings.manage')
);

drop policy if exists "Check-in settings managed by setting managers" on public.check_in_settings;
create policy "Check-in settings managed by setting managers"
on public.check_in_settings
for all
to authenticated
using (app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.settings.manage'))
with check (app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.settings.manage'));

drop policy if exists "Check-in devices visible to assigned check-in users" on public.check_in_devices;
create policy "Check-in devices visible to assigned check-in users"
on public.check_in_devices
for select
to authenticated
using (
  app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.read')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.perform')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.devices.manage')
);

drop policy if exists "Check-in devices managed by device managers" on public.check_in_devices;
create policy "Check-in devices managed by device managers"
on public.check_in_devices
for all
to authenticated
using (app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.devices.manage'))
with check (app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.devices.manage'));

drop policy if exists "Check-in tokens visible to token managers" on public.check_in_tokens;
create policy "Check-in tokens visible to token managers"
on public.check_in_tokens
for select
to authenticated
using (app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.tokens.manage'));

drop policy if exists "Check-in tokens managed by token managers" on public.check_in_tokens;

drop policy if exists "Check-in records visible to check-in readers" on public.check_in_records;
create policy "Check-in records visible to check-in readers"
on public.check_in_records
for select
to authenticated
using (
  app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.read')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.dashboard')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.perform')
);

drop policy if exists "Check-in records inserted by check-in staff" on public.check_in_records;

drop policy if exists "Unexpected guest requests visible to check-in users" on public.unexpected_guest_requests;
create policy "Unexpected guest requests visible to check-in users"
on public.unexpected_guest_requests
for select
to authenticated
using (
  app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.unexpected_guests.create')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.unexpected_guests.review')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.dashboard')
);

drop policy if exists "Unexpected guest requests created by check-in staff" on public.unexpected_guest_requests;

drop policy if exists "Unexpected guest requests reviewed by supervisors" on public.unexpected_guest_requests;

drop policy if exists "Check-in preload snapshots visible to offline check-in users" on public.check_in_preload_snapshots;
create policy "Check-in preload snapshots visible to offline check-in users"
on public.check_in_preload_snapshots
for select
to authenticated
using (
  app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.offline_sync')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.read')
);

drop policy if exists "Check-in preload snapshots created by offline check-in users" on public.check_in_preload_snapshots;
create policy "Check-in preload snapshots created by offline check-in users"
on public.check_in_preload_snapshots
for insert
to authenticated
with check (
  generated_by = (select auth.uid())
  and app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.offline_sync')
);

drop policy if exists "Check-in sync batches visible to offline check-in users" on public.check_in_sync_batches;
create policy "Check-in sync batches visible to offline check-in users"
on public.check_in_sync_batches
for select
to authenticated
using (
  app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.offline_sync')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.dashboard')
);

drop policy if exists "Check-in sync batches managed by offline check-in users" on public.check_in_sync_batches;

drop policy if exists "Check-in sync conflicts visible to offline check-in users" on public.check_in_sync_conflicts;
create policy "Check-in sync conflicts visible to offline check-in users"
on public.check_in_sync_conflicts
for select
to authenticated
using (
  app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.offline_sync')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.dashboard')
);

drop policy if exists "Check-in sync conflicts managed by offline check-in users" on public.check_in_sync_conflicts;

drop policy if exists "Check-in staff can read assigned event guest rows" on public.guests;
create policy "Check-in staff can read assigned event guest rows"
on public.guests
for select
to authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.guest_event_assignments gea
    where gea.project_id = guests.project_id
      and gea.guest_id = guests.id
      and gea.invited = true
      and gea.status = 'assigned'
      and (
        app_private.user_can_access_check_in_event((select auth.uid()), gea.project_id, gea.event_id, 'check_in.read')
        or app_private.user_can_access_check_in_event((select auth.uid()), gea.project_id, gea.event_id, 'check_in.search')
        or app_private.user_can_access_check_in_event((select auth.uid()), gea.project_id, gea.event_id, 'check_in.perform')
      )
  )
);

drop policy if exists "Check-in staff can read assigned event guest assignments" on public.guest_event_assignments;
create policy "Check-in staff can read assigned event guest assignments"
on public.guest_event_assignments
for select
to authenticated
using (
  invited = true
  and status = 'assigned'
  and (
    app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.read')
    or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.search')
    or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.perform')
  )
);

drop policy if exists "Check-in staff can read assigned event guest title types" on public.guest_title_types;
create policy "Check-in staff can read assigned event guest title types"
on public.guest_title_types
for select
to authenticated
using (
  exists (
    select 1
    from public.guests g
    join public.guest_event_assignments gea
      on gea.project_id = g.project_id
      and gea.guest_id = g.id
    where g.project_id = guest_title_types.project_id
      and g.guest_title_type_id = guest_title_types.id
      and g.is_active = true
      and gea.invited = true
      and gea.status = 'assigned'
      and (
        app_private.user_can_access_check_in_event((select auth.uid()), gea.project_id, gea.event_id, 'check_in.read')
        or app_private.user_can_access_check_in_event((select auth.uid()), gea.project_id, gea.event_id, 'check_in.search')
        or app_private.user_can_access_check_in_event((select auth.uid()), gea.project_id, gea.event_id, 'check_in.perform')
      )
  )
);

drop policy if exists "Check-in staff can read assigned event guest tags" on public.guest_tags;
create policy "Check-in staff can read assigned event guest tags"
on public.guest_tags
for select
to authenticated
using (
  exists (
    select 1
    from public.guest_tag_assignments gta
    join public.guest_event_assignments gea
      on gea.project_id = gta.project_id
      and gea.guest_id = gta.guest_id
    where gta.project_id = guest_tags.project_id
      and gta.tag_id = guest_tags.id
      and gea.invited = true
      and gea.status = 'assigned'
      and (
        app_private.user_can_access_check_in_event((select auth.uid()), gea.project_id, gea.event_id, 'check_in.read')
        or app_private.user_can_access_check_in_event((select auth.uid()), gea.project_id, gea.event_id, 'check_in.search')
        or app_private.user_can_access_check_in_event((select auth.uid()), gea.project_id, gea.event_id, 'check_in.perform')
      )
  )
);

drop policy if exists "Check-in staff can read assigned event guest tag assignments" on public.guest_tag_assignments;
create policy "Check-in staff can read assigned event guest tag assignments"
on public.guest_tag_assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.guest_event_assignments gea
    where gea.project_id = guest_tag_assignments.project_id
      and gea.guest_id = guest_tag_assignments.guest_id
      and gea.invited = true
      and gea.status = 'assigned'
      and (
        app_private.user_can_access_check_in_event((select auth.uid()), gea.project_id, gea.event_id, 'check_in.read')
        or app_private.user_can_access_check_in_event((select auth.uid()), gea.project_id, gea.event_id, 'check_in.search')
        or app_private.user_can_access_check_in_event((select auth.uid()), gea.project_id, gea.event_id, 'check_in.perform')
      )
  )
);

drop policy if exists "Check-in staff can read event RSVP context" on public.rsvp_records;
create policy "Check-in staff can read event RSVP context"
on public.rsvp_records
for select
to authenticated
using (
  app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.read')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.search')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.perform')
);

drop policy if exists "Check-in staff can read event invitation context" on public.invitations;
create policy "Check-in staff can read event invitation context"
on public.invitations
for select
to authenticated
using (
  app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.read')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.search')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.perform')
);

drop policy if exists "Check-in staff can read event table context" on public.event_tables;
create policy "Check-in staff can read event table context"
on public.event_tables
for select
to authenticated
using (
  app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.read')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.search')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.perform')
);

drop policy if exists "Check-in staff can read event seat context" on public.event_table_seats;
create policy "Check-in staff can read event seat context"
on public.event_table_seats
for select
to authenticated
using (
  app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.read')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.search')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.perform')
);

drop policy if exists "Check-in staff can read event table assignments" on public.guest_table_assignments;
create policy "Check-in staff can read event table assignments"
on public.guest_table_assignments
for select
to authenticated
using (
  app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.read')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.search')
  or app_private.user_can_access_check_in_event((select auth.uid()), project_id, event_id, 'check_in.perform')
);

grant select, insert, update on public.check_in_settings to authenticated;
grant select, insert, update on public.check_in_devices to authenticated;
grant select on public.check_in_tokens to authenticated;
grant select on public.check_in_records to authenticated;
grant select on public.unexpected_guest_requests to authenticated;
revoke insert, update, delete on public.check_in_records from authenticated;
revoke insert, update, delete on public.unexpected_guest_requests from authenticated;
grant select, insert on public.check_in_preload_snapshots to authenticated;
grant select on public.check_in_sync_batches to authenticated;
grant select on public.check_in_sync_conflicts to authenticated;

grant select, insert, update on public.check_in_settings to service_role;
grant select, insert, update on public.check_in_devices to service_role;
grant select, insert, update on public.check_in_tokens to service_role;
grant select, insert on public.check_in_records to service_role;
grant select, insert, update on public.unexpected_guest_requests to service_role;
grant select, insert on public.check_in_preload_snapshots to service_role;
grant select, insert, update on public.check_in_sync_batches to service_role;
grant select, insert, update, delete on public.check_in_sync_conflicts to service_role;

insert into public.permissions (slug, description, requirement_ids)
values
  ('check_in.read', 'Read event check-in settings and assigned check-in context.', array['CHK-001', 'CHK-004']),
  ('check_in.settings.manage', 'Configure event-specific check-in settings.', array['CHK-001', 'CHK-003', 'TECH-004']),
  ('check_in.tokens.manage', 'Create, regenerate, and revoke event-specific check-in tokens.', array['CHK-003', 'INV-007', 'INV-008', 'TECH-010']),
  ('check_in.search', 'Search event guests by QR, invitation ID, name, phone, side, and table for check-in.', array['CHK-002', 'CHK-012']),
  ('check_in.perform', 'Perform staff-only guest check-in actions.', array['CHK-001', 'CHK-002', 'CHK-003', 'CHK-005', 'CHK-006', 'CHK-012']),
  ('check_in.unexpected_guests.create', 'Create unexpected guest requests during check-in.', array['CHK-008']),
  ('check_in.unexpected_guests.review', 'Approve, reject, or record manual approval for unexpected guest requests.', array['CHK-008', 'CHK-009']),
  ('check_in.devices.manage', 'Assign and manage check-in devices and stations.', array['CHK-013']),
  ('check_in.offline_sync', 'Prepare preload snapshots and submit offline check-in sync batches.', array['CHK-011', 'TECH-007']),
  ('check_in.dashboard', 'View check-in dashboard metrics by table, staff, and device.', array['CHK-014'])
on conflict (slug) do update
set
  description = excluded.description,
  requirement_ids = excluded.requirement_ids;

insert into public.roles (scope, slug, name, description, requires_mfa, is_system, requirement_ids)
values
  ('event', 'check_in_supervisor', 'Check-in Supervisor', 'Event-level supervisor for unexpected guest approvals, devices, and arrivals dashboard.', true, true, array['CHK-008', 'CHK-009', 'CHK-013', 'CHK-014', 'ROLE-006'])
on conflict (slug) do update
set
  scope = excluded.scope,
  name = excluded.name,
  description = excluded.description,
  requires_mfa = excluded.requires_mfa,
  is_system = excluded.is_system,
  requirement_ids = excluded.requirement_ids;

with grants(role_slug, permission_slug) as (
  values
    ('diginoces_admin', 'check_in.read'),
    ('diginoces_admin', 'check_in.settings.manage'),
    ('diginoces_admin', 'check_in.tokens.manage'),
    ('diginoces_admin', 'check_in.search'),
    ('diginoces_admin', 'check_in.perform'),
    ('diginoces_admin', 'check_in.unexpected_guests.create'),
    ('diginoces_admin', 'check_in.unexpected_guests.review'),
    ('diginoces_admin', 'check_in.devices.manage'),
    ('diginoces_admin', 'check_in.offline_sync'),
    ('diginoces_admin', 'check_in.dashboard'),
    ('operations_manager', 'check_in.read'),
    ('operations_manager', 'check_in.settings.manage'),
    ('operations_manager', 'check_in.tokens.manage'),
    ('operations_manager', 'check_in.search'),
    ('operations_manager', 'check_in.perform'),
    ('operations_manager', 'check_in.unexpected_guests.create'),
    ('operations_manager', 'check_in.unexpected_guests.review'),
    ('operations_manager', 'check_in.devices.manage'),
    ('operations_manager', 'check_in.offline_sync'),
    ('operations_manager', 'check_in.dashboard'),
    ('event_staff', 'check_in.read'),
    ('event_staff', 'check_in.search'),
    ('event_staff', 'check_in.perform'),
    ('event_staff', 'check_in.unexpected_guests.create'),
    ('event_staff', 'check_in.offline_sync'),
    ('check_in_supervisor', 'platform.foundation.access'),
    ('check_in_supervisor', 'events.read'),
    ('check_in_supervisor', 'seating.read'),
    ('check_in_supervisor', 'check_in.read'),
    ('check_in_supervisor', 'check_in.search'),
    ('check_in_supervisor', 'check_in.perform'),
    ('check_in_supervisor', 'check_in.unexpected_guests.create'),
    ('check_in_supervisor', 'check_in.unexpected_guests.review'),
    ('check_in_supervisor', 'check_in.devices.manage'),
    ('check_in_supervisor', 'check_in.offline_sync'),
    ('check_in_supervisor', 'check_in.dashboard')
)
insert into public.role_permissions (role_id, permission_slug)
select r.id, g.permission_slug
from grants g
join public.roles r on r.slug = g.role_slug
join public.permissions p on p.slug = g.permission_slug
on conflict (role_id, permission_slug) do nothing;
