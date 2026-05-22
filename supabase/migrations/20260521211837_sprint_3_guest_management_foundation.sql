-- Sprint 3 - Guest Management & Guest Lists Foundation
-- Requirements: GM-001, GM-002, GM-003, GM-006, GM-007, GM-008, GM-009,
-- GM-011, GM-013, GM-015, PROJ-005, ROLE-005, REP-006, TECH-004.

do $$
begin
  create type public.guest_side as enum ('bride', 'groom', 'both');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.guest_event_assignment_status as enum ('assigned', 'not_invited', 'removed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.guest_duplicate_reason as enum (
    'normalized_name',
    'title_and_name',
    'whatsapp_number'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.guest_duplicate_status as enum ('open', 'dismissed', 'confirmed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.guest_title_types (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  slug text not null,
  label text not null,
  default_guest_count integer not null default 1,
  requires_admin_approval boolean not null default false,
  is_system_default boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guest_title_types_slug_format check (slug ~ '^[a-z][a-z0-9_]*$'),
  constraint guest_title_types_label_not_blank check (length(trim(label)) > 0),
  constraint guest_title_types_default_count_positive check (default_guest_count >= 1)
);

create unique index if not exists guest_title_types_project_slug_key
  on public.guest_title_types (project_id, slug);

create unique index if not exists guest_title_types_id_project_id_key
  on public.guest_title_types (id, project_id);

create table if not exists public.guest_tags (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  slug text not null,
  name text not null,
  color text,
  is_internal boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guest_tags_slug_format check (slug ~ '^[a-z][a-z0-9_]*$'),
  constraint guest_tags_name_not_blank check (length(trim(name)) > 0)
);

create unique index if not exists guest_tags_project_slug_key
  on public.guest_tags (project_id, slug);

create unique index if not exists guest_tags_id_project_id_key
  on public.guest_tags (id, project_id);

create table if not exists public.guests (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  guest_title_type_id uuid,
  display_name text not null,
  normalized_name text generated always as (
    lower(regexp_replace(trim(display_name), '\s+', ' ', 'g'))
  ) stored,
  guest_side public.guest_side not null,
  whatsapp_number text,
  normalized_whatsapp text generated always as (
    nullif(regexp_replace(coalesce(whatsapp_number, ''), '[^0-9]+', '', 'g'), '')
  ) stored,
  preferred_language text default 'en',
  is_printed_only boolean not null default false,
  is_active boolean not null default true,
  internal_notes text,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guests_display_name_not_blank check (length(trim(display_name)) > 0),
  constraint guests_title_type_project_match
    foreign key (guest_title_type_id, project_id)
    references public.guest_title_types (id, project_id)
    on delete restrict
);

create unique index if not exists guests_id_project_id_key
  on public.guests (id, project_id);

create index if not exists guests_project_side_idx
  on public.guests (project_id, guest_side, is_active, display_name);

create index if not exists guests_project_normalized_name_idx
  on public.guests (project_id, normalized_name)
  where is_active = true;

create index if not exists guests_project_normalized_whatsapp_idx
  on public.guests (project_id, normalized_whatsapp)
  where normalized_whatsapp is not null and is_active = true;

create table if not exists public.guest_event_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  guest_id uuid not null,
  event_id uuid not null,
  invited boolean not null default true,
  status public.guest_event_assignment_status not null default 'assigned',
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guest_event_assignments_guest_project_match
    foreign key (guest_id, project_id)
    references public.guests (id, project_id)
    on delete cascade,
  constraint guest_event_assignments_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade
);

create unique index if not exists guest_event_assignments_guest_event_key
  on public.guest_event_assignments (guest_id, event_id);

create index if not exists guest_event_assignments_project_event_idx
  on public.guest_event_assignments (project_id, event_id, status);

create table if not exists public.guest_tag_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  guest_id uuid not null,
  tag_id uuid not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint guest_tag_assignments_guest_project_match
    foreign key (guest_id, project_id)
    references public.guests (id, project_id)
    on delete cascade,
  constraint guest_tag_assignments_tag_project_match
    foreign key (tag_id, project_id)
    references public.guest_tags (id, project_id)
    on delete cascade
);

