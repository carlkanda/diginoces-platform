-- Sprint 2 - CodeRabbit schema review fixes
-- Requirements: PROJ-002, PROJ-004, PROJ-007.

alter table public.events
  drop constraint if exists events_event_code_format;

alter table public.events
  add constraint events_event_code_format
  check (event_code ~ '^[A-Z0-9]{3,8}-[0-9]{4}-[0-9]{3,}-[A-Z]{3}(-[0-9]{2,})?$');

create unique index if not exists events_id_project_id_key
  on public.events (id, project_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workflow_tasks_event_matches_project'
      and conrelid = 'public.workflow_tasks'::regclass
  ) then
    alter table public.workflow_tasks
      add constraint workflow_tasks_event_matches_project
      foreign key (event_id, project_id)
      references public.events (id, project_id)
      on delete cascade;
  end if;
end $$;
