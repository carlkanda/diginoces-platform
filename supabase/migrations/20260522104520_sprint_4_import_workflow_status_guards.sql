-- Sprint 4 CodeRabbit review fixes: import workflow status guards.
-- Requirements: GM-004, GM-005, ROLE-005, TECH-004.

create or replace function public.submit_guest_import_session(
  p_import_session_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_session public.guest_import_sessions%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  select *
  into v_session
  from public.guest_import_sessions
  where id = p_import_session_id;

  if v_session.id is null then
    raise exception 'Guest import session was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_session.project_id, 'guest_imports.submit')
    or not app_private.user_can_manage_guest_side(v_actor_user_id, v_session.project_id, v_session.import_side) then
    raise exception 'Guest import submit permission denied.'
      using errcode = '42501';
  end if;

  if v_session.status not in ('previewed', 'validation_failed') then
    raise exception 'Guest import session must be previewed before submission.'
      using errcode = '22023';
  end if;

  if v_session.row_count <= v_session.invalid_row_count then
    raise exception 'Guest import has no reviewable rows.'
      using errcode = '22023';
  end if;

  update public.guest_import_sessions
  set
    status = 'ready_for_review',
    submitted_at = coalesce(submitted_at, now()),
    updated_by = v_actor_user_id
  where id = p_import_session_id;
end;
$$;

create or replace function public.review_guest_import_rows(
  p_import_session_id uuid,
  p_approved_row_ids uuid[] default '{}'::uuid[],
  p_rejected_row_ids uuid[] default '{}'::uuid[],
  p_held_row_ids uuid[] default '{}'::uuid[],
  p_review_notes text default null
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_approved_count integer;
  v_held_count integer;
  v_rejected_count integer;
  v_session public.guest_import_sessions%rowtype;
  v_status public.guest_import_session_status;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  select *
  into v_session
  from public.guest_import_sessions
  where id = p_import_session_id;

  if v_session.id is null then
    raise exception 'Guest import session was not found.'
      using errcode = 'P0002';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_session.project_id, 'guest_imports.review') then
    raise exception 'Guest import review permission denied.'
      using errcode = '42501';
  end if;

  if v_session.status not in ('ready_for_review', 'partially_approved') then
    raise exception 'Guest import session must be submitted for review.'
      using errcode = '22023';
  end if;

  update public.guest_import_rows
  set
    approval_status = 'approved',
    review_notes = coalesce(p_review_notes, review_notes)
  where import_session_id = p_import_session_id
    and id = any(p_approved_row_ids)
    and validation_status <> 'blocked'
    and approval_status <> 'applied';

  update public.guest_import_rows
  set
    approval_status = 'rejected',
    review_notes = coalesce(p_review_notes, review_notes)
  where import_session_id = p_import_session_id
    and id = any(p_rejected_row_ids)
    and approval_status <> 'applied';

  update public.guest_import_rows
  set
    approval_status = 'held',
    review_notes = coalesce(p_review_notes, review_notes)
  where import_session_id = p_import_session_id
    and id = any(p_held_row_ids)
    and approval_status <> 'applied';

  select
    count(*) filter (where approval_status = 'approved'),
    count(*) filter (where approval_status = 'rejected'),
    count(*) filter (where approval_status = 'held')
  into v_approved_count, v_rejected_count, v_held_count
  from public.guest_import_rows
  where import_session_id = p_import_session_id;

  v_status := case
    when v_approved_count > 0 and (v_rejected_count > 0 or v_held_count > 0) then 'partially_approved'::public.guest_import_session_status
    when v_approved_count > 0 then 'approved'::public.guest_import_session_status
    when v_rejected_count > 0 and v_held_count = 0 then 'rejected'::public.guest_import_session_status
    else 'ready_for_review'::public.guest_import_session_status
  end;

  update public.guest_import_sessions
  set
    approved_row_count = v_approved_count,
    rejected_row_count = v_rejected_count,
    reviewed_by = v_actor_user_id,
    reviewed_at = now(),
    review_notes = coalesce(p_review_notes, review_notes),
    status = v_status,
    updated_by = v_actor_user_id
  where id = p_import_session_id;
end;
$$;

revoke all on function public.submit_guest_import_session(uuid) from public;
revoke all on function public.review_guest_import_rows(uuid, uuid[], uuid[], uuid[], text) from public;
grant execute on function public.submit_guest_import_session(uuid) to authenticated;
grant execute on function public.review_guest_import_rows(uuid, uuid[], uuid[], uuid[], text) to authenticated;
