-- Sprint 7 - WhatsApp Communication Workflows
-- Requirements: MSG-001 through MSG-010, PV-004, RSVP-011, INV-013,
-- PAY-014, PAY-015, REP-006, TECH-005.
--
-- Scope guard: this migration creates only message template, guided manual
-- WhatsApp preparation, API-ready queue/log, reminder placeholder, status, and
-- audit foundations. It intentionally does not implement unofficial WhatsApp
-- Web automation, production WhatsApp API credentials, seating, check-in,
-- contracts, pricing, payments, invitation PDF generation, QR generation, or
-- partner project creation.

alter type public.invitation_status add value if not exists 'sent';
alter type public.invitation_status add value if not exists 'resent';
alter type public.invitation_status add value if not exists 'cancelled';

do $$
begin
  create type public.message_type as enum (
    'invitation',
    'invitation_resend',
    'rsvp_request',
    'maybe_follow_up',
    'event_reminder',
    'modification_notice',
    'welcome_table_placeholder',
    'manual_custom'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_language as enum ('fr', 'en');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_template_status as enum (
    'draft',
    'active',
    'inactive',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_channel as enum ('whatsapp');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_sending_mode as enum (
    'guided_manual',
    'api_ready',
    'api_sent'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_delivery_status as enum (
    'not_prepared',
    'prepared',
    'queued',
    'opened_manually',
    'sent',
    'failed',
    'skipped',
    'resent',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.message_templates (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  message_type public.message_type not null,
  language public.message_language not null,
  title text not null,
  body text not null,
  variables jsonb not null default '[]'::jsonb,
  status public.message_template_status not null default 'draft',
  template_version integer not null default 1,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint message_templates_title_not_blank check (length(trim(title)) > 0),
  constraint message_templates_body_not_blank check (length(trim(body)) > 0),
  constraint message_templates_version_positive check (template_version > 0),
  constraint message_templates_variables_array check (jsonb_typeof(variables) = 'array'),
  constraint message_templates_approval_pair check (
    (approved_by is null and approved_at is null)
    or (approved_by is not null and approved_at is not null)
  )
);

create unique index if not exists message_templates_project_type_language_version_key
  on public.message_templates (project_id, message_type, language, template_version);

create unique index if not exists message_templates_id_project_id_key
  on public.message_templates (id, project_id);

create unique index if not exists message_templates_one_active_language_key
  on public.message_templates (project_id, message_type, language)
  where status = 'active';

create index if not exists message_templates_project_type_status_idx
  on public.message_templates (project_id, message_type, status, updated_at desc);

create table if not exists public.message_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid,
  guest_id uuid,
  invitation_id uuid references public.invitations (id) on delete set null,
  template_id uuid references public.message_templates (id) on delete set null,
  message_type public.message_type not null,
  language public.message_language not null,
  template_version integer,
  rendered_body text not null,
  channel public.message_channel not null default 'whatsapp',
  sending_mode public.message_sending_mode not null default 'guided_manual',
  status public.message_delivery_status not null default 'prepared',
  target_whatsapp_number text,
  manual_whatsapp_url text,
  external_provider_message_id text,
  prepared_by uuid references auth.users (id) on delete set null,
  opened_by uuid references auth.users (id) on delete set null,
  sent_confirmed_by uuid references auth.users (id) on delete set null,
  opened_at timestamptz,
  sent_at timestamptz,
  failure_reason text,
  skipped_reason text,
  previous_message_log_id uuid references public.message_logs (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint message_logs_rendered_body_not_blank check (length(trim(rendered_body)) > 0),
  constraint message_logs_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint message_logs_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint message_logs_guest_project_match
    foreign key (guest_id, project_id)
    references public.guests (id, project_id)
    on delete cascade,
  constraint message_logs_template_project_match
    foreign key (template_id, project_id)
    references public.message_templates (id, project_id)
    on delete set null
);

create unique index if not exists message_logs_id_project_id_key
  on public.message_logs (id, project_id);

create index if not exists message_logs_project_event_status_idx
  on public.message_logs (project_id, event_id, status, created_at desc);

create index if not exists message_logs_guest_history_idx
  on public.message_logs (project_id, guest_id, created_at desc);

create table if not exists public.message_queue_items (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid,
  guest_id uuid,
  message_log_id uuid not null references public.message_logs (id) on delete cascade,
  message_type public.message_type not null,
  sending_mode public.message_sending_mode not null default 'guided_manual',
  status public.message_delivery_status not null default 'queued',
  scheduled_for timestamptz,
  attempts integer not null default 0,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint message_queue_items_attempts_non_negative check (attempts >= 0),
  constraint message_queue_items_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint message_queue_items_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint message_queue_items_guest_project_match
    foreign key (guest_id, project_id)
    references public.guests (id, project_id)
    on delete cascade,
  constraint message_queue_items_log_project_match
    foreign key (message_log_id, project_id)
    references public.message_logs (id, project_id)
    on delete cascade
);

create index if not exists message_queue_items_project_status_idx
  on public.message_queue_items (project_id, status, scheduled_for, created_at desc);

create table if not exists public.message_status_events (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  message_log_id uuid not null references public.message_logs (id) on delete cascade,
  old_status public.message_delivery_status,
  new_status public.message_delivery_status not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  constraint message_status_events_log_project_match
    foreign key (message_log_id, project_id)
    references public.message_logs (id, project_id)
    on delete cascade
);

create index if not exists message_status_events_log_created_idx
  on public.message_status_events (message_log_id, created_at desc);

drop trigger if exists set_message_templates_updated_at on public.message_templates;
create trigger set_message_templates_updated_at
before update on public.message_templates
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_message_logs_updated_at on public.message_logs;
create trigger set_message_logs_updated_at
before update on public.message_logs
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_message_queue_items_updated_at on public.message_queue_items;
create trigger set_message_queue_items_updated_at
before update on public.message_queue_items
for each row
execute function app_private.set_updated_at();

create or replace function app_private.redact_message_audit_snapshot(p_snapshot jsonb)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_snapshot is null then null
    else p_snapshot
      - 'rendered_body'
      - 'target_whatsapp_number'
      - 'manual_whatsapp_url'
      - 'external_provider_message_id'
  end;
$$;

revoke all on function app_private.redact_message_audit_snapshot(jsonb) from public;

create or replace function app_private.audit_message_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  action_name text;
  changed_object_type text;
  changed_object_id uuid;
  actor_id uuid;
  sanitized_old jsonb := null;
  sanitized_new jsonb := null;
begin
  changed_object_type := tg_table_name;

  if tg_op = 'INSERT' then
    changed_object_id := new.id;
    actor_id := coalesce(
      nullif(to_jsonb(new)->>'created_by', '')::uuid,
      nullif(to_jsonb(new)->>'prepared_by', '')::uuid,
      nullif(to_jsonb(new)->>'sent_confirmed_by', '')::uuid,
      nullif(to_jsonb(new)->>'opened_by', '')::uuid,
      (select auth.uid())
    );
  elsif tg_op = 'UPDATE' then
    changed_object_id := new.id;
    actor_id := coalesce(
      nullif(to_jsonb(new)->>'updated_by', '')::uuid,
      nullif(to_jsonb(new)->>'sent_confirmed_by', '')::uuid,
      nullif(to_jsonb(new)->>'opened_by', '')::uuid,
      (select auth.uid())
    );
    sanitized_old := app_private.redact_message_audit_snapshot(to_jsonb(old));
  else
    changed_object_id := old.id;
    actor_id := (select auth.uid());
    sanitized_old := app_private.redact_message_audit_snapshot(to_jsonb(old));
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    sanitized_new := app_private.redact_message_audit_snapshot(to_jsonb(new));
  end if;

  if tg_table_name = 'message_templates' then
    if tg_op = 'INSERT' then
      action_name := 'message_templates.created';
    elsif new.status = 'active' and old.status is distinct from new.status then
      action_name := 'message_templates.activated';
    elsif new.status = 'inactive' and old.status is distinct from new.status then
      action_name := 'message_templates.deactivated';
    else
      action_name := 'message_templates.updated';
    end if;
    changed_object_type := 'message_template';
  elsif tg_table_name = 'message_queue_items' then
    action_name := case
      when new.message_type in ('maybe_follow_up', 'event_reminder') then 'message_reminders.prepared'
      else 'messages.prepared'
    end;
    changed_object_type := 'message_queue_item';
  elsif tg_table_name = 'message_logs' then
    if tg_op = 'INSERT' then
      action_name := case
        when new.message_type = 'maybe_follow_up' then 'message_reminders.prepared'
        when new.message_type = 'modification_notice' then 'message_modifications.prepared'
        else 'messages.prepared'
      end;
    elsif new.status = 'opened_manually' and old.status is distinct from new.status then
      action_name := 'messages.opened_manually';
    elsif new.status = 'sent' and old.status is distinct from new.status then
      action_name := 'messages.sent';
    elsif new.status = 'failed' and old.status is distinct from new.status then
      action_name := 'messages.failed';
    elsif new.status = 'skipped' and old.status is distinct from new.status then
      action_name := 'messages.skipped';
    elsif new.status = 'resent' and old.status is distinct from new.status then
      action_name := 'messages.resent';
    else
      action_name := 'messages.updated';
    end if;
    changed_object_type := 'message_log';
  else
    action_name := 'messages.updated';
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

revoke all on function app_private.audit_message_change() from public;

drop trigger if exists audit_message_templates_insert on public.message_templates;
create trigger audit_message_templates_insert
after insert on public.message_templates
for each row
execute function app_private.audit_message_change();

drop trigger if exists audit_message_templates_update on public.message_templates;
create trigger audit_message_templates_update
after update on public.message_templates
for each row
execute function app_private.audit_message_change();

drop trigger if exists audit_message_logs_insert on public.message_logs;
create trigger audit_message_logs_insert
after insert on public.message_logs
for each row
execute function app_private.audit_message_change();

drop trigger if exists audit_message_logs_update on public.message_logs;
create trigger audit_message_logs_update
after update on public.message_logs
for each row
execute function app_private.audit_message_change();

drop trigger if exists audit_message_queue_items_insert on public.message_queue_items;
create trigger audit_message_queue_items_insert
after insert on public.message_queue_items
for each row
execute function app_private.audit_message_change();

drop trigger if exists audit_message_queue_items_update on public.message_queue_items;
create trigger audit_message_queue_items_update
after update on public.message_queue_items
for each row
execute function app_private.audit_message_change();

create or replace function public.prepare_message_log_with_queue(
  p_project_id uuid,
  p_event_id uuid,
  p_guest_id uuid,
  p_invitation_id uuid,
  p_template_id uuid,
  p_template_version integer,
  p_message_type public.message_type,
  p_language public.message_language,
  p_channel public.message_channel,
  p_sending_mode public.message_sending_mode,
  p_status public.message_delivery_status,
  p_rendered_body text,
  p_target_whatsapp_number text,
  p_manual_whatsapp_url text,
  p_failure_reason text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_previous_message_log_id uuid default null,
  p_id uuid default null
)
returns public.message_logs
language plpgsql
security invoker
set search_path = public, app_private
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_log public.message_logs;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, p_project_id, 'messages.prepare') then
    raise exception 'Message prepare permission denied.'
      using errcode = '42501';
  end if;

  insert into public.message_logs (
    channel,
    event_id,
    failure_reason,
    guest_id,
    id,
    invitation_id,
    language,
    manual_whatsapp_url,
    message_type,
    metadata,
    prepared_by,
    previous_message_log_id,
    project_id,
    rendered_body,
    sending_mode,
    status,
    target_whatsapp_number,
    template_id,
    template_version
  )
  values (
    p_channel,
    p_event_id,
    p_failure_reason,
    p_guest_id,
    coalesce(p_id, gen_random_uuid()),
    p_invitation_id,
    p_language,
    p_manual_whatsapp_url,
    p_message_type,
    coalesce(p_metadata, '{}'::jsonb),
    v_actor_user_id,
    p_previous_message_log_id,
    p_project_id,
    p_rendered_body,
    p_sending_mode,
    p_status,
    p_target_whatsapp_number,
    p_template_id,
    p_template_version
  )
  returning * into v_log;

  insert into public.message_queue_items (
    created_by,
    event_id,
    guest_id,
    message_log_id,
    message_type,
    project_id,
    sending_mode,
    status
  )
  values (
    v_actor_user_id,
    v_log.event_id,
    v_log.guest_id,
    v_log.id,
    v_log.message_type,
    v_log.project_id,
    v_log.sending_mode,
    'queued'
  );

  return v_log;
end;
$$;

revoke all on function public.prepare_message_log_with_queue(
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  integer,
  public.message_type,
  public.message_language,
  public.message_channel,
  public.message_sending_mode,
  public.message_delivery_status,
  text,
  text,
  text,
  text,
  jsonb,
  uuid,
  uuid
) from public;
grant execute on function public.prepare_message_log_with_queue(
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  integer,
  public.message_type,
  public.message_language,
  public.message_channel,
  public.message_sending_mode,
  public.message_delivery_status,
  text,
  text,
  text,
  text,
  jsonb,
  uuid,
  uuid
) to authenticated;

create or replace function public.mark_guided_manual_message_status(
  p_message_log_id uuid,
  p_status public.message_delivery_status,
  p_reason text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_log public.message_logs;
  v_old_status public.message_delivery_status;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  if p_status not in ('opened_manually', 'sent', 'failed', 'skipped', 'resent') then
    raise exception 'Unsupported manual message status.'
      using errcode = '22023';
  end if;

  select *
    into v_log
  from public.message_logs
  where id = p_message_log_id
  for update;

  if not found then
    raise exception 'Message log was not found.'
      using errcode = '02000';
  end if;

  if v_log.sending_mode <> 'guided_manual' then
    raise exception 'Only guided manual messages can be marked manually.'
      using errcode = '22023';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_log.project_id, 'messages.send') then
    raise exception 'Message send permission denied.'
      using errcode = '42501';
  end if;

  v_old_status := v_log.status;

  if not (
    (v_old_status = 'prepared' and p_status in ('opened_manually', 'sent', 'resent', 'failed', 'skipped'))
    or (v_old_status = 'opened_manually' and p_status in ('sent', 'resent', 'failed', 'skipped'))
    or (v_old_status in ('sent', 'resent') and p_status = 'resent')
  ) then
    raise exception 'Unsupported manual message status transition.'
      using errcode = '22023';
  end if;

  if p_status = 'failed' and nullif(trim(coalesce(p_reason, '')), '') is null then
    raise exception 'Failure reason is required.'
      using errcode = '22023';
  end if;

  if p_status = 'skipped' and nullif(trim(coalesce(p_reason, '')), '') is null then
    raise exception 'Skip reason is required.'
      using errcode = '22023';
  end if;

  update public.message_logs
  set
    status = p_status,
    opened_at = case when p_status = 'opened_manually' then now() else opened_at end,
    opened_by = case when p_status = 'opened_manually' then v_actor_user_id else opened_by end,
    sent_at = case when p_status in ('sent', 'resent') then now() else sent_at end,
    sent_confirmed_by = case when p_status in ('sent', 'resent') then v_actor_user_id else sent_confirmed_by end,
    failure_reason = case when p_status = 'failed' then nullif(trim(p_reason), '') else failure_reason end,
    skipped_reason = case when p_status = 'skipped' then nullif(trim(p_reason), '') else skipped_reason end
  where id = v_log.id
  returning * into v_log;

  insert into public.message_status_events (
    project_id,
    message_log_id,
    old_status,
    new_status,
    actor_user_id,
    reason
  )
  values (
    v_log.project_id,
    v_log.id,
    v_old_status,
    p_status,
    v_actor_user_id,
    p_reason
  );

  -- This enum cast is intentionally limited to statuses shared by
  -- message_delivery_status and invitation_status. Review this block if either
  -- enum gains a divergent delivery or invitation lifecycle value.
  if v_log.invitation_id is not null and p_status in ('sent', 'resent') then
    update public.invitations
    set
      status = (p_status::text)::public.invitation_status,
      updated_by = v_actor_user_id
    where id = v_log.invitation_id;
  end if;

  return jsonb_build_object(
    'messageLogId', v_log.id,
    'status', v_log.status,
    'projectId', v_log.project_id
  );
end;
$$;

revoke all on function public.mark_guided_manual_message_status(uuid, public.message_delivery_status, text) from public;
grant execute on function public.mark_guided_manual_message_status(uuid, public.message_delivery_status, text) to authenticated;

alter table public.message_templates enable row level security;
alter table public.message_logs enable row level security;
alter table public.message_queue_items enable row level security;
alter table public.message_status_events enable row level security;

drop policy if exists "Message templates visible to template readers" on public.message_templates;
create policy "Message templates visible to template readers"
on public.message_templates
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'message_templates.read')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'messages.prepare')
);

