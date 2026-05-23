-- Sprint 6 - Invitation Template & PDF Generation Foundation
-- Requirements: INV-001 through INV-015, FILE-001, FILE-004, FILE-005,
-- FILE-006, FILE-009, ROLE-001, ROLE-007, REP-006, RSVP-001, TECH-006,
-- TECH-010.
--
-- Scope guard: this migration creates only invitation template, dynamic field,
-- preview approval, invitation record/file version, and batch generation job
-- foundations. It intentionally does not implement WhatsApp sending, seating,
-- check-in scan workflows, contracts, pricing, payments, partner project
-- creation, or full Canva API integration.

do $$
begin
  create type public.invitation_template_status as enum (
    'draft',
    'uploaded',
    'configured',
    'preview_generated',
    'technical_preview_approved',
    'active',
    'failed',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

alter type public.file_scope_type add value if not exists 'invitation';

do $$
begin
  create type public.invitation_template_file_type as enum ('canva_pdf');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.invitation_template_field_target as enum (
    'guest.title',
    'guest.display_name',
    'guest.full_invitation_name',
    'event.name',
    'event.date',
    'event.venue',
    'couple.names',
    'table.name',
    'table.code',
    'public_guest_page_qr',
    'public_guest_page_url',
    'invitation.id'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.invitation_status as enum (
    'not_generated',
    'preview_generated',
    'generated',
    'needs_regeneration',
    'failed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.invitation_generation_job_status as enum (
    'queued',
    'running',
    'completed',
    'failed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.invitation_generation_mode as enum (
    'technical_preview',
    'event',
    'selected_guests',
    'regenerate_selected'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.invitation_templates (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null,
  name text not null,
  file_type public.invitation_template_file_type not null default 'canva_pdf',
  source_filename text not null,
  mime_type text not null default 'application/pdf',
  file_size_bytes integer not null,
  storage_bucket text not null default 'invitation-templates',
  storage_path text not null,
  status public.invitation_template_status not null default 'uploaded',
  template_version integer not null default 1,
  technical_preview_metadata jsonb not null default '{}'::jsonb,
  technical_preview_generated_at timestamptz,
  technical_preview_approved_at timestamptz,
  technical_preview_approved_by uuid references auth.users (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitation_templates_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint invitation_templates_name_not_blank check (length(trim(name)) > 0),
  constraint invitation_templates_source_filename_pdf check (lower(source_filename) like '%.pdf'),
  constraint invitation_templates_pdf_mime check (mime_type = 'application/pdf'),
  constraint invitation_templates_file_size_positive check (file_size_bytes > 0),
  constraint invitation_templates_file_size_limit check (file_size_bytes <= 20971520),
  constraint invitation_templates_storage_path_not_blank check (length(trim(storage_path)) > 0),
  constraint invitation_templates_template_version_positive check (template_version > 0),
  constraint invitation_templates_approval_timestamp check (
    (technical_preview_approved_at is null and technical_preview_approved_by is null)
    or (technical_preview_approved_at is not null and technical_preview_approved_by is not null)
  )
);

create unique index if not exists invitation_templates_id_project_id_key
  on public.invitation_templates (id, project_id);

create index if not exists invitation_templates_project_event_status_idx
  on public.invitation_templates (project_id, event_id, status, created_at desc);

create table if not exists public.invitation_template_fields (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null,
  template_id uuid not null,
  field_key public.invitation_template_field_target not null,
  label text not null,
  page_number integer not null default 1,
  position jsonb not null,
  font_family text,
  font_size numeric(6,2),
  alignment text,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitation_template_fields_template_project_match
    foreign key (template_id, project_id)
    references public.invitation_templates (id, project_id)
    on delete cascade,
  constraint invitation_template_fields_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint invitation_template_fields_label_not_blank check (length(trim(label)) > 0),
  constraint invitation_template_fields_page_positive check (page_number > 0),
  constraint invitation_template_fields_position_object check (jsonb_typeof(position) = 'object'),
  constraint invitation_template_fields_alignment_supported check (
    alignment is null or alignment in ('left', 'center', 'right')
  ),
  constraint invitation_template_fields_font_size_positive check (
    font_size is null or font_size > 0
  ),
  constraint invitation_template_fields_template_field_key_unique
    unique (template_id, field_key)
);

create index if not exists invitation_template_fields_template_sort_idx
  on public.invitation_template_fields (template_id, page_number, sort_order, created_at);

create table if not exists public.invitation_generation_jobs (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null,
  template_id uuid not null,
  mode public.invitation_generation_mode not null,
  status public.invitation_generation_job_status not null default 'queued',
  total_guests integer not null default 0,
  ready_count integer not null default 0,
  blocked_count integer not null default 0,
  generated_count integer not null default 0,
  failed_count integer not null default 0,
  validation_summary jsonb not null default '{}'::jsonb,
  error_message text,
  created_by uuid references auth.users (id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitation_generation_jobs_template_project_match
    foreign key (template_id, project_id)
    references public.invitation_templates (id, project_id)
    on delete cascade,
  constraint invitation_generation_jobs_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint invitation_generation_jobs_counts_non_negative check (
    total_guests >= 0
    and ready_count >= 0
    and blocked_count >= 0
    and generated_count >= 0
    and failed_count >= 0
  )
);

create index if not exists invitation_generation_jobs_project_event_idx
  on public.invitation_generation_jobs (project_id, event_id, created_at desc);

create table if not exists public.invitations (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null,
  guest_id uuid not null,
  template_id uuid not null,
  public_guest_token_id uuid references public.guest_public_tokens (id) on delete set null,
  status public.invitation_status not null default 'not_generated',
  dynamic_field_snapshot jsonb not null default '{}'::jsonb,
  last_generated_at timestamptz,
  needs_regeneration_reason text,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitations_guest_project_match
    foreign key (guest_id, project_id)
    references public.guests (id, project_id)
    on delete cascade,
  constraint invitations_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint invitations_template_project_match
    foreign key (template_id, project_id)
    references public.invitation_templates (id, project_id)
    on delete restrict
);

create unique index if not exists invitations_guest_event_key
  on public.invitations (guest_id, event_id);

create unique index if not exists invitations_id_project_id_key
  on public.invitations (id, project_id);

create index if not exists invitations_project_event_status_idx
  on public.invitations (project_id, event_id, status, updated_at desc);

create table if not exists public.invitation_generation_job_items (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null,
  generation_job_id uuid not null references public.invitation_generation_jobs (id) on delete cascade,
  guest_id uuid not null,
  invitation_id uuid references public.invitations (id) on delete set null,
  status public.invitation_generation_job_status not null default 'queued',
  validation_issues jsonb not null default '[]'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitation_generation_job_items_guest_project_match
    foreign key (guest_id, project_id)
    references public.guests (id, project_id)
    on delete cascade,
  constraint invitation_generation_job_items_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade
);

create unique index if not exists invitation_generation_job_items_job_guest_key
  on public.invitation_generation_job_items (generation_job_id, guest_id);

create table if not exists public.invitation_files (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null,
  guest_id uuid not null,
  invitation_id uuid not null,
  template_id uuid not null,
  generation_job_id uuid references public.invitation_generation_jobs (id) on delete set null,
  version integer not null,
  storage_bucket text not null default 'invitations',
  storage_path text not null,
  mime_type text not null default 'application/pdf',
  file_size_bytes integer not null,
  checksum_sha256 text,
  is_active boolean not null default true,
  generated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint invitation_files_invitation_project_match
    foreign key (invitation_id, project_id)
    references public.invitations (id, project_id)
    on delete cascade,
  constraint invitation_files_guest_project_match
    foreign key (guest_id, project_id)
    references public.guests (id, project_id)
    on delete cascade,
  constraint invitation_files_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint invitation_files_template_project_match
    foreign key (template_id, project_id)
    references public.invitation_templates (id, project_id)
    on delete restrict,
  constraint invitation_files_version_positive check (version > 0),
  constraint invitation_files_storage_path_not_blank check (length(trim(storage_path)) > 0),
  constraint invitation_files_pdf_mime check (mime_type = 'application/pdf'),
  constraint invitation_files_file_size_positive check (file_size_bytes > 0),
  constraint invitation_files_checksum_sha256_hex check (
    checksum_sha256 is null or checksum_sha256 ~ '^[a-f0-9]{64}$'
  )
);

create unique index if not exists invitation_files_invitation_version_key
  on public.invitation_files (invitation_id, version);

create unique index if not exists invitation_files_one_active_per_invitation
  on public.invitation_files (invitation_id)
  where is_active = true;

create index if not exists invitation_files_project_event_idx
  on public.invitation_files (project_id, event_id, generated_at desc);

comment on column public.invitation_template_fields.field_key is
  'Sprint 6 supports public_guest_page_qr and public_guest_page_url dynamic fields. Future check-in token fields must use the existing guest_public_tokens token_type=check_in and remain separate from guest_public_page tokens.';

drop trigger if exists set_invitation_templates_updated_at on public.invitation_templates;
create trigger set_invitation_templates_updated_at
before update on public.invitation_templates
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_invitation_template_fields_updated_at on public.invitation_template_fields;
create trigger set_invitation_template_fields_updated_at
before update on public.invitation_template_fields
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_invitation_generation_jobs_updated_at on public.invitation_generation_jobs;
create trigger set_invitation_generation_jobs_updated_at
before update on public.invitation_generation_jobs
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_invitations_updated_at on public.invitations;
create trigger set_invitations_updated_at
before update on public.invitations
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_invitation_generation_job_items_updated_at on public.invitation_generation_job_items;
create trigger set_invitation_generation_job_items_updated_at
before update on public.invitation_generation_job_items
for each row
execute function app_private.set_updated_at();

create or replace function app_private.redact_invitation_audit_snapshot(
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
      - 'source_filename'
      - 'storage_path'
      - 'checksum_sha256'
      - 'error_message'
  end;
$$;

revoke all on function app_private.redact_invitation_audit_snapshot(jsonb) from public;

create or replace function app_private.audit_invitation_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  action_name text;
  changed_object_type text;
  changed_object_id uuid;
  sanitized_new jsonb;
  sanitized_old jsonb;
begin
  changed_object_type := case tg_table_name
    when 'invitation_templates' then 'invitation_template'
    when 'invitation_template_fields' then 'invitation_template_field'
    when 'invitation_generation_jobs' then 'invitation_generation_job'
    when 'invitation_generation_job_items' then 'invitation_generation_job_item'
    when 'invitations' then 'invitation'
    when 'invitation_files' then 'invitation_file'
    else tg_table_name
  end;

  changed_object_id := case tg_op
    when 'DELETE' then old.id
    else new.id
  end;

  action_name := case
    when tg_table_name = 'invitation_templates' and tg_op = 'INSERT' then 'invitation_templates.created'
    when tg_table_name = 'invitation_templates' and tg_op = 'UPDATE' and old.status <> 'preview_generated' and new.status = 'preview_generated' then 'invitation_templates.preview_generated'
    when tg_table_name = 'invitation_templates' and tg_op = 'UPDATE' and old.status <> 'technical_preview_approved' and new.status = 'technical_preview_approved' then 'invitation_templates.preview_approved'
    when tg_table_name = 'invitation_templates' and tg_op = 'UPDATE' then 'invitation_templates.updated'
    when tg_table_name = 'invitation_template_fields' and tg_op = 'INSERT' then 'invitation_templates.updated'
    when tg_table_name = 'invitation_template_fields' and tg_op = 'UPDATE' then 'invitation_templates.updated'
    when tg_table_name = 'invitation_generation_jobs' and tg_op = 'INSERT' then 'invitation_generation_jobs.created'
    when tg_table_name = 'invitation_generation_jobs' and tg_op = 'UPDATE' then 'invitation_generation_jobs.updated'
    when tg_table_name = 'invitations' and tg_op = 'INSERT' then 'invitations.created'
    when tg_table_name = 'invitations' and tg_op = 'UPDATE' and new.status = 'needs_regeneration' then 'invitations.regeneration_required'
    when tg_table_name = 'invitations' and tg_op = 'UPDATE' and new.status = 'generated' then 'invitations.generated'
    when tg_table_name = 'invitation_files' and tg_op = 'INSERT' then 'invitation_files.versioned'
    when tg_table_name = 'invitation_files' and tg_op = 'UPDATE' then 'invitation_files.versioned'
    else lower(tg_table_name || '.' || tg_op)
  end;

  if tg_op in ('UPDATE', 'DELETE') then
    sanitized_old := app_private.redact_invitation_audit_snapshot(to_jsonb(old));
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    sanitized_new := app_private.redact_invitation_audit_snapshot(to_jsonb(new));
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

revoke all on function app_private.audit_invitation_change() from public;

drop trigger if exists audit_invitation_templates_insert on public.invitation_templates;
create trigger audit_invitation_templates_insert
after insert on public.invitation_templates
for each row
execute function app_private.audit_invitation_change();

drop trigger if exists audit_invitation_templates_update on public.invitation_templates;
create trigger audit_invitation_templates_update
after update on public.invitation_templates
for each row
execute function app_private.audit_invitation_change();

drop trigger if exists audit_invitation_template_fields_insert on public.invitation_template_fields;
create trigger audit_invitation_template_fields_insert
after insert on public.invitation_template_fields
for each row
execute function app_private.audit_invitation_change();

drop trigger if exists audit_invitation_template_fields_update on public.invitation_template_fields;
create trigger audit_invitation_template_fields_update
after update on public.invitation_template_fields
for each row
execute function app_private.audit_invitation_change();

drop trigger if exists audit_invitation_generation_jobs_insert on public.invitation_generation_jobs;
create trigger audit_invitation_generation_jobs_insert
after insert on public.invitation_generation_jobs
for each row
execute function app_private.audit_invitation_change();

drop trigger if exists audit_invitation_generation_jobs_update on public.invitation_generation_jobs;
create trigger audit_invitation_generation_jobs_update
after update on public.invitation_generation_jobs
for each row
execute function app_private.audit_invitation_change();

drop trigger if exists audit_invitations_insert on public.invitations;
create trigger audit_invitations_insert
after insert on public.invitations
for each row
execute function app_private.audit_invitation_change();

drop trigger if exists audit_invitations_update on public.invitations;
create trigger audit_invitations_update
after update on public.invitations
for each row
execute function app_private.audit_invitation_change();

drop trigger if exists audit_invitation_files_insert on public.invitation_files;
create trigger audit_invitation_files_insert
after insert on public.invitation_files
for each row
execute function app_private.audit_invitation_change();

drop trigger if exists audit_invitation_files_update on public.invitation_files;
create trigger audit_invitation_files_update
after update of is_active on public.invitation_files
for each row
when (old.is_active is distinct from new.is_active)
execute function app_private.audit_invitation_change();

create or replace function public.save_invitation_template_fields(
  p_template_id uuid,
  p_fields jsonb,
  p_actor_user_id uuid default null
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_template public.invitation_templates%rowtype;
  v_field_count integer;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  if p_actor_user_id is not null and p_actor_user_id <> v_actor_user_id then
    raise exception 'Actor user mismatch.'
      using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(p_fields, '[]'::jsonb)) <> 'array' then
    raise exception 'Template fields must be an array.'
      using errcode = '22023';
  end if;

  if jsonb_array_length(coalesce(p_fields, '[]'::jsonb)) = 0 then
    raise exception 'At least one template field is required.'
      using errcode = '23514';
  end if;

  select *
  into v_template
  from public.invitation_templates
  where id = p_template_id
  for update;

  if not found then
    raise exception 'Invitation template was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_template.project_id, 'invitation_templates.update') then
    raise exception 'Invitation template update permission denied.'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_fields) as field_json(value)
    where nullif(trim(field_json.value->>'fieldKey'), '') is null
      or nullif(trim(field_json.value->>'label'), '') is null
      or field_json.value->>'pageNumber' is null
      or jsonb_typeof(field_json.value->'position') is distinct from 'object'
  ) then
    raise exception 'Each template field requires fieldKey, label, pageNumber, and position.'
      using errcode = '22023';
  end if;

  delete from public.invitation_template_fields
  where template_id = p_template_id;

  with parsed_fields as (
    select
      coalesce(field_record."sortOrder", (row_number() over ())::integer - 1) as sort_order,
      field_record."fieldKey" as field_key,
      field_record.label,
      field_record."pageNumber" as page_number,
      field_record.position,
      field_record."fontFamily" as font_family,
      field_record."fontSize" as font_size,
      field_record.alignment
    from jsonb_to_recordset(p_fields) as field_record(
      "fieldKey" public.invitation_template_field_target,
      label text,
      "pageNumber" integer,
      position jsonb,
      "fontFamily" text,
      "fontSize" numeric,
      alignment text,
      "sortOrder" integer
    )
  )
  insert into public.invitation_template_fields (
    project_id,
    event_id,
    template_id,
    field_key,
    label,
    page_number,
    position,
    font_family,
    font_size,
    alignment,
    sort_order,
    created_by,
    updated_by
  )
  select
    v_template.project_id,
    v_template.event_id,
    v_template.id,
    parsed_fields.field_key,
    parsed_fields.label,
    parsed_fields.page_number,
    parsed_fields.position,
    parsed_fields.font_family,
    parsed_fields.font_size,
    parsed_fields.alignment,
    parsed_fields.sort_order,
    v_actor_user_id,
    v_actor_user_id
  from parsed_fields;

  get diagnostics v_field_count = row_count;

  update public.invitation_templates
  set
    status = 'configured',
    updated_by = v_actor_user_id
  where id = p_template_id;

  return jsonb_build_object(
    'templateId', p_template_id,
    'fieldCount', v_field_count,
    'status', 'configured'
  );
end;
$$;

create or replace function public.mark_invitation_template_preview_generated(
  p_template_id uuid,
  p_preview_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_template public.invitation_templates%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  select *
  into v_template
  from public.invitation_templates
  where id = p_template_id
  for update;

  if not found then
    raise exception 'Invitation template was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_template.project_id, 'invitation_templates.update') then
    raise exception 'Invitation template update permission denied.'
      using errcode = '42501';
  end if;

  update public.invitation_templates
  set
    status = 'preview_generated',
    technical_preview_metadata = coalesce(p_preview_metadata, '{}'::jsonb),
    technical_preview_generated_at = now(),
    updated_by = v_actor_user_id
  where id = p_template_id
  returning * into v_template;

  return jsonb_build_object(
    'templateId', v_template.id,
    'status', v_template.status,
    'previewGeneratedAt', v_template.technical_preview_generated_at
  );
end;
$$;

create or replace function public.approve_invitation_template_preview(
  p_template_id uuid
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_template public.invitation_templates%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  select *
  into v_template
  from public.invitation_templates
  where id = p_template_id
  for update;

  if not found then
    raise exception 'Invitation template was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_template.project_id, 'invitation_templates.approve') then
    raise exception 'Invitation template approval permission denied.'
      using errcode = '42501';
  end if;

  if v_template.status <> 'preview_generated' then
    raise exception 'Technical preview must be generated before approval.'
      using errcode = '23514';
  end if;

  update public.invitation_templates
  set
    status = 'technical_preview_approved',
    technical_preview_approved_at = now(),
    technical_preview_approved_by = v_actor_user_id,
    updated_by = v_actor_user_id
  where id = p_template_id
  returning * into v_template;

  return jsonb_build_object(
    'templateId', v_template.id,
    'status', v_template.status,
    'approvedAt', v_template.technical_preview_approved_at,
    'approvedBy', v_template.technical_preview_approved_by
  );
end;
$$;

create or replace function public.enqueue_invitation_generation_job(
  p_template_id uuid,
  p_mode public.invitation_generation_mode,
  p_guest_ids uuid[] default null
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_template public.invitation_templates%rowtype;
  v_job_id uuid;
  v_ready_count integer := 0;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  select *
  into v_template
  from public.invitation_templates
  where id = p_template_id
  for update;

  if not found then
    raise exception 'Invitation template was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_template.project_id, 'invitations.generate') then
    raise exception 'Invitation generation permission denied.'
      using errcode = '42501';
  end if;

  if v_template.status not in ('technical_preview_approved', 'active') then
    raise exception 'Invitation generation requires an approved technical preview.'
      using errcode = '23514';
  end if;

  if p_mode is null then
    raise exception 'Invitation generation mode is required.'
      using errcode = '22023';
  end if;

  if p_mode in ('selected_guests', 'regenerate_selected') and coalesce(cardinality(p_guest_ids), 0) = 0 then
    raise exception 'Selected invitation generation modes require at least one guest id.'
      using errcode = '22023';
  end if;

  if p_mode in ('event', 'technical_preview') and coalesce(cardinality(p_guest_ids), 0) > 0 then
    raise exception 'Guest ids are only allowed for selected invitation generation modes.'
      using errcode = '22023';
  end if;

  insert into public.invitation_generation_jobs (
    project_id,
    event_id,
    template_id,
    mode,
    status,
    created_by
  )
  values (
    v_template.project_id,
    v_template.event_id,
    v_template.id,
    p_mode,
    'queued',
    v_actor_user_id
  )
  returning id into v_job_id;

  with eligible_guests as (
    select g.id as guest_id
    from public.guests g
    join public.guest_event_assignments gea
      on gea.guest_id = g.id
      and gea.event_id = v_template.event_id
      and gea.project_id = g.project_id
    where g.project_id = v_template.project_id
      and g.is_active = true
      and gea.invited = true
      and gea.status = 'assigned'
      and (
        p_mode in ('event', 'technical_preview')
        or g.id = any(p_guest_ids)
      )
  ),
  upserted_invitations as (
    insert into public.invitations (
      project_id,
      event_id,
      guest_id,
      template_id,
      status,
      created_by,
      updated_by
    )
    select
      v_template.project_id,
      v_template.event_id,
      eligible_guests.guest_id,
      v_template.id,
      'not_generated',
      v_actor_user_id,
      v_actor_user_id
    from eligible_guests
    on conflict (guest_id, event_id)
    do update set
      template_id = excluded.template_id,
      status = case
        when public.invitations.status = 'generated' then 'needs_regeneration'::public.invitation_status
        else public.invitations.status
      end,
      needs_regeneration_reason = case
        when public.invitations.status = 'generated' then 'template_generation_requested'
        else public.invitations.needs_regeneration_reason
      end,
      updated_by = v_actor_user_id
    returning id, guest_id
  ),
  inserted_job_items as (
    insert into public.invitation_generation_job_items (
      project_id,
      event_id,
      generation_job_id,
      guest_id,
      invitation_id,
      status
    )
    select
      v_template.project_id,
      v_template.event_id,
      v_job_id,
      upserted_invitations.guest_id,
      upserted_invitations.id,
      'queued'
    from upserted_invitations
    on conflict (generation_job_id, guest_id) do nothing
    returning id
  )
  select count(*)::integer
  into v_ready_count
  from inserted_job_items;

  update public.invitation_generation_jobs
  set
    total_guests = v_ready_count,
    ready_count = v_ready_count
  where id = v_job_id;

  return jsonb_build_object(
    'generationJobId', v_job_id,
    'eventId', v_template.event_id,
    'templateId', v_template.id,
    'readyCount', v_ready_count,
    'status', 'queued'
  );
end;
$$;

revoke all on function public.mark_invitation_template_preview_generated(uuid, jsonb) from public;
revoke all on function public.save_invitation_template_fields(uuid, jsonb, uuid) from public;
revoke all on function public.approve_invitation_template_preview(uuid) from public;
revoke all on function public.enqueue_invitation_generation_job(uuid, public.invitation_generation_mode, uuid[]) from public;

grant execute on function public.mark_invitation_template_preview_generated(uuid, jsonb) to authenticated;
grant execute on function public.save_invitation_template_fields(uuid, jsonb, uuid) to authenticated;
grant execute on function public.approve_invitation_template_preview(uuid) to authenticated;
grant execute on function public.enqueue_invitation_generation_job(uuid, public.invitation_generation_mode, uuid[]) to authenticated;

alter table public.invitation_templates enable row level security;
alter table public.invitation_template_fields enable row level security;
alter table public.invitation_generation_jobs enable row level security;
alter table public.invitation_generation_job_items enable row level security;
alter table public.invitations enable row level security;
alter table public.invitation_files enable row level security;

drop policy if exists "Invitation templates visible to template readers" on public.invitation_templates;
create policy "Invitation templates visible to template readers"
on public.invitation_templates
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'invitation_templates.read'));

drop policy if exists "Invitation templates creatable by template creators" on public.invitation_templates;
create policy "Invitation templates creatable by template creators"
on public.invitation_templates
for insert
to authenticated
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'invitation_templates.create'));

drop policy if exists "Invitation templates updatable by template editors or approvers" on public.invitation_templates;
create policy "Invitation templates updatable by template editors or approvers"
on public.invitation_templates
for update
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'invitation_templates.update')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'invitation_templates.approve')
)
with check (
  app_private.user_can_access_project((select auth.uid()), project_id, 'invitation_templates.update')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'invitation_templates.approve')
);

