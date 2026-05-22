# Sprint 4 - Guest Import Hardening Report

## Status

Draft PR hardening follow-up for Sprint 4 after the original merged PRs.

Traceability anchors:

- Issue: #7 - Sprint 4 - Guest Import & Approval Workflow
- Original PR: #8 - Sprint 4 - Guest Import & Approval Workflow
- Follow-up PR: #9 - Sprint 4 - Guest Import & Approval Workflow
- Hardening PR: #16 - Sprint 4 - Guest Import Hardening
- Sprint plan: `docs/planning/sprint-4-plan.md`

## Requirements And Backlog Scope

Hardened requirements:

- `GM-004` - CSV guest import with column mapping and preview
- `GM-005` - Bride/groom imports require Diginoces/admin review
- `GM-006` - Required field validation before workflows
- `GM-008` - Duplicate detection across lists and imports
- `GM-015` - Printed-only guest import handling
- `ROLE-001` - Role-based permission model
- `ROLE-005` - Bride/groom own-side restrictions
- `REP-006` - Audit logs for sensitive actions
- `TECH-004` - Backend permission enforcement

Sprint 4 remains limited to CSV guest import and approval hardening. No RSVP, public guest page, invitation, WhatsApp, seating, check-in, contract, pricing, payment, partner, `.xlsx`, source-file persistence, or automatic duplicate merge work was added.

## Findings And Fixes

1. Guest import read RLS was project-wide for any role with `guest_imports.read`.
   - Added `app_private.user_can_read_guest_import_session`.
   - Replaced read policies for `guest_import_sessions`, `guest_import_rows`, and `guest_import_mappings`.
   - Bride/groom visibility is now own-side or own-upload only; admin/operations review/apply roles retain full project review visibility.

2. Import workflow RPCs could silently ignore invalid review row IDs or stale row states.
   - `review_guest_import_rows` now rejects overlapping row IDs, row IDs outside the import session, blocked/applied approvals, and applied-row re-review attempts.
   - `submit_guest_import_session`, `review_guest_import_rows`, and `apply_guest_import_approved_rows` now lock the session row during state transitions.
   - Review locks target rows before updating them.
   - Apply locks approved rows and returns `0` when a repeated apply call sees an already applied session, preventing duplicate guest creation.

3. Server-rendered pages loaded or exposed import workflow controls before explicit capability checks.
   - Import history requires `guest_imports.read` before loading sessions.
   - Upload requires create capability for at least one manageable guest side before loading the form.
   - Detail, mapping, and review pages now use explicit server-side import permissions and fail closed on denied access.
   - Mapping, submit, review, and apply controls are hidden or disabled unless the server-verified capability allows the action.

4. Guest import API routes could authorize after import lookup in some mutation paths.
   - Review authorization now runs before project-scoped import lookup.
   - Mapping and submit routes perform broad project permission checks before import lookup, then still check project/import binding and side-specific permissions.
   - Read routes use the shared guest-import read helper.

5. API JSON CSV uploads did not share the same size limit as server-action file/paste uploads.
   - Added `MAX_GUEST_IMPORT_CSV_BYTES`.
   - `parseStartGuestImportPayload` and import creation both reject CSV content larger than 5 MB.

6. Guest import login redirects used raw `next` query values on some pages.
   - Guest import pages now build login redirects with `URLSearchParams`.

## Files Created Or Changed

- `supabase/migrations/20260522221804_sprint_4_post_merge_hardening.sql`
- `apps/web/src/lib/guest-imports/guest-import-service.ts`
- `apps/web/src/lib/guest-imports/guest-import-db.ts`
- `apps/web/src/lib/guest-imports/guest-import-api.ts`
- `apps/web/src/lib/guest-imports/guest-import-foundation.test.ts`
- `apps/web/src/app/api/projects/[projectId]/guest-imports/route.ts`
- `apps/web/src/app/api/projects/[projectId]/guest-imports/[importId]/route.ts`
- `apps/web/src/app/api/projects/[projectId]/guest-imports/[importId]/mapping/route.ts`
- `apps/web/src/app/api/projects/[projectId]/guest-imports/[importId]/submit/route.ts`
- `apps/web/src/app/api/projects/[projectId]/guest-imports/[importId]/review/route.ts`
- `apps/web/src/app/platform/projects/[projectId]/guest-imports/actions.ts`
- `apps/web/src/app/platform/projects/[projectId]/guest-imports/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guest-imports/new/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guest-imports/[importId]/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guest-imports/[importId]/mapping/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guest-imports/[importId]/review/page.tsx`
- `docs/planning/sprint-4-hardening-report.md`

No active sprint metadata files were changed; neither `AGENTS.md` nor `README.md` is part of this hardening diff.

## Database Migration

Added one migration:

- `20260522221804_sprint_4_post_merge_hardening.sql`

Migration behavior:

- adds a private guest-import read visibility helper;
- replaces staged import session, row, and mapping read policies;
- hardens submit/review/apply RPCs with locks and explicit transition validation;
- preserves the existing `applied` session status semantics.

## Tests Added Or Updated

