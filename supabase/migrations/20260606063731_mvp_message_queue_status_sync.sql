-- MVP QA hardening: keep guided-manual message queue rows aligned with
-- manual message status transitions so the queue UI does not show stale
-- "queued" rows after a message is opened, sent, failed, skipped, or resent.

create or replace function public.mark_guided_manual_message_status(
  p_message_log_id uuid,
  p_project_id uuid,
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
    and project_id = p_project_id
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

  update public.message_queue_items
  set
    status = p_status,
    last_error = case
      when p_status = 'failed' then nullif(trim(p_reason), '')
      else last_error
    end
  where project_id = v_log.project_id
    and message_log_id = v_log.id;

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

revoke all on function public.mark_guided_manual_message_status(uuid, uuid, public.message_delivery_status, text) from public;
grant execute on function public.mark_guided_manual_message_status(uuid, uuid, public.message_delivery_status, text) to authenticated, service_role;

update public.message_queue_items as queue
set status = log.status
from public.message_logs as log
where queue.message_log_id = log.id
  and queue.project_id = log.project_id
  and log.sending_mode = 'guided_manual'
  and log.status in ('opened_manually', 'sent', 'failed', 'skipped', 'resent')
  and queue.status is distinct from log.status;
