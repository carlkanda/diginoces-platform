# Sprint 12 Completion Report - Guest Wishes, Guest Book & Post-Event Feedback

## Summary

Sprint 12 implements the guest written-message, guest-book review/export, and post-event feedback foundation for issue `#28` on branch `codex/sprint-12-guest-wishes-feedback`.

The implementation remains limited to Sprint 12. It does not add audio/video/photo guest submissions, guest file uploads, direct Canva API integration, automatic public testimonial publishing, partner SaaS scaling, partner commission management, advanced AI assistance, or public marketing website testimonial publishing.

Draft PR status: pending creation after final commit and branch push.

## Traceability

- GitHub issue: `#28` - Sprint 12 - Guest Wishes, Guest Book & Post-Event Feedback.
- Branch: `codex/sprint-12-guest-wishes-feedback`.
- Sprint plan: `docs/planning/sprint-12-plan.md`.
- Previous sprint dependency: Sprint 11, issue `#27`, PR `#38`.
- Primary sprint epic in CSV backlog: `EPIC-WISH`.
- Related epics: `EPIC-REP`, `EPIC-FILE`.

## Requirements Covered

- `WISH-001`: Added guest written-message submission to the existing secure public guest page.
- `WISH-002`: Kept Sprint 12 submissions text-only with emoji support and explicit audio/video/photo/file upload rejection.
- `WISH-003`: Added one-message-per-guest storage and edit-before-deadline behavior that updates the same message record.
- `WISH-004`: Added Diginoces/admin moderation actions for approve, edit-and-approve, exclude, flag, and restore.
- `WISH-005`: Preserved original submitted text separately from current and approved/edited text.
- `WISH-006`: Added couple review workflow with couple-safe message projection and no internal moderation notes.
- `WISH-007`: Added approved-message Canva Bulk Create CSV export foundation.
- `WISH-008`, `FILE-001`, `FILE-002`, `FILE-005`, `FILE-008`: Added guest-book export metadata, versioning, active/latest marker, and project file-library registration for generated CSV exports. Final guest-book PDF upload remains a documented follow-up.
- `REP-005`: Reused the Sprint 11 CSV export helper and report/export conventions.
- `REP-006`: Added audit actions and database audit triggers for guest messages, reviews, exports, feedback, and testimonial permission changes.
- `ROLE-005`: Added bride/groom/couple access for couple guest-book review and post-event feedback submission/read.
- `ROLE-009`: Kept guest submission scoped to the existing secure public guest token.
- `TECH-004`: Added backend permission checks in server pages, server actions, API routes, RLS policies, and RPCs.

## Backlog Traceability

- CSV-backed epic: `EPIC-WISH`.
- CSV-backed features: `FEAT-WISH-001`, `FEAT-WISH-002`.
- Sprint plan feature breakdown: `FEAT-WISH-001` through `FEAT-WISH-007`, `FEAT-FEEDBACK-001`, `FEAT-FEEDBACK-002`.
- Backlog snapshot mismatch documented: the sprint plan and issue reference `FEAT-FEEDBACK-001` and `FEAT-FEEDBACK-002`, but those IDs are not present in the current CSV backlog snapshots. The implemented feedback/testimonial work is still covered by issue `#28`, `docs/planning/sprint-12-plan.md`, and related requirement IDs.
- Primary requirement rows in `master-requirements-register.csv`: `WISH-001` through `WISH-008`.
- Related requirements: `FILE-001`, `FILE-002`, `FILE-005`, `FILE-008`, `REP-005`, `REP-006`, `ROLE-005`, `ROLE-009`, `TECH-004`.

## Files Created Or Changed

- Added Supabase migration:
  - `supabase/migrations/20260531145755_sprint_12_guest_wishes_feedback.sql`
- Added guest-wishes services and tests:
  - `apps/web/src/lib/guest-wishes/guest-wish-action-helpers.ts`
  - `apps/web/src/lib/guest-wishes/guest-wish-api.ts`
  - `apps/web/src/lib/guest-wishes/guest-wish-db.ts`
  - `apps/web/src/lib/guest-wishes/guest-wish-page-context.tsx`
  - `apps/web/src/lib/guest-wishes/guest-wish-service.ts`
  - `apps/web/src/lib/guest-wishes/guest-wishes-foundation.test.ts`