create unique index if not exists guest_tag_assignments_guest_tag_key
  on public.guest_tag_assignments (guest_id, tag_id);

create table if not exists public.guest_duplicate_candidates (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  source_guest_id uuid not null,
  matched_guest_id uuid not null,
  reason public.guest_duplicate_reason not null,
  status public.guest_duplicate_status not null default 'open',
  created_at timestamptz not null default now(),
  constraint guest_duplicate_candidates_not_self check (source_guest_id <> matched_guest_id),
  constraint guest_duplicate_candidates_source_project_match
    foreign key (source_guest_id, project_id)
    references public.guests (id, project_id)
    on delete cascade,
  constraint guest_duplicate_candidates_match_project_match
    foreign key (matched_guest_id, project_id)
    references public.guests (id, project_id)
    on delete cascade
);

create unique index if not exists guest_duplicate_candidates_unique_open_signal
  on public.guest_duplicate_candidates (project_id, source_guest_id, matched_guest_id, reason)
  where status = 'open';

drop trigger if exists set_guest_title_types_updated_at on public.guest_title_types;
create trigger set_guest_title_types_updated_at
before update on public.guest_title_types
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_guest_tags_updated_at on public.guest_tags;
create trigger set_guest_tags_updated_at
before update on public.guest_tags
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_guests_updated_at on public.guests;
create trigger set_guests_updated_at
before update on public.guests
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_guest_event_assignments_updated_at on public.guest_event_assignments;
create trigger set_guest_event_assignments_updated_at
before update on public.guest_event_assignments
for each row
execute function app_private.set_updated_at();

