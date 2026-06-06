-- MVP launch hardening: partner profile creation was blocked because the
-- shared partner audit trigger referenced a project_id field on NEW for tables
-- that do not have a project_id column, such as public.partners.

create or replace function app_private.audit_partner_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid;
  action_name text;
  changed_object_id uuid;
  changed_object_type text;
  new_snapshot jsonb;
  old_snapshot jsonb;
  project_id uuid;
begin
  if tg_op in ('INSERT', 'UPDATE') then
    new_snapshot := to_jsonb(new);
  end if;
  if tg_op in ('UPDATE', 'DELETE') then
    old_snapshot := to_jsonb(old);
  end if;

  changed_object_type := case tg_table_name
    when 'partners' then 'partner'
    when 'partner_users' then 'partner_user'
    when 'partner_project_sources' then 'partner_project_source'
    when 'partner_project_submissions' then 'partner_project_submission'
    when 'partner_project_assignments' then 'partner_project_assignment'
    when 'project_comments' then 'project_comment'
    else tg_table_name
  end;
  changed_object_id := coalesce(
    nullif(new_snapshot ->> 'id', '')::uuid,
    nullif(old_snapshot ->> 'id', '')::uuid
  );

  if tg_table_name in (
    'partner_project_sources',
    'partner_project_submissions',
    'partner_project_assignments',
    'project_comments'
  ) then
    project_id := coalesce(
      nullif(new_snapshot ->> 'project_id', '')::uuid,
      nullif(old_snapshot ->> 'project_id', '')::uuid
    );
  else
    project_id := null;
  end if;

  actor_id := case tg_table_name
    when 'partners' then coalesce(
      nullif(new_snapshot ->> 'updated_by', '')::uuid,
      nullif(new_snapshot ->> 'created_by', '')::uuid,
      nullif(old_snapshot ->> 'updated_by', '')::uuid,
      nullif(old_snapshot ->> 'created_by', '')::uuid,
      (select auth.uid())
    )
    when 'partner_users' then coalesce(
      nullif(new_snapshot ->> 'invited_by', '')::uuid,
      nullif(old_snapshot ->> 'invited_by', '')::uuid,
      (select auth.uid())
    )
    when 'partner_project_sources' then coalesce(
      nullif(new_snapshot ->> 'approved_by', '')::uuid,
      nullif(new_snapshot ->> 'submitted_by', '')::uuid,
      nullif(new_snapshot ->> 'created_by', '')::uuid,
      nullif(old_snapshot ->> 'approved_by', '')::uuid,
      nullif(old_snapshot ->> 'submitted_by', '')::uuid,
      nullif(old_snapshot ->> 'created_by', '')::uuid,
      (select auth.uid())
    )
    when 'partner_project_submissions' then coalesce(
      nullif(new_snapshot ->> 'reviewed_by', '')::uuid,
      nullif(new_snapshot ->> 'submitted_by', '')::uuid,
      nullif(new_snapshot ->> 'created_by', '')::uuid,
      nullif(old_snapshot ->> 'reviewed_by', '')::uuid,
      nullif(old_snapshot ->> 'submitted_by', '')::uuid,
      nullif(old_snapshot ->> 'created_by', '')::uuid,
      (select auth.uid())
    )
    when 'partner_project_assignments' then coalesce(
      nullif(new_snapshot ->> 'removed_by', '')::uuid,
      nullif(new_snapshot ->> 'assigned_by', '')::uuid,
      nullif(old_snapshot ->> 'removed_by', '')::uuid,
      nullif(old_snapshot ->> 'assigned_by', '')::uuid,
      (select auth.uid())
    )
    when 'project_comments' then coalesce(
      nullif(new_snapshot ->> 'updated_by', '')::uuid,
      nullif(new_snapshot ->> 'created_by', '')::uuid,
      nullif(new_snapshot ->> 'author_user_id', '')::uuid,
      nullif(old_snapshot ->> 'updated_by', '')::uuid,
      nullif(old_snapshot ->> 'created_by', '')::uuid,
      nullif(old_snapshot ->> 'author_user_id', '')::uuid,
      (select auth.uid())
    )
    else (select auth.uid())
  end;

  action_name := case
    when tg_table_name = 'partners' and tg_op = 'INSERT' then 'partners.created'
    when tg_table_name = 'partners' and tg_op = 'UPDATE' and old_snapshot ->> 'status' <> 'active' and new_snapshot ->> 'status' = 'active' then 'partners.activated'
    when tg_table_name = 'partners' and tg_op = 'UPDATE' and new_snapshot ->> 'status' = 'suspended' and old_snapshot ->> 'status' <> 'suspended' then 'partners.suspended'
    when tg_table_name = 'partners' and tg_op = 'UPDATE' and old_snapshot ->> 'status' = 'suspended' and new_snapshot ->> 'status' = 'active' then 'partners.reactivated'
    when tg_table_name = 'partners' and tg_op = 'UPDATE' and new_snapshot ->> 'status' = 'archived' and old_snapshot ->> 'status' <> 'archived' then 'partners.archived'
    when tg_table_name = 'partners' and tg_op = 'UPDATE' then 'partners.updated'
    when tg_table_name = 'partner_users' and tg_op = 'INSERT' then 'partner_users.linked'
    when tg_table_name = 'partner_users' and tg_op = 'UPDATE' then 'partner_users.updated'
    when tg_table_name = 'partner_project_sources' and tg_op = 'INSERT' then 'partner_project_sources.created'
    when tg_table_name = 'partner_project_sources' and tg_op = 'UPDATE' then 'partner_project_sources.updated'
    when tg_table_name = 'partner_project_submissions' and tg_op = 'INSERT' then 'partner_project_submissions.created'
    when tg_table_name = 'partner_project_submissions' and tg_op = 'UPDATE' and new_snapshot ->> 'status' = 'submitted' and old_snapshot ->> 'status' <> 'submitted' then 'partner_project_submissions.submitted'
    when tg_table_name = 'partner_project_submissions' and tg_op = 'UPDATE' and new_snapshot ->> 'status' = 'approved' and old_snapshot ->> 'status' <> 'approved' then 'partner_project_submissions.approved'
    when tg_table_name = 'partner_project_submissions' and tg_op = 'UPDATE' and new_snapshot ->> 'status' = 'rejected' and old_snapshot ->> 'status' <> 'rejected' then 'partner_project_submissions.rejected'
    when tg_table_name = 'partner_project_submissions' and tg_op = 'UPDATE' and new_snapshot ->> 'status' = 'changes_requested' and old_snapshot ->> 'status' <> 'changes_requested' then 'partner_project_submissions.changes_requested'
    when tg_table_name = 'partner_project_submissions' and tg_op = 'UPDATE' and new_snapshot ->> 'status' = 'archived' and old_snapshot ->> 'status' <> 'archived' then 'partner_project_submissions.archived'
    when tg_table_name = 'partner_project_submissions' and tg_op = 'UPDATE' then 'partner_project_submissions.updated'
    when tg_table_name = 'partner_project_assignments' and tg_op = 'INSERT' then 'partner_project_assignments.created'
    when tg_table_name = 'partner_project_assignments' and tg_op = 'UPDATE' and new_snapshot ->> 'status' = 'removed' and old_snapshot ->> 'status' <> 'removed' then 'partner_project_assignments.removed'
    when tg_table_name = 'partner_project_assignments' and tg_op = 'UPDATE' then 'partner_project_assignments.updated'
    when tg_table_name = 'project_comments' and tg_op = 'INSERT' then 'project_comments.created'
    when tg_table_name = 'project_comments' and tg_op = 'UPDATE' and new_snapshot ->> 'deleted_at' is not null and old_snapshot ->> 'deleted_at' is null then 'project_comments.deleted'
    when tg_table_name = 'project_comments' and tg_op = 'UPDATE' then 'project_comments.updated'
    else tg_table_name || '.' || lower(tg_op)
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
    actor_id,
    action_name,
    changed_object_type,
    changed_object_id,
    app_private.redact_partner_audit_snapshot(old_snapshot),
    app_private.redact_partner_audit_snapshot(new_snapshot),
    'api',
    case
      when tg_table_name = 'partner_project_submissions' then coalesce(new_snapshot ->> 'review_reason', old_snapshot ->> 'review_reason')
      when tg_table_name = 'partner_project_sources' then coalesce(new_snapshot ->> 'source_notes', old_snapshot ->> 'source_notes')
      when project_id is not null then 'project_id=' || project_id::text
      else null
    end
  );

  return coalesce(new, old);
end;
$$;

revoke all on function app_private.audit_partner_change() from public;
