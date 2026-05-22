-- Sprint 5 - RSVP & Public Guest Page
-- Requirements: RSVP-001, RSVP-002, RSVP-003, RSVP-004, RSVP-005,
-- RSVP-006, RSVP-007, RSVP-008, RSVP-009, RSVP-010, RSVP-012,
-- RSVP-013, RSVP-014, ROLE-009, PAY-014, PAY-015, REP-006, TECH-010.
--
-- Scope guard: this migration creates only the secure guest public-page
-- token, payment-gated access-check, admin preview, RSVP record, deadline,
-- and audit foundations. It intentionally does not create invitation PDF/QR,
-- WhatsApp, seating, check-in, contract, pricing, payment, partner, or full
-- guest-book workflows.

do $$
begin
  create type public.guest_page_access_status as enum (
    'locked',
    'payment_confirmed',
    'exception_override'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.guest_public_token_type as enum (
    'guest_public_page',
    'check_in'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.guest_public_token_status as enum (
    'active',
    'revoked',
    'expired'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.rsvp_status as enum (
    'pending',
    'yes',
    'no',
    'maybe',
    'manual_review',
    'locked'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.rsvp_source as enum (
    'public_guest_page',
    'manual',
    'phone_call',
    'whatsapp',
    'in_person',
    'family_confirmation'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.rsvp_deadline_state as enum (
    'open',
    'manual_review'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.wedding_projects
  add column if not exists couple_photo_url text,
  add column if not exists guest_page_access_status public.guest_page_access_status not null default 'locked',
  add column if not exists guest_page_access_unlocked_at timestamptz,
  add column if not exists guest_page_access_unlocked_by uuid references auth.users (id) on delete set null,
  add column if not exists guest_page_payment_exception_reason text;

alter table public.events
  add column if not exists rsvp_deadline_at timestamptz;

create table if not exists public.guest_public_tokens (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  guest_id uuid not null,
  token_type public.guest_public_token_type not null default 'guest_public_page',
  token_hash text not null unique,
  token_preview text not null,
  status public.guest_public_token_status not null default 'active',
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references auth.users (id) on delete set null,
  regenerated_from_token_id uuid references public.guest_public_tokens (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guest_public_tokens_guest_project_match
    foreign key (guest_id, project_id)
    references public.guests (id, project_id)
    on delete cascade,
  constraint guest_public_tokens_hash_sha256_hex check (token_hash ~ '^[a-f0-9]{64}$'),
  constraint guest_public_tokens_preview_not_blank check (length(trim(token_preview)) >= 6),
  constraint guest_public_tokens_revoked_timestamp check (
    (status <> 'revoked' and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null)
  )
);

create unique index if not exists guest_public_tokens_active_guest_page_key
  on public.guest_public_tokens (guest_id, token_type)
  where status = 'active' and token_type = 'guest_public_page';

create index if not exists guest_public_tokens_project_guest_idx
  on public.guest_public_tokens (project_id, guest_id, status);

create table if not exists public.rsvp_records (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  guest_id uuid not null,
  event_id uuid not null,
  status public.rsvp_status not null default 'pending',
  source public.rsvp_source not null default 'public_guest_page',
  deadline_state public.rsvp_deadline_state not null default 'open',
  manual_review_required boolean not null default false,
  submitted_at timestamptz,
  last_changed_at timestamptz,
  submitted_by_user_id uuid references auth.users (id) on delete set null,
  public_token_id uuid references public.guest_public_tokens (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rsvp_records_guest_project_match
    foreign key (guest_id, project_id)
    references public.guests (id, project_id)
    on delete cascade,
  constraint rsvp_records_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade
);

create unique index if not exists rsvp_records_guest_event_key
  on public.rsvp_records (guest_id, event_id);

create index if not exists rsvp_records_project_event_status_idx
  on public.rsvp_records (project_id, event_id, status, manual_review_required);

create index if not exists rsvp_records_guest_idx
  on public.rsvp_records (guest_id, updated_at desc);

drop trigger if exists set_guest_public_tokens_updated_at on public.guest_public_tokens;
create trigger set_guest_public_tokens_updated_at
before update on public.guest_public_tokens
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_rsvp_records_updated_at on public.rsvp_records;
create trigger set_rsvp_records_updated_at
before update on public.rsvp_records
for each row
execute function app_private.set_updated_at();

create or replace function app_private.redact_rsvp_audit_snapshot(
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
    when p_table_name = 'guest_public_tokens' then p_snapshot - 'token_hash'
    else p_snapshot
  end;
$$;

revoke all on function app_private.redact_rsvp_audit_snapshot(text, jsonb) from public;

create or replace function app_private.audit_rsvp_public_page_change()
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
    when 'guest_public_tokens' then 'guest_public_token'
    when 'rsvp_records' then 'rsvp_record'
  end;

  changed_object_id := case tg_op
    when 'DELETE' then old.id
    else new.id
  end;

  action_name := case
    when tg_table_name = 'guest_public_tokens' and tg_op = 'INSERT' and new.regenerated_from_token_id is not null then 'guest_public_tokens.regenerated'
    when tg_table_name = 'guest_public_tokens' and tg_op = 'INSERT' then 'guest_public_tokens.created'
    when tg_table_name = 'guest_public_tokens' and tg_op = 'UPDATE' and old.status <> 'revoked' and new.status = 'revoked' then 'guest_public_tokens.revoked'
    when tg_table_name = 'rsvp_records' and tg_op = 'INSERT' and new.source = 'public_guest_page' then 'rsvps.submitted'
    when tg_table_name = 'rsvp_records' and tg_op = 'INSERT' then 'rsvps.manual_recorded'
    when tg_table_name = 'rsvp_records' and tg_op = 'UPDATE' and not old.manual_review_required and new.manual_review_required then 'rsvps.deadline_review_required'
    when tg_table_name = 'rsvp_records' and tg_op = 'UPDATE' then 'rsvps.changed'
    else lower(tg_table_name || '.' || tg_op)
  end;

  if tg_op in ('UPDATE', 'DELETE') then
    sanitized_old := app_private.redact_rsvp_audit_snapshot(tg_table_name, to_jsonb(old));
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    sanitized_new := app_private.redact_rsvp_audit_snapshot(tg_table_name, to_jsonb(new));
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

drop trigger if exists audit_guest_public_tokens_insert on public.guest_public_tokens;
create trigger audit_guest_public_tokens_insert
after insert on public.guest_public_tokens
for each row
execute function app_private.audit_rsvp_public_page_change();

drop trigger if exists audit_guest_public_tokens_update on public.guest_public_tokens;
create trigger audit_guest_public_tokens_update
after update on public.guest_public_tokens
for each row
execute function app_private.audit_rsvp_public_page_change();

drop trigger if exists audit_rsvp_records_insert on public.rsvp_records;
create trigger audit_rsvp_records_insert
after insert on public.rsvp_records
for each row
execute function app_private.audit_rsvp_public_page_change();

drop trigger if exists audit_rsvp_records_update on public.rsvp_records;
create trigger audit_rsvp_records_update
after update on public.rsvp_records
for each row
execute function app_private.audit_rsvp_public_page_change();

create or replace function app_private.public_guest_page_payload(
  p_guest_id uuid,
  p_token_id uuid default null,
  p_mode text default 'public'
)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'status', 'ok',
    'mode', p_mode,
    'tokenId', p_token_id,
    'guest', jsonb_build_object(
      'id', g.id,
      'displayName', g.display_name,
      'preferredLanguage', coalesce(g.preferred_language, wp.preferred_language, 'fr'),
      'isPrintedOnly', g.is_printed_only
    ),
    'project', jsonb_build_object(
      'id', wp.id,
      'brideName', wp.bride_name,
      'groomName', wp.groom_name,
      'couplePhotoUrl', wp.couple_photo_url,
      'preferredLanguage', coalesce(wp.preferred_language, 'fr'),
      'guestPageAccessStatus', wp.guest_page_access_status
    ),
    'events', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'assignmentId', gea.id,
            'eventId', e.id,
            'name', e.name,
            'eventDate', e.event_date,
            'startsAt', e.starts_at,
            'venueName', e.venue_name,
            'venueAddress', e.venue_address,
            'rsvpDeadlineAt', e.rsvp_deadline_at,
            'rsvp', case
              when rr.id is null then null
              else jsonb_build_object(
                'id', rr.id,
                'status', rr.status,
                'source', rr.source,
                'deadlineState', rr.deadline_state,
                'manualReviewRequired', rr.manual_review_required,
                'submittedAt', rr.submitted_at,
                'lastChangedAt', rr.last_changed_at
              )
            end
          )
          order by e.event_date nulls last, e.starts_at nulls last, e.created_at
        )
        from public.guest_event_assignments gea
        join public.events e
          on e.id = gea.event_id
          and e.project_id = gea.project_id
        left join public.rsvp_records rr
          on rr.guest_id = gea.guest_id
          and rr.event_id = gea.event_id
        where gea.guest_id = g.id
          and gea.project_id = g.project_id
          and gea.invited = true
          and gea.status = 'assigned'
      ),
      '[]'::jsonb
    ),
    'invitation', jsonb_build_object(
      'downloadAvailable', false,
      'placeholderOnly', true
    )
  )
  from public.guests g
  join public.wedding_projects wp on wp.id = g.project_id
  where g.id = p_guest_id
    and g.is_active = true;
$$;

revoke all on function app_private.public_guest_page_payload(uuid, uuid, text) from public;

create or replace function public.create_guest_public_token(
  p_guest_id uuid,
  p_expires_at timestamptz default null
)
returns table (
  token_id uuid,
  guest_id uuid,
  project_id uuid,
  token text,
  token_preview text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_guest public.guests%rowtype;
  v_previous_token_id uuid;
  v_token text;
  v_token_id uuid;
  v_token_preview text;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '28000';
  end if;

  select *
  into v_guest
  from public.guests
  where id = p_guest_id
    and is_active = true;

  if not found then
    raise exception 'Guest was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_guest.project_id, 'guest_public_tokens.manage') then
    raise exception 'Guest public token permission denied.'
      using errcode = '42501';
  end if;

  select id
  into v_previous_token_id
  from public.guest_public_tokens
  where guest_id = p_guest_id
    and token_type = 'guest_public_page'
    and status = 'active'
  order by created_at desc
  limit 1;

  update public.guest_public_tokens
  set
    status = 'revoked',
    revoked_at = now(),
    revoked_by = v_actor_user_id,
    updated_by = v_actor_user_id
  where guest_id = p_guest_id
    and token_type = 'guest_public_page'
    and status = 'active';

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_token_preview := left(v_token, 8);

  insert into public.guest_public_tokens (
    project_id,
    guest_id,
    token_type,
    token_hash,
    token_preview,
    status,
    expires_at,
    regenerated_from_token_id,
    created_by,
    updated_by
  )
  values (
    v_guest.project_id,
    p_guest_id,
    'guest_public_page',
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    v_token_preview,
    'active',
    p_expires_at,
    v_previous_token_id,
    v_actor_user_id,
    v_actor_user_id
  )
  returning id into v_token_id;

  return query
  select
    v_token_id,
    p_guest_id,
    v_guest.project_id,
    v_token,
    v_token_preview,
    p_expires_at;
end;
$$;

create or replace function public.revoke_guest_public_token(
  p_token_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_token public.guest_public_tokens%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '28000';
  end if;

  select *
  into v_token
  from public.guest_public_tokens
  where id = p_token_id;

  if not found then
    raise exception 'Guest public token was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_token.project_id, 'guest_public_tokens.manage') then
    raise exception 'Guest public token permission denied.'
      using errcode = '42501';
  end if;

  update public.guest_public_tokens
  set
    status = 'revoked',
    revoked_at = coalesce(revoked_at, now()),
    revoked_by = coalesce(revoked_by, v_actor_user_id),
    updated_by = v_actor_user_id
  where id = p_token_id;
end;
$$;

create or replace function public.resolve_guest_public_page(
  p_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_token public.guest_public_tokens%rowtype;
  v_guest public.guests%rowtype;
  v_project public.wedding_projects%rowtype;
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
  into v_guest
  from public.guests
  where id = v_token.guest_id
    and project_id = v_token.project_id
    and is_active = true;

  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  select *
  into v_project
  from public.wedding_projects
  where id = v_token.project_id;

  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  if v_project.guest_page_access_status = 'locked' then
    return jsonb_build_object(
      'status', 'locked',
      'preferredLanguage', coalesce(v_guest.preferred_language, v_project.preferred_language, 'fr')
    );
  end if;

  update public.guest_public_tokens
  set last_used_at = now()
  where id = v_token.id;

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
    null,
    'guest_public_pages.accessed',
    'guest_public_token',
    v_token.id,
    null,
    jsonb_build_object(
      'project_id', v_token.project_id,
      'guest_id', v_token.guest_id,
      'mode', 'public'
    ),
    'api'
  );

  return app_private.public_guest_page_payload(v_guest.id, v_token.id, 'public');
end;
$$;

create or replace function public.preview_guest_public_page(
  p_guest_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_guest public.guests%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '28000';
  end if;

  select *
  into v_guest
  from public.guests
  where id = p_guest_id
    and is_active = true;

  if not found then
    raise exception 'Guest was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_guest.project_id, 'guest_public_pages.preview') then
    raise exception 'Guest public page preview permission denied.'
      using errcode = '42501';
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
    'guest_public_pages.previewed',
    'guest',
    v_guest.id,
    null,
    jsonb_build_object(
      'project_id', v_guest.project_id,
      'mode', 'preview'
    ),
    'api'
  );

  return app_private.public_guest_page_payload(v_guest.id, null, 'preview');
end;
$$;

create or replace function public.submit_public_rsvp(
  p_token text,
  p_event_id uuid,
  p_response public.rsvp_status,
  p_preferred_language text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_token public.guest_public_tokens%rowtype;
  v_guest public.guests%rowtype;
  v_project public.wedding_projects%rowtype;
  v_event public.events%rowtype;
  v_previous_status public.rsvp_status;
  v_deadline_state public.rsvp_deadline_state := 'open';
  v_manual_review_required boolean := false;
  v_rsvp_id uuid;
begin
  if p_response not in ('yes', 'no', 'maybe') then
    return jsonb_build_object('status', 'invalid_response');
  end if;

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
  into v_guest
  from public.guests
  where id = v_token.guest_id
    and project_id = v_token.project_id
    and is_active = true;

  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  select *
  into v_project
  from public.wedding_projects
  where id = v_token.project_id;

  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  if v_project.guest_page_access_status = 'locked' then
    return jsonb_build_object('status', 'payment_gate_locked');
  end if;

  if v_guest.is_printed_only then
    return jsonb_build_object('status', 'manual_printed_only');
  end if;

  select e.*
  into v_event
  from public.events e
  join public.guest_event_assignments gea
    on gea.event_id = e.id
    and gea.project_id = e.project_id
  where gea.guest_id = v_guest.id
    and gea.project_id = v_guest.project_id
    and gea.invited = true
    and gea.status = 'assigned'
    and e.id = p_event_id;

  if not found then
    return jsonb_build_object('status', 'not_invited');
  end if;

  select status
  into v_previous_status
  from public.rsvp_records
  where guest_id = v_guest.id
    and event_id = p_event_id;

  if v_previous_status in ('yes', 'no') then
    return jsonb_build_object('status', 'locked_final_response');
  end if;

  if v_event.rsvp_deadline_at is not null and now() > v_event.rsvp_deadline_at then
    v_deadline_state := 'manual_review';
    v_manual_review_required := true;
  end if;

  insert into public.rsvp_records (
    project_id,
    guest_id,
    event_id,
    status,
    source,
    deadline_state,
    manual_review_required,
    submitted_at,
    last_changed_at,
    public_token_id
  )
  values (
    v_guest.project_id,
    v_guest.id,
    p_event_id,
    p_response,
    'public_guest_page',
    v_deadline_state,
    v_manual_review_required,
    now(),
    now(),
    v_token.id
  )
  on conflict (guest_id, event_id)
  do update set
    status = excluded.status,
    source = excluded.source,
    deadline_state = excluded.deadline_state,
    manual_review_required = excluded.manual_review_required,
    submitted_at = excluded.submitted_at,
    last_changed_at = excluded.last_changed_at,
    public_token_id = excluded.public_token_id
  returning id into v_rsvp_id;

  if lower(coalesce(p_preferred_language, '')) in ('fr', 'en') then
    update public.guests
    set preferred_language = lower(p_preferred_language)
    where id = v_guest.id;
  end if;

  return jsonb_build_object(
    'status', 'saved',
    'rsvpId', v_rsvp_id,
    'deadlineState', v_deadline_state,
    'manualReviewRequired', v_manual_review_required
  );
end;
$$;

create or replace function public.get_project_rsvp_summary(
  p_project_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '28000';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, p_project_id, 'rsvps.read') then
    raise exception 'RSVP summary permission denied.'
      using errcode = '42501';
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'eventId', e.id,
          'eventName', e.name,
          'rsvpDeadlineAt', e.rsvp_deadline_at,
          'invitedCount', counts.invited_count,
          'pendingCount', counts.pending_count,
          'yesCount', counts.yes_count,
          'noCount', counts.no_count,
          'maybeCount', counts.maybe_count,
          'manualReviewCount', counts.manual_review_count
        )
        order by e.event_date nulls last, e.created_at
      )
      from public.events e
      cross join lateral (
        select
          count(gea.id)::integer as invited_count,
          count(gea.id) filter (where coalesce(rr.status, 'pending') = 'pending')::integer as pending_count,
          count(gea.id) filter (where rr.status = 'yes')::integer as yes_count,
          count(gea.id) filter (where rr.status = 'no')::integer as no_count,
          count(gea.id) filter (where rr.status = 'maybe')::integer as maybe_count,
          count(gea.id) filter (
            where rr.manual_review_required
              or coalesce(rr.status, 'pending') = 'manual_review'
              or (
                e.rsvp_deadline_at is not null
                and now() > e.rsvp_deadline_at
                and coalesce(rr.status, 'pending') in ('pending', 'maybe')
              )
          )::integer as manual_review_count
        from public.guest_event_assignments gea
        left join public.rsvp_records rr
          on rr.guest_id = gea.guest_id
          and rr.event_id = gea.event_id
        where gea.project_id = e.project_id
          and gea.event_id = e.id
          and gea.invited = true
          and gea.status = 'assigned'
      ) counts
      where e.project_id = p_project_id
    ),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.create_guest_public_token(uuid, timestamptz) from public;
revoke all on function public.revoke_guest_public_token(uuid) from public;
revoke all on function public.resolve_guest_public_page(text) from public;
revoke all on function public.preview_guest_public_page(uuid) from public;
revoke all on function public.submit_public_rsvp(text, uuid, public.rsvp_status, text) from public;
revoke all on function public.get_project_rsvp_summary(uuid) from public;

grant usage on schema public to anon, authenticated;
grant execute on function public.create_guest_public_token(uuid, timestamptz) to authenticated;
grant execute on function public.revoke_guest_public_token(uuid) to authenticated;
grant execute on function public.resolve_guest_public_page(text) to anon, authenticated;
grant execute on function public.preview_guest_public_page(uuid) to authenticated;
grant execute on function public.submit_public_rsvp(text, uuid, public.rsvp_status, text) to anon, authenticated;
grant execute on function public.get_project_rsvp_summary(uuid) to authenticated;

alter table public.guest_public_tokens enable row level security;
alter table public.rsvp_records enable row level security;

drop policy if exists "Guest public tokens visible to token managers" on public.guest_public_tokens;
create policy "Guest public tokens visible to token managers"
on public.guest_public_tokens
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_public_tokens.manage'));

drop policy if exists "Guest public tokens managed by token managers" on public.guest_public_tokens;
create policy "Guest public tokens managed by token managers"
on public.guest_public_tokens
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_public_tokens.manage'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_public_tokens.manage'));

drop policy if exists "RSVP records visible to RSVP readers" on public.rsvp_records;
create policy "RSVP records visible to RSVP readers"
on public.rsvp_records
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'rsvps.read'));