create or replace function app_private.seed_guest_foundation_for_project(
  p_project_id uuid,
  p_actor_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.guest_title_types (
    project_id,
    slug,
    label,
    default_guest_count,
    requires_admin_approval,
    is_system_default,
    sort_order,
    created_by
  )
  values
    (p_project_id, 'mr', 'Mr.', 1, false, true, 10, p_actor_user_id),
    (p_project_id, 'mme', 'Mme.', 1, false, true, 20, p_actor_user_id),
    (p_project_id, 'mlle', 'Mlle.', 1, false, true, 30, p_actor_user_id),
    (p_project_id, 'couple', 'Couple', 2, true, true, 40, p_actor_user_id)
  on conflict (project_id, slug) do nothing;

  insert into public.guest_tags (
    project_id,
    slug,
    name,
    is_internal,
    created_by
  )
  values
    (p_project_id, 'family', 'Family', false, p_actor_user_id),
    (p_project_id, 'friends', 'Friends', false, p_actor_user_id),
    (p_project_id, 'colleagues', 'Colleagues', false, p_actor_user_id),
    (p_project_id, 'vip', 'VIP', false, p_actor_user_id),
    (p_project_id, 'protocol', 'Protocol', false, p_actor_user_id),
    (p_project_id, 'printed_invitation', 'Printed invitation', false, p_actor_user_id),
    (p_project_id, 'digital_invitation', 'Digital invitation', false, p_actor_user_id),
    (p_project_id, 'child', 'Child', false, p_actor_user_id),
    (p_project_id, 'special_attention', 'Special attention', false, p_actor_user_id),
    (p_project_id, 'follow_up_needed', 'Follow-up needed', true, p_actor_user_id)
  on conflict (project_id, slug) do nothing;
end;
$$;

create or replace function app_private.seed_guest_foundation_after_project()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform app_private.seed_guest_foundation_for_project(new.id, new.created_by);
  return new;
end;
$$;

drop trigger if exists seed_guest_foundation_after_project on public.wedding_projects;
create trigger seed_guest_foundation_after_project
after insert on public.wedding_projects
for each row
execute function app_private.seed_guest_foundation_after_project();

select app_private.seed_guest_foundation_for_project(id, created_by)
from public.wedding_projects;

create or replace function app_private.user_can_manage_guest_side(
  p_user_id uuid,
  p_project_id uuid,
  p_guest_side public.guest_side
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_user_id is not null
    and (
      app_private.user_can_access_project(p_user_id, p_project_id, 'guests.update')
      or (
        p_guest_side = 'bride'
        and app_private.user_can_access_project(p_user_id, p_project_id, 'guests.manage_bride_side')
      )
      or (
        p_guest_side = 'groom'
        and app_private.user_can_access_project(p_user_id, p_project_id, 'guests.manage_groom_side')
      )
      or (
        p_guest_side = 'both'
        and app_private.user_can_access_project(p_user_id, p_project_id, 'guests.manage_bride_side')
        and app_private.user_can_access_project(p_user_id, p_project_id, 'guests.manage_groom_side')
      )
    );
$$;

create or replace function public.current_user_can_manage_guest_side(
  p_project_id uuid,
  p_guest_side public.guest_side
)
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select app_private.user_can_manage_guest_side((select auth.uid()), p_project_id, p_guest_side);
$$;

revoke all on function app_private.seed_guest_foundation_for_project(uuid, uuid) from public;
revoke all on function app_private.seed_guest_foundation_after_project() from public;
revoke all on function app_private.user_can_manage_guest_side(uuid, uuid, public.guest_side) from public;
revoke all on function public.current_user_can_manage_guest_side(uuid, public.guest_side) from public;
grant execute on function public.current_user_can_manage_guest_side(uuid, public.guest_side) to authenticated;

create or replace function app_private.redact_guest_audit_snapshot(
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
      - 'display_name'
      - 'normalized_name'
      - 'whatsapp_number'
      - 'normalized_whatsapp'
      - 'internal_notes'
  end;
$$;

revoke all on function app_private.redact_guest_audit_snapshot(jsonb) from public;

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

  action_name := case
    when tg_table_name = 'guests' and tg_op = 'INSERT' then 'guests.created'
    when tg_table_name = 'guests' and tg_op = 'UPDATE' and old.is_active and not new.is_active then 'guests.deactivated'
    when tg_table_name = 'guests' and tg_op = 'UPDATE' then 'guests.updated'
    when tg_table_name = 'guest_event_assignments' and tg_op = 'INSERT' then 'guest_event_assignments.created'
    when tg_table_name = 'guest_event_assignments' and tg_op = 'UPDATE' then 'guest_event_assignments.updated'
    when tg_table_name = 'guest_event_assignments' and tg_op = 'DELETE' then 'guest_event_assignments.deleted'
    when tg_table_name = 'guest_tag_assignments' and tg_op = 'INSERT' then 'guest_tags.assigned'
    when tg_table_name = 'guest_tag_assignments' and tg_op = 'DELETE' then 'guest_tags.removed'
    when tg_table_name = 'guest_title_types' and tg_op = 'INSERT' then 'guest_title_types.created'
    when tg_table_name = 'guest_title_types' and tg_op = 'UPDATE' then 'guest_title_types.updated'
    when tg_table_name = 'guest_tags' and tg_op = 'INSERT' then 'guest_tags.created'
    when tg_table_name = 'guest_tags' and tg_op = 'UPDATE' then 'guest_tags.updated'
    when tg_table_name = 'guest_duplicate_candidates' and tg_op = 'INSERT' then 'guest_duplicates.detected'
    when tg_table_name = 'guest_duplicate_candidates' and tg_op = 'UPDATE' then 'guest_duplicates.reviewed'
    else lower(tg_table_name || '.' || tg_op)
  end;

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

drop trigger if exists audit_guests_insert on public.guests;
create trigger audit_guests_insert
after insert on public.guests
for each row
execute function app_private.audit_guest_management_change();

drop trigger if exists audit_guests_update on public.guests;
create trigger audit_guests_update
after update on public.guests
for each row
execute function app_private.audit_guest_management_change();

drop trigger if exists audit_guest_event_assignments_insert on public.guest_event_assignments;
create trigger audit_guest_event_assignments_insert
after insert on public.guest_event_assignments
for each row
execute function app_private.audit_guest_management_change();

drop trigger if exists audit_guest_event_assignments_update on public.guest_event_assignments;
create trigger audit_guest_event_assignments_update
after update on public.guest_event_assignments
for each row
execute function app_private.audit_guest_management_change();

drop trigger if exists audit_guest_event_assignments_delete on public.guest_event_assignments;
create trigger audit_guest_event_assignments_delete
after delete on public.guest_event_assignments
for each row
execute function app_private.audit_guest_management_change();

drop trigger if exists audit_guest_tag_assignments_insert on public.guest_tag_assignments;
create trigger audit_guest_tag_assignments_insert
after insert on public.guest_tag_assignments
for each row
execute function app_private.audit_guest_management_change();

drop trigger if exists audit_guest_tag_assignments_delete on public.guest_tag_assignments;
create trigger audit_guest_tag_assignments_delete
after delete on public.guest_tag_assignments
for each row
execute function app_private.audit_guest_management_change();

drop trigger if exists audit_guest_title_types_insert on public.guest_title_types;
create trigger audit_guest_title_types_insert
after insert on public.guest_title_types
for each row
execute function app_private.audit_guest_management_change();

drop trigger if exists audit_guest_title_types_update on public.guest_title_types;
create trigger audit_guest_title_types_update
after update on public.guest_title_types
for each row
execute function app_private.audit_guest_management_change();

drop trigger if exists audit_guest_tags_insert on public.guest_tags;
create trigger audit_guest_tags_insert
after insert on public.guest_tags
for each row
execute function app_private.audit_guest_management_change();

drop trigger if exists audit_guest_tags_update on public.guest_tags;
create trigger audit_guest_tags_update
after update on public.guest_tags
for each row
execute function app_private.audit_guest_management_change();

drop trigger if exists audit_guest_duplicate_candidates_insert on public.guest_duplicate_candidates;
create trigger audit_guest_duplicate_candidates_insert
after insert on public.guest_duplicate_candidates
for each row
execute function app_private.audit_guest_management_change();

drop trigger if exists audit_guest_duplicate_candidates_update on public.guest_duplicate_candidates;
create trigger audit_guest_duplicate_candidates_update
after update on public.guest_duplicate_candidates
for each row
execute function app_private.audit_guest_management_change();

alter table public.guest_title_types enable row level security;
alter table public.guest_tags enable row level security;
alter table public.guests enable row level security;
alter table public.guest_event_assignments enable row level security;
alter table public.guest_tag_assignments enable row level security;
alter table public.guest_duplicate_candidates enable row level security;

drop policy if exists "Guest title types visible to guest readers" on public.guest_title_types;
create policy "Guest title types visible to guest readers"
on public.guest_title_types
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'guests.read'));

drop policy if exists "Guest title types managed by guest title managers" on public.guest_title_types;
create policy "Guest title types managed by guest title managers"
on public.guest_title_types
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_title_types.manage'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_title_types.manage'));

