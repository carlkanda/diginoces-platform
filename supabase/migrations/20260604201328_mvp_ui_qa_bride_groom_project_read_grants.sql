-- Sprint 15 MVP UI QA hardening:
-- Bride/groom project roles are project-scoped couple actors introduced after
-- Sprint 2. They need the same project/event detail read foundation that the
-- original couple role had, otherwise project hubs can be visible through later
-- module policies while the project detail route fails closed.

begin;

with grants(role_slug, permission_slug) as (
  values
    ('bride', 'projects.read'),
    ('bride', 'events.read'),
    ('bride', 'workflow_tasks.read'),
    ('groom', 'projects.read'),
    ('groom', 'events.read'),
    ('groom', 'workflow_tasks.read')
)
insert into public.role_permissions (role_id, permission_slug)
select r.id, g.permission_slug
from grants g
join public.roles r on r.slug = g.role_slug
join public.permissions p on p.slug = g.permission_slug
on conflict (role_id, permission_slug) do nothing;

commit;
