-- Sprint 12 - Guest Wishes, Guest Book & Post-Event Feedback
-- Requirements: WISH-001, WISH-002, WISH-003, WISH-004, WISH-005,
-- WISH-006, WISH-007, WISH-008, FILE-001, FILE-002, FILE-005,
-- FILE-008, REP-005, REP-006, ROLE-005, ROLE-009, TECH-004.
--
-- Scope guard: this migration creates only text guest wishes, moderation,
-- couple review, approved-message CSV export tracking, post-event feedback,
-- testimonial permission, permission, RLS, and audit foundations. It does not
-- add audio/video/photo/file guest submissions, direct Canva API integration,
-- automatic public testimonial publishing, partner scaling, commissions, or AI.

do $$
begin
  create type public.guest_message_status as enum (
    'pending_review',
    'admin_approved',
    'admin_edited',
    'excluded',
    'flagged',
    'couple_approved',
    'couple_correction_requested',
    'exported',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.guest_message_review_action as enum (
    'approve',
    'edit_and_approve',
    'exclude',
    'flag',
    'restore',
    'request_correction'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.guest_message_review_actor_type as enum (
    'admin',
    'staff',
    'couple'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.guest_book_export_status as enum (
    'generated',
    'failed',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.post_event_feedback_review_status as enum (
    'pending',
    'reviewed',
    'approved_for_public_use',
    'rejected'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.wedding_projects
  add column if not exists guest_message_deadline_at timestamptz,
  add column if not exists post_event_feedback_deadline_at timestamptz;

alter table public.events
  add column if not exists guest_message_deadline_at timestamptz;

create table if not exists public.guest_messages (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  guest_id uuid not null,
  event_id uuid,
  public_token_id uuid references public.guest_public_tokens (id) on delete set null,
  original_text text not null,
  current_text text not null,
  approved_text text,
  submitted_language text not null default 'fr',
  status public.guest_message_status not null default 'pending_review',
  submitted_at timestamptz not null default now(),
  last_guest_edited_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  couple_reviewed_by uuid references auth.users (id) on delete set null,
  couple_reviewed_at timestamptz,
  couple_comment text,
  internal_moderation_note text,
  exported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guest_messages_guest_project_match
    foreign key (guest_id, project_id)
    references public.guests (id, project_id)
    on delete cascade,
  constraint guest_messages_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete set null (event_id),
  constraint guest_messages_one_per_guest unique (guest_id),
  constraint guest_messages_original_text_length check (
    length(trim(original_text)) between 1 and 1200
  ),
  constraint guest_messages_current_text_length check (
    length(trim(current_text)) between 1 and 1200
  ),
  constraint guest_messages_approved_text_length check (
    approved_text is null or length(trim(approved_text)) between 1 and 1200
  ),
  constraint guest_messages_language_supported check (submitted_language in ('fr', 'en'))
);

create table if not exists public.guest_message_reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  message_id uuid not null references public.guest_messages (id) on delete cascade,
  action public.guest_message_review_action not null,
  actor_type public.guest_message_review_actor_type not null,
  reviewer_user_id uuid references auth.users (id) on delete set null,
  previous_status public.guest_message_status not null,
  next_status public.guest_message_status not null,
  note text,
  approved_text_snapshot text,
  created_at timestamptz not null default now(),
  constraint guest_message_reviews_note_length check (
    note is null or length(trim(note)) <= 1000
  )
);

create table if not exists public.guest_book_exports (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  version integer not null,
  status public.guest_book_export_status not null default 'generated',
  filename text not null,
  mime_type text not null default 'text/csv',
  storage_bucket text,
  storage_path text,
  file_id uuid references public.files (id) on delete set null,
  row_count integer not null default 0,
  excluded_count integer not null default 0,
  requested_by uuid references auth.users (id) on delete set null,
  generated_at timestamptz not null default now(),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guest_book_exports_version_positive check (version > 0),
  constraint guest_book_exports_row_count_non_negative check (row_count >= 0),
  constraint guest_book_exports_excluded_count_non_negative check (excluded_count >= 0),
  constraint guest_book_exports_filename_not_blank check (length(trim(filename)) > 0),
  constraint guest_book_exports_csv_mime check (mime_type = 'text/csv'),
  constraint guest_book_exports_storage_pair check (
    (storage_bucket is null and storage_path is null)
    or (storage_bucket is not null and storage_path is not null)
  ),
  constraint guest_book_exports_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.post_event_feedback (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  submitted_by uuid references auth.users (id) on delete set null,
  overall_rating integer not null,
  service_quality_rating integer,
  invitation_communication_rating integer,
  feedback_text text not null,
  improvement_suggestions text,
  testimonial_text text,
  testimonial_permission_granted boolean not null default false,
  testimonial_permission_at timestamptz,
  public_display_name text,
  review_status public.post_event_feedback_review_status not null default 'pending',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  internal_review_note text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_event_feedback_one_per_project unique (project_id),
  constraint post_event_feedback_overall_rating_range check (overall_rating between 1 and 5),
  constraint post_event_feedback_service_quality_rating_range check (
    service_quality_rating is null or service_quality_rating between 1 and 5
  ),
  constraint post_event_feedback_invitation_rating_range check (
    invitation_communication_rating is null or invitation_communication_rating between 1 and 5
  ),
  constraint post_event_feedback_text_not_blank check (length(trim(feedback_text)) > 0),
  constraint post_event_feedback_permission_timestamp check (
    (testimonial_permission_granted = false and testimonial_permission_at is null)
    or (testimonial_permission_granted = true and testimonial_permission_at is not null)
  )
);

create table if not exists public.testimonial_permissions (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  feedback_id uuid not null references public.post_event_feedback (id) on delete cascade,
  permission_granted boolean not null default false,
  permission_at timestamptz,
  granted_by uuid references auth.users (id) on delete set null,
  testimonial_text text,
  public_display_name text,
  review_status public.post_event_feedback_review_status not null default 'pending',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  internal_review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint testimonial_permissions_one_per_project unique (project_id),
  constraint testimonial_permissions_one_per_feedback unique (feedback_id),
  constraint testimonial_permissions_permission_timestamp check (
    (permission_granted = false and permission_at is null)
    or (permission_granted = true and permission_at is not null)
  )
);

create unique index if not exists guest_book_exports_project_version_key
  on public.guest_book_exports (project_id, version);

create unique index if not exists guest_book_exports_one_active_per_project
  on public.guest_book_exports (project_id)
  where is_active;

create index if not exists guest_messages_project_status_idx
  on public.guest_messages (project_id, status, updated_at desc);

create index if not exists guest_message_reviews_message_created_idx
  on public.guest_message_reviews (message_id, created_at desc);

create index if not exists post_event_feedback_project_status_idx
  on public.post_event_feedback (project_id, review_status);

drop trigger if exists set_guest_messages_updated_at on public.guest_messages;
create trigger set_guest_messages_updated_at
before update on public.guest_messages
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_guest_book_exports_updated_at on public.guest_book_exports;
create trigger set_guest_book_exports_updated_at
before update on public.guest_book_exports
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_post_event_feedback_updated_at on public.post_event_feedback;
create trigger set_post_event_feedback_updated_at
before update on public.post_event_feedback
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_testimonial_permissions_updated_at on public.testimonial_permissions;
create trigger set_testimonial_permissions_updated_at
before update on public.testimonial_permissions
for each row
execute function app_private.set_updated_at();

create or replace function app_private.audit_guest_wishes_feedback_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  action_name text;
  actor_id uuid;
  changed_object_id uuid;
  changed_object_type text;
begin
  changed_object_id := new.id;

  changed_object_type := case tg_table_name
    when 'guest_messages' then 'guest_message'
    when 'guest_message_reviews' then 'guest_message_review'
    when 'guest_book_exports' then 'guest_book_export'
    when 'post_event_feedback' then 'post_event_feedback'
    when 'testimonial_permissions' then 'testimonial_permission'
    else tg_table_name
  end;

  actor_id := case
    when tg_table_name = 'guest_messages' and tg_op = 'UPDATE' then coalesce(new.reviewed_by, new.couple_reviewed_by, (select auth.uid()))
    when tg_table_name = 'guest_message_reviews' then new.reviewer_user_id
    when tg_table_name = 'guest_book_exports' then new.requested_by
    when tg_table_name = 'post_event_feedback' then coalesce(new.reviewed_by, new.submitted_by, (select auth.uid()))
    when tg_table_name = 'testimonial_permissions' then coalesce(new.reviewed_by, new.granted_by, (select auth.uid()))
    else (select auth.uid())
  end;

  action_name := case
    when tg_table_name = 'guest_messages' and tg_op = 'INSERT' then 'guest_messages.submitted'
    when tg_table_name = 'guest_messages' and tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'admin_approved' then 'guest_messages.approved'
    when tg_table_name = 'guest_messages' and tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'admin_edited' then 'guest_messages.edited_by_admin'
    when tg_table_name = 'guest_messages' and tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'excluded' then 'guest_messages.excluded'
    when tg_table_name = 'guest_messages' and tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'flagged' then 'guest_messages.flagged'
    when tg_table_name = 'guest_messages' and tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'couple_approved' then 'guest_messages.couple_approved'
    when tg_table_name = 'guest_messages' and tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'couple_correction_requested' then 'guest_messages.couple_correction_requested'
    when tg_table_name = 'guest_messages' and tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'exported' then 'guest_messages.exported'
    when tg_table_name = 'guest_messages' and tg_op = 'UPDATE' then 'guest_messages.edited'
    when tg_table_name = 'guest_message_reviews' and new.actor_type = 'couple' then 'guest_messages.couple_reviewed'
    when tg_table_name = 'guest_message_reviews' then 'guest_messages.moderated'
    when tg_table_name = 'guest_book_exports' and tg_op = 'INSERT' then 'guest_book_exports.generated'
    when tg_table_name = 'guest_book_exports' and tg_op = 'UPDATE' then 'guest_book_exports.updated'
    when tg_table_name = 'post_event_feedback' and tg_op = 'INSERT' then 'post_event_feedback.submitted'
    when tg_table_name = 'post_event_feedback' and tg_op = 'UPDATE' and old.testimonial_permission_granted is distinct from new.testimonial_permission_granted then 'post_event_feedback.testimonial_permission_changed'
    when tg_table_name = 'post_event_feedback' and tg_op = 'UPDATE' then 'post_event_feedback.reviewed'
    when tg_table_name = 'testimonial_permissions' and tg_op = 'INSERT' then 'testimonial_permissions.recorded'
    when tg_table_name = 'testimonial_permissions' and tg_op = 'UPDATE' then 'testimonial_permissions.reviewed'
    else lower(tg_table_name || '.' || tg_op)
  end;

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
    case
      when tg_op = 'UPDATE' then to_jsonb(old) - 'internal_moderation_note' - 'internal_review_note'
      else null
    end,
    case
      when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) - 'internal_moderation_note' - 'internal_review_note'
      else null
    end,
    'api'
  );

  return new;
end;
$$;

revoke all on function app_private.audit_guest_wishes_feedback_change() from public;

drop trigger if exists audit_guest_messages_insert on public.guest_messages;
create trigger audit_guest_messages_insert
after insert on public.guest_messages
for each row
execute function app_private.audit_guest_wishes_feedback_change();

drop trigger if exists audit_guest_messages_update on public.guest_messages;
create trigger audit_guest_messages_update
after update on public.guest_messages
for each row
execute function app_private.audit_guest_wishes_feedback_change();

drop trigger if exists audit_guest_message_reviews_insert on public.guest_message_reviews;
create trigger audit_guest_message_reviews_insert
after insert on public.guest_message_reviews
for each row
execute function app_private.audit_guest_wishes_feedback_change();

drop trigger if exists audit_guest_book_exports_insert on public.guest_book_exports;
create trigger audit_guest_book_exports_insert
after insert on public.guest_book_exports
for each row
execute function app_private.audit_guest_wishes_feedback_change();

drop trigger if exists audit_guest_book_exports_update on public.guest_book_exports;
create trigger audit_guest_book_exports_update
after update on public.guest_book_exports
for each row
execute function app_private.audit_guest_wishes_feedback_change();

drop trigger if exists audit_post_event_feedback_insert on public.post_event_feedback;
create trigger audit_post_event_feedback_insert
after insert on public.post_event_feedback
for each row
execute function app_private.audit_guest_wishes_feedback_change();

drop trigger if exists audit_post_event_feedback_update on public.post_event_feedback;
create trigger audit_post_event_feedback_update
after update on public.post_event_feedback
for each row
execute function app_private.audit_guest_wishes_feedback_change();

drop trigger if exists audit_testimonial_permissions_insert on public.testimonial_permissions;
create trigger audit_testimonial_permissions_insert
after insert on public.testimonial_permissions
for each row
execute function app_private.audit_guest_wishes_feedback_change();

drop trigger if exists audit_testimonial_permissions_update on public.testimonial_permissions;
create trigger audit_testimonial_permissions_update
after update on public.testimonial_permissions
for each row
execute function app_private.audit_guest_wishes_feedback_change();

create or replace function app_private.guest_message_deadline(
  p_project_id uuid,
  p_event_id uuid default null
)
returns timestamptz
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select e.guest_message_deadline_at from public.events e where e.id = p_event_id and e.project_id = p_project_id),
    (select wp.guest_message_deadline_at from public.wedding_projects wp where wp.id = p_project_id)
  );
$$;

revoke all on function app_private.guest_message_deadline(uuid, uuid) from public;

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
      'guestPageAccessStatus', wp.guest_page_access_status,
      'guestMessageDeadlineAt', wp.guest_message_deadline_at
    ),
    'guestMessage', (
      select case
        when gm.id is null then jsonb_build_object(
          'status', 'not_submitted',
          'messageId', null,
          'currentText', null,
          'approvedText', null,
          'submittedAt', null,
          'lastGuestEditedAt', null,
          'deadlineAt', app_private.guest_message_deadline(g.project_id, null)
        )
        else jsonb_build_object(
          'status', gm.status,
          'messageId', gm.id,
          'currentText', gm.current_text,
          'approvedText', gm.approved_text,
          'submittedAt', gm.submitted_at,
          'lastGuestEditedAt', gm.last_guest_edited_at,
          'deadlineAt', app_private.guest_message_deadline(gm.project_id, gm.event_id)
        )
      end
      from public.guest_messages gm
      where gm.guest_id = g.id
      union all
      select jsonb_build_object(
        'status', 'not_submitted',
        'messageId', null,
        'currentText', null,
        'approvedText', null,
        'submittedAt', null,
        'lastGuestEditedAt', null,
        'deadlineAt', app_private.guest_message_deadline(g.project_id, null)
      )
      where not exists (select 1 from public.guest_messages gm where gm.guest_id = g.id)
      limit 1
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
            'guestMessageDeadlineAt', e.guest_message_deadline_at,
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

create or replace function public.list_couple_guest_messages(
  p_project_id uuid
)
returns table (
  id uuid,
  guest_display_name text,
  approved_text text,
  couple_comment text,
  status public.guest_message_status,
  submitted_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    gm.id,
    g.display_name as guest_display_name,
    gm.approved_text,
    gm.couple_comment,
    gm.status,
    gm.submitted_at
  from public.guest_messages gm
  join public.guests g
    on g.id = gm.guest_id
    and g.project_id = gm.project_id
  where gm.project_id = p_project_id
    and (select auth.uid()) is not null
    and app_private.user_can_access_project((select auth.uid()), p_project_id, 'guest_messages.couple_review')
    and gm.status in ('admin_approved', 'admin_edited', 'couple_approved', 'couple_correction_requested', 'excluded')
  order by gm.submitted_at, gm.id;
$$;

create or replace function public.submit_public_guest_message(
  p_token text,
  p_message_text text,
  p_language text default null,
  p_event_id uuid default null
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
  v_deadline_at timestamptz;
  v_message_id uuid;
  v_normalized_text text := trim(coalesce(p_message_text, ''));
  v_language text := lower(coalesce(p_language, 'fr'));
  v_existing public.guest_messages%rowtype;
  v_event_id uuid;
  v_has_existing boolean := false;
  v_result_status text := 'created';
begin
  if length(v_normalized_text) < 1 or length(v_normalized_text) > 1200 then
    return jsonb_build_object('status', 'invalid_message_text');
  end if;

  if v_language not in ('fr', 'en') then
    v_language := 'fr';
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

  if v_guest.is_printed_only then
    return jsonb_build_object('status', 'manual_printed_only');
  end if;

  select *
  into v_project
  from public.wedding_projects
  where id = v_guest.project_id;

  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  if v_project.guest_page_access_status = 'locked' then
    return jsonb_build_object('status', 'payment_gate_locked');
  end if;

  if p_event_id is not null and not exists (
    select 1
    from public.guest_event_assignments gea
    where gea.project_id = v_guest.project_id
      and gea.guest_id = v_guest.id
      and gea.event_id = p_event_id
      and gea.invited = true
      and gea.status = 'assigned'
  ) then
    return jsonb_build_object('status', 'not_invited');
  end if;

  select *
  into v_existing
  from public.guest_messages
  where guest_id = v_guest.id
  for update;

  v_has_existing := found;
  v_event_id := case
    when v_has_existing then coalesce(p_event_id, v_existing.event_id)
    else p_event_id
  end;

  if v_has_existing and v_existing.status not in ('pending_review', 'couple_correction_requested') then
    return jsonb_build_object('status', 'message_locked');
  end if;

  v_deadline_at := app_private.guest_message_deadline(v_guest.project_id, v_event_id);

  if v_deadline_at is not null and now() > v_deadline_at then
    return jsonb_build_object('status', 'deadline_passed');
  end if;

  if v_has_existing then
    v_result_status := 'updated';

    update public.guest_messages
    set
      current_text = v_normalized_text,
      approved_text = null,
      submitted_language = v_language,
      status = 'pending_review',
      last_guest_edited_at = now(),
      event_id = v_event_id,
      public_token_id = v_token.id,
      reviewed_by = null,
      reviewed_at = null,
      internal_moderation_note = null,
      couple_reviewed_by = null,
      couple_reviewed_at = null,
      couple_comment = null
    where id = v_existing.id
    returning id into v_message_id;
  else
    insert into public.guest_messages (
      project_id,
      guest_id,
      event_id,
      public_token_id,
      original_text,
      current_text,
      submitted_language,
      status,
      submitted_at
    )
    values (
      v_guest.project_id,
      v_guest.id,
      v_event_id,
      v_token.id,
      v_normalized_text,
      v_normalized_text,
      v_language,
      'pending_review',
      now()
    )
    returning id into v_message_id;
  end if;

  return jsonb_build_object(
    'status', 'saved',
    'mode', v_result_status,
    'messageId', v_message_id
  );
end;
$$;

create or replace function public.review_guest_message(
  p_message_id uuid,
  p_action text,
  p_approved_text text default null,
  p_internal_note text default null
)
returns public.guest_messages
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_message public.guest_messages%rowtype;
  v_previous_status public.guest_message_status;
  v_next_status public.guest_message_status;
  v_approved_text text;
  v_actor_type public.guest_message_review_actor_type := 'staff';
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '28000';
  end if;

  select *
  into v_message
  from public.guest_messages
  where id = p_message_id
  for update;

  if not found then
    raise exception 'Guest message was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_message.project_id, 'guest_messages.moderate') then
    raise exception 'Guest message moderation permission denied.'
      using errcode = '42501';
  end if;

  select case
    when exists (
      select 1
      from public.role_assignments ra
      join public.roles r on r.id = ra.role_id
      where ra.user_id = v_actor_user_id
        and r.slug = 'diginoces_admin'
        and ra.scope = r.scope
        and (ra.expires_at is null or ra.expires_at > now())
    )
    then 'admin'::public.guest_message_review_actor_type
    else 'staff'::public.guest_message_review_actor_type
  end
  into v_actor_type;

  v_previous_status := v_message.status;
  v_next_status := case p_action
    when 'approve' then 'admin_approved'::public.guest_message_status
    when 'edit_and_approve' then 'admin_edited'::public.guest_message_status
    when 'exclude' then 'excluded'::public.guest_message_status
    when 'flag' then 'flagged'::public.guest_message_status
    when 'restore' then 'pending_review'::public.guest_message_status
    else null
  end;

  if v_next_status is null then
    raise exception 'Unsupported guest message moderation action.'
      using errcode = '22023';
  end if;

  v_approved_text := case
    when p_action = 'approve' then v_message.current_text
    when p_action = 'edit_and_approve' then trim(coalesce(p_approved_text, ''))
    when p_action = 'restore' then null
    else v_message.approved_text
  end;

  if p_action = 'edit_and_approve' and length(v_approved_text) < 1 then
    raise exception 'Approved text is required for admin edits.'
      using errcode = '22023';
  end if;

  update public.guest_messages
  set
    approved_text = v_approved_text,
    status = v_next_status,
    reviewed_by = v_actor_user_id,
    reviewed_at = now(),
    internal_moderation_note = nullif(trim(coalesce(p_internal_note, '')), '')
  where id = p_message_id
  returning * into v_message;

  insert into public.guest_message_reviews (
    project_id,
    message_id,
    action,
    actor_type,
    reviewer_user_id,
    previous_status,
    next_status,
    note,
    approved_text_snapshot
  )
  values (
    v_message.project_id,
    v_message.id,
    p_action::public.guest_message_review_action,
    v_actor_type,
    v_actor_user_id,
    v_previous_status,
    v_next_status,
    nullif(trim(coalesce(p_internal_note, '')), ''),
    v_message.approved_text
  );

  return v_message;
end;
$$;

create or replace function public.couple_review_guest_message(
  p_message_id uuid,
  p_action text,
  p_comment text default null
)
returns public.guest_messages
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_message public.guest_messages%rowtype;
  v_previous_status public.guest_message_status;
  v_next_status public.guest_message_status;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '28000';
  end if;

  select *
  into v_message
  from public.guest_messages
  where id = p_message_id
  for update;

  if not found then
    raise exception 'Guest message was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_message.project_id, 'guest_messages.couple_review') then
    raise exception 'Guest message couple review permission denied.'
      using errcode = '42501';
  end if;

  if v_message.status not in ('admin_approved', 'admin_edited', 'couple_correction_requested') then
    raise exception 'Only moderated messages can enter couple review.'
      using errcode = '22023';
  end if;

  if v_message.approved_text is null and p_action = 'approve' then
    raise exception 'Approved text is required before couple approval.'
      using errcode = '22023';
  end if;

  v_previous_status := v_message.status;
  v_next_status := case p_action
    when 'approve' then 'couple_approved'::public.guest_message_status
    when 'exclude' then 'excluded'::public.guest_message_status
    when 'request_correction' then 'couple_correction_requested'::public.guest_message_status
    else null
  end;

  if v_next_status is null then
    raise exception 'Unsupported couple review action.'
      using errcode = '22023';
  end if;

  update public.guest_messages
  set
    status = v_next_status,
    couple_reviewed_by = v_actor_user_id,
    couple_reviewed_at = now(),
    couple_comment = nullif(trim(coalesce(p_comment, '')), '')
  where id = p_message_id
  returning * into v_message;

  insert into public.guest_message_reviews (
    project_id,
    message_id,
    action,
    actor_type,
    reviewer_user_id,
    previous_status,
    next_status,
    note,
    approved_text_snapshot
  )
  values (
    v_message.project_id,
    v_message.id,
    p_action::public.guest_message_review_action,
    'couple',
    v_actor_user_id,
    v_previous_status,
    v_next_status,
    nullif(trim(coalesce(p_comment, '')), ''),
    v_message.approved_text
  );

  return v_message;
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

  insert into public.files (
    scope_type,
    scope_id,
    bucket,
    storage_path,
    category,
    version,
    is_active,
    created_by
  )
  values (
    'project',
    p_project_id,
    'project-files',
    v_storage_path,
    'guest_book_exports',
    v_version,
    true,
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
      'source', 'Sprint 12 Canva CSV export foundation'
    )
  )
  returning * into v_export;

  return v_export;
end;
$$;

create or replace function public.submit_post_event_feedback(
  p_project_id uuid,
  p_overall_rating integer,
  p_service_quality_rating integer default null,
  p_invitation_communication_rating integer default null,
  p_feedback_text text default null,
  p_improvement_suggestions text default null,
  p_testimonial_text text default null,
  p_testimonial_permission_granted boolean default false,
  p_public_display_name text default null
)
returns public.post_event_feedback
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_feedback public.post_event_feedback;
  v_feedback_text text := trim(coalesce(p_feedback_text, ''));
  v_permission_at timestamptz := null;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '28000';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, p_project_id, 'post_event_feedback.submit') then
    raise exception 'Post-event feedback permission denied.'
      using errcode = '42501';
  end if;

  if p_overall_rating not between 1 and 5 then
    raise exception 'Overall rating must be between 1 and 5.'
      using errcode = '22023';
  end if;

  if p_service_quality_rating is not null and p_service_quality_rating not between 1 and 5 then
    raise exception 'Service quality rating must be between 1 and 5.'
      using errcode = '22023';
  end if;

  if p_invitation_communication_rating is not null and p_invitation_communication_rating not between 1 and 5 then
    raise exception 'Invitation communication rating must be between 1 and 5.'
      using errcode = '22023';
  end if;

  if length(v_feedback_text) < 1 then
    raise exception 'Feedback text is required.'
      using errcode = '22023';
  end if;

  if p_testimonial_permission_granted then
    v_permission_at := now();
  end if;

  insert into public.post_event_feedback (
    project_id,
    submitted_by,
    overall_rating,
    service_quality_rating,
    invitation_communication_rating,
    feedback_text,
    improvement_suggestions,
    testimonial_text,
    testimonial_permission_granted,
    testimonial_permission_at,
    public_display_name,
    review_status,
    submitted_at
  )
  values (
    p_project_id,
    v_actor_user_id,
    p_overall_rating,
    p_service_quality_rating,
    p_invitation_communication_rating,
    v_feedback_text,
    nullif(trim(coalesce(p_improvement_suggestions, '')), ''),
    nullif(trim(coalesce(p_testimonial_text, '')), ''),
    p_testimonial_permission_granted,
    v_permission_at,
    nullif(trim(coalesce(p_public_display_name, '')), ''),
    'pending',
    now()
  )
  on conflict (project_id)
  do update set
    submitted_by = excluded.submitted_by,
    overall_rating = excluded.overall_rating,
    service_quality_rating = excluded.service_quality_rating,
    invitation_communication_rating = excluded.invitation_communication_rating,
    feedback_text = excluded.feedback_text,
    improvement_suggestions = excluded.improvement_suggestions,
    testimonial_text = excluded.testimonial_text,
    testimonial_permission_granted = excluded.testimonial_permission_granted,
    testimonial_permission_at = excluded.testimonial_permission_at,
    public_display_name = excluded.public_display_name,
    review_status = 'pending',
    reviewed_by = null,
    reviewed_at = null,
    internal_review_note = null,
    submitted_at = excluded.submitted_at
  returning * into v_feedback;

  insert into public.testimonial_permissions (
    project_id,
    feedback_id,
    permission_granted,
    permission_at,
    granted_by,
    testimonial_text,
    public_display_name,
    review_status
  )
  values (
    p_project_id,
    v_feedback.id,
    p_testimonial_permission_granted,
    v_permission_at,
    v_actor_user_id,
    v_feedback.testimonial_text,
    v_feedback.public_display_name,
    'pending'
  )
  on conflict (project_id)
  do update set
    feedback_id = excluded.feedback_id,
    permission_granted = excluded.permission_granted,
    permission_at = excluded.permission_at,
    granted_by = excluded.granted_by,
    testimonial_text = excluded.testimonial_text,
    public_display_name = excluded.public_display_name,
    review_status = 'pending',
    reviewed_by = null,
    reviewed_at = null,
    internal_review_note = null;

  return v_feedback;
end;
$$;

create or replace function public.review_post_event_feedback(
  p_feedback_id uuid,
  p_review_status public.post_event_feedback_review_status,
  p_internal_review_note text default null
)
returns public.post_event_feedback
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_feedback public.post_event_feedback%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '28000';
  end if;

  select *
  into v_feedback
  from public.post_event_feedback
  where id = p_feedback_id
  for update;

  if not found then
    raise exception 'Post-event feedback was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_feedback.project_id, 'post_event_feedback.review') then
    raise exception 'Post-event feedback review permission denied.'
      using errcode = '42501';
  end if;

  if p_review_status = 'approved_for_public_use' and (
    not v_feedback.testimonial_permission_granted
    or v_feedback.testimonial_text is null
    or length(trim(v_feedback.testimonial_text)) = 0
  ) then
    raise exception 'Public testimonial approval requires couple permission and testimonial text.'
      using errcode = '22023';
  end if;

  update public.post_event_feedback
  set
    review_status = p_review_status,
    reviewed_by = v_actor_user_id,
    reviewed_at = now(),
    internal_review_note = nullif(trim(coalesce(p_internal_review_note, '')), '')
  where id = p_feedback_id
  returning * into v_feedback;

  update public.testimonial_permissions
  set
    review_status = p_review_status,
    reviewed_by = v_actor_user_id,
    reviewed_at = now(),
    internal_review_note = nullif(trim(coalesce(p_internal_review_note, '')), '')
  where feedback_id = p_feedback_id;

  return v_feedback;
end;
$$;

create or replace function public.list_post_event_feedback(
  p_project_id uuid
)
returns table (
  id uuid,
  feedback_text text,
  improvement_suggestions text,
  invitation_communication_rating integer,
  overall_rating integer,
  public_display_name text,
  review_status public.post_event_feedback_review_status,
  service_quality_rating integer,
  submitted_at timestamptz,
  testimonial_permission_granted boolean,
  testimonial_text text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    f.id,
    f.feedback_text,
    f.improvement_suggestions,
    f.invitation_communication_rating,
    f.overall_rating,
    f.public_display_name,
    f.review_status,
    f.service_quality_rating,
    f.submitted_at,
    f.testimonial_permission_granted,
    f.testimonial_text
  from public.post_event_feedback f
  where f.project_id = p_project_id
    and (select auth.uid()) is not null
    and (
      app_private.user_can_access_project((select auth.uid()), p_project_id, 'post_event_feedback.review')
      or app_private.user_can_access_project((select auth.uid()), p_project_id, 'post_event_feedback.read')
    )
  order by f.submitted_at desc, f.id;
$$;

revoke all on function public.submit_public_guest_message(text, text, text, uuid) from public;
revoke all on function public.list_couple_guest_messages(uuid) from public;
revoke all on function public.review_guest_message(uuid, text, text, text) from public;
revoke all on function public.couple_review_guest_message(uuid, text, text) from public;
revoke all on function public.create_guest_book_export(uuid) from public;
revoke all on function public.submit_post_event_feedback(uuid, integer, integer, integer, text, text, text, boolean, text) from public;
revoke all on function public.review_post_event_feedback(uuid, public.post_event_feedback_review_status, text) from public;
revoke all on function public.list_post_event_feedback(uuid) from public;

grant execute on function public.submit_public_guest_message(text, text, text, uuid) to anon, authenticated;
grant execute on function public.list_couple_guest_messages(uuid) to authenticated, service_role;
grant execute on function public.review_guest_message(uuid, text, text, text) to authenticated, service_role;
grant execute on function public.couple_review_guest_message(uuid, text, text) to authenticated, service_role;
grant execute on function public.create_guest_book_export(uuid) to authenticated, service_role;
grant execute on function public.submit_post_event_feedback(uuid, integer, integer, integer, text, text, text, boolean, text) to authenticated, service_role;
grant execute on function public.review_post_event_feedback(uuid, public.post_event_feedback_review_status, text) to authenticated, service_role;
grant execute on function public.list_post_event_feedback(uuid) to authenticated, service_role;

alter table public.guest_messages enable row level security;
alter table public.guest_message_reviews enable row level security;
alter table public.guest_book_exports enable row level security;
alter table public.post_event_feedback enable row level security;
alter table public.testimonial_permissions enable row level security;

drop policy if exists "Guest messages visible to wish readers" on public.guest_messages;
-- Direct guest_messages reads require moderation permission so couple review
-- callers must use list_couple_guest_messages, which returns sanitized fields
-- and hides internal_moderation_note while filtering to couple-visible statuses.
create policy "Guest messages visible to wish readers"
on public.guest_messages
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'guest_messages.moderate')
);

