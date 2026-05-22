-- Sprint 5 CodeRabbit final review fixes.
-- Harden token-regeneration chains and make RSVP submitted_at preservation explicit.

comment on column public.guest_public_tokens.regenerated_from_token_id is
  'Previous token in the regeneration chain. app_private.validate_guest_public_token_regeneration_chain prevents cycles and caps traversal at 25 tokens.';

create or replace function app_private.validate_guest_public_token_regeneration_chain()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cursor uuid := new.regenerated_from_token_id;
  v_next uuid;
  v_depth integer := 0;
  v_max_depth constant integer := 25;
begin
  if new.regenerated_from_token_id is null then
    return new;
  end if;

  while v_cursor is not null loop
    v_depth := v_depth + 1;

    if v_cursor = new.id then
      raise exception 'Guest public token regeneration chain cannot contain a cycle.'
        using errcode = '23514';
    end if;

    if v_depth > v_max_depth then
      raise exception 'Guest public token regeneration chain exceeds % tokens.', v_max_depth
        using errcode = '23514';
    end if;

    select gpt.regenerated_from_token_id
    into v_next
    from public.guest_public_tokens gpt
    where gpt.id = v_cursor;

    if not found then
      exit;
    end if;

    v_cursor := v_next;
  end loop;

  return new;
end;
$$;

revoke all on function app_private.validate_guest_public_token_regeneration_chain() from public;

drop trigger if exists validate_guest_public_token_regeneration_chain on public.guest_public_tokens;
create trigger validate_guest_public_token_regeneration_chain
before insert or update of regenerated_from_token_id on public.guest_public_tokens
for each row
execute function app_private.validate_guest_public_token_regeneration_chain();

create or replace function app_private.submit_public_rsvp(
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

  if v_previous_status in ('yes'::public.rsvp_status, 'no'::public.rsvp_status) then
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
