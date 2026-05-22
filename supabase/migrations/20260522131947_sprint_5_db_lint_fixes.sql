-- Sprint 5 db lint follow-up:
-- - qualify guest public token references that collide with table-return aliases
-- - cast RSVP enum literals used in PL/pgSQL defaults/comparisons

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

  select g.*
  into v_guest
  from public.guests g
  where g.id = p_guest_id
    and g.is_active = true;

  if not found then
    raise exception 'Guest was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_guest.project_id, 'guest_public_tokens.manage') then
    raise exception 'Guest public token permission denied.'
      using errcode = '42501';
  end if;

  select gpt.id
  into v_previous_token_id
  from public.guest_public_tokens gpt
  where gpt.guest_id = p_guest_id
    and gpt.token_type = 'guest_public_page'::public.guest_public_token_type
    and gpt.status = 'active'::public.guest_public_token_status
  order by gpt.created_at desc
  limit 1;

  update public.guest_public_tokens as gpt
  set
    status = 'revoked'::public.guest_public_token_status,
    revoked_at = now(),
    revoked_by = v_actor_user_id,
    updated_by = v_actor_user_id
  where gpt.guest_id = p_guest_id
    and gpt.token_type = 'guest_public_page'::public.guest_public_token_type
    and gpt.status = 'active'::public.guest_public_token_status;

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
    'guest_public_page'::public.guest_public_token_type,
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    v_token_preview,
    'active'::public.guest_public_token_status,
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
  v_deadline_state public.rsvp_deadline_state := 'open'::public.rsvp_deadline_state;
  v_manual_review_required boolean := false;
  v_rsvp_id uuid;
begin
  if p_response not in (
    'yes'::public.rsvp_status,
    'no'::public.rsvp_status,
    'maybe'::public.rsvp_status
  ) then
    return jsonb_build_object('status', 'invalid_response');
  end if;

  select gpt.*
  into v_token
  from public.guest_public_tokens gpt
  where gpt.token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
    and gpt.token_type = 'guest_public_page'::public.guest_public_token_type
    and gpt.status = 'active'::public.guest_public_token_status
    and (gpt.expires_at is null or gpt.expires_at > now());

  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  select g.*
  into v_guest
  from public.guests g
  where g.id = v_token.guest_id
    and g.project_id = v_token.project_id
    and g.is_active = true;

  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  select wp.*
  into v_project
  from public.wedding_projects wp
  where wp.id = v_token.project_id;

  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  if v_project.guest_page_access_status = 'locked'::public.guest_page_access_status then
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
    and gea.status = 'assigned'::public.guest_event_assignment_status
    and e.id = p_event_id;

  if not found then
    return jsonb_build_object('status', 'not_invited');
  end if;

  select rr.status
  into v_previous_status
  from public.rsvp_records rr
  where rr.guest_id = v_guest.id
    and rr.event_id = p_event_id;

  if v_previous_status in (
    'yes'::public.rsvp_status,
    'no'::public.rsvp_status,
    'locked'::public.rsvp_status
  ) then
    return jsonb_build_object('status', 'locked_final_response');
  end if;

  if v_event.rsvp_deadline_at is not null and now() > v_event.rsvp_deadline_at then
    v_deadline_state := 'manual_review'::public.rsvp_deadline_state;
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
    'public_guest_page'::public.rsvp_source,
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
    submitted_at = coalesce(public.rsvp_records.submitted_at, excluded.submitted_at),
    last_changed_at = excluded.last_changed_at,
    public_token_id = excluded.public_token_id
  returning id into v_rsvp_id;

  if lower(coalesce(p_preferred_language, '')) in ('fr', 'en') then
    update public.guests as g
    set preferred_language = lower(p_preferred_language)
    where g.id = v_guest.id;
  end if;

  return jsonb_build_object(
    'status', 'saved',
    'rsvpId', v_rsvp_id,
    'deadlineState', v_deadline_state,
    'manualReviewRequired', v_manual_review_required
  );
end;
$$;
