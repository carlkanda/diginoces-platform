-- MVP QA hardening: keep the Sprint 12 audit trigger from reading fields that
-- exist only on sibling guest-wish/feedback tables.

create or replace function app_private.audit_guest_wishes_feedback_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  action_name text;
  actor_id uuid;
  changed_object_id uuid;
  changed_object_type text;
begin
  changed_object_id := new.id;

  if tg_table_name = 'guest_messages' then
    changed_object_type := 'guest_message';

    if tg_op = 'UPDATE' then
      actor_id := coalesce(new.reviewed_by, new.couple_reviewed_by, (select auth.uid()));

      if old.status is distinct from new.status and new.status = 'admin_approved' then
        action_name := 'guest_messages.approved';
      elsif old.status is distinct from new.status and new.status = 'admin_edited' then
        action_name := 'guest_messages.edited_by_admin';
      elsif old.status is distinct from new.status and new.status = 'excluded' then
        action_name := 'guest_messages.excluded';
      elsif old.status is distinct from new.status and new.status = 'flagged' then
        action_name := 'guest_messages.flagged';
      elsif old.status is distinct from new.status and new.status = 'couple_approved' then
        action_name := 'guest_messages.couple_approved';
      elsif old.status is distinct from new.status and new.status = 'couple_correction_requested' then
        action_name := 'guest_messages.couple_correction_requested';
      elsif old.status is distinct from new.status and new.status = 'exported' then
        action_name := 'guest_messages.exported';
      else
        action_name := 'guest_messages.edited';
      end if;
    else
      actor_id := (select auth.uid());
      action_name := 'guest_messages.submitted';
    end if;
  elsif tg_table_name = 'guest_message_reviews' then
    changed_object_type := 'guest_message_review';
    actor_id := new.reviewer_user_id;

    if new.actor_type = 'couple' then
      action_name := 'guest_messages.couple_reviewed';
    else
      action_name := 'guest_messages.moderated';
    end if;
  elsif tg_table_name = 'guest_book_exports' then
    changed_object_type := 'guest_book_export';
    actor_id := new.requested_by;

    if tg_op = 'INSERT' then
      action_name := 'guest_book_exports.generated';
    else
      action_name := 'guest_book_exports.updated';
    end if;
  elsif tg_table_name = 'post_event_feedback' then
    changed_object_type := 'post_event_feedback';
    actor_id := coalesce(new.reviewed_by, new.submitted_by, (select auth.uid()));

    if tg_op = 'INSERT' then
      action_name := 'post_event_feedback.submitted';
    elsif old.testimonial_permission_granted is distinct from new.testimonial_permission_granted then
      action_name := 'post_event_feedback.testimonial_permission_changed';
    else
      action_name := 'post_event_feedback.reviewed';
    end if;
  elsif tg_table_name = 'testimonial_permissions' then
    changed_object_type := 'testimonial_permission';
    actor_id := coalesce(new.reviewed_by, new.granted_by, (select auth.uid()));

    if tg_op = 'INSERT' then
      action_name := 'testimonial_permissions.recorded';
    else
      action_name := 'testimonial_permissions.reviewed';
    end if;
  else
    changed_object_type := tg_table_name;
    actor_id := (select auth.uid());
    action_name := lower(tg_table_name || '.' || tg_op);
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
    actor_id,
    action_name,
    changed_object_type,
    changed_object_id,
    case
      when tg_op = 'UPDATE' then to_jsonb(old) - 'internal_moderation_note' - 'internal_review_note'
      else null
    end,
    case
      when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) - 'internal_moderation_note' - 'internal_review_note'
      else null
    end,
    'api'
  );

  return new;
end;
$$;

revoke all on function app_private.audit_guest_wishes_feedback_change() from public;
