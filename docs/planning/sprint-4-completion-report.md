# Sprint 4 Completion Report

## Status

Sprint 4 is implemented and verified for draft PR review. The linked Supabase migration was applied, generated database types were refreshed, `db:lint` passed, and web checks passed.

## Requirements Covered

- Epic: `EPIC-GM`
- Feature: `FEAT-GM-004`
- Stories: `STORY-GM-004`, `STORY-GM-005`
- Task: `TASK-GM-003`
- Test cases: `TEST-GM-004`, `TEST-GM-005`
- Requirement IDs: `GM-004`, `GM-005`, `GM-006`, `GM-008`, `GM-013`, `GM-014`, `GM-015`, `ROLE-001`, `ROLE-005`, `REP-006`, `TECH-004`

Deferred by Sprint 4 scope: Excel import, RSVP, public guest page, invitation generation, PDF/QR generation, WhatsApp, seating, check-in, contracts, pricing, payments, partner project creation, and automatic duplicate merging.

## Files Created Or Changed

- `supabase/migrations/20260522085658_sprint_4_guest_import_approval.sql`
- `apps/web/package.json`
- `package-lock.json`
- `apps/web/src/types/database.ts`
- `apps/web/src/lib/guest-imports/guest-import-service.ts`
- `apps/web/src/lib/guest-imports/guest-import-db.ts`
- `apps/web/src/lib/guest-imports/guest-import-api.ts`
- `apps/web/src/lib/guest-imports/guest-import-foundation.test.ts`
- `apps/web/src/lib/security/permissions.ts`
- `apps/web/src/app/api/health/route.ts`
- `apps/web/src/app/api/projects/[projectId]/guest-imports/route.ts`
- `apps/web/src/app/api/projects/[projectId]/guest-imports/[importId]/route.ts`
- `apps/web/src/app/api/projects/[projectId]/guest-imports/[importId]/mapping/route.ts`
- `apps/web/src/app/api/projects/[projectId]/guest-imports/[importId]/submit/route.ts`
- `apps/web/src/app/api/projects/[projectId]/guest-imports/[importId]/review/route.ts`
- `apps/web/src/app/api/projects/[projectId]/guest-imports/[importId]/apply/route.ts`
- `apps/web/src/app/platform/projects/[projectId]/guest-imports/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guest-imports/new/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guest-imports/actions.ts`
- `apps/web/src/app/platform/projects/[projectId]/guest-imports/[importId]/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guest-imports/[importId]/mapping/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guest-imports/[importId]/review/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guests/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/page.tsx`
- `docs/setup/local-development.md`
- `docs/planning/sprint-4-completion-report.md`

## Database Migration

- Added `guest_import_sessions`, `guest_import_rows`, and `guest_import_mappings`.
- Added import status, row validation status, duplicate severity, and row approval status enums.
- Added RLS policies, grants, indexes, updated-at triggers, audit triggers, and import permissions.
- Added RPCs:
  - `submit_guest_import_session`
  - `review_guest_import_rows`
  - `apply_guest_import_approved_rows`

## Tests Added

- `apps/web/src/lib/guest-imports/guest-import-foundation.test.ts`
  - CSV parsing with headers, quoted fields, blank rows, and row numbers.
  - French/English mapping suggestions.
  - Row mapping and validation for display name, title/type, side, and project events.
  - Printed-only rows without WhatsApp allowed.
  - Digital rows without WhatsApp blocked.
  - Duplicate detection within import and against existing guests.
  - Staged import behavior before approval.
  - Partial approval applies only approved rows.
  - Unauthorized roles cannot review/apply.
  - Import audit action coverage.

## Commands Run

- `npx.cmd supabase@latest migration --help`
- `npx.cmd supabase@latest migration new sprint_4_guest_import_approval`
- `npm.cmd install csv-parse --workspace apps/web --save`
- `npm.cmd --workspace apps/web run test -- src/lib/guest-imports/guest-import-foundation.test.ts`
- `npm.cmd run typecheck`
- `npx.cmd supabase@latest db --help`
- `npx.cmd supabase@latest db push --help`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `npx.cmd supabase@latest db push --linked --yes`
- `npx.cmd supabase@latest gen --help`
- `npx.cmd supabase@latest gen types --help`
- `npx.cmd supabase@latest gen types --linked --lang=typescript --schema public`
- `npm.cmd run format`
- `npm.cmd ci`
- `npm.cmd run format:check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run test`
- `npm.cmd run build`
- `npm.cmd audit --omit=dev`
- `npm.cmd run db:lint`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `npx.cmd supabase@latest migration list --linked`
- `git diff --check`
- Targeted secret-pattern scan across app, docs, migrations, env template, and package files.