- Updated public guest page flow:
  - `apps/web/src/app/g/[guestToken]/actions.ts`
  - `apps/web/src/app/g/[guestToken]/page.tsx`
  - `apps/web/src/lib/rsvp/public-guest-page-view.tsx`
  - `apps/web/src/lib/rsvp/rsvp-db.ts`
  - `apps/web/src/lib/rsvp/rsvp-service.ts`
- Added API routes:
  - `apps/web/src/app/api/projects/[projectId]/guest-book/route.ts`
  - `apps/web/src/app/api/projects/[projectId]/feedback/route.ts`
- Added platform UI routes and actions:
  - `apps/web/src/app/platform/projects/[projectId]/guest-book/page.tsx`
  - `apps/web/src/app/platform/projects/[projectId]/guest-book/actions.ts`
  - `apps/web/src/app/platform/projects/[projectId]/guest-book/confirm-submit-button.tsx`
  - `apps/web/src/app/platform/projects/[projectId]/guest-book/couple-review/page.tsx`
  - `apps/web/src/app/platform/projects/[projectId]/feedback/page.tsx`
  - `apps/web/src/app/platform/projects/[projectId]/feedback/actions.ts`
- Updated shared platform foundations:
  - `apps/web/src/app/api/health/route.ts`
  - `apps/web/src/app/platform/projects/[projectId]/page.tsx`
  - `apps/web/src/lib/audit/audit-log.ts`
  - `apps/web/src/lib/auth/auth-service.ts`
  - `apps/web/src/lib/security/permissions.ts`
- Updated documentation:
  - `docs/planning/sprint-11-completion-report.md`
  - `docs/setup/local-development.md`
  - `docs/planning/sprint-12-completion-report.md`

## Database And Security Notes

- Added enums for guest message status, message review action, review actor type, guest-book export status, and post-event feedback review status.
- Added `guest_messages`, `guest_message_reviews`, `guest_book_exports`, `post_event_feedback`, and `testimonial_permissions`.
- Project-level and event-level guest-message deadline fields were added.
- Public guest-page payload now supports the current guest's own message only.
- RPCs cover public guest message submission, admin moderation, couple review, guest-book export creation, post-event feedback submission, testimonial review, and couple-safe message listing.
- Guest messages are one per guest through a unique `guest_id` constraint.
- Public guest message submission uses the existing guest public token and payment gate.
- Couple-facing message reads use `list_couple_guest_messages`, a safe projection that excludes original text, current raw text, internal moderation notes, review history, and audit metadata.
- Direct `guest_messages` table reads are restricted to moderator access by RLS; couple review uses the safe RPC instead.
- Testimonials are private by default. Public use requires both couple permission and Diginoces/admin review status.
- Guest-book CSV export creates `guest_book_exports` metadata and a project-scoped `files` row. Object upload of generated CSV/PDF assets remains a follow-up until production storage is configured.
- The guest-book export API returns CSV as `text/csv` with download headers instead of embedding CSV in JSON.
- Guest messages are not marked `exported` until future storage/upload finalization is implemented; export metadata remains the Sprint 12 tracking artifact.
- Audit triggers record guest-message, review, guest-book export, post-event feedback, and testimonial permission changes.

## Tests Added

- `apps/web/src/lib/guest-wishes/guest-wishes-foundation.test.ts`
  - Covers text-only public message parsing, emoji support, and upload rejection.
  - Covers one-message-per-guest update behavior and original-text preservation.
  - Covers edit-before-deadline decisions.
  - Covers admin moderation and original/current/approved text preservation.
  - Covers couple-safe views that exclude internal moderation notes.
  - Covers couple review actions.
  - Covers approved-only Canva CSV export and spreadsheet formula neutralization.
  - Covers post-event feedback parsing and testimonial privacy rules.
  - Covers role/permission expectations for admin, operations, couple, and partner roles.
  - Covers migration, RLS, permission, audit, public-page, and route foundations.
  - Covers public guest-message language validation, explicit action-status alerts, guest-book action failure redirects, feedback review notes, and testimonial approval guard evidence.
  - Covers safe CSV download response headers, upload-attempt detection, moderation action validation, and migration hardening evidence.
  - Covers Sprint 12 traceability and explicit future-scope deferrals.

## Commands Run

