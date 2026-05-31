-- Sprint 12 post-merge lint fix.
-- The original function body initialized an enum variable from an untyped text
-- literal. The database accepted it, but Supabase db lint reports the implicit
-- assignment as a warning. Recreate the function with an explicit enum cast.

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
  v_actor_type public.guest_message_review_actor_type := 'staff'::public.guest_message_review_actor_type;
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

revoke all on function public.review_guest_message(uuid, text, text, text) from public;
grant execute on function public.review_guest_message(uuid, text, text, text) to authenticated, service_role;
