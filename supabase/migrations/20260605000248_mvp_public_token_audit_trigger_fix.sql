-- MVP QA hardening: fix public guest-token audit trigger.
--
-- The shared RSVP/public-page audit trigger is attached to both
-- guest_public_tokens and rsvp_records. PL/pgSQL record fields are resolved at
-- runtime, so referencing new.source while handling guest_public_tokens raises
-- "record new has no field source" even though the CASE branch is intended for
-- rsvp_records. Split table-specific action selection before touching
-- table-specific columns.

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

  if tg_table_name = 'guest_public_tokens' then
    action_name := case
      when tg_op = 'INSERT' and new.regenerated_from_token_id is not null then 'guest_public_tokens.regenerated'
      when tg_op = 'INSERT' then 'guest_public_tokens.created'
      when tg_op = 'UPDATE' and old.status <> 'revoked' and new.status = 'revoked' then 'guest_public_tokens.revoked'
      else lower(tg_table_name || '.' || tg_op)
    end;
  elsif tg_table_name = 'rsvp_records' then
    action_name := case
      when tg_op = 'INSERT' and new.source = 'public_guest_page' then 'rsvps.submitted'
      when tg_op = 'INSERT' then 'rsvps.manual_recorded'
      when tg_op = 'UPDATE' and not old.manual_review_required and new.manual_review_required then 'rsvps.deadline_review_required'
      when tg_op = 'UPDATE' then 'rsvps.changed'
      else lower(tg_table_name || '.' || tg_op)
    end;
  else
    action_name := lower(tg_table_name || '.' || tg_op);
  end if;

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

revoke all on function app_private.audit_rsvp_public_page_change() from public;