drop policy if exists "RSVP records managed by RSVP managers" on public.rsvp_records;
create policy "RSVP records managed by RSVP managers"
on public.rsvp_records
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'rsvps.manage'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'rsvps.manage'));

grant select, insert, update on public.guest_public_tokens to authenticated;
grant select, insert, update on public.rsvp_records to authenticated;
grant select, insert, update on public.guest_public_tokens to service_role;
grant select, insert, update on public.rsvp_records to service_role;

insert into public.permissions (slug, description, requirement_ids)
values
  ('guest_public_pages.preview', 'Preview guest public pages before the public payment gate is unlocked.', array['RSVP-003', 'TECH-004']),
  ('guest_public_tokens.manage', 'Create, regenerate, and revoke secure guest public-page tokens.', array['RSVP-001', 'TECH-010', 'REP-006']),
  ('rsvps.read', 'Read project RSVP status and summary foundations.', array['RSVP-007', 'RSVP-010', 'RSVP-012']),
  ('rsvps.manage', 'Manage RSVP records and manual RSVP foundations.', array['RSVP-009', 'RSVP-014', 'REP-006'])
on conflict (slug) do update
set
  description = excluded.description,
  requirement_ids = excluded.requirement_ids;

with grants(role_slug, permission_slug) as (
  values
    ('diginoces_admin', 'guest_public_pages.preview'),
    ('diginoces_admin', 'guest_public_tokens.manage'),
    ('diginoces_admin', 'rsvps.read'),
    ('diginoces_admin', 'rsvps.manage'),
    ('operations_manager', 'guest_public_pages.preview'),
    ('operations_manager', 'guest_public_tokens.manage'),
    ('operations_manager', 'rsvps.read'),
    ('operations_manager', 'rsvps.manage'),
    ('couple', 'rsvps.read'),
    ('bride', 'rsvps.read'),
    ('groom', 'rsvps.read')
)
insert into public.role_permissions (role_id, permission_slug)
select r.id, g.permission_slug
from grants g
join public.roles r on r.slug = g.role_slug
join public.permissions p on p.slug = g.permission_slug
on conflict (role_id, permission_slug) do nothing;
