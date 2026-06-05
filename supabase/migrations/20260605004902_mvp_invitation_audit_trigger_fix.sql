-- MVP QA hardening: keep the Sprint 6 invitation audit trigger from comparing
-- status enum values that belong to sibling invitation tables.

create or replace function app_private.audit_invitation_change()
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
  if tg_op = 'DELETE' then
    changed_object_id := old.id;
  else
    changed_object_id := new.id;
  end if;

  if tg_table_name = 'invitation_templates' then
    changed_object_type := 'invitation_template';

    if tg_op = 'INSERT' then
      action_name := 'invitation_templates.created';
    elsif tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'preview_generated' then
      action_name := 'invitation_templates.preview_generated';
    elsif tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'technical_preview_approved' then
      action_name := 'invitation_templates.preview_approved';
    elsif tg_op = 'UPDATE' then
      action_name := 'invitation_templates.updated';
    else
      action_name := lower(tg_table_name || '.' || tg_op);
    end if;
  elsif tg_table_name = 'invitation_template_fields' then
    changed_object_type := 'invitation_template_field';

    if tg_op in ('INSERT', 'UPDATE') then
      action_name := 'invitation_templates.updated';
    else
      action_name := lower(tg_table_name || '.' || tg_op);
    end if;
  elsif tg_table_name = 'invitation_generation_jobs' then
    changed_object_type := 'invitation_generation_job';

    if tg_op = 'INSERT' then
      action_name := 'invitation_generation_jobs.created';
    elsif tg_op = 'UPDATE' then
      action_name := 'invitation_generation_jobs.updated';
    else
      action_name := lower(tg_table_name || '.' || tg_op);
    end if;
  elsif tg_table_name = 'invitation_generation_job_items' then
    changed_object_type := 'invitation_generation_job_item';
    action_name := lower(tg_table_name || '.' || tg_op);
  elsif tg_table_name = 'invitations' then
    changed_object_type := 'invitation';

    if tg_op = 'INSERT' then
      action_name := 'invitations.created';
    elsif tg_op = 'UPDATE' and new.status = 'needs_regeneration' then
      action_name := 'invitations.regeneration_required';
    elsif tg_op = 'UPDATE' and new.status = 'generated' then
      action_name := 'invitations.generated';
    else
      action_name := lower(tg_table_name || '.' || tg_op);
    end if;
  elsif tg_table_name = 'invitation_files' then
    changed_object_type := 'invitation_file';

    if tg_op in ('INSERT', 'UPDATE') then
      action_name := 'invitation_files.versioned';
    else
      action_name := lower(tg_table_name || '.' || tg_op);
    end if;
  else
    changed_object_type := tg_table_name;
    action_name := lower(tg_table_name || '.' || tg_op);
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    sanitized_old := app_private.redact_invitation_audit_snapshot(to_jsonb(old));
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    sanitized_new := app_private.redact_invitation_audit_snapshot(to_jsonb(new));
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

  return new;
end;
$$;

revoke all on function app_private.audit_invitation_change() from public;
