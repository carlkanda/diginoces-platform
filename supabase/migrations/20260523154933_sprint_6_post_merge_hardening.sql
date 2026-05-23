-- Sprint 6 post-merge hardening
-- Traceability: Sprint 6 issue #12 / PR #19 visual QA follow-up.
--
-- The Sprint 6 visual check exposed two cross-sprint database issues:
-- 1. RLS policies call private access helpers directly, so authenticated users
--    need EXECUTE on those helpers even though the functions remain in the
--    unexposed app_private schema.
-- 2. The shared guest audit trigger referenced guests-only columns from a CASE
--    expression that also runs for guest title/tag/assignment triggers.

grant execute on function app_private.user_has_permission(
  uuid,
  text,
  public.role_scope_type,
  uuid
) to authenticated;

grant execute on function app_private.user_can_access_project(
  uuid,
  uuid,
  text
) to authenticated;

grant execute on function app_private.user_can_access_event(
  uuid,
  uuid,
  text
) to authenticated;

create or replace function app_private.audit_guest_management_change()
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
    when 'guests' then 'guest'
    when 'guest_event_assignments' then 'guest_event_assignment'
    when 'guest_tag_assignments' then 'guest_tag_assignment'
    when 'guest_title_types' then 'guest_title_type'
    when 'guest_tags' then 'guest_tag'
    when 'guest_duplicate_candidates' then 'guest_duplicate_candidate'
  end;

  changed_object_id := case tg_op
    when 'DELETE' then old.id
    else new.id
  end;

  if tg_table_name = 'guests' then
    if tg_op = 'INSERT' then
      action_name := 'guests.created';
    elsif tg_op = 'UPDATE' and old.is_active and not new.is_active then
      action_name := 'guests.deactivated';
    elsif tg_op = 'UPDATE' then
      action_name := 'guests.updated';
    end if;
  elsif tg_table_name = 'guest_event_assignments' then
    action_name := case tg_op
      when 'INSERT' then 'guest_event_assignments.created'
      when 'UPDATE' then 'guest_event_assignments.updated'
      when 'DELETE' then 'guest_event_assignments.deleted'
    end;
  elsif tg_table_name = 'guest_tag_assignments' then
    action_name := case tg_op
      when 'INSERT' then 'guest_tags.assigned'
      when 'DELETE' then 'guest_tags.removed'
    end;
  elsif tg_table_name = 'guest_title_types' then
    action_name := case tg_op
      when 'INSERT' then 'guest_title_types.created'
      when 'UPDATE' then 'guest_title_types.updated'
    end;
  elsif tg_table_name = 'guest_tags' then
    action_name := case tg_op
      when 'INSERT' then 'guest_tags.created'
      when 'UPDATE' then 'guest_tags.updated'
    end;
  elsif tg_table_name = 'guest_duplicate_candidates' then
    action_name := case tg_op
      when 'INSERT' then 'guest_duplicates.detected'
      when 'UPDATE' then 'guest_duplicates.reviewed'
    end;
  end if;

  action_name := coalesce(action_name, lower(tg_table_name || '.' || tg_op));

  if tg_op in ('UPDATE', 'DELETE') then
    sanitized_old := app_private.redact_guest_audit_snapshot(to_jsonb(old));
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    sanitized_new := app_private.redact_guest_audit_snapshot(to_jsonb(new));
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