drop policy if exists "Invitation template fields visible to template readers" on public.invitation_template_fields;
create policy "Invitation template fields visible to template readers"
on public.invitation_template_fields
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'invitation_templates.read'));

drop policy if exists "Invitation template fields managed by template editors" on public.invitation_template_fields;
create policy "Invitation template fields managed by template editors"
on public.invitation_template_fields
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'invitation_templates.update'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'invitation_templates.update'));

drop policy if exists "Invitation jobs visible to invitation readers" on public.invitation_generation_jobs;
create policy "Invitation jobs visible to invitation readers"
on public.invitation_generation_jobs
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'invitations.read')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'invitations.generate')
);

drop policy if exists "Invitation jobs managed by invitation generators" on public.invitation_generation_jobs;
create policy "Invitation jobs managed by invitation generators"
on public.invitation_generation_jobs
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'invitations.generate'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'invitations.generate'));

drop policy if exists "Invitation job items visible to invitation readers" on public.invitation_generation_job_items;
create policy "Invitation job items visible to invitation readers"
on public.invitation_generation_job_items
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'invitations.read')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'invitations.generate')
);

drop policy if exists "Invitation job items managed by invitation generators" on public.invitation_generation_job_items;
create policy "Invitation job items managed by invitation generators"
on public.invitation_generation_job_items
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'invitations.generate'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'invitations.generate'));