## Checks Passed

- `npm.cmd ci` passed and reported `found 0 vulnerabilities`.
- `npm.cmd run format:check` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run typecheck` passed for web and database workspaces.
- `npm.cmd run test` passed: 4 files, 29 tests.
- `npm.cmd run build` passed with Sprint 4 API and UI routes in the route manifest.
- `npm.cmd audit --omit=dev` passed with 0 vulnerabilities.
- `npx.cmd supabase@latest db push --linked --dry-run` passed before apply and reported `20260522085658_sprint_4_guest_import_approval.sql` pending.
- `npx.cmd supabase@latest db push --linked --yes` passed and applied `20260522085658_sprint_4_guest_import_approval.sql`.
- `npx.cmd supabase@latest gen types --linked --lang=typescript --schema public` passed and refreshed `apps/web/src/types/database.ts`.
- `npm.cmd run db:lint` passed: no schema errors found for `public` and `app_private`.
- `npx.cmd supabase@latest db push --linked --dry-run` passed after apply and reported the remote database is up to date.
- `npx.cmd supabase@latest migration list --linked` passed and showed `20260522085658` present locally and remotely.

## Checks Failed Or Blocked

- An initial `npm.cmd run format` failed because PowerShell redirection wrote generated Supabase types as UTF-16. The file was regenerated with raw `cmd` redirection, formatted, and final `format:check` passed.
- No Sprint 4 completion blockers remain.

## Security Checks Performed

- No `.env` or `.env.local` files were created or committed.
- No Supabase service-role key, database password, WhatsApp token, Google secret, or private guest/client data was added.
- New public tables have RLS enabled.
- Backend routes and server actions call permission helpers before import mutations.
- RLS enforces `guest_imports.create`, `guest_imports.submit`, `guest_imports.review`, and `guest_imports.apply`.
- Bride/groom imports require own-side permission and remain staged until review.
- Review and apply are admin/staff permission-gated.
- Security definer helper functions remain in `app_private`; public RPCs use security invoker.
- Audit snapshots redact raw row data, mapped fields, validation details, duplicate details, mapping JSON, and review notes.
- Source CSV files are not persisted in Sprint 4.
- Targeted secret scan found only expected SQL `service_role` grants, placeholder env/doc references, generated type names, and a package-lock integrity hash.

## Import Validation Behavior

- Header row is required.
- Blank CSV rows are ignored safely.
- Missing display name is blocked.
- Missing or unknown title/type is blocked.
- Invalid side is blocked.
- Event names outside the project are blocked.
- Printed-only rows can pass without WhatsApp.
- Digital rows without WhatsApp are blocked.
- Duplicate signals are warnings and do not auto-merge.

## Duplicate Detection Behavior

- Detects duplicate WhatsApp numbers within the same import.
- Detects normalized-name duplicates within the same import.
- Detects title/type plus normalized-name duplicates within the same import.
- Detects normalized-name and WhatsApp matches against existing active project guests.
- Automatic duplicate merging remains out of scope.

## Audit-Log Behavior

- Import session creation, mapping save, validation completion, submit, review, apply, row staging, row review, and row apply are represented through audit actions.
- Applying approved rows also triggers existing guest creation and assignment audit behavior.

## Assumptions Made

- The user-provided Sprint 4 plan narrows implementation to CSV only, despite the broader plan mentioning Excel-style files.
- Uploaded source file persistence is deferred; parsed row JSON and metadata are sufficient for Sprint 4.
- Bride/groom users can import and submit only their own side, not review or apply.
- Diginoces admin and operations users can review/apply when RBAC grants the new import permissions.
- The backlog CSV snapshots make `FEAT-GM-004`, `STORY-GM-004`, `STORY-GM-005`, `TASK-GM-003`, `TEST-GM-004`, and `TEST-GM-005` the Sprint 4 traceability set.

## Open Issues Or Blockers

- No Sprint 4 completion blockers remain.
- Excel `.xlsx` import is deferred.
- Uploaded source file persistence is deferred.
- Duplicate merge workflow is deferred.
- List locking/change-request enforcement remains a future enhancement beyond current import permissions.

## Recommended Sprint 5 Scope

- Public guest page foundation.
- Secure guest token foundation.
- RSVP yes/no/maybe foundation.
- Event-specific RSVP.
- RSVP deadlines.
- Payment lock behavior for guest page access.
- Admin preview of public guest pages.
- Invitation download placeholder only.
- Preserve the Sprint 4 staged import/audit model when RSVP begins consuming guest records.
