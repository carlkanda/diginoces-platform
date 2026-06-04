-- MVP UI QA hardening:
-- Guest import session inserts failed because the shared audit trigger
-- referenced guest_import_rows.approval_status while running for
-- guest_import_sessions. Branch by table before touching row-specific fields.

begin;

create or replace function app_private.audit_guest_import_change()
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
    when 'guest_import_sessions' then 'guest_import_session'
    when 'guest_import_rows' then 'guest_import_row'
    when 'guest_import_mappings' then 'guest_import_mapping'
  end;

  changed_object_id := case tg_op
    when 'DELETE' then old.id
    else new.id
  end;

  if tg_table_name = 'guest_import_sessions' then
    action_name := case
      when tg_op = 'INSERT' then 'guest_imports.created'
      when tg_op = 'UPDATE' and new.status in ('previewed', 'validation_failed') then 'guest_imports.validation_completed'
      when tg_op = 'UPDATE' and new.status = 'ready_for_review' then 'guest_imports.submitted'
      when tg_op = 'UPDATE' and new.status in ('partially_approved', 'approved', 'rejected') then 'guest_imports.reviewed'
      when tg_op = 'UPDATE' and new.status = 'applied' then 'guest_imports.applied'
      when tg_op = 'UPDATE' then 'guest_imports.updated'
      else lower(tg_table_name || '.' || tg_op)
    end;
  elsif tg_table_name = 'guest_import_mappings' then
    action_name := 'guest_imports.mapping_saved';
  elsif tg_table_name = 'guest_import_rows' then
    action_name := case
      when tg_op = 'INSERT' then 'guest_import_rows.staged'
      when tg_op = 'UPDATE' and new.approval_status = 'applied' then 'guest_import_rows.applied'
      when tg_op = 'UPDATE' and old.approval_status is distinct from new.approval_status then 'guest_import_rows.reviewed'
      when tg_op = 'UPDATE' then 'guest_import_rows.validation_updated'
      else lower(tg_table_name || '.' || tg_op)
    end;
  else
    action_name := lower(tg_table_name || '.' || tg_op);
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    sanitized_old := app_private.redact_guest_import_audit_snapshot(tg_table_name, to_jsonb(old));
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    sanitized_new := app_private.redact_guest_import_audit_snapshot(tg_table_name, to_jsonb(new));
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

commit;