drop policy if exists "Invitations visible to invitation readers" on public.invitations;
create policy "Invitations visible to invitation readers"
on public.invitations
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'invitations.read'));

drop policy if exists "Invitations managed by invitation generators" on public.invitations;
create policy "Invitations managed by invitation generators"
on public.invitations
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'invitations.generate'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'invitations.generate'));

drop policy if exists "Invitation files visible to invitation file readers" on public.invitation_files;
create policy "Invitation files visible to invitation file readers"
on public.invitation_files
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'invitation_files.read')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'invitations.read')
);

drop policy if exists "Invitation files managed by invitation generators" on public.invitation_files;
create policy "Invitation files managed by invitation generators"
on public.invitation_files
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'invitations.generate'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'invitations.generate'));

grant select, insert, update on public.invitation_templates to authenticated;
grant select, insert, update, delete on public.invitation_template_fields to authenticated;
grant select, insert, update on public.invitation_generation_jobs to authenticated;
grant select, insert, update on public.invitation_generation_job_items to authenticated;
grant select, insert, update on public.invitations to authenticated;
grant select, insert, update on public.invitation_files to authenticated;

grant select, insert, update on public.invitation_templates to service_role;
grant select, insert, update, delete on public.invitation_template_fields to service_role;
grant select, insert, update on public.invitation_generation_jobs to service_role;
grant select, insert, update on public.invitation_generation_job_items to service_role;
grant select, insert, update on public.invitations to service_role;
grant select, insert, update on public.invitation_files to service_role;

