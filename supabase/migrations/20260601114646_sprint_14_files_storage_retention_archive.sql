-- Sprint 14 - Files, Storage, Retention & Archive
-- Requirements: FILE-001 through FILE-009, PV-006, REP-005, REP-006,
-- ROLE-001 through ROLE-004, ROLE-009, TECH-004.
--
-- Scope guard: this migration hardens the existing app-owned file registry,
-- storage metadata, versioning, retention, archive, and secure-download
-- foundations. It intentionally does not implement AI assistance, advanced
-- integrations, direct Canva API integration, partner white-label SaaS,
-- partner commission management, online payment provider integration,
-- external accounting storage sync, or automated destructive deletion.

do $$
begin
  create type public.file_category as enum (
    'contract',
    'contract_addendum',
    'payment_proof',
    'invitation_template',
    'generated_invitation',
    'qr_asset',
    'import_file',
    'canva_csv_export',
    'table_card_export',
    'guest_book_export',
    'report_export',
    'check_in_export',
    'partner_document',
    'project_archive',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.file_visibility as enum (
    'internal',
    'couple_visible',
    'partner_visible',
    'guest_visible'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.file_status as enum (
    'generated',
    'active',
    'superseded',
    'archived',
    'failed',
    'deleted',
    'pending_cleanup'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.file_access_action as enum (
    'download_requested',
    'download_denied',
    'signed_url_created',
    'guest_signed_url_created'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.file_archive_action as enum (
    'archive',
    'soft_delete',
    'restore'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.file_retention_status as enum (
    'active',
    'completed',
    'retention_active',
    'retention_due',
    'retention_extended',
    'archived',
    'pending_deletion',
    'deleted'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.retention_notice_status as enum (
    'not_required',
    'pending_notice',
    'notice_sent',
    'admin_review_required',
    'review_completed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.project_archive_action as enum (
    'mark_completed',
    'archive',
    'extend_retention',
    'mark_pending_deletion',
    'cancel_pending_deletion'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.file_download_token_status as enum (
    'active',
    'used',
    'revoked',
    'expired'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.file_categories (
  slug public.file_category primary key,
  name text not null,
  description text not null,
  allowed_mime_types text[] not null default '{}',
  max_size_bytes bigint not null default 52428800,
  guest_visible_allowed boolean not null default false,
  retention_required boolean not null default true,
  requirement_ids text[] not null default array['FILE-001', 'FILE-002'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint file_categories_name_not_blank check (length(trim(name)) > 0),
  constraint file_categories_description_not_blank check (length(trim(description)) > 0),
  constraint file_categories_max_size_positive check (max_size_bytes > 0)
);

insert into public.file_categories (
  slug,
  name,
  description,
  allowed_mime_types,
  guest_visible_allowed,
  requirement_ids
)
values
  ('contract', 'Contract', 'Project contract PDF or exported contract record.', array['application/pdf'], false, array['FILE-002', 'FILE-005']),
  ('contract_addendum', 'Contract addendum', 'Contract addendum PDF or exported addendum record.', array['application/pdf'], false, array['FILE-002', 'FILE-005']),
  ('payment_proof', 'Payment proof', 'Payment proof or receipt supplied to Diginoces/admin.', array['application/pdf', 'image/png', 'image/jpeg', 'image/webp'], false, array['FILE-002', 'FILE-009']),
  ('invitation_template', 'Invitation template', 'Canva-exported PDF invitation template.', array['application/pdf'], false, array['FILE-001', 'FILE-003']),
  ('generated_invitation', 'Generated invitation', 'Personalized guest invitation file.', array['application/pdf'], true, array['FILE-004', 'FILE-005', 'FILE-006']),
  ('qr_asset', 'QR asset', 'Generated QR image asset where storage is required.', array['image/png', 'image/jpeg', 'image/webp'], true, array['FILE-004', 'FILE-006']),
  ('import_file', 'Import file', 'Guest import source or approved import evidence.', array['text/csv', 'application/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], false, array['FILE-002', 'FILE-009']),
  ('canva_csv_export', 'Canva CSV export', 'Generic Canva Bulk Create CSV export.', array['text/csv'], false, array['FILE-008']),
  ('table_card_export', 'Table card export', 'Table-card or seating Canva CSV export.', array['text/csv'], false, array['FILE-003', 'FILE-008']),
  ('guest_book_export', 'Guest-book export', 'Guest-book Canva CSV or final guest-book file.', array['text/csv', 'application/pdf'], false, array['FILE-008']),
  ('report_export', 'Report export', 'Operational report export generated from dashboards/reports.', array['text/csv', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], false, array['REP-005', 'FILE-008']),
  ('check_in_export', 'Check-in export', 'Check-in operational export or recap.', array['text/csv', 'application/pdf'], false, array['FILE-003', 'REP-005']),
  ('partner_document', 'Partner document', 'Partner-visible operational document that excludes sensitive revenue/payment data.', array['application/pdf', 'text/csv'], false, array['ROLE-004', 'FILE-002']),
  ('project_archive', 'Project archive', 'Project archive bundle or archive marker file.', array['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], false, array['FILE-007']),
  ('other', 'Other', 'Controlled fallback for safe internal project files.', array['application/pdf', 'text/csv', 'text/plain', 'text/markdown', 'image/png', 'image/jpeg', 'image/webp'], false, array['FILE-002'])
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  allowed_mime_types = excluded.allowed_mime_types,
  max_size_bytes = excluded.max_size_bytes,
  guest_visible_allowed = excluded.guest_visible_allowed,
  retention_required = excluded.retention_required,
  requirement_ids = excluded.requirement_ids,
  updated_at = now();

update public.files
set category = case
  when category = 'guest_book_exports' then 'guest_book_export'
  when category = 'table_cards_csv' then 'table_card_export'
  when category in (
    'contract',
    'contract_addendum',
    'payment_proof',
    'invitation_template',
    'generated_invitation',
    'qr_asset',
    'import_file',
    'canva_csv_export',
    'table_card_export',
    'guest_book_export',
    'report_export',
    'check_in_export',
    'partner_document',
    'project_archive',
    'other'
  ) then category
  else 'other'
end;

alter table public.files
  alter column category type public.file_category using category::public.file_category,
  alter column category set default 'other'::public.file_category;

alter table public.files
  add column if not exists project_id uuid references public.wedding_projects (id) on delete cascade,
  add column if not exists event_id uuid,
  add column if not exists guest_id uuid,
  add column if not exists invitation_id uuid,
  add column if not exists filename text,
  add column if not exists mime_type text,
  add column if not exists file_size_bytes bigint,
  add column if not exists file_size_unknown boolean not null default false,
  add column if not exists checksum_sha256 text,
  add column if not exists visibility public.file_visibility not null default 'internal',
  add column if not exists status public.file_status not null default 'active',
  add column if not exists version_group_id uuid,
  add column if not exists is_latest boolean not null default true,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists retention_status public.file_retention_status not null default 'active',
  add column if not exists retention_started_at timestamptz,
  add column if not exists retention_expires_at timestamptz,
  add column if not exists retention_extended_until timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users (id) on delete set null,
  add column if not exists archive_reason text,
  add column if not exists soft_deleted_at timestamptz,
  add column if not exists soft_deleted_by uuid references auth.users (id) on delete set null,
  add column if not exists soft_delete_reason text,
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_by uuid references auth.users (id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

update public.files
set
  project_id = case
    when scope_type = 'project' then scope_id
    else project_id
  end,
  event_id = case
    when scope_type = 'event' then scope_id
    else event_id
  end,
  guest_id = case
    when scope_type = 'guest' then scope_id
    else guest_id
  end,
  invitation_id = case
    when scope_type = 'invitation' then scope_id
    else invitation_id
  end,
  filename = coalesce(filename, regexp_replace(storage_path, '^.*/', '')),
  mime_type = coalesce(
    mime_type,
    case
      when lower(storage_path) like '%.pdf' then 'application/pdf'
      when lower(storage_path) like '%.csv' then 'text/csv'
      when lower(storage_path) like '%.xlsx' then 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      when lower(storage_path) like '%.png' then 'image/png'
      when lower(storage_path) like '%.jpg' or lower(storage_path) like '%.jpeg' then 'image/jpeg'
      when lower(storage_path) like '%.webp' then 'image/webp'
      else 'application/octet-stream'
    end
  ),
  file_size_unknown = case
    when file_size_bytes is null then true
    else file_size_unknown
  end,
  metadata = case
    when file_size_bytes is null then coalesce(metadata, '{}'::jsonb) || jsonb_build_object('size_estimated', true)
    else metadata
  end,
  version_group_id = coalesce(version_group_id, id),
  is_latest = coalesce(is_latest, is_active),
  status = case
    when is_active then 'active'::public.file_status
    else 'superseded'::public.file_status
  end
where version_group_id is null
  or filename is null
  or mime_type is null
  or file_size_bytes is null;

update public.files f
set
  project_id = e.project_id
from public.events e
where f.event_id = e.id
  and f.project_id is null;

update public.files f
set
  project_id = g.project_id
from public.guests g
where f.guest_id = g.id
  and f.project_id is null;

update public.files f
set
  project_id = i.project_id,
  event_id = coalesce(f.event_id, i.event_id),
  guest_id = coalesce(f.guest_id, i.guest_id)
from public.invitations i
where f.invitation_id = i.id
  and f.project_id is null;

alter table public.files
  alter column filename set not null,
  alter column mime_type set not null,
  alter column version_group_id set not null;

do $$
begin
  alter table public.files
    add constraint files_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.files
    add constraint files_guest_project_match
    foreign key (guest_id, project_id)
    references public.guests (id, project_id)
    on delete cascade;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.files
    add constraint files_invitation_project_match
    foreign key (invitation_id, project_id)
    references public.invitations (id, project_id)
    on delete set null (invitation_id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.files
    add constraint files_filename_not_blank check (length(trim(filename)) > 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.files
    add constraint files_mime_type_not_blank check (length(trim(mime_type)) > 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.files
    add constraint files_size_non_negative check (file_size_bytes >= 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.files
    add constraint files_checksum_sha256_hex check (
      checksum_sha256 is null or checksum_sha256 ~ '^[a-f0-9]{64}$'
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.files
    add constraint files_metadata_object check (jsonb_typeof(metadata) = 'object');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.files
    add constraint files_project_scope_consistency check (
      (scope_type = 'platform' and project_id is null)
      or (scope_type <> 'platform' and project_id is not null)
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.files
    add constraint files_guest_visibility_requires_guest check (
      visibility <> 'guest_visible' or guest_id is not null
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.files
    add constraint files_archive_status_timestamp check (
      (status = 'archived' and archived_at is not null)
      or status <> 'archived'
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.files
    add constraint files_deleted_status_timestamp check (
      (status = 'deleted' and soft_deleted_at is not null)
      or status <> 'deleted'
    );
exception
  when duplicate_object then null;
end $$;

create unique index if not exists files_one_latest_per_version_group
  on public.files (version_group_id)
  where is_latest = true;

create index if not exists files_project_category_status_idx
  on public.files (project_id, category, status, is_latest, created_at desc)
  where project_id is not null;

create index if not exists files_event_idx
  on public.files (event_id, category, status, is_latest, created_at desc)
  where event_id is not null;

create index if not exists files_guest_idx
  on public.files (guest_id, category, visibility, status, is_latest)
  where guest_id is not null;

create index if not exists files_retention_idx
  on public.files (retention_status, retention_expires_at, project_id);

drop trigger if exists set_files_updated_at on public.files;
create trigger set_files_updated_at
before update on public.files
for each row
execute function app_private.set_updated_at();

alter table public.wedding_projects
  add column if not exists completed_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users (id) on delete set null,
  add column if not exists archive_reason text,
  add column if not exists file_retention_status public.file_retention_status not null default 'active',
  add column if not exists retention_started_at timestamptz,
  add column if not exists retention_expires_at timestamptz,
  add column if not exists retention_extended_until timestamptz,
  add column if not exists retention_notice_status public.retention_notice_status not null default 'not_required',
  add column if not exists retention_decision text,
  add column if not exists retention_decision_at timestamptz,
  add column if not exists retention_decision_by uuid references auth.users (id) on delete set null;

create table if not exists public.file_retention_policies (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  retention_start_at timestamptz,
  retention_end_at timestamptz,
  status public.file_retention_status not null default 'active',
  notice_status public.retention_notice_status not null default 'not_required',
  decision text,
  decision_reason text,
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  extended_until timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint file_retention_policies_project_unique unique (project_id),
  constraint file_retention_policies_end_after_start check (
    retention_start_at is null
    or retention_end_at is null
    or retention_end_at > retention_start_at
  ),
  constraint file_retention_policies_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.file_access_events (
  id uuid primary key default extensions.gen_random_uuid(),
  file_id uuid references public.files (id) on delete set null,
  project_id uuid references public.wedding_projects (id) on delete cascade,
  event_id uuid,
  guest_id uuid,
  invitation_id uuid,
  actor_user_id uuid references auth.users (id) on delete set null,
  public_token_id uuid references public.guest_public_tokens (id) on delete set null,
  access_action public.file_access_action not null,
  access_context text not null default 'internal',
  allowed boolean not null default true,
  denial_reason text,
  signed_url_expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint file_access_events_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete set null,
  constraint file_access_events_guest_project_match
    foreign key (guest_id, project_id)
    references public.guests (id, project_id)
    on delete set null,
  constraint file_access_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.project_archive_events (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  action public.project_archive_action not null,
  previous_status public.project_lifecycle_status,
  next_status public.project_lifecycle_status,
  previous_retention_status public.file_retention_status,
  next_retention_status public.file_retention_status,
  retention_start_at timestamptz,
  retention_end_at timestamptz,
  reason text not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint project_archive_events_reason_not_blank check (length(trim(reason)) > 0),
  constraint project_archive_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.file_archive_events (
  id uuid primary key default extensions.gen_random_uuid(),
  file_id uuid not null references public.files (id) on delete cascade,
  project_id uuid references public.wedding_projects (id) on delete cascade,
  action public.file_archive_action not null,
  previous_status public.file_status not null,
  next_status public.file_status not null,
  reason text not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint file_archive_events_reason_not_blank check (length(trim(reason)) > 0),
  constraint file_archive_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.file_download_tokens (
  id uuid primary key default extensions.gen_random_uuid(),
  file_id uuid not null references public.files (id) on delete cascade,
  project_id uuid references public.wedding_projects (id) on delete cascade,
  guest_id uuid,
  token_hash text not null unique,
  token_preview text not null,
  status public.file_download_token_status not null default 'active',
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint file_download_tokens_hash_sha256_hex check (token_hash ~ '^[a-f0-9]{64}$'),
  constraint file_download_tokens_preview_not_blank check (length(trim(token_preview)) >= 6),
  constraint file_download_tokens_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint file_download_tokens_expiry_future check (expires_at > created_at)
);

create index if not exists file_access_events_file_created_idx
  on public.file_access_events (file_id, created_at desc);

create index if not exists file_access_events_project_created_idx
  on public.file_access_events (project_id, created_at desc);

create index if not exists file_retention_policies_status_idx
  on public.file_retention_policies (status, retention_end_at, project_id);

create index if not exists project_archive_events_project_created_idx
  on public.project_archive_events (project_id, created_at desc);

create index if not exists file_archive_events_file_created_idx
  on public.file_archive_events (file_id, created_at desc);

create index if not exists file_download_tokens_file_status_idx
  on public.file_download_tokens (file_id, status, expires_at);

drop trigger if exists set_file_categories_updated_at on public.file_categories;
create trigger set_file_categories_updated_at
before update on public.file_categories
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_file_retention_policies_updated_at on public.file_retention_policies;
create trigger set_file_retention_policies_updated_at
before update on public.file_retention_policies
for each row
execute function app_private.set_updated_at();

create or replace function app_private.file_default_retention_end(
  p_start_at timestamptz
)
returns timestamptz
language sql
immutable
set search_path = public, pg_temp
as $$
  select p_start_at + interval '1 year';
$$;

create or replace function app_private.user_can_access_file(
  p_user_id uuid,
  p_file_id uuid,
  p_permission text default 'files.read'
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
      from public.files f
      where f.id = p_file_id
        and f.status <> 'deleted'
        and (
          (
            f.scope_type = 'platform'
            and app_private.user_has_permission(p_user_id, p_permission, 'global', null)
          )
          or (
            f.project_id is not null
            and (
              app_private.user_can_access_project(p_user_id, f.project_id, p_permission)
              or (
                p_permission in ('files.download', 'files.read')
                and app_private.user_can_access_project(p_user_id, f.project_id, 'files.read')
              )
              or (
                p_permission in ('files.download', 'files.read')
                and f.visibility = 'couple_visible'
                and not app_private.user_can_access_project(p_user_id, f.project_id, 'files.read')
                and app_private.user_can_access_project(p_user_id, f.project_id, 'files.download')
              )
              or (
                p_permission in ('files.download', 'files.read')
                and f.visibility = 'partner_visible'
                and not app_private.user_can_access_project(p_user_id, f.project_id, 'files.read')
                and app_private.user_can_access_partner_project(p_user_id, f.project_id, 'files.download')
              )
              or (
                f.event_id is not null
                and app_private.user_can_access_event(p_user_id, f.event_id, p_permission)
              )
            )
          )
        )
    );
$$;

create or replace function public.current_user_can_access_file(
  p_file_id uuid,
  p_permission text default 'files.read'
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app_private.user_can_access_file((select auth.uid()), p_file_id, p_permission);
$$;

create or replace function public.current_user_can_access_project_permissions(
  p_project_id uuid,
  p_permissions text[]
)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    jsonb_object_agg(permission, app_private.user_can_access_project((select auth.uid()), p_project_id, permission)),
    '{}'::jsonb
  )
  from unnest(coalesce(p_permissions, array[]::text[])) as requested_permission(permission);
$$;

create or replace function app_private.redact_file_audit_snapshot(
  p_snapshot jsonb
)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_snapshot is null then null
    else p_snapshot
      - 'storage_path'
      - 'checksum_sha256'
      - 'metadata'
      - 'token_hash'
  end;
$$;

create or replace function app_private.audit_file_lifecycle_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_action text;
  v_actor_user_id uuid;
  v_object_type text;
  v_object_id uuid;
  v_old jsonb;
  v_new jsonb;
begin
  if tg_table_name = 'files' then
    v_object_type := 'files';
    v_object_id := new.id;
    v_actor_user_id := coalesce(new.created_by, new.archived_by, new.soft_deleted_by, new.revoked_by, (select auth.uid()));
    v_action := case
      when tg_op = 'INSERT' and coalesce(new.version, 1) > 1 then 'files.version_created'
      when tg_op = 'INSERT' then 'files.registered'
      when tg_op = 'UPDATE' and new.status = 'archived' and old.status <> 'archived' then 'files.archived'
      when tg_op = 'UPDATE' and new.status = 'deleted' and old.status <> 'deleted' then 'files.soft_deleted'
      when tg_op = 'UPDATE' and new.is_latest = true and old.is_latest = false then 'files.latest_changed'
      when tg_op = 'UPDATE' and new.retention_extended_until is distinct from old.retention_extended_until then 'files.retention_extended'
      else 'files.updated'
    end;
    v_old := case when tg_op = 'UPDATE' then app_private.redact_file_audit_snapshot(to_jsonb(old)) else null end;
    v_new := app_private.redact_file_audit_snapshot(to_jsonb(new));
  elsif tg_table_name = 'file_access_events' then
    v_object_type := 'file_access_events';
    v_object_id := new.id;
    v_actor_user_id := coalesce(new.actor_user_id, (select auth.uid()));
    v_action := case
      when new.access_action = 'download_requested' then 'files.download_requested'
      when new.access_action = 'download_denied' then 'files.download_denied'
      when new.access_action = 'guest_signed_url_created' then 'files.guest_signed_url_created'
      else 'files.signed_url_created'
    end;
    v_old := null;
    v_new := app_private.redact_file_audit_snapshot(to_jsonb(new));
  elsif tg_table_name = 'file_retention_policies' then
    v_object_type := 'file_retention_policies';
    v_object_id := new.id;
    v_actor_user_id := coalesce(new.updated_by, new.created_by, new.decided_by, (select auth.uid()));
    v_action := case
      when tg_op = 'INSERT' then 'file_retention_policies.created'
      else 'file_retention_policies.updated'
    end;
    v_old := case when tg_op = 'UPDATE' then app_private.redact_file_audit_snapshot(to_jsonb(old)) else null end;
    v_new := app_private.redact_file_audit_snapshot(to_jsonb(new));
  elsif tg_table_name = 'project_archive_events' then
    v_object_type := 'project_archive_events';
    v_object_id := new.id;
    v_actor_user_id := coalesce(new.actor_user_id, (select auth.uid()));
    v_action := case
      when new.action = 'mark_completed' then 'projects.completed'
      when new.action = 'archive' then 'projects.archived'
      when new.action = 'extend_retention' then 'projects.retention_extended'
      when new.action = 'mark_pending_deletion' then 'projects.marked_pending_deletion'
      when new.action = 'cancel_pending_deletion' then 'projects.cancelled_pending_deletion'
      else 'projects.retention_updated'
    end;
    v_old := null;
    v_new := app_private.redact_file_audit_snapshot(to_jsonb(new));
  elsif tg_table_name = 'file_archive_events' then
    v_object_type := 'file_archive_events';
    v_object_id := new.id;
    v_actor_user_id := coalesce(new.actor_user_id, (select auth.uid()));
    v_action := case
      when new.action = 'soft_delete' then 'files.soft_deleted'
      when new.action = 'restore' then 'files.restored'
      else 'files.archived'
    end;
    v_old := null;
    v_new := app_private.redact_file_audit_snapshot(to_jsonb(new));
  else
    return new;
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
    v_actor_user_id,
    v_action,
    v_object_type,
    v_object_id,
    v_old,
    v_new,
    'storage'
  );

  return new;
end;
$$;

drop trigger if exists audit_files_insert on public.files;
create trigger audit_files_insert
after insert on public.files
for each row
execute function app_private.audit_file_lifecycle_change();

drop trigger if exists audit_files_update on public.files;
create trigger audit_files_update
after update on public.files
for each row
execute function app_private.audit_file_lifecycle_change();

drop trigger if exists audit_file_access_events_insert on public.file_access_events;
create trigger audit_file_access_events_insert
after insert on public.file_access_events
for each row
execute function app_private.audit_file_lifecycle_change();

drop trigger if exists audit_file_retention_policies_insert on public.file_retention_policies;
create trigger audit_file_retention_policies_insert
after insert on public.file_retention_policies
for each row
execute function app_private.audit_file_lifecycle_change();

drop trigger if exists audit_file_retention_policies_update on public.file_retention_policies;
create trigger audit_file_retention_policies_update
after update on public.file_retention_policies
for each row
execute function app_private.audit_file_lifecycle_change();

drop trigger if exists audit_project_archive_events_insert on public.project_archive_events;
create trigger audit_project_archive_events_insert
after insert on public.project_archive_events
for each row
execute function app_private.audit_file_lifecycle_change();

drop trigger if exists audit_file_archive_events_insert on public.file_archive_events;
create trigger audit_file_archive_events_insert
after insert on public.file_archive_events
for each row
execute function app_private.audit_file_lifecycle_change();

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

  if not exists (
    select 1
    from public.file_categories fc
    where fc.slug = p_category
      and (
        coalesce(array_length(fc.allowed_mime_types, 1), 0) = 0
        or lower(p_mime_type) = any(fc.allowed_mime_types)
      )
  ) then
    raise exception 'MIME type is not allowed for this category.' using errcode = '23514';
  end if;

  if p_visibility = 'guest_visible' and p_guest_id is null then
    raise exception 'Guest-visible files require a guest.' using errcode = '23514';
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
      when p_guest_id is not null then 'guest'
      when p_event_id is not null then 'event'
      else 'project'
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

create or replace function public.create_file_version(
  p_previous_file_id uuid,
  p_filename text,
  p_mime_type text,
  p_file_size_bytes bigint,
  p_storage_path text default null,
  p_reason text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.files
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_previous public.files;
  v_file public.files;
  v_version integer;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;

  select *
  into v_previous
  from public.files
  where id = p_previous_file_id
  for update;

  if not found then
    raise exception 'Previous file was not found.' using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_file(v_actor_user_id, v_previous.id, 'files.version.manage') then
    raise exception 'File version permission denied.' using errcode = '42501';
  end if;

  if p_file_size_bytes < 0 or p_file_size_bytes > 52428800 then
    raise exception 'Project files must be between 0 bytes and 50 MB.' using errcode = '23514';
  end if;

  if length(trim(coalesce(p_mime_type, ''))) = 0 then
    raise exception 'File MIME type is required.' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.file_categories fc
    where fc.slug = v_previous.category
      and (
        coalesce(array_length(fc.allowed_mime_types, 1), 0) = 0
        or lower(p_mime_type) = any(fc.allowed_mime_types)
      )
  ) then
    raise exception 'MIME type is not allowed for this category.' using errcode = '23514';
  end if;

  if v_previous.status = 'deleted' then
    raise exception 'Deleted files cannot be versioned.' using errcode = '23514';
  end if;

  select coalesce(max(version), 0) + 1
  into v_version
  from public.files
  where version_group_id = v_previous.version_group_id;

  update public.files
  set
    is_latest = false,
    is_active = false,
    status = case
      when status in ('active', 'generated') then 'superseded'::public.file_status
      else status
    end
  where version_group_id = v_previous.version_group_id;

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
    v_previous.scope_type,
    v_previous.scope_id,
    v_previous.project_id,
    v_previous.event_id,
    v_previous.guest_id,
    v_previous.invitation_id,
    v_previous.bucket,
    coalesce(
      nullif(trim(p_storage_path), ''),
      case
        when v_previous.storage_path ~ '\.v[0-9]+$' then
          regexp_replace(v_previous.storage_path, '\.v[0-9]+$', '.v' || v_version::text)
        when v_previous.storage_path ~ '\.[a-z0-9]+$' then
          regexp_replace(v_previous.storage_path, '(\.[a-z0-9]+)$', '.v' || v_version::text || '\1')
        else
          v_previous.storage_path || '.v' || v_version::text
      end
    ),
    v_previous.category,
    p_filename,
    lower(p_mime_type),
    p_file_size_bytes,
    v_previous.visibility,
    'active',
    v_version,
    true,
    true,
    v_previous.version_group_id,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'versionReason', nullif(trim(coalesce(p_reason, '')), ''),
      'storageUploadPending', true,
      'registeredBySprint', 14
    ),
    v_actor_user_id
  )
  returning * into v_file;

  return v_file;
end;
$$;

create or replace function public.archive_project_file(
  p_file_id uuid,
  p_action public.file_archive_action,
  p_reason text
)
returns public.files
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_file public.files;
  v_previous_status public.file_status;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;

  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Archive or soft-delete reason is required.' using errcode = '23514';
  end if;

  select *
  into v_file
  from public.files
  where id = p_file_id
  for update;

  if not found then
    raise exception 'File was not found.' using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_file(v_actor_user_id, v_file.id, 'files.archive') then
    raise exception 'File archive permission denied.' using errcode = '42501';
  end if;

  if p_action = 'soft_delete' and not exists (
    select 1
    from public.role_assignments ra
    join public.roles r on r.id = ra.role_id
    where ra.user_id = v_actor_user_id
      and r.slug = 'diginoces_admin'
      and ra.scope = 'global'
      and ra.scope_id is null
      and (ra.expires_at is null or ra.expires_at > now())
  ) then
    raise exception 'Diginoces admin role is required for file soft deletion.' using errcode = '42501';
  end if;

  if p_action = 'soft_delete' and v_file.is_latest = true then
    raise exception 'Latest files must be archived or superseded before soft deletion.' using errcode = '23514';
  end if;

  v_previous_status := v_file.status;

  update public.files
  set
    status = case
      when p_action = 'soft_delete' then 'deleted'::public.file_status
      when p_action = 'restore' then 'active'::public.file_status
      else 'archived'::public.file_status
    end,
    is_active = case when p_action = 'restore' then true else false end,
    archived_at = case when p_action = 'archive' then now() else archived_at end,
    archived_by = case when p_action = 'archive' then v_actor_user_id else archived_by end,
    archive_reason = case when p_action = 'archive' then trim(p_reason) else archive_reason end,
    soft_deleted_at = case when p_action = 'soft_delete' then now() else soft_deleted_at end,
    soft_deleted_by = case when p_action = 'soft_delete' then v_actor_user_id else soft_deleted_by end,
    soft_delete_reason = case when p_action = 'soft_delete' then trim(p_reason) else soft_delete_reason end
  where id = v_file.id
  returning * into v_file;

  insert into public.file_archive_events (
    file_id,
    project_id,
    action,
    previous_status,
    next_status,
    reason,
    actor_user_id
  )
  values (
    v_file.id,
    v_file.project_id,
    p_action,
    v_previous_status,
    v_file.status,
    trim(p_reason),
    v_actor_user_id
  );

  return v_file;
end;
$$;

create or replace function public.update_project_archive_lifecycle(
  p_project_id uuid,
  p_action public.project_archive_action,
  p_reason text,
  p_extended_until timestamptz default null
)
returns public.wedding_projects
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_project public.wedding_projects;
  v_previous_status public.project_lifecycle_status;
  v_previous_retention_status public.file_retention_status;
  v_retention_start timestamptz;
  v_retention_end timestamptz;
  v_next_status public.project_lifecycle_status;
  v_next_retention_status public.file_retention_status;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;

  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Project archive action reason is required.' using errcode = '23514';
  end if;

  if not (
    app_private.user_can_access_project(v_actor_user_id, p_project_id, 'files.retention.manage')
    or app_private.user_can_access_project(v_actor_user_id, p_project_id, 'projects.manage_status')
  ) then
    raise exception 'Project archive permission denied.' using errcode = '42501';
  end if;

  select *
  into v_project
  from public.wedding_projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'Project was not found.' using errcode = 'P0002';
  end if;

  v_previous_status := v_project.status;
  v_previous_retention_status := v_project.file_retention_status;
  v_retention_start := coalesce(v_project.retention_started_at, v_project.completed_at, now());
  v_retention_end := coalesce(p_extended_until, v_project.retention_extended_until, app_private.file_default_retention_end(v_retention_start));

  if p_action = 'mark_completed' then
    v_next_status := 'completed';
    v_next_retention_status := 'retention_active';
  elsif p_action = 'archive' then
    v_next_status := 'archived';
    v_next_retention_status := 'archived';
  elsif p_action = 'extend_retention' then
    v_next_status := v_project.status;
    v_next_retention_status := 'retention_extended';
  elsif p_action = 'mark_pending_deletion' then
    v_next_status := v_project.status;
    v_next_retention_status := 'pending_deletion';
  else
    v_next_status := v_project.status;
    v_next_retention_status := 'retention_active';
  end if;

  update public.wedding_projects
  set
    status = v_next_status,
    completed_at = case when p_action = 'mark_completed' then coalesce(completed_at, now()) else completed_at end,
    archived_at = case when p_action = 'archive' then coalesce(archived_at, now()) else archived_at end,
    archived_by = case when p_action = 'archive' then v_actor_user_id else archived_by end,
    archive_reason = case when p_action = 'archive' then trim(p_reason) else archive_reason end,
    file_retention_status = v_next_retention_status,
    retention_started_at = v_retention_start,
    retention_expires_at = v_retention_end,
    retention_extended_until = case when p_action = 'extend_retention' then p_extended_until else retention_extended_until end,
    retention_notice_status = case
      when v_next_retention_status in ('retention_due', 'pending_deletion') then 'admin_review_required'::public.retention_notice_status
      else retention_notice_status
    end,
    retention_decision = p_action::text,
    retention_decision_at = now(),
    retention_decision_by = v_actor_user_id
  where id = p_project_id
  returning * into v_project;

  insert into public.file_retention_policies (
    project_id,
    retention_start_at,
    retention_end_at,
    status,
    notice_status,
    decision,
    decision_reason,
    decided_by,
    decided_at,
    extended_until,
    created_by,
    updated_by
  )
  values (
    p_project_id,
    v_retention_start,
    v_retention_end,
    v_next_retention_status,
    v_project.retention_notice_status,
    p_action::text,
    trim(p_reason),
    v_actor_user_id,
    now(),
    case when p_action = 'extend_retention' then p_extended_until else null end,
    v_actor_user_id,
    v_actor_user_id
  )
  on conflict (project_id) do update
  set
    retention_start_at = excluded.retention_start_at,
    retention_end_at = excluded.retention_end_at,
    status = excluded.status,
    notice_status = excluded.notice_status,
    decision = excluded.decision,
    decision_reason = excluded.decision_reason,
    decided_by = excluded.decided_by,
    decided_at = excluded.decided_at,
    extended_until = excluded.extended_until,
    updated_by = excluded.updated_by,
    updated_at = now();

  insert into public.project_archive_events (
    project_id,
    action,
    previous_status,
    next_status,
    previous_retention_status,
    next_retention_status,
    retention_start_at,
    retention_end_at,
    reason,
    actor_user_id
  )
  values (
    p_project_id,
    p_action,
    v_previous_status,
    v_next_status,
    v_previous_retention_status,
    v_next_retention_status,
    v_retention_start,
    v_retention_end,
    trim(p_reason),
    v_actor_user_id
  );

  return v_project;
end;
$$;

create or replace function public.record_file_access_event(
  p_file_id uuid,
  p_access_action public.file_access_action,
  p_allowed boolean default true,
  p_denial_reason text default null,
  p_signed_url_expires_at timestamptz default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.file_access_events
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_file public.files;
  v_event public.file_access_events;
begin
  select *
  into v_file
  from public.files
  where id = p_file_id;

  if not found then
    raise exception 'File was not found.' using errcode = 'P0002';
  end if;

  if v_actor_user_id is not null
    and not app_private.user_can_access_file(v_actor_user_id, p_file_id, 'files.download') then
    raise exception 'File download permission denied.' using errcode = '42501';
  end if;

  insert into public.file_access_events (
    file_id,
    project_id,
    event_id,
    guest_id,
    invitation_id,
    actor_user_id,
    access_action,
    access_context,
    allowed,
    denial_reason,
    signed_url_expires_at,
    metadata
  )
  values (
    v_file.id,
    v_file.project_id,
    v_file.event_id,
    v_file.guest_id,
    v_file.invitation_id,
    v_actor_user_id,
    p_access_action,
    coalesce(nullif(p_metadata->>'accessContext', ''), 'internal'),
    p_allowed,
    p_denial_reason,
    p_signed_url_expires_at,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_event;

  return v_event;
end;
$$;

create or replace function public.resolve_guest_file_download(
  p_token text,
  p_file_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_token public.guest_public_tokens;
  v_project public.wedding_projects;
  v_file public.files;
begin
  select *
  into v_token
  from public.guest_public_tokens
  where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
    and token_type = 'guest_public_page'
    and status = 'active'
    and (expires_at is null or expires_at > now());

  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  select *
  into v_project
  from public.wedding_projects
  where id = v_token.project_id;

  if not found or v_project.guest_page_access_status = 'locked' then
    return jsonb_build_object('status', 'payment_gate_locked');
  end if;

  select *
  into v_file
  from public.files
  where id = p_file_id
    and project_id = v_token.project_id
    and guest_id = v_token.guest_id
    and visibility = 'guest_visible'
    and is_active = true
    and is_latest = true
    and status = 'active'
    and revoked_at is null;

  if not found then
    insert into public.file_access_events (
      file_id,
      project_id,
      guest_id,
      public_token_id,
      access_action,
      access_context,
      allowed,
      denial_reason
    )
    values (
      p_file_id,
      v_token.project_id,
      v_token.guest_id,
      v_token.id,
      'download_denied',
      'public_guest_page',
      false,
      'guest_file_not_available'
    );

    return jsonb_build_object('status', 'not_found');
  end if;

  insert into public.file_access_events (
    file_id,
    project_id,
    event_id,
    guest_id,
    invitation_id,
    public_token_id,
    access_action,
    access_context,
    allowed,
    signed_url_expires_at
  )
  values (
    v_file.id,
    v_file.project_id,
    v_file.event_id,
    v_file.guest_id,
    v_file.invitation_id,
    v_token.id,
    'guest_signed_url_created',
    'public_guest_page',
    true,
    now() + interval '5 minutes'
  );

  return jsonb_build_object(
    'status', 'ok',
    'fileId', v_file.id,
    'bucket', v_file.bucket,
    'storagePath', v_file.storage_path,
    'filename', v_file.filename,
    'mimeType', v_file.mime_type,
    'expiresInSeconds', 300
  );
end;
$$;

create or replace function public.list_guest_file_downloads(
  p_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_token public.guest_public_tokens;
  v_project public.wedding_projects;
  v_files jsonb;
begin
  select *
  into v_token
  from public.guest_public_tokens
  where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
    and token_type = 'guest_public_page'
    and status = 'active'
    and (expires_at is null or expires_at > now());

  if not found then
    return jsonb_build_object('status', 'invalid', 'files', '[]'::jsonb);
  end if;

  select *
  into v_project
  from public.wedding_projects
  where id = v_token.project_id;

  if not found or v_project.guest_page_access_status = 'locked' then
    return jsonb_build_object('status', 'payment_gate_locked', 'files', '[]'::jsonb);
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'fileId', f.id,
        'filename', f.filename,
        'category', f.category,
        'mimeType', f.mime_type,
        'version', f.version
      )
      order by f.created_at desc
    ),
    '[]'::jsonb
  )
  into v_files
  from public.files f
  where f.project_id = v_token.project_id
    and f.guest_id = v_token.guest_id
    and f.visibility = 'guest_visible'
    and f.is_active = true
    and f.is_latest = true
    and f.status = 'active'
    and f.revoked_at is null;

  return jsonb_build_object('status', 'ok', 'files', v_files);
end;
$$;

revoke all on function app_private.file_default_retention_end(timestamptz) from public;
revoke all on function app_private.user_can_access_file(uuid, uuid, text) from public;
revoke all on function app_private.redact_file_audit_snapshot(jsonb) from public;
revoke all on function app_private.audit_file_lifecycle_change() from public;
revoke all on function public.current_user_can_access_file(uuid, text) from public;
revoke all on function public.current_user_can_access_project_permissions(uuid, text[]) from public;
revoke all on function public.register_project_file(uuid, public.file_category, text, text, bigint, public.file_visibility, uuid, uuid, uuid, text, text, jsonb) from public;
revoke all on function public.create_file_version(uuid, text, text, bigint, text, text, jsonb) from public;
revoke all on function public.archive_project_file(uuid, public.file_archive_action, text) from public;
revoke all on function public.update_project_archive_lifecycle(uuid, public.project_archive_action, text, timestamptz) from public;
revoke all on function public.record_file_access_event(uuid, public.file_access_action, boolean, text, timestamptz, jsonb) from public;
revoke all on function public.resolve_guest_file_download(text, uuid) from public;
revoke all on function public.list_guest_file_downloads(text) from public;

grant execute on function public.current_user_can_access_file(uuid, text) to authenticated;
grant execute on function public.current_user_can_access_project_permissions(uuid, text[]) to authenticated;
grant execute on function public.register_project_file(uuid, public.file_category, text, text, bigint, public.file_visibility, uuid, uuid, uuid, text, text, jsonb) to authenticated;
grant execute on function public.create_file_version(uuid, text, text, bigint, text, text, jsonb) to authenticated;
grant execute on function public.archive_project_file(uuid, public.file_archive_action, text) to authenticated;
grant execute on function public.update_project_archive_lifecycle(uuid, public.project_archive_action, text, timestamptz) to authenticated;
grant execute on function public.record_file_access_event(uuid, public.file_access_action, boolean, text, timestamptz, jsonb) to anon, authenticated;
grant execute on function public.resolve_guest_file_download(text, uuid) to anon, authenticated;
grant execute on function public.list_guest_file_downloads(text) to anon, authenticated;

alter table public.file_categories enable row level security;
alter table public.files enable row level security;
alter table public.file_access_events enable row level security;
alter table public.file_retention_policies enable row level security;
alter table public.project_archive_events enable row level security;
alter table public.file_archive_events enable row level security;
alter table public.file_download_tokens enable row level security;

drop policy if exists "File categories visible to authenticated users" on public.file_categories;
create policy "File categories visible to authenticated users"
on public.file_categories
for select
to authenticated
using (true);

drop policy if exists "Files readable by scoped file permissions" on public.files;
create policy "Files readable by scoped file permissions"
on public.files
for select
to authenticated
using (app_private.user_can_access_file((select auth.uid()), id, 'files.read'));

drop policy if exists "Files registered by scoped file writers" on public.files;
create policy "Files registered by scoped file writers"
on public.files
for insert
to authenticated
with check (
  project_id is not null
  and app_private.user_can_access_project((select auth.uid()), project_id, 'files.write')
);

drop policy if exists "Files updated by scoped file managers" on public.files;
create policy "Files updated by scoped file managers"
on public.files
for update
to authenticated
using (
  app_private.user_can_access_file((select auth.uid()), id, 'files.write')
  or app_private.user_can_access_file((select auth.uid()), id, 'files.archive')
  or app_private.user_can_access_file((select auth.uid()), id, 'files.version.manage')
  or app_private.user_can_access_file((select auth.uid()), id, 'files.retention.manage')
)
with check (
  app_private.user_can_access_file((select auth.uid()), id, 'files.write')
  or app_private.user_can_access_file((select auth.uid()), id, 'files.archive')
  or app_private.user_can_access_file((select auth.uid()), id, 'files.version.manage')
  or app_private.user_can_access_file((select auth.uid()), id, 'files.retention.manage')
);

drop policy if exists "File access events readable by file readers" on public.file_access_events;
create policy "File access events readable by file readers"
on public.file_access_events
for select
to authenticated
using (
  file_id is not null
  and app_private.user_can_access_file((select auth.uid()), file_id, 'files.read')
);

drop policy if exists "File access events inserted by file readers" on public.file_access_events;
create policy "File access events inserted by file readers"
on public.file_access_events
for insert
to authenticated
with check (
  file_id is not null
  and app_private.user_can_access_file((select auth.uid()), file_id, 'files.download')
);

drop policy if exists "Retention policies visible to retention managers" on public.file_retention_policies;
create policy "Retention policies visible to retention managers"
on public.file_retention_policies
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'files.retention.manage')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'files.read')
);

drop policy if exists "Retention policies managed by retention managers" on public.file_retention_policies;
create policy "Retention policies managed by retention managers"
on public.file_retention_policies
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'files.retention.manage'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'files.retention.manage'));

drop policy if exists "Project archive events visible to retention managers" on public.project_archive_events;
create policy "Project archive events visible to retention managers"
on public.project_archive_events
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'files.retention.manage')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'files.read')
);

drop policy if exists "File archive events visible to file readers" on public.file_archive_events;
create policy "File archive events visible to file readers"
on public.file_archive_events
for select
to authenticated
using (
  file_id is not null
  and app_private.user_can_access_file((select auth.uid()), file_id, 'files.read')
);

drop policy if exists "File download tokens visible to file readers" on public.file_download_tokens;
create policy "File download tokens visible to file readers"
on public.file_download_tokens
for select
to authenticated
using (
  file_id is not null
  and app_private.user_can_access_file((select auth.uid()), file_id, 'files.read')
);

drop policy if exists "File download tokens managed by file downloaders" on public.file_download_tokens;
create policy "File download tokens managed by file downloaders"
on public.file_download_tokens
for all
to authenticated
using (
  file_id is not null
  and app_private.user_can_access_file((select auth.uid()), file_id, 'files.download')
)
with check (
  file_id is not null
  and app_private.user_can_access_file((select auth.uid()), file_id, 'files.download')
);

insert into storage.buckets (id, name, public)
values
  ('project-files', 'project-files', false),
  ('invitation-files', 'invitation-files', false),
  ('archive-files', 'archive-files', false)
on conflict (id) do update
set public = false;

drop policy if exists "Project file objects read by file permissions" on storage.objects;
create policy "Project file objects read by file permissions"
on storage.objects
for select
to authenticated
using (
  exists (
    select 1
    from public.files f
    where f.bucket = bucket_id
      and f.storage_path = name
      and app_private.user_can_access_file((select auth.uid()), f.id, 'files.download')
  )
);

drop policy if exists "Project file objects inserted by file writers" on storage.objects;
create policy "Project file objects inserted by file writers"
on storage.objects
for insert
to authenticated
with check (
  exists (
    select 1
    from public.files f
    where f.bucket = bucket_id
      and f.storage_path = name
      and app_private.user_can_access_file((select auth.uid()), f.id, 'files.write')
  )
);

drop policy if exists "Project file objects updated by file writers" on storage.objects;
create policy "Project file objects updated by file writers"
on storage.objects
for update
to authenticated
using (
  exists (
    select 1
    from public.files f
    where f.bucket = bucket_id
      and f.storage_path = name
      and app_private.user_can_access_file((select auth.uid()), f.id, 'files.write')
  )
)
with check (
  exists (
    select 1
    from public.files f
    where f.bucket = bucket_id
      and f.storage_path = name
      and app_private.user_can_access_file((select auth.uid()), f.id, 'files.write')
  )
);

grant select on public.file_categories to authenticated;
grant select, insert, update on public.files to authenticated;
grant select, insert on public.file_access_events to authenticated;
grant select, insert, update on public.file_retention_policies to authenticated;
grant select, insert on public.project_archive_events to authenticated;
grant select, insert on public.file_archive_events to authenticated;
grant select, insert, update on public.file_download_tokens to authenticated;

grant select, insert, update on public.file_categories to service_role;
grant select, insert, update on public.files to service_role;
grant select, insert on public.file_access_events to service_role;
grant select, insert, update on public.file_retention_policies to service_role;
grant select, insert on public.project_archive_events to service_role;
grant select, insert on public.file_archive_events to service_role;
grant select, insert, update on public.file_download_tokens to service_role;

insert into public.permissions (slug, description, requirement_ids)
values
  ('files.download', 'Create authorized short-lived file download links.', array['FILE-006', 'ROLE-009', 'TECH-004']),
  ('files.archive', 'Archive or soft-delete project files through controlled backend workflows.', array['FILE-007', 'FILE-009', 'REP-006']),
  ('files.version.manage', 'Create file versions and manage active/latest file markers.', array['FILE-005', 'FILE-008']),
  ('files.retention.manage', 'Manage project file retention and archive lifecycle decisions.', array['FILE-007', 'ROLE-002'])
on conflict (slug) do update
set
  description = excluded.description,
  requirement_ids = excluded.requirement_ids;

with grants(role_slug, permission_slug) as (
  values
    ('diginoces_admin', 'files.download'),
    ('diginoces_admin', 'files.archive'),
    ('diginoces_admin', 'files.version.manage'),
    ('diginoces_admin', 'files.retention.manage'),
    ('operations_manager', 'files.write'),
    ('operations_manager', 'files.download'),
    ('operations_manager', 'files.archive'),
    ('operations_manager', 'files.version.manage'),
    ('operations_manager', 'files.retention.manage'),
    ('file_manager', 'files.download'),
    ('file_manager', 'files.archive'),
    ('file_manager', 'files.version.manage'),
    ('file_manager', 'files.retention.manage'),
    ('couple', 'files.download'),
    ('bride', 'files.download'),
    ('groom', 'files.download'),
    ('partner_project_operator', 'files.download')
)
insert into public.role_permissions (role_id, permission_slug)
select r.id, g.permission_slug
from grants g
join public.roles r on r.slug = g.role_slug
join public.permissions p on p.slug = g.permission_slug
on conflict (role_id, permission_slug) do nothing;