- `gh api repos/carlkanda/diginoces-platform/issues/28 --jq '{number,title,state,body}'` - passed; issue `#28` is open and matches Sprint 12 scope.
- `npx supabase@latest migration new sprint_12_guest_wishes_feedback` - passed; created the Sprint 12 migration.
- `npm run test -- --run src/lib/guest-wishes/guest-wishes-foundation.test.ts` before implementation - failed as expected while the RED test referenced missing Sprint 12 services.
- `npm --workspace apps/web run test -- --run src/lib/guest-wishes/guest-wishes-foundation.test.ts` - passed, 11 tests.
- `npm --workspace apps/web run typecheck` - passed after fixing the couple-safe message projection typing.
- `npm --workspace apps/web run lint` - passed before final report.
- `npm run format` - passed after an initial format check found formatting changes were needed.
- `npm ci` - passed, 0 vulnerabilities reported by install audit.
- `wsl.exe bash -lc "cd '/mnt/c/Users/Carl Kanda (IT)/Downloads/@codex_projects/@diginoces-platform/diginoces-platform' && coderabbit review --agent -t uncommitted -c AGENTS.md"` - completed; six issues reported. Four valid code/schema documentation issues were fixed. Two report traceability notes were deferred or skipped because draft PR creation had not happened yet and CodeRabbit incorrectly identified the source branch as `vscode-changes`.
- `npm run format:check` - passed after the final CodeRabbit fixes.
- `npm run lint` - passed after the final CodeRabbit fixes.
- `npm run typecheck` - passed after the final CodeRabbit fixes.
- `npm run test` - passed after the final CodeRabbit fixes, 13 test files and 131 tests.
- `npm run build` - passed after the final CodeRabbit fixes.
- `npm audit --omit=dev` - passed, 0 vulnerabilities.
- `npm run db:lint` from `apps/web` - failed because the script is defined at the repository root, not in the web workspace.
- `npm run db:lint` from the repository root - passed, no schema errors in linked `public` and `app_private` schemas.
- `npx supabase@latest db push --linked --dry-run` - passed; would push only `20260531145755_sprint_12_guest_wishes_feedback.sql`.
- Second `wsl.exe bash -lc "cd '/mnt/c/Users/Carl Kanda (IT)/Downloads/@codex_projects/@diginoces-platform/diginoces-platform' && coderabbit review --agent -t uncommitted -c AGENTS.md"` - completed; seven issues reported. Valid fixes were applied for feedback review notes, explicit feedback/guest-book status alerts, guest-book action failure redirects, and public guest-message language validation. The testimonial permission approval guard was already enforced in `review_post_event_feedback`; the `ConfirmSubmitButton` item was explicit no-op UX guidance.
- `npm run format` - passed after the second CodeRabbit fixes.
- `npm run format:check` - passed after the second CodeRabbit fixes.
- `npm run lint` - passed after the second CodeRabbit fixes.
- `npm run typecheck` - passed after the second CodeRabbit fixes.
- `npm run test` - passed after the second CodeRabbit fixes, 13 test files and 131 tests.
- `npm run build` - passed after the second CodeRabbit fixes.
- `npm audit --omit=dev` - passed after the second CodeRabbit fixes, 0 vulnerabilities.
- `npm run db:lint` from the repository root - passed after the second CodeRabbit fixes, no schema errors in linked `public` and `app_private` schemas.
- `npx supabase@latest db push --linked --dry-run` - passed after the second CodeRabbit fixes; would push only `20260531145755_sprint_12_guest_wishes_feedback.sql`.
- Third local CodeRabbit review from WSL - completed; valid issues fixed for feedback review status reset, Supabase client reuse in guest-wish page/action contexts, action failure handling, guest-book status parsing, French label typography, DB row-count handling, operations-manager permission parity, and action/page status handling.
- Fourth local CodeRabbit review from WSL - completed; valid issues fixed for export-record null handling, testimonial review status typing, Canva CSV metadata, audit-log reason misuse, guest re-submission review reset, guest-book export advisory locking, text/csv API response, upload-attempt detection, and moderation action validation. Deferred storage count verification remains a follow-up because Sprint 12 does not persist uploaded CSV binaries.
- `npm run format` - passed after the final concrete CodeRabbit fixes.
- `npm run format:check` - passed after the final concrete CodeRabbit fixes.
- `npm run lint` - passed after the final concrete CodeRabbit fixes.
- `npm run typecheck` - passed after the final concrete CodeRabbit fixes.
- `npm run test` - passed after the final concrete CodeRabbit fixes, 13 test files and 131 tests.
- `npm run build` - passed after the final concrete CodeRabbit fixes.
- `npm audit --omit=dev` - passed after the final concrete CodeRabbit fixes, 0 vulnerabilities.
- `npm run db:lint` from the repository root - passed after the final concrete CodeRabbit fixes, no schema errors in linked `public` and `app_private` schemas.
- `npx supabase@latest db push --linked --dry-run` - passed after the final concrete CodeRabbit fixes; would push only `20260531145755_sprint_12_guest_wishes_feedback.sql`.
- `git diff --check` - passed after the final concrete CodeRabbit fixes; only repository LF/CRLF warnings were printed.
- Targeted secret scan with `rg` - passed after the final concrete CodeRabbit fixes. Matches were expected placeholder/documentation warnings and SQL grants to the Postgres `service_role` role, not real secrets.