drop policy if exists "Guest messages managed by moderators" on public.guest_messages;
create policy "Guest messages managed by moderators"
on public.guest_messages
for update
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_messages.moderate'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_messages.moderate'));

drop policy if exists "Guest message reviews visible to moderators" on public.guest_message_reviews;
create policy "Guest message reviews visible to moderators"
on public.guest_message_reviews
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_messages.moderate'));

drop policy if exists "Guest-book exports visible to export readers" on public.guest_book_exports;
create policy "Guest-book exports visible to export readers"
on public.guest_book_exports
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'guest_book_exports.read')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'guest_book_exports.create')
);

drop policy if exists "Guest-book exports managed by export creators" on public.guest_book_exports;
create policy "Guest-book exports managed by export creators"
on public.guest_book_exports
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_book_exports.create'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_book_exports.create'));

drop policy if exists "Post-event feedback visible to scoped readers" on public.post_event_feedback;
create policy "Post-event feedback visible to scoped readers"
on public.post_event_feedback
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'post_event_feedback.review')
);

drop policy if exists "Post-event feedback submitted by scoped couples" on public.post_event_feedback;
create policy "Post-event feedback submitted by scoped couples"
on public.post_event_feedback
for insert
to authenticated
with check (
  submitted_by = (select auth.uid())
  and app_private.user_can_access_project((select auth.uid()), project_id, 'post_event_feedback.submit')
);