insert into public.permissions (slug, description, requirement_ids)
values
  ('invitation_templates.read', 'Read event invitation template registration and field configuration.', array['INV-001', 'INV-003', 'INV-015']),
  ('invitation_templates.create', 'Register Canva-exported PDF invitation templates.', array['INV-001', 'INV-002', 'FILE-004', 'INV-015']),
  ('invitation_templates.update', 'Update invitation template metadata, field coordinates, and preview metadata.', array['INV-003', 'INV-004', 'INV-005', 'INV-015']),
  ('invitation_templates.approve', 'Approve technical invitation template previews before batch generation.', array['INV-006', 'INV-015', 'REP-006']),
  ('invitations.read', 'Read invitation records, generation status, and generation job history.', array['INV-007', 'INV-008', 'INV-012']),
  ('invitations.generate', 'Create invitation generation jobs and invitation records for ready event guests.', array['INV-011', 'INV-012', 'INV-014', 'INV-015']),
  ('invitation_files.read', 'Read generated invitation file metadata and active versions.', array['INV-008', 'FILE-005', 'FILE-006'])
on conflict (slug) do update
set
  description = excluded.description,
  requirement_ids = excluded.requirement_ids;

with grants(role_slug, permission_slug) as (
  values
    ('diginoces_admin', 'invitation_templates.read'),
    ('diginoces_admin', 'invitation_templates.create'),
    ('diginoces_admin', 'invitation_templates.update'),
    ('diginoces_admin', 'invitation_templates.approve'),
    ('diginoces_admin', 'invitations.read'),
    ('diginoces_admin', 'invitations.generate'),
    ('diginoces_admin', 'invitation_files.read'),
    ('operations_manager', 'invitation_templates.read'),
    ('operations_manager', 'invitation_templates.create'),
    ('operations_manager', 'invitation_templates.update'),
    ('operations_manager', 'invitation_templates.approve'),
    ('operations_manager', 'invitations.read'),
    ('operations_manager', 'invitations.generate'),
    ('operations_manager', 'invitation_files.read')
)
insert into public.role_permissions (role_id, permission_slug)
select r.id, g.permission_slug
from grants g
join public.roles r on r.slug = g.role_slug
join public.permissions p on p.slug = g.permission_slug
on conflict (role_id, permission_slug) do nothing;
