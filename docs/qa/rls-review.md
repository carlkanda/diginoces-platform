# RLS And Database Security Review - Sprint 15

## Traceability

- GitHub issue: `#31` - Sprint 15 - Release Hardening, QA & MVP Launch.
- Sprint plan: `docs/planning/sprint-15-plan.md`.
- Requirements/backlog: `ROLE-001`, `ROLE-004`, `ROLE-006`, `ROLE-007`, `ROLE-009`, `TECH-004`, `TECH-010`, `FILE-006`, `FILE-009`, `REP-007`, `EPIC-RELEASE`, `FEAT-REL-002`, and `FEAT-REL-003`.
- Migration reviewed: `supabase/migrations/20260603113922_sprint_15_release_security_grants.sql`.

## Scope

This review covers Supabase/Postgres security posture for public business tables, RLS policies, grants, helper functions, RPCs, audit logs, file access, and migration state after Sprints 1-14.

## Checks Performed

- Reviewed migrations under `supabase/migrations`.
- Executed linked migration list and dry-run checks before Sprint 15 edits.
- Validated `npm run db:lint` before Sprint 15 edits; no schema errors were reported.
- Used Supabase security advisors to scan the linked dev database.
- Used Supabase performance advisors to scan the linked dev database.
- Added a Sprint 15 migration to narrow function execute grants flagged by security advisors.

## Security Advisor Findings

Supabase security advisors flagged inherited execute access on multiple `SECURITY DEFINER` functions for `anon` and `authenticated`.

Sprint 15 classifies anonymous execute access on authenticated application RPCs as `launch_blocker`. The migration `20260603113922_sprint_15_release_security_grants.sql` revokes inherited `public` execute access and direct `anon` execute grants on authenticated-only RPCs, then grants only the intended roles. The release-readiness test also scans historical migration SQL to confirm authenticated RPCs were not explicitly granted to `anon`; that historical scan is an additional safeguard, not a substitute for the explicit Sprint 15 revokes.

Post-apply verification owner: engineering lead, with operations lead sign-off recorded in `docs/planning/mvp-launch-checklist.md` or the external release runbook. After applying the migration, query function privileges for the authenticated RPC set and confirm no authenticated application RPC remains executable by `anon` or inherited `PUBLIC`. The token-scoped functions listed below remain intentionally granted to `anon`.

Run this verification against the target linked project:

```sql
begin;
set local search_path = '';

with allowed_public_rpc(signature) as (
  -- MUST match documented public guest functions below.
  values
    ('public.list_guest_file_downloads(text)'),
    ('public.resolve_guest_file_download(text, uuid)'),
    ('public.resolve_guest_public_page(text)'),
    ('public.submit_public_guest_message(text, text, text, uuid)'),
    ('public.submit_public_rsvp(text, uuid, public.rsvp_status, text)')
),
direct_execute_grants as (
  select
    format(
      'public.%I(%s)',
      p.proname,
      pg_get_function_identity_arguments(p.oid)
    ) as signature,
    coalesce(r.rolname, 'PUBLIC') as grantee
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  cross join lateral aclexplode(
    coalesce(p.proacl, acldefault('f', p.proowner))
  ) as acl
  left join pg_roles r on r.oid = acl.grantee
  where n.nspname = 'public'
    and acl.privilege_type = 'EXECUTE'
    and coalesce(r.rolname, 'PUBLIC') in ('PUBLIC', 'anon')
)
select signature, grantee
from direct_execute_grants
where signature not in (select signature from allowed_public_rpc)
order by signature, grantee;

rollback;
```

Expected result: zero rows. If any authenticated-only RPC appears, add a corrective migration that runs `revoke execute on function <signature> from public;` for inherited grants or `revoke execute on function <signature> from anon;` for direct `anon` grants, rerun the query, and store the query output plus owner sign-off in the QA artifact store from `docs/setup/qa-artifact-store.md` as part of the release evidence.

The following token-scoped public guest functions intentionally remain available to `anon`:

- `public.list_guest_file_downloads(text)`
- `public.resolve_guest_file_download(text, uuid)`
- `public.resolve_guest_public_page(text)`
- `public.submit_public_guest_message(text, text, text, uuid)`
- `public.submit_public_rsvp(text, uuid, public.rsvp_status, text)`

These functions are public by product design and must remain guest-token scoped. They are documented as `acceptable_mvp_risk` provided token checks remain in place.

## Performance Advisor Findings

Supabase performance advisors reported informational and warning-level items, including unindexed foreign keys and multiple permissive policies. These are classified as `post_launch_follow_up` unless a staging load test shows user-visible performance or policy ambiguity. They should be cleaned up before higher-volume production usage.

## RLS Review Matrix

| Area | Review result | Classification |
| --- | --- | --- |
| Public business tables | RLS is used across sprint migrations for app tables | acceptable_mvp_risk |
| Public guest page flows | `anon` access is limited to token-scoped guest public flows | acceptable_mvp_risk |
| Authenticated app RPCs | Sprint 15 migration removes inherited public and direct anon execute grants | launch_blocker until applied |
| Service role | Used only as database role grants/server-side concept; no key committed | acceptable_mvp_risk |
| Audit logs | Audit tables/triggers/RPCs exist across modules; audit entries are append-oriented | acceptable_mvp_risk |
| File access | Signed download routes and RPCs enforce project/guest access before URL creation | acceptable_mvp_risk |
| Partner/couple restrictions | Enforced by project/event membership, permission helpers, and RLS/RPC checks | acceptable_mvp_risk |

## Remaining Work

- Apply the Sprint 15 grant migration to the target Supabase project before launch.
- Re-run `npm run db:lint`, `npx supabase@latest db push --linked --dry-run`, and Supabase advisors after the migration is applied.
- Track performance-advisor cleanup as post-launch hardening unless staging reveals a launch-blocking issue.
