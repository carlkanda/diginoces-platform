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
- `supabase/migrations/20260521230555_sprint_3_coderabbit_review_fixes.sql`
- `supabase/migrations/20260522001000_sprint_3_coderabbit_followup_fixes.sql`
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
- `npx.cmd supabase@latest db push --linked --dry-run` after CodeRabbit fixes
- `npx.cmd supabase@latest db push --linked --yes` after CodeRabbit fixes
- `npx.cmd supabase@latest gen types --linked --lang=typescript --schema public` after CodeRabbit fixes
- `npx.cmd supabase@latest db push --linked --dry-run` after CodeRabbit follow-up fixes
- `npx.cmd supabase@latest db push --linked --yes` after CodeRabbit follow-up fixes
- `npx.cmd supabase@latest migration list --linked` after CodeRabbit follow-up fixes
- `npm.cmd run db:lint` after CodeRabbit follow-up fixes
- `docker version`
- `npm.cmd run db:lint`
- `npm.cmd ci`
- `npm.cmd run format:check`
- `npm.cmd run format:check` after CodeRabbit follow-up fixes
- `npm.cmd run lint` after CodeRabbit follow-up fixes
- `npm.cmd run typecheck` after CodeRabbit follow-up fixes
- `npm.cmd run test`
- `npm.cmd run test` after CodeRabbit follow-up fixes
- `npm.cmd audit --omit=dev`
- `npm.cmd audit --omit=dev` after CodeRabbit follow-up fixes
- `npm.cmd run build`
- `npm.cmd run build` after CodeRabbit follow-up fixes
- Local browser verification at `http://localhost:3000`, `/api/health`, and `/platform/projects`
- `git diff --check`
- `git diff --check` after CodeRabbit follow-up fixes
- Secret-pattern scan across changed app, migration, setup, report, and `.env.example` files
- Secret-pattern scan across changed app, migration, setup, report, and `.env.example` files after CodeRabbit follow-up fixes

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
- `npx.cmd supabase@latest migration list --linked` passed and showed `20260521211837` and `20260521230555` present locally and remotely.
- `npx.cmd supabase@latest gen types --linked --lang=typescript --schema public` passed, and `apps/web/src/types/database.ts` was refreshed from the linked schema.
- `npx.cmd supabase@latest db push --linked --yes` after CodeRabbit fixes passed and applied `20260521230555_sprint_3_coderabbit_review_fixes.sql`.
- `npx.cmd supabase@latest gen types --linked --lang=typescript --schema public` after CodeRabbit fixes passed, and `apps/web/src/types/database.ts` was refreshed with `replace_guest_foundation_assignments`.
- CodeRabbit review fixes were applied for event filter clearing, guest fixture consistency, atomic assignment replacement, safe duplicate queries without `.or()` interpolation, and `guests.deactivate` RLS enforcement.
- `npx.cmd supabase@latest db push --linked --dry-run` after CodeRabbit follow-up fixes passed and reported `20260522001000_sprint_3_coderabbit_followup_fixes.sql` as pending.
- `npx.cmd supabase@latest db push --linked --yes` after CodeRabbit follow-up fixes passed and applied `20260522001000_sprint_3_coderabbit_followup_fixes.sql`.
- `npm.cmd run db:lint` after CodeRabbit follow-up fixes passed: no schema errors found for `public` and `app_private`.
- `npx.cmd supabase@latest migration list --linked` after CodeRabbit follow-up fixes passed and showed `20260522001000` present locally and remotely.
- Additional CodeRabbit follow-up fixes were applied for invalid guest `side` query validation, form-control typography inheritance, `guest_duplicates.manage` write semantics, and project-scoped event/tag assignment validation in `replace_guest_foundation_assignments`.
- After the CodeRabbit follow-up fixes, `npm.cmd run format:check`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run test`, `npm.cmd run build`, `npm.cmd audit --omit=dev`, and `git diff --check` were re-run and passed.
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
- Guest deactivation requires `guests.deactivate` in addition to side-management access.
- Guest event/tag assignment replacement now runs through an atomic database RPC.
- Guest event/tag assignment replacement rejects event and tag IDs outside the guest project before writing assignments.
- Guest duplicate candidate writes now require `guest_duplicates.manage`; read-only duplicate visibility remains on `guest_duplicates.read`.
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