drop policy if exists "Post-event feedback reviewed by authorized reviewers" on public.post_event_feedback;
create policy "Post-event feedback reviewed by authorized reviewers"
on public.post_event_feedback
for update
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'post_event_feedback.review')
)
with check (
  app_private.user_can_access_project((select auth.uid()), project_id, 'post_event_feedback.review')
);

drop policy if exists "Testimonial permissions visible to feedback readers" on public.testimonial_permissions;
create policy "Testimonial permissions visible to feedback readers"
on public.testimonial_permissions
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'post_event_feedback.review')
);

drop policy if exists "Testimonial permissions reviewed by feedback reviewers" on public.testimonial_permissions;
create policy "Testimonial permissions reviewed by feedback reviewers"
on public.testimonial_permissions
for update
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'post_event_feedback.review'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'post_event_feedback.review'));

grant select, update on public.guest_messages to authenticated;
grant select on public.guest_message_reviews to authenticated;
grant select, insert, update on public.guest_book_exports to authenticated;
grant select, insert, update on public.post_event_feedback to authenticated;
grant select, insert, update on public.testimonial_permissions to authenticated;

grant select, insert, update on public.guest_messages to service_role;
grant select, insert on public.guest_message_reviews to service_role;
grant select, insert, update on public.guest_book_exports to service_role;
grant select, insert, update on public.post_event_feedback to service_role;
grant select, insert, update on public.testimonial_permissions to service_role;