## Checks Passed Or Failed

- Passed: targeted Sprint 12 tests, full format check, lint, typecheck, test suite, production build, dependency install, dependency audit, Supabase linked db lint, and Supabase linked migration dry-run.
- Failed and resolved: initial RED test before implementation, initial format check before formatting, one transient typecheck after the safe projection change, and one `db:lint` invocation from the wrong `apps/web` working directory.
- Pending before branch handoff: branch push and draft PR creation.

## Security Checks Performed

- No `.env` or `.env.local` files were added.
- No Supabase service-role keys, database passwords, WhatsApp tokens, Google secrets, API secrets, real client data, real couple data, or real guest data were added.
- Public guest submissions remain token-scoped through the existing public guest page foundation.
- Couple-facing guest-book reads use a safe RPC projection and do not expose internal moderation notes or audit records.
- Admin/staff moderation, export, and feedback review actions are permission-gated server-side and in RPCs.
- Guest audio/video/photo/file submissions are rejected by service validation and are not represented in the UI.
- Printed-only public guest message submission is blocked server-side and hidden in the public guest-page form.
- Direct `guest_messages` select access is restricted to moderators so couple-facing reads must use the sanitized RPC.
- Guest-book export API responses stream CSV with download headers instead of embedding raw CSV in JSON.
- Guest re-submission clears prior admin/couple review metadata and returns the message to pending review.
- Final targeted secret scan found no real secrets. Matches were limited to expected docs/placeholders and SQL grants to the Postgres `service_role` role.

## Assumptions

- Sprint 12 source-file upload and final PDF upload are deferred; Sprint 12 registers guest-book CSV export metadata and a project file-library row but does not upload binary files to object storage.
- Canva remains an external manual design tool. Sprint 12 exports CSV only and does not integrate with the Canva API.
- The linked Supabase project is a development project. This PR performs a linked dry-run only; applying the Sprint 12 migration should happen after PR merge unless explicitly requested earlier.
- The generated Supabase TypeScript database types are not regenerated in this PR. Sprint 12 uses internal service shapes and untyped Supabase calls for new DB objects, matching recent sprint patterns.
- Feedback/testimonial features are traceable to issue `#28` and the Sprint 12 plan despite missing `FEAT-FEEDBACK-*` rows in the current backlog CSV snapshots.

## Open Issues Or Blockers

- No known implementation blocker remains.
- Branch push and draft PR creation are pending until this report update is committed.
- Supabase linked migration has not been applied to the dev project yet; only dry-run is expected before merge.
- Final guest-book PDF upload and actual object storage persistence are deferred to storage/release hardening.
- CSV upload/storage verification counts are deferred with the storage persistence follow-up because Sprint 12 intentionally keeps generated CSV output in the API response and records metadata only.

## Recommended Sprint 13 Scope

- Start Sprint 13 partner/external provider model only after Sprint 12 is reviewed and merged.
- Keep Sprint 13 separate from advanced AI moderation, public marketing testimonial publishing, direct Canva integration, and full analytics/BI unless explicitly assigned.
- Consider a follow-up hardening pass to regenerate Supabase database types and verify guest-book export metadata against linked dev data after the Sprint 12 migration is applied.
