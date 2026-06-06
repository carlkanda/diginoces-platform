-- MVP QA hardening: fix commercial audit trigger enum comparisons.
--
-- app_private.audit_commercial_change() is shared by contract, payment,
-- payment_exception, package, gesture, and gate-event tables. A flat CASE that
-- compares new.status to table-specific enum literals can make Postgres cast a
-- literal such as 'approved' to payment_exception_status while processing
-- payment_exceptions, blocking valid inserts. Keep the shared audit writer, but
-- select action names inside table-specific branches.

create or replace function app_private.audit_commercial_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  action_name text;
  changed_object_type text;
  changed_object_id uuid;
  sanitized_new jsonb;
  sanitized_old jsonb;
begin
  changed_object_type := case tg_table_name
    when 'service_packages' then 'service_package'
    when 'service_package_addons' then 'service_package_addon'
    when 'project_event_package_selections' then 'project_event_package_selection'
    when 'pricing_calculations' then 'pricing_calculation'
    when 'contracts' then 'contract'
    when 'contract_approvals' then 'contract_approval'
    when 'contract_addendums' then 'contract_addendum'
    when 'payments' then 'payment'
    when 'payment_exceptions' then 'payment_exception'
    when 'commercial_gestures' then 'commercial_gesture'
    when 'payment_gate_events' then 'payment_gate_event'
  end;

  changed_object_id := case tg_op
    when 'DELETE' then old.id
    else new.id
  end;

  if tg_table_name = 'service_packages' then
    action_name := case
      when tg_op = 'INSERT' then 'service_packages.created'
      when tg_op = 'UPDATE' then 'service_packages.updated'
      else lower(tg_table_name || '.' || tg_op)
    end;
  elsif tg_table_name = 'service_package_addons' then
    action_name := case
      when tg_op = 'INSERT' then 'service_package_addons.created'
      when tg_op = 'UPDATE' then 'service_package_addons.updated'
      else lower(tg_table_name || '.' || tg_op)
    end;
  elsif tg_table_name = 'project_event_package_selections' then
    action_name := case
      when tg_op = 'INSERT' then 'project_event_package_selections.selected'
      when tg_op = 'UPDATE' then 'project_event_package_selections.updated'
      else lower(tg_table_name || '.' || tg_op)
    end;
  elsif tg_table_name = 'pricing_calculations' then
    action_name := case
      when tg_op = 'INSERT' then 'pricing_calculations.generated'
      else lower(tg_table_name || '.' || tg_op)
    end;
  elsif tg_table_name = 'contracts' then
    action_name := case
      when tg_op = 'INSERT' then 'contracts.generated'
      when tg_op = 'UPDATE' and new.status = 'approved' and old.status <> 'approved' then 'contracts.approved'
      when tg_op = 'UPDATE' then 'contracts.updated'
      else lower(tg_table_name || '.' || tg_op)
    end;
  elsif tg_table_name = 'contract_approvals' then
    action_name := case
      when tg_op = 'INSERT' then 'contract_approvals.created'
      else lower(tg_table_name || '.' || tg_op)
    end;
  elsif tg_table_name = 'contract_addendums' then
    action_name := case
      when tg_op = 'INSERT' then 'contract_addendums.generated'
      when tg_op = 'UPDATE' and new.status = 'approved' and old.status <> 'approved' then 'contract_addendums.approved'
      when tg_op = 'UPDATE' then 'contract_addendums.updated'
      else lower(tg_table_name || '.' || tg_op)
    end;
  elsif tg_table_name = 'payments' then
    action_name := case
      when tg_op = 'INSERT' then 'payments.recorded'
      when tg_op = 'UPDATE' and new.status = 'confirmed' and old.status <> 'confirmed' then 'payments.confirmed'
      when tg_op = 'UPDATE' then 'payments.updated'
      else lower(tg_table_name || '.' || tg_op)
    end;
  elsif tg_table_name = 'payment_exceptions' then
    action_name := case
      when tg_op = 'INSERT' then 'payment_exceptions.created'
      when tg_op = 'UPDATE' and new.status = 'revoked' and old.status <> 'revoked' then 'payment_exceptions.revoked'
      when tg_op = 'UPDATE' then 'payment_exceptions.updated'
      else lower(tg_table_name || '.' || tg_op)
    end;
  elsif tg_table_name = 'commercial_gestures' then
    action_name := case
      when tg_op = 'INSERT' then 'commercial_gestures.applied'
      when tg_op = 'UPDATE' then 'commercial_gestures.updated'
      else lower(tg_table_name || '.' || tg_op)
    end;
  elsif tg_table_name = 'payment_gate_events' then
    action_name := case
      when tg_op = 'INSERT' then 'payment_gate_events.created'
      else lower(tg_table_name || '.' || tg_op)
    end;
  else
    action_name := lower(tg_table_name || '.' || tg_op);
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    sanitized_old := app_private.redact_commercial_audit_snapshot(tg_table_name, to_jsonb(old));
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    sanitized_new := app_private.redact_commercial_audit_snapshot(tg_table_name, to_jsonb(new));
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

revoke all on function app_private.audit_commercial_change() from public;
