-- MVP UI QA hardening:
-- Check-in settings inserts failed because the shared audit trigger referenced
-- token/record-only fields while running for check_in_settings. Branch by table
-- before touching table-specific columns.

begin;

create or replace function app_private.audit_check_in_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid;
  v_action text;
  v_object_id uuid;
  v_object_type text;
  v_old jsonb;
  v_new jsonb;
begin
  v_actor_user_id := coalesce(
    case
      when tg_op in ('INSERT', 'UPDATE') then
        coalesce(
          (to_jsonb(new)->>'updated_by')::uuid,
          (to_jsonb(new)->>'created_by')::uuid,
          (to_jsonb(new)->>'staff_user_id')::uuid,
          (to_jsonb(new)->>'requested_by')::uuid,
          (to_jsonb(new)->>'submitted_by')::uuid,
          (to_jsonb(new)->>'generated_by')::uuid,
          (to_jsonb(new)->>'supervisor_user_id')::uuid
        )
      else null
    end,
    (select auth.uid())
  );

  v_object_id := case
    when tg_op = 'DELETE' then old.id
    else new.id
  end;

  v_object_type := case tg_table_name
    when 'check_in_settings' then 'check_in_setting'
    when 'check_in_devices' then 'check_in_device'
    when 'check_in_tokens' then 'check_in_token'
    when 'check_in_records' then 'check_in_record'
    when 'unexpected_guest_requests' then 'unexpected_guest_request'
    when 'check_in_preload_snapshots' then 'check_in_preload_snapshot'
    when 'check_in_sync_batches' then 'check_in_sync_batch'
    when 'check_in_sync_conflicts' then 'check_in_sync_conflict'
    else tg_table_name
  end;

  if tg_table_name = 'check_in_settings' then
    v_action := case
      when tg_op = 'INSERT' then 'check_in_settings.created'
      when tg_op = 'UPDATE' then 'check_in_settings.updated'
      else concat(tg_table_name, '.', lower(tg_op))
    end;
  elsif tg_table_name = 'check_in_devices' then
    v_action := case
      when tg_op = 'INSERT' then 'check_in_devices.assigned'
      when tg_op = 'UPDATE' then 'check_in_devices.updated'
      else concat(tg_table_name, '.', lower(tg_op))
    end;
  elsif tg_table_name = 'check_in_tokens' then
    v_action := case
      when tg_op = 'INSERT' and new.regenerated_from_token_id is not null then 'check_in_tokens.regenerated'
      when tg_op = 'INSERT' then 'check_in_tokens.created'
      when tg_op = 'UPDATE' and old.status <> 'revoked' and new.status = 'revoked' then 'check_in_tokens.revoked'
      when tg_op = 'UPDATE' then 'check_in_tokens.updated'
      else concat(tg_table_name, '.', lower(tg_op))
    end;
  elsif tg_table_name = 'check_in_records' then
    v_action := case
      when tg_op = 'INSERT' and new.is_duplicate_scan then 'check_in.duplicate_scan_detected'
      when tg_op = 'INSERT' and new.method = 'offline_sync' then 'check_in.offline_synced'
      when tg_op = 'INSERT' and new.attendance_before > 0 then 'check_in.partial_arrival_updated'
      when tg_op = 'INSERT' then 'check_in.guest_checked_in'
      else concat(tg_table_name, '.', lower(tg_op))
    end;
  elsif tg_table_name = 'unexpected_guest_requests' then
    v_action := case
      when tg_op = 'INSERT' then 'unexpected_guest_requests.created'
      when tg_op = 'UPDATE' and old.status = 'pending' and new.status in ('approved', 'manual_approved') then 'unexpected_guest_requests.approved'
      when tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'rejected' then 'unexpected_guest_requests.rejected'
      when tg_op = 'UPDATE' then 'unexpected_guest_requests.updated'
      else concat(tg_table_name, '.', lower(tg_op))
    end;
  elsif tg_table_name = 'check_in_preload_snapshots' then
    v_action := case
      when tg_op = 'INSERT' then 'check_in.preload_snapshot.created'
      else concat(tg_table_name, '.', lower(tg_op))
    end;
  elsif tg_table_name = 'check_in_sync_batches' then
    v_action := case
      when tg_op = 'INSERT' then 'check_in.sync_batch.created'
      when tg_op = 'UPDATE' then 'check_in.sync_batch.updated'
      else concat(tg_table_name, '.', lower(tg_op))
    end;
  elsif tg_table_name = 'check_in_sync_conflicts' then
    v_action := case
      when tg_op = 'INSERT' then 'check_in.sync_conflict.detected'
      when tg_op = 'UPDATE' then 'check_in.sync_conflict.updated'
      else concat(tg_table_name, '.', lower(tg_op))
    end;
  else
    v_action := concat(tg_table_name, '.', lower(tg_op));
  end if;

  v_old := case
    when tg_op = 'INSERT' then null
    else app_private.redact_check_in_audit_snapshot(tg_table_name, to_jsonb(old))
  end;
  v_new := case
    when tg_op = 'DELETE' then null
    else app_private.redact_check_in_audit_snapshot(tg_table_name, to_jsonb(new))
  end;

  insert into public.audit_logs (
    actor_user_id,
    action,
    object_type,
    object_id,
    old_value,
    new_value,
    source,
    reason
  )
  values (
    v_actor_user_id,
    v_action,
    v_object_type,
    v_object_id,
    v_old,
    v_new,
    'api',
    coalesce(v_new->>'decision_reason', v_new->>'notes', v_old->>'notes')
  );

  return case
    when tg_op = 'DELETE' then old
    else new
  end;
end;
$$;

commit;