drop policy if exists "Guest tags visible to guest readers" on public.guest_tags;
create policy "Guest tags visible to guest readers"
on public.guest_tags
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'guests.read'));

drop policy if exists "Guest tags managed by tag managers" on public.guest_tags;
create policy "Guest tags managed by tag managers"
on public.guest_tags
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_tags.manage'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_tags.manage'));

drop policy if exists "Guests visible to guest readers" on public.guests;
create policy "Guests visible to guest readers"
on public.guests
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'guests.read'));

drop policy if exists "Guests inserted by side managers" on public.guests;
create policy "Guests inserted by side managers"
on public.guests
for insert
to authenticated
with check (app_private.user_can_manage_guest_side((select auth.uid()), project_id, guest_side));

drop policy if exists "Guests updated by side managers" on public.guests;
create policy "Guests updated by side managers"
on public.guests
for update
to authenticated
using (app_private.user_can_manage_guest_side((select auth.uid()), project_id, guest_side))
with check (
  app_private.user_can_manage_guest_side((select auth.uid()), project_id, guest_side)
  and (
    is_active
    or app_private.user_can_access_project((select auth.uid()), project_id, 'guests.deactivate')
  )
);

drop policy if exists "Guest event assignments visible to guest readers" on public.guest_event_assignments;
create policy "Guest event assignments visible to guest readers"
on public.guest_event_assignments
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'guests.read'));