drop policy if exists "Message templates managed by template managers" on public.message_templates;
create policy "Message templates managed by template managers"
on public.message_templates
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'message_templates.manage'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'message_templates.manage'));

drop policy if exists "Message logs visible to message readers" on public.message_logs;
create policy "Message logs visible to message readers"
on public.message_logs
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'messages.read')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'messages.prepare')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'messages.send')
);

drop policy if exists "Message logs prepared by message preparers" on public.message_logs;
create policy "Message logs prepared by message preparers"
on public.message_logs
for insert
to authenticated
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'messages.prepare'));

drop policy if exists "Message logs updated by message senders" on public.message_logs;
create policy "Message logs updated by message senders"
on public.message_logs
for update
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'messages.send'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'messages.send'));

drop policy if exists "Message queue visible to message readers" on public.message_queue_items;
create policy "Message queue visible to message readers"
on public.message_queue_items
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'messages.read')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'messages.prepare')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'messages.send')
);

drop policy if exists "Message queue managed by message preparers" on public.message_queue_items;
create policy "Message queue managed by message preparers"
on public.message_queue_items
for all
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'messages.prepare')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'messages.send')
)
with check (
  app_private.user_can_access_project((select auth.uid()), project_id, 'messages.prepare')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'messages.send')
);

drop policy if exists "Message status events visible to message readers" on public.message_status_events;
create policy "Message status events visible to message readers"
on public.message_status_events
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'messages.read')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'messages.send')
);

