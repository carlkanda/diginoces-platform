# RLS And Database Security Review - Sprint 15

## Traceability

- GitHub issue: `#31` - Sprint 15 - Release Hardening, QA & MVP Launch.
- Sprint plan: `docs/planning/sprint-15-plan.md`.
- Requirements/backlog: `ROLE-001`, `ROLE-004`, `ROLE-006`, `ROLE-007`, `ROLE-009`, `TECH-004`, `TECH-010`, `FILE-006`, `FILE-009`, `REP-007`, `EPIC-RELEASE`, `FEAT-REL-002`, and `FEAT-REL-003`.
- Migration reviewed: `supabase/migrations/20260603113922_sprint_15_release_security_grants.sql`.

## Scope

This review covers Supabase/Postgres security posture for public business tables, RLS policies, grants, helper functions, RPCs, audit logs, file access, and migration state after Sprints 1-15.

## Checks Performed

- Reviewed migrations under `supabase/migrations`.
- Executed linked migration list and dry-run checks before Sprint 15 edits.
- Validated `npm run db:lint` before Sprint 15 edits; no schema errors were reported.
- Used Supabase security advisors to scan the linked dev database.
- Used Supabase performance advisors to scan the linked dev database.
- Added a Sprint 15 migration to narrow function execute grants flagged by security advisors.
- Applied the Sprint 15 migration to the linked dev project on June 4, 2026.
- Re-ran linked migration list, linked dry-run, `npm run db:lint`, security advisors, performance advisors, and RPC grant verification after apply.
- Re-ran linked-dev security advisors and RPC grant verification on June 6, 2026 after PR `#48` low-privilege QA hardening.
- Verified exact low-privilege browser boundaries for bride, groom, partner admin, and event staff in Chrome/CDP using temporary linked-dev roles and fake disposable rows.

## Security Advisor Findings

Supabase security advisors flagged inherited execute access on multiple `SECURITY DEFINER` functions for `anon` and `authenticated` before the Sprint 15 migration. After apply, advisors still report expected warnings for explicitly exposed authenticated app RPCs and token-scoped public guest RPCs; the targeted grant verification below is the release gate for anonymous or inherited-public execute exposure.

Sprint 15 classifies anonymous execute access on authenticated application RPCs as `launch_blocker`. The migration `20260603113922_sprint_15_release_security_grants.sql` revokes inherited `public` execute access and direct `anon` execute grants on authenticated-only RPCs, then grants only the intended roles. The release-readiness test also scans historical migration SQL to confirm authenticated RPCs were not explicitly granted to `anon`; that historical scan is an additional safeguard, not a substitute for the explicit Sprint 15 revokes.

Post-apply verification owner: engineering lead, with operations lead sign-off recorded in `docs/planning/mvp-launch-checklist.md` or the external release runbook. After applying the migration, query function privileges for the authenticated RPC set and confirm no authenticated application RPC remains executable by `anon` or inherited `PUBLIC`. The token-scoped functions listed below remain intentionally granted to `anon`.

Linked dev result on June 4, 2026: passed. The corrected query below returned zero non-allowlisted `PUBLIC`/`anon` execute grants.

Linked dev refresh on June 6, 2026: passed. The same corrected query returned
zero non-allowlisted `PUBLIC`/`anon` execute grants after PR `#48` role-boundary
hardening. The security advisor still reports the expected explicit
security-definer warnings for permission-gated authenticated RPCs and
token-scoped public guest RPCs, plus the production Auth leaked-password
configuration warning tracked in `docs/planning/mvp-launch-checklist.md`.

Run this verification against the target linked project:

```sql
begin;
set local search_path = '';

with allowed_public_rpc(function_name, identity_arguments) as (
  -- MUST match documented public guest functions below.
  values
    ('list_guest_file_downloads', 'p_token text'),
    ('resolve_guest_file_download', 'p_token text, p_file_id uuid'),
    ('resolve_guest_public_page', 'p_token text'),
    ('submit_public_guest_message', 'p_token text, p_message_text text, p_language text, p_event_id uuid'),
    ('submit_public_rsvp', 'p_token text, p_event_id uuid, p_response rsvp_status, p_preferred_language text')
),
direct_execute_grants as (
  select
    p.proname as function_name,
    replace(pg_get_function_identity_arguments(p.oid), 'public.', '') as identity_arguments,
    format(
      'public.%I(%s)',
      p.proname,
      replace(pg_get_function_identity_arguments(p.oid), 'public.', '')
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
where not exists (
  select 1
  from allowed_public_rpc allowlist
  where allowlist.function_name = direct_execute_grants.function_name
    and allowlist.identity_arguments = direct_execute_grants.identity_arguments
)
order by signature, grantee;

rollback;
```

Expected result: zero rows. The query normalizes `public.` from identity arguments because `pg_get_function_identity_arguments` may report the `rsvp_status` enum as either `public.rsvp_status` or `rsvp_status` depending on the connection context. If any authenticated-only RPC appears, add a corrective migration that runs `revoke execute on function <signature> from public;` for inherited grants or `revoke execute on function <signature> from anon;` for direct `anon` grants, rerun the query, and store the query output plus owner sign-off in the QA artifact store from `docs/setup/qa-artifact-store.md` as part of the release evidence.

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
| Authenticated app RPCs | Sprint 15 migration removed inherited public and direct anon execute grants in linked dev; corrected verification query returned zero rows | conditional_go |
| Service role | Used only as database role grants/server-side concept; no key committed | acceptable_mvp_risk |
| Audit logs | Audit tables/triggers/RPCs exist across modules; audit entries are append-oriented | acceptable_mvp_risk |
| File access | Signed download routes and RPCs enforce project/guest access before URL creation | acceptable_mvp_risk |
| Partner/couple restrictions | Enforced by project/event membership, permission helpers, and RLS/RPC checks; PR `#48` exact-role Chrome/CDP QA verified bride/groom side boundaries, partner visible-only access, and check-in staff event scope | acceptable_mvp_risk |

## Remaining Work

- Repeat the Sprint 15 grant migration apply and verification on any staging or production Supabase project that is separate from linked dev.
- Re-run `npm run db:lint`, `npx supabase@latest db push --linked --dry-run`, Supabase advisors, and the RPC grant verification query for each target environment before production promotion.
- Track performance-advisor cleanup as post-launch hardening unless staging reveals a launch-blocking issue.