drop policy if exists "Guest event assignments managed by assignment managers" on public.guest_event_assignments;
create policy "Guest event assignments managed by assignment managers"
on public.guest_event_assignments
for all
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'guest_event_assignments.manage')
  and exists (
    select 1
    from public.guests
    where guests.id = guest_event_assignments.guest_id
      and guests.project_id = guest_event_assignments.project_id
      and app_private.user_can_manage_guest_side((select auth.uid()), guest_event_assignments.project_id, guests.guest_side)
  )
)
with check (
  app_private.user_can_access_project((select auth.uid()), project_id, 'guest_event_assignments.manage')
  and exists (
    select 1
    from public.guests
    where guests.id = guest_event_assignments.guest_id
      and guests.project_id = guest_event_assignments.project_id
      and app_private.user_can_manage_guest_side((select auth.uid()), guest_event_assignments.project_id, guests.guest_side)
  )
);

drop policy if exists "Guest tag assignments visible to guest readers" on public.guest_tag_assignments;
create policy "Guest tag assignments visible to guest readers"
on public.guest_tag_assignments
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'guests.read'));

drop policy if exists "Guest tag assignments managed by tag managers" on public.guest_tag_assignments;
create policy "Guest tag assignments managed by tag managers"
on public.guest_tag_assignments
for all
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'guest_tags.manage')
  and exists (
    select 1
    from public.guests
    where guests.id = guest_tag_assignments.guest_id
      and guests.project_id = guest_tag_assignments.project_id
      and app_private.user_can_manage_guest_side((select auth.uid()), guest_tag_assignments.project_id, guests.guest_side)
  )
)
with check (
  app_private.user_can_access_project((select auth.uid()), project_id, 'guest_tags.manage')
  and exists (
    select 1
    from public.guests
    where guests.id = guest_tag_assignments.guest_id
      and guests.project_id = guest_tag_assignments.project_id
      and app_private.user_can_manage_guest_side((select auth.uid()), guest_tag_assignments.project_id, guests.guest_side)
  )
);

drop policy if exists "Guest duplicates visible to duplicate readers" on public.guest_duplicate_candidates;
create policy "Guest duplicates visible to duplicate readers"
on public.guest_duplicate_candidates
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_duplicates.read'));

drop policy if exists "Guest duplicates managed by duplicate readers" on public.guest_duplicate_candidates;
drop policy if exists "Guest duplicates managed by duplicate managers" on public.guest_duplicate_candidates;
create policy "Guest duplicates managed by duplicate managers"
on public.guest_duplicate_candidates
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_duplicates.manage'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'guest_duplicates.manage'));

grant select, insert, update on public.guest_title_types to authenticated;
grant select, insert, update on public.guest_tags to authenticated;
grant select, insert, update on public.guests to authenticated;
grant select, insert, update, delete on public.guest_event_assignments to authenticated;
grant select, insert, delete on public.guest_tag_assignments to authenticated;
grant select, insert, update on public.guest_duplicate_candidates to authenticated;

grant select, insert, update on public.guest_title_types to service_role;
grant select, insert, update on public.guest_tags to service_role;
grant select, insert, update on public.guests to service_role;
grant select, insert, update, delete on public.guest_event_assignments to service_role;
grant select, insert, delete on public.guest_tag_assignments to service_role;
grant select, insert, update on public.guest_duplicate_candidates to service_role;