drop policy if exists "Message status events inserted by message senders" on public.message_status_events;
create policy "Message status events inserted by message senders"
on public.message_status_events
for insert
to authenticated
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'messages.send'));

grant select, insert, update on public.message_templates to authenticated;
grant select, insert, update on public.message_logs to authenticated;
grant select, insert, update on public.message_queue_items to authenticated;
grant select, insert on public.message_status_events to authenticated;

grant select, insert, update on public.message_templates to service_role;
grant select, insert, update on public.message_logs to service_role;
grant select, insert, update on public.message_queue_items to service_role;
grant select, insert on public.message_status_events to service_role;

insert into public.permissions (slug, description, requirement_ids)
values
  ('message_templates.read', 'Read approved WhatsApp-first message templates.', array['MSG-002', 'MSG-003']),
  ('message_templates.manage', 'Create, update, activate, and deactivate approved message templates.', array['MSG-002', 'MSG-003', 'REP-006']),
  ('messages.read', 'Read authorized project communication history and queue state.', array['MSG-008', 'MSG-009']),
  ('messages.prepare', 'Prepare guided manual and API-ready communication messages.', array['MSG-001', 'MSG-004', 'MSG-005', 'MSG-006', 'TECH-005']),
  ('messages.send', 'Open guided manual WhatsApp messages and mark sent, failed, skipped, or resent statuses.', array['MSG-001', 'MSG-008', 'MSG-009', 'MSG-010'])
on conflict (slug) do update
set
  description = excluded.description,
  requirement_ids = excluded.requirement_ids;

with grants(role_slug, permission_slug) as (
  values
    ('diginoces_admin', 'message_templates.read'),
    ('diginoces_admin', 'message_templates.manage'),
    ('diginoces_admin', 'messages.read'),
    ('diginoces_admin', 'messages.prepare'),
    ('diginoces_admin', 'messages.send'),
    ('operations_manager', 'message_templates.read'),
    ('operations_manager', 'message_templates.manage'),
    ('operations_manager', 'messages.read'),
    ('operations_manager', 'messages.prepare'),
    ('operations_manager', 'messages.send')
)
insert into public.role_permissions (role_id, permission_slug)
select r.id, g.permission_slug
from grants g
join public.roles r on r.slug = g.role_slug
join public.permissions p on p.slug = g.permission_slug
on conflict (role_id, permission_slug) do nothing;