- Added side-aware import read permission coverage for bride, groom, and operations/admin-style reviewers.
- Added API payload size coverage for CSV content over 5 MB.
- Added applied-row idempotency coverage in the pure apply helper.
- Added static migration guard coverage for RLS helper, row/session locking, invalid row review rejection, blocked/applied approval rejection, and repeated apply behavior.
- Existing Sprint 4 parsing, mapping, validation, duplicate detection, audit action, and partial approval tests remain in the same test suite.

## Commands Run

| Command | Result |
| --- | --- |
| `npm --workspace apps/web run test -- src/lib/guest-imports/guest-import-foundation.test.ts` | Passed |
| `npm ci` | Passed |
| `npm run format:check` | Failed initially on edited files, then passed after `npm run format` |
| `npm run format` | Passed |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run test` | Passed - 5 files, 50 tests |
| `npm run build` | Passed |
| `npm audit --omit=dev` | Passed - 0 vulnerabilities |
| `npm run db:lint` | Passed - no schema errors found |
| `npx supabase@latest db push --linked --dry-run` | Passed - dry run would push the existing Sprint 3 hardening migration and this Sprint 4 hardening migration |
| `git diff --check` | Passed |
| Targeted secret scan | Passed - no matching real secret patterns found |
| GitHub PR `Verify` check | Passed on PR #16 |
| `wsl.exe ... coderabbit review --agent --base main -c AGENTS.md` | Passed - 3 issues raised; fixed the migration-test and report-precision items; retained the layered CSV size guard because the hardening plan explicitly requires API payload parsing to reject oversized `csvContent` |
| Review-loop rerun: `npm --workspace apps/web run test -- src/lib/guest-imports/guest-import-foundation.test.ts` | Passed - 14 tests |
| Review-loop rerun: `npm run format:check` | Passed |
| Review-loop rerun: `npm run lint` | Passed |
| Review-loop rerun: `npm run typecheck` | Passed |
| Review-loop rerun: `npm run test` | Passed - 5 files, 50 tests |
| Review-loop rerun: `npm run build` | Passed |
| Second CodeRabbit pass: `wsl.exe ... coderabbit review --agent --base main -c AGENTS.md` | Passed - valid Sprint 4 findings applied for safe UUID casting and import permission test coverage; out-of-scope findings tracked below |
| Second review-loop rerun: `npm --workspace apps/web run test -- src/lib/guest-imports/guest-import-foundation.test.ts` | Passed - 14 tests |
| Second review-loop rerun: `npm run format:check` | Passed |
| Second review-loop rerun: `npm run lint` | Passed |
| Second review-loop rerun: `npm run typecheck` | Passed |
| Second review-loop rerun: `npm run test` | Passed - 5 files, 50 tests |
| Second review-loop rerun: `npm run build` | Passed |
| Second review-loop rerun: `npm run db:lint` | Passed - no schema errors found |
| Second review-loop rerun: `npx supabase@latest db push --linked --dry-run` | Passed - dry run would push the existing Sprint 3 hardening migration and this Sprint 4 hardening migration |

## Security Review

- RLS read visibility for staged import data is now side-aware and uploader-aware.
- Review/apply actors retain full access only through `guest_imports.review` and `guest_imports.apply`.
- Server pages and API routes perform backend permission checks; UI controls are no longer the only enforcement layer.
- Raw row JSON, mapping JSON, validation issues, and duplicate warnings remain protected by the same RLS helper as the import session.
- CSV size validation intentionally remains layered: API payload parsing rejects oversized `csvContent` before permission checks, and import creation remains a service-layer backstop for non-API callers.
- Import apply now validates UUID-shaped mapped title, event, and tag values before casting, so malformed staged JSON is skipped or nulled instead of aborting the whole apply loop.
- No real credentials, Supabase service-role keys, database passwords, WhatsApp tokens, Google secrets, private keys, or real client/guest data were added.

## Assumptions

- Own-upload visibility remains allowed when the uploader still has project-level `guest_imports.read`.
- Admin/operations review/apply roles should keep full project import visibility for operational review.
- Repeated apply calls should be idempotent and return `0` once the session is already `applied`.
- CSV remains the only Sprint 4 import format.

## Open Issues Or Blockers

- No blocking issues remain from the WSL CodeRabbit CLI review loop.
- CodeRabbit raised dependency/version findings for the existing Next.js canary and `latest` type packages. The Next.js canary is already tracked as Sprint 1 technical debt in `docs/planning/technical-debt.md` (`TD-001`), and package dependency changes are outside this Sprint 4 guest-import hardening PR.
- CodeRabbit raised a Sprint 2 project-code loop bound finding in `20260521123000_sprint_2_projects_events.sql`; that is outside this Sprint 4 hardening scope and should be handled in a Sprint 2 follow-up if still desired.
- CodeRabbit suggested replacing multiple UI capability RPCs with a composite RPC. This is a performance optimization outside the current correctness/security hardening scope and would require a new public database interface.
- No browser UI regression test suite exists for these server-rendered permission flows; coverage is by helper/unit tests, build/typecheck, and RLS/RPC migration review.

## Recommended Next Scope

Keep Sprint 5 and later scopes unchanged. Future import work can add `.xlsx` import, source-file persistence, and a full duplicate merge workflow only when those items are explicitly scheduled.