insert into public.permissions (slug, description, requirement_ids)
values
  ('guest_messages.read', 'Read project guest-message/wish records for authorized guest-book workflows.', array['WISH-004', 'WISH-006', 'TECH-004']),
  ('guest_messages.moderate', 'Moderate, edit, approve, flag, or exclude submitted guest messages.', array['WISH-004', 'WISH-005', 'REP-006']),
  ('guest_messages.couple_review', 'Review prepared guest messages as an authorized bride/groom/couple user.', array['WISH-006', 'ROLE-005']),
  ('guest_book_exports.read', 'Read guest-book export metadata for authorized project users.', array['WISH-008', 'FILE-008']),
  ('guest_book_exports.create', 'Generate approved-message Canva CSV export metadata and project file records.', array['WISH-007', 'WISH-008', 'FILE-008', 'REP-005']),
  ('post_event_feedback.submit', 'Submit post-event satisfaction feedback and testimonial permission for a project.', array['WISH-008', 'ROLE-005']),
  ('post_event_feedback.read', 'Read project post-event feedback where authorized.', array['TECH-004']),
  ('post_event_feedback.review', 'Review feedback and testimonial permission for public-use eligibility.', array['REP-006', 'TECH-004'])
on conflict (slug) do update
set
  description = excluded.description,
  requirement_ids = excluded.requirement_ids;