insert into public.permissions (slug, description, requirement_ids)
values
  ('guests.read', 'Read project-level guest records and guest lists.', array['GM-001', 'GM-002', 'ROLE-005']),
  ('guests.create', 'Create project-level guest records across sides.', array['GM-003', 'TECH-004']),
  ('guests.update', 'Update project-level guest records across sides.', array['GM-003', 'ROLE-005', 'TECH-004']),
  ('guests.deactivate', 'Deactivate project-level guest records.', array['GM-003', 'REP-006']),
  ('guests.manage_bride_side', 'Create and update bride-side guest records for assigned projects.', array['GM-002', 'ROLE-005']),
  ('guests.manage_groom_side', 'Create and update groom-side guest records for assigned projects.', array['GM-002', 'ROLE-005']),
  ('guest_title_types.manage', 'Manage project guest title/type records.', array['GM-007']),
  ('guest_tags.manage', 'Manage project guest tags and tag assignments.', array['GM-011']),
  ('guest_event_assignments.manage', 'Manage event assignment foundation for guests.', array['PROJ-005', 'GM-006']),
  ('guest_duplicates.read', 'Read guest duplicate candidate signals.', array['GM-008']),
  ('guest_duplicates.manage', 'Manage guest duplicate candidate review state.', array['GM-008'])
on conflict (slug) do update
set
  description = excluded.description,
  requirement_ids = excluded.requirement_ids;

insert into public.roles (scope, slug, name, description, requires_mfa, is_system, requirement_ids)
values
  ('project', 'bride', 'Bride', 'Project-level bride role with own-side guest management.', false, true, array['ROLE-005', 'GM-002', 'GM-003']),
  ('project', 'groom', 'Groom', 'Project-level groom role with own-side guest management.', false, true, array['ROLE-005', 'GM-002', 'GM-003'])
on conflict (slug) do update
set
  scope = excluded.scope,
  name = excluded.name,
  description = excluded.description,
  requires_mfa = excluded.requires_mfa,
  is_system = excluded.is_system,
  requirement_ids = excluded.requirement_ids;

with grants(role_slug, permission_slug) as (
  values
    ('diginoces_admin', 'guests.read'),
    ('diginoces_admin', 'guests.create'),
    ('diginoces_admin', 'guests.update'),
    ('diginoces_admin', 'guests.deactivate'),
    ('diginoces_admin', 'guests.manage_bride_side'),
    ('diginoces_admin', 'guests.manage_groom_side'),
    ('diginoces_admin', 'guest_title_types.manage'),
    ('diginoces_admin', 'guest_tags.manage'),
    ('diginoces_admin', 'guest_event_assignments.manage'),
    ('diginoces_admin', 'guest_duplicates.read'),
    ('diginoces_admin', 'guest_duplicates.manage'),
    ('operations_manager', 'guests.read'),
    ('operations_manager', 'guests.create'),
    ('operations_manager', 'guests.update'),
    ('operations_manager', 'guests.deactivate'),
    ('operations_manager', 'guest_title_types.manage'),
    ('operations_manager', 'guest_tags.manage'),
    ('operations_manager', 'guest_event_assignments.manage'),
    ('operations_manager', 'guest_duplicates.read'),
    ('operations_manager', 'guest_duplicates.manage'),
    ('couple', 'guests.read'),
    ('couple', 'guest_duplicates.read'),
    ('bride', 'guests.read'),
    ('bride', 'guests.manage_bride_side'),
    ('bride', 'guest_title_types.manage'),
    ('bride', 'guest_tags.manage'),
    ('bride', 'guest_event_assignments.manage'),
    ('bride', 'guest_duplicates.read'),
    ('groom', 'guests.read'),
    ('groom', 'guests.manage_groom_side'),
    ('groom', 'guest_title_types.manage'),
    ('groom', 'guest_tags.manage'),
    ('groom', 'guest_event_assignments.manage'),
    ('groom', 'guest_duplicates.read')
)
insert into public.role_permissions (role_id, permission_slug)
select r.id, g.permission_slug
from grants g
join public.roles r on r.slug = g.role_slug
join public.permissions p on p.slug = g.permission_slug
on conflict (role_id, permission_slug) do nothing;
