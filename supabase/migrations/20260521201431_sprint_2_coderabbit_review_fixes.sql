-- Sprint 2 - CodeRabbit review follow-up fixes
-- Requirements: PROJ-003, PROJ-004, PROJ-007, REP-006.

alter table public.wedding_projects
  alter column preferred_language drop not null;

create or replace function app_private.generate_project_code(
  p_bride_name text,
  p_groom_name text,
  p_project_year integer
)
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  base_code text;
  candidate text;
  sequence_number integer := 1;
  selected_year integer;
begin
  selected_year := coalesce(p_project_year, extract(year from now())::integer);
  base_code := app_private.project_code_prefix(p_bride_name, p_groom_name) || '-' || selected_year::text || '-';
  perform pg_advisory_xact_lock(hashtext(base_code));

  loop
    candidate := base_code || lpad(sequence_number::text, 3, '0');

    if not exists (
      select 1
      from public.wedding_projects
      where project_code = candidate
    ) then
      return candidate;
    end if;

    sequence_number := sequence_number + 1;
  end loop;

  raise exception 'Unable to generate a unique project code';
end;
$$;

create or replace function app_private.generate_event_code(
  p_project_id uuid,
  p_event_type public.event_type
)
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  base_code text;
  candidate text;
  project_code_value text;
  sequence_number integer := 1;
begin
  select project_code
  into project_code_value
  from public.wedding_projects
  where id = p_project_id;

  if project_code_value is null then
    raise exception 'Cannot generate an event code without a valid project';
  end if;

  base_code := project_code_value || '-' || app_private.event_type_code(p_event_type);
  perform pg_advisory_xact_lock(hashtext(base_code));

  loop
    candidate := case
      when sequence_number = 1 then base_code
      else base_code || '-' || lpad(sequence_number::text, 2, '0')
    end;

    if not exists (
      select 1
      from public.events
      where event_code = candidate
    ) then
      return candidate;
    end if;

    sequence_number := sequence_number + 1;
  end loop;

  raise exception 'Unable to generate a unique event code';
end;
$$;

create or replace function app_private.redact_project_event_audit_snapshot(
  p_snapshot jsonb
)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_snapshot is null then null
    else p_snapshot
      - 'internal_notes'
      - 'preferred_language'
      - 'primary_contact_email'
      - 'primary_contact_name'
      - 'primary_contact_phone'
      - 'timeline_notes'
  end;
$$;

revoke all on function app_private.redact_project_event_audit_snapshot(jsonb) from public;

create or replace function app_private.audit_project_event_change()
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
    when 'wedding_projects' then 'wedding_project'
    when 'events' then 'event'
    when 'workflow_tasks' then 'workflow_task'
  end;

  changed_object_id := case tg_op
    when 'DELETE' then old.id
    else new.id
  end;

  action_name := case
    when tg_table_name = 'wedding_projects' and tg_op = 'INSERT' then 'projects.created'
    when tg_table_name = 'wedding_projects' and tg_op = 'UPDATE' then 'projects.updated'
    when tg_table_name = 'events' and tg_op = 'INSERT' then 'events.created'
    when tg_table_name = 'events' and tg_op = 'UPDATE' then 'events.updated'
    when tg_table_name = 'workflow_tasks' and tg_op = 'INSERT' then 'workflow_tasks.created'
    when tg_table_name = 'workflow_tasks' and tg_op = 'UPDATE' then 'workflow_tasks.updated'
    when tg_table_name = 'workflow_tasks' and tg_op = 'DELETE' then 'workflow_tasks.deleted'
    else lower(tg_table_name || '.' || tg_op)
  end;

  if tg_op in ('UPDATE', 'DELETE') then
    sanitized_old := app_private.redact_project_event_audit_snapshot(to_jsonb(old));
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    sanitized_new := app_private.redact_project_event_audit_snapshot(to_jsonb(new));
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

drop trigger if exists audit_workflow_tasks_insert on public.workflow_tasks;
create trigger audit_workflow_tasks_insert
after insert on public.workflow_tasks
for each row
execute function app_private.audit_project_event_change();

drop trigger if exists audit_workflow_tasks_update on public.workflow_tasks;
create trigger audit_workflow_tasks_update
after update on public.workflow_tasks
for each row
execute function app_private.audit_project_event_change();

drop trigger if exists audit_workflow_tasks_delete on public.workflow_tasks;
create trigger audit_workflow_tasks_delete
after delete on public.workflow_tasks
for each row
execute function app_private.audit_project_event_change();