with sprint_12_grants(role_slug, permission_slug) as (
  values
    ('diginoces_admin', 'guest_messages.read'),
    ('diginoces_admin', 'guest_messages.moderate'),
    ('diginoces_admin', 'guest_messages.couple_review'),
    ('diginoces_admin', 'guest_book_exports.read'),
    ('diginoces_admin', 'guest_book_exports.create'),
    ('diginoces_admin', 'post_event_feedback.submit'),
    ('diginoces_admin', 'post_event_feedback.read'),
    ('diginoces_admin', 'post_event_feedback.review'),
    ('operations_manager', 'guest_messages.read'),
    ('operations_manager', 'guest_messages.moderate'),
    ('operations_manager', 'guest_messages.couple_review'),
    ('operations_manager', 'guest_book_exports.read'),
    ('operations_manager', 'guest_book_exports.create'),
    ('operations_manager', 'post_event_feedback.submit'),
    ('operations_manager', 'post_event_feedback.read'),
    ('operations_manager', 'post_event_feedback.review'),
    ('couple', 'guest_messages.read'),
    ('couple', 'guest_messages.couple_review'),
    ('couple', 'guest_book_exports.read'),
    ('couple', 'post_event_feedback.submit'),
    ('couple', 'post_event_feedback.read'),
    ('bride', 'guest_messages.read'),
    ('bride', 'guest_messages.couple_review'),
    ('bride', 'guest_book_exports.read'),
    ('bride', 'post_event_feedback.submit'),
    ('bride', 'post_event_feedback.read'),
    ('groom', 'guest_messages.read'),
    ('groom', 'guest_messages.couple_review'),
    ('groom', 'guest_book_exports.read'),
    ('groom', 'post_event_feedback.submit'),
    ('groom', 'post_event_feedback.read')
)
insert into public.role_permissions (role_id, permission_slug)
select r.id, g.permission_slug
from sprint_12_grants g
join public.roles r on r.slug = g.role_slug
join public.permissions p on p.slug = g.permission_slug
on conflict (role_id, permission_slug) do nothing;

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;
