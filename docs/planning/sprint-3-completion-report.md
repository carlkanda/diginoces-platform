# Sprint 3 Completion Report

## Status

Sprint 3 is implemented and verified for draft PR review. The linked Supabase migration was applied, `db:lint` passed, web checks passed, and tests/checks are documented below.

## Requirements Covered

- `EPIC-GM`
- `FEAT-GM-001`, `FEAT-GM-002`, `FEAT-GM-003`, `FEAT-GM-005`
- Foundation-only coverage for `FEAT-GM-006`
- Requirement IDs: `GM-001`, `GM-002`, `GM-003`, `GM-006`, `GM-007`, `GM-008`, `GM-009`, `GM-011`, `GM-013`, `GM-015`, `PROJ-005`, `ROLE-005`, `REP-006`, `TECH-004`

Deferred by Sprint 3 scope: `FEAT-GM-004` CSV/Excel import and approval, full duplicate merge workflow, RSVP, public guest page, invitation generation, PDF/QR generation, WhatsApp, seating, check-in, contracts, pricing, payments, and partner project creation.

## Files Created Or Changed

- `supabase/migrations/20260521211837_sprint_3_guest_management_foundation.sql`
- `apps/web/src/types/database.ts`
- `apps/web/src/lib/guests/guest-service.ts`
- `apps/web/src/lib/guests/guest-api.ts`
- `apps/web/src/lib/guests/guest-foundation.test.ts`
- `apps/web/src/app/api/projects/[projectId]/guests/route.ts`
- `apps/web/src/app/api/guests/[guestId]/route.ts`
- `apps/web/src/app/platform/projects/[projectId]/guests/actions.ts`
- `apps/web/src/app/platform/projects/[projectId]/guests/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guests/new/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guests/[guestId]/page.tsx`
- `apps/web/src/lib/security/permissions.ts`
- `apps/web/src/lib/audit/audit-log.ts`
- `apps/web/src/app/api/health/route.ts`
- `apps/web/src/app/platform/projects/[projectId]/page.tsx`
- `apps/web/src/app/globals.css`
- `docs/setup/local-development.md`
- `docs/planning/sprint-3-completion-report.md`

## Tests Added

- `apps/web/src/lib/guests/guest-foundation.test.ts`
  - Scope mapping for `EPIC-GM` and approved Sprint 3 feature IDs.
  - Manual guest creation/update payload validation.
  - Side and event filtering helpers.
  - Duplicate detection helper.
  - Bride/groom/both side permission helper.
  - Guest readiness validation without implementing invitation workflows.

## Commands Run

- `npm.cmd --workspace apps/web run test -- src/lib/guests/guest-foundation.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run format`
- `npx.cmd supabase@latest db push --help`
- `npx.cmd supabase@latest db lint --help`
- `npx.cmd supabase@latest migration list --help`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `npx.cmd supabase@latest migration list --linked`
- `npx.cmd supabase@latest db push --linked --yes`
- `npx.cmd supabase@latest gen types --linked --lang=typescript --schema public`
- `docker version`
- `npm.cmd run db:lint`
- `npm.cmd ci`
- `npm.cmd run format:check`
- `npm.cmd run test`
- `npm.cmd audit --omit=dev`
- `npm.cmd run build`
- Local browser verification at `http://localhost:3000`, `/api/health`, and `/platform/projects`
- `git diff --check`
- Secret-pattern scan across changed app, migration, setup, report, and `.env.example` files

## Checks Passed

- `npm.cmd ci` passed and reported `found 0 vulnerabilities`.
- `npm.cmd run format:check` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run typecheck` passed for web and database workspaces.
- `npm.cmd run test` passed: 3 files, 20 tests.
- `npm.cmd audit --omit=dev` passed with 0 vulnerabilities.
- `npm.cmd run build` passed with the new guest API and UI routes included in the route manifest.
- `npx.cmd supabase@latest db push --linked --dry-run` passed and reported only `20260521211837_sprint_3_guest_management_foundation.sql` as pending.
- `npx.cmd supabase@latest db push --linked --yes` passed and applied `20260521211837_sprint_3_guest_management_foundation.sql`.
- `npm.cmd run db:lint` passed: no schema errors found for `public` and `app_private`.
- `npx.cmd supabase@latest migration list --linked` passed and showed `20260521211837` present locally and remotely.
- `npx.cmd supabase@latest gen types --linked --lang=typescript --schema public` passed, and `apps/web/src/types/database.ts` was refreshed from the linked schema.
- Browser verification passed: home, health, and projects pages rendered content, had no framework error overlay, and reported no browser console errors.
- `git diff --check` passed.
- Secret-pattern scan found only documented placeholder variable names, existing service-role SQL grants, and `.env.example` placeholders; no real credentials were found.

## Checks Failed Or Blocked

- No Sprint 3 completion blockers remain.
- `docker version` failed because Docker is not installed in this environment, so local Supabase database validation was not available. The linked Supabase migration push and linked `db:lint` path passed instead.

## Security Checks Performed

- No `.env` or `.env.local` files were created or committed.
- No Supabase service-role key, database password, WhatsApp token, Google secret, or private guest data was added.
- New guest tables in the exposed `public` schema enable RLS.
- Backend routes call permission RPCs before guest mutations.
- RLS policies use project permissions and bride/groom/both side checks for guest writes and guest assignment writes.
- Security definer functions are placed in the private `app_private` schema.
- Guest audit triggers redact direct guest PII fields from audit snapshots.
- Guest APIs use the authenticated Supabase session and do not use service-role secrets.

## Assumptions Made

- The user request for issue `#5` overrides the stale Sprint 1 label in `AGENTS.md`.
- Sprint 3 maps to `EPIC-GM` and backlog features `FEAT-GM-001`, `FEAT-GM-002`, `FEAT-GM-003`, `FEAT-GM-005`, with foundation-only treatment for `FEAT-GM-006`.
- CSV/Excel import and approval (`FEAT-GM-004`) starts in Sprint 4 and is intentionally not implemented here.
- Bride and groom project roles are foundation roles for own-side guest management; `both` guests require either `guests.update` or both side-specific grants.

## Open Issues Or Blockers

- No Sprint 3 completion blockers remain.
- Full duplicate merge workflow and guest locking/change-request workflow remain future scope.

## Recommended Sprint 4 Scope

- CSV/Excel guest import and approval workflow.
- Import validation reporting and rejection reasons.
- Full duplicate review and merge workflow.
- Guest list locking and change-request workflow beyond the Sprint 3 placeholder.
- Preserve the Sprint 3 permission and audit model for import-created guests.
