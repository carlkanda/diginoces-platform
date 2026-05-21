-- Sprint 2 - Code generation lint hardening
-- Requirements: PROJ-003, PROJ-004.

create or replace function app_private.generate_project_code(
  p_bride_name text,
  p_groom_name text,
  p_project_year integer
)
returns text
language plpgsql
stable
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
stable
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
