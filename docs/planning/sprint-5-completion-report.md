# Sprint 5 Completion Report

## Status

Sprint 5 is implemented and verified for PR review. The linked Supabase migrations were applied, generated database types were refreshed, web checks passed, `db:lint` passed after follow-up SQL hardening, and no Sprint 5 completion blockers remain.

## Requirements Covered

- GitHub issue: `#10`
- Epic: `EPIC-RSVP`
- CSV backlog features: `FEAT-RSVP-001`, `FEAT-RSVP-002`, `FEAT-RSVP-003`
- Sprint-plan RSVP feature scope: secure public page, token model, payment gate, RSVP model, event-specific responses, deadlines/change rules, summary foundation, language support, and admin preview
- Stories: `STORY-RSVP-001`, `STORY-RSVP-002`, `STORY-RSVP-003`, `STORY-RSVP-004`
- Tasks: `TASK-RSVP-001`, `TASK-RSVP-002`
- Test cases: `TEST-RSVP-001`, `TEST-RSVP-002`, `TEST-RSVP-003`, `TEST-RSVP-004`
- Requirement IDs: `RSVP-001`, `RSVP-002`, `RSVP-003`, `RSVP-004`, `RSVP-005`, `RSVP-006`, `RSVP-007`, `RSVP-008`, `RSVP-009`, `RSVP-010`, `RSVP-012`, `RSVP-013`, `RSVP-014`, `ROLE-009`, `PAY-014`, `PAY-015`, `REP-006`, `TECH-010`

Deferred by Sprint 5 scope: invitation PDF generation, invitation template upload, QR image generation, WhatsApp sending, seating, check-in, contracts, pricing, payments, partner project creation, and full guest-book workflow.

## Files Created Or Changed

- `supabase/migrations/20260522125555_sprint_5_rsvp_public_guest_page.sql`
- `supabase/migrations/20260522131947_sprint_5_db_lint_fixes.sql`
- `supabase/migrations/20260522132532_sprint_5_private_rsvp_rpc_wrappers.sql`
- `supabase/migrations/20260522135714_sprint_5_preserve_rsvp_submitted_at.sql`
- `supabase/migrations/20260522142952_sprint_5_coderabbit_final_fixes.sql`
- `supabase/migrations/20260522144906_sprint_5_locked_rsvp_final_response.sql`
- `supabase/migrations/20260522151659_sprint_5_atomic_rsvp_finality.sql`
- `apps/web/src/types/database.ts`
- `apps/web/src/lib/api/read-json.ts`
- `apps/web/src/lib/rsvp/rsvp-service.ts`
- `apps/web/src/lib/rsvp/rsvp-db.ts`
- `apps/web/src/lib/rsvp/public-guest-page-view.tsx`
- `apps/web/src/lib/rsvp/rsvp-foundation.test.ts`
- `apps/web/src/lib/security/permissions.ts`
- `apps/web/src/lib/audit/audit-log.ts`
- `apps/web/src/app/g/[guestToken]/page.tsx`
- `apps/web/src/app/g/[guestToken]/actions.ts`
- `apps/web/src/app/api/projects/[projectId]/guests/[guestId]/public-token/route.ts`
- `apps/web/src/app/api/projects/[projectId]/rsvps/summary/route.ts`
- `apps/web/src/app/platform/projects/[projectId]/rsvps/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guests/[guestId]/public-preview/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guests/[guestId]/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guests/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/page.tsx`
- `apps/web/src/app/api/health/route.ts`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/.prettierignore`
- `docs/setup/local-development.md`
- `docs/planning/sprint-5-completion-report.md`

## Database Migration

- Added project-level guest-page access gate fields on `wedding_projects`.
- Added `events.rsvp_deadline_at`.
- Added enums for guest page access status, guest public token type/status, RSVP status/source/deadline state.
- Added `guest_public_tokens` with SHA-256 token hashes only, token previews, revocation/regeneration metadata, expiry, and last-used metadata.
- Added `rsvp_records` for event-specific RSVP responses with deadline/manual-review state.
- Added RLS policies, grants, indexes, updated-at triggers, and audit triggers.
- Added permissions:
  - `guest_public_pages.preview`
  - `guest_public_tokens.manage`
  - `rsvps.read`
  - `rsvps.manage`
- Added RPCs for token creation/revocation, public token resolution, public RSVP submission, admin preview, and project RSVP summary.
- Added follow-up migration for `db:lint` SQL fixes: qualified token references and cast RSVP enum literals.
- Added follow-up migration moving privileged RSVP/public-page logic into `app_private` with `security invoker` public wrappers for Supabase RPC compatibility.
- Added final CodeRabbit follow-up migration that guards token-regeneration chains against cycles/depth overflow and makes first `submitted_at` preservation explicit in the RSVP upsert.
- Added final locked-response follow-up migration so public RSVP submission cannot overwrite an operations-owned `locked` RSVP record.
- Added final atomic-finality follow-up migration so public RSVP upserts cannot race past a concurrent final `yes`, `no`, or `locked` response.

## Tests Added

- `apps/web/src/lib/rsvp/rsvp-foundation.test.ts`
  - Token hashing and resolution.
  - Invalid, revoked, expired, and non-public token rejection.
  - Locked payment-gate behavior.
  - Admin/staff preview allowed before public unlock; couple preview denied.
  - Guest-scoped invited event filtering.
  - Event-specific Yes/Maybe RSVP storage.
  - RSVP change rules for pending, Maybe, Yes, and No.
  - Post-deadline manual review behavior.
  - Printed-only manual RSVP behavior.
  - Operational effect helper behavior.
  - French/English guest page labels.
  - Audit action coverage and out-of-scope guardrails.

## Commands Run

- `npx.cmd supabase@latest migration new sprint_5_rsvp_public_guest_page`
- `npm.cmd --workspace apps/web run test -- src/lib/rsvp/rsvp-foundation.test.ts`
- `npm.cmd run typecheck`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `npm.cmd run format`
- `npx.cmd supabase@latest db push --linked --yes`
- `npx.cmd supabase@latest gen types --linked --lang=typescript --schema public`
- `npm.cmd exec --workspace apps/web -- prettier --write src/types/database.ts`
- `npm.cmd ci`
- `npm.cmd run format:check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run test`
- `npm.cmd audit --omit=dev`
- `npm.cmd run build`
- `npm.cmd run db:lint`
- Local browser smoke check at `http://127.0.0.1:3000/`
- Local route smoke check at `http://127.0.0.1:3000/g/not-a-real-token`
- `npx.cmd supabase@latest migration new sprint_5_db_lint_fixes`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `npx.cmd supabase@latest db push --linked --yes`
- `npm.cmd run db:lint`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `npx.cmd supabase@latest migration list --linked`
- `npx.cmd supabase@latest migration new sprint_5_private_rsvp_rpc_wrappers`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `npx.cmd supabase@latest db push --linked --yes`
- `npm.cmd run db:lint`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `git diff --check`
- `wsl.exe -d Ubuntu --exec /home/carlkanda/.local/bin/coderabbit review --agent --type committed --base origin/main -c AGENTS.md`
- `npx.cmd supabase@latest migration new sprint_5_atomic_rsvp_finality`
- `npm.cmd run format`
- `npm.cmd --workspace apps/web run test -- src/lib/rsvp/rsvp-foundation.test.ts`
- `npm.cmd run typecheck`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `npx.cmd supabase@latest db push --linked --yes`
- `npm.cmd run format:check`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`
- `npm.cmd run db:lint`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `git diff --check`
- Targeted secret-pattern scan across changed files.
- CodeRabbit review read for PR `#11`.
- `npx.cmd supabase@latest migration new sprint_5_preserve_rsvp_submitted_at`
- `wsl.exe -d Ubuntu --exec /home/carlkanda/.local/bin/coderabbit review --agent --type committed --base origin/main -c AGENTS.md`
- `npx.cmd supabase@latest migration new sprint_5_coderabbit_final_fixes`
- `npm.cmd run format`
- `npm.cmd --workspace apps/web run test -- src/lib/rsvp/rsvp-foundation.test.ts`
- `npm.cmd run format:check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `npx.cmd supabase@latest db push --linked --yes`
- `npm.cmd run test`
- `npm.cmd run build`
- `npm.cmd run db:lint`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `git diff --check`
- Targeted final secret-pattern scan across changed files.
- `wsl.exe -d Ubuntu --exec /home/carlkanda/.local/bin/coderabbit review --agent --type committed --base origin/main -c AGENTS.md`
- `npm.cmd run format`
- `npm.cmd --workspace apps/web run test -- src/lib/rsvp/rsvp-foundation.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run format:check`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`
- `npm.cmd run db:lint`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `git diff --check`
- `wsl.exe -d Ubuntu --exec /home/carlkanda/.local/bin/coderabbit review --agent --type committed --base origin/main -c AGENTS.md`
- `npx.cmd supabase@latest migration new sprint_5_locked_rsvp_final_response`
- `npm.cmd run format`
- `npm.cmd --workspace apps/web run test -- src/lib/rsvp/rsvp-foundation.test.ts`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run format:check`
- `npx.cmd supabase@latest db push --linked --yes`
- `npm.cmd run test`
- `npm.cmd run build`
- `npm.cmd run db:lint`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `git diff --check`
- Targeted final secret-pattern scan across changed files.

## Checks Passed

- `npm.cmd ci` passed and reported `found 0 vulnerabilities`.
- `npm.cmd --workspace apps/web run test -- src/lib/rsvp/rsvp-foundation.test.ts` passed: 1 file, 11 tests.
- `npm.cmd run format:check` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run typecheck` passed for web and database workspaces.
- `npm.cmd run test` passed: 5 files, 43 tests.
- `npm.cmd run build` passed and included Sprint 5 public, preview, token, summary, and RSVP routes in the route manifest.
- Local browser smoke check passed for `http://127.0.0.1:3000/`, and Chrome was opened to the running app.
- Local public route smoke check passed for `http://127.0.0.1:3000/g/not-a-real-token` after adding the safe local-not-configured state.
- `npm.cmd audit --omit=dev` passed with 0 vulnerabilities.
- `npx.cmd supabase@latest db push --linked --dry-run` passed before applying Sprint 5 migrations.
- `npx.cmd supabase@latest db push --linked --yes` passed for all Sprint 5 migrations.
- `npx.cmd supabase@latest gen types --linked --lang=typescript --schema public` passed and refreshed `apps/web/src/types/database.ts`.
- `npm.cmd run db:lint` passed after SQL follow-up migrations: no schema errors found for `public` and `app_private`.
- Final `npx.cmd supabase@latest db push --linked --dry-run` passed and reported the remote database is up to date.
- `npx.cmd supabase@latest migration list --linked` passed and showed `20260522125555`, `20260522131947`, and `20260522132532` present locally and remotely.
- `git diff --check` passed.
- Targeted secret-pattern scan found only expected WhatsApp field/type references, out-of-scope docs text, and SQL `service_role` grants. No real secrets were found.
- Final CodeRabbit follow-up checks passed after `20260522142952_sprint_5_coderabbit_final_fixes.sql`: targeted RSVP test, `format:check`, `lint`, `typecheck`, full test suite, `build`, `db:lint`, Supabase post-push dry run, `git diff --check`, and targeted secret scan.
- Second final CodeRabbit follow-up checks passed after `20260522144906_sprint_5_locked_rsvp_final_response.sql`: targeted RSVP test, `format:check`, `lint`, `typecheck`, full test suite, `build`, `db:lint`, Supabase post-push dry run, `git diff --check`, and targeted secret scan.
- Third CodeRabbit follow-up checks passed after the typed RPC/shared JSON helper changes: targeted RSVP test, `format:check`, `lint`, `typecheck`, full test suite, `build`, `db:lint`, Supabase dry run, and `git diff --check`.
- Fourth CodeRabbit follow-up checks passed after `20260522151659_sprint_5_atomic_rsvp_finality.sql`: targeted RSVP test, `format:check`, `lint`, `typecheck`, full test suite, `build`, `db:lint`, Supabase post-push dry run, `git diff --check`, and targeted secret scan.

## Checks Failed Or Blocked

- An initial `npm.cmd run db:lint` failed on `public.create_guest_public_token` because `guest_id` was ambiguous inside a table-returning function. The same lint run warned that `submit_public_rsvp` initialized an enum variable from an uncast text literal.
- `20260522131947_sprint_5_db_lint_fixes.sql` fixed the lint findings by qualifying token table references and casting RSVP enum literals.
- A final hardening pass added `20260522132532_sprint_5_private_rsvp_rpc_wrappers.sql` to keep privileged logic in `app_private` and leave public RPCs as `security invoker` wrappers.
- A later local `npm.cmd run format:check` failed because untracked local helper files `apps/web/AGENTS.md` and `apps/web/CLAUDE.md` were being scanned. `apps/web/.prettierignore` now ignores those local helper files so they stay preserved and uncommitted while the required format check passes.
- CodeRabbit requested seven follow-up fixes on PR `#11`: invalid JSON handling, public RSVP error fallback, home-page scope/coverage accuracy, conditional manual-review alerts, per-button RSVP gating, complete Yes/No/Maybe test coverage, and preserving first RSVP `submitted_at`. These fixes were applied in the review follow-up commit.
- A final local CodeRabbit full review requested four review-readiness fixes: canonical RSVP navigation label, regeneration-chain guard/documentation, explicit `locked` RSVP semantics, and explicit `submitted_at` preservation. These fixes were applied in the final review follow-up.
- A second local CodeRabbit full review requested seven low-severity follow-ups: token revocation RPC helper clarity, RSVP summary 404 behavior, public-token expiry validation, single timestamp calculation in the guest page view, duplicate CSS cleanup, nullable generated token expiry type, and treating `locked` RSVP records as final in public submission. These fixes were applied in the second final review follow-up.
- A third local CodeRabbit full review requested three remaining trivial follow-ups: typed RSVP/revoke RPC responses, a shared JSON body helper for the token route, and runtime validation around the public guest page payload. These fixes were applied without adding a new validation dependency.
- A fourth local CodeRabbit full review requested additional review hardening: RSVP summary server-side `rsvps.read` permission check, preview-link visibility by `guest_public_pages.preview`, grouped guest-page actions, JSON object validation, localized RSVP deadlines, submit-response runtime validation, and atomic final-response upsert protection. These fixes were applied in the fourth review follow-up.
- No Sprint 5 completion blockers remain.

## Security Checks Performed

- No `.env` or `.env.local` files were created or committed.
- No Supabase service-role key, database password, WhatsApp token, Google secret, or private client data was added.
- Public guest tokens store only SHA-256 hashes, not raw token values.
- Raw public guest tokens are returned only once by the authenticated token generation RPC.
- Public token generation validates optional `expiresAt` before calling the database RPC.
- Public guest token type is separate from future check-in token types.
- Guest public token regeneration is guarded by a database trigger that rejects cycles and chains deeper than 25 tokens.
- Public token resolution returns only guest-scoped safe payloads.
- Public guest page RPC payloads are checked at runtime before rendering.
- Locked public guest pages return a safe locked state without guest/event details.
- Public RSVP submission requires a valid active token, unlocked guest page gate, non-printed-only guest, and an assigned invited event.
- Admin/operations preview is authenticated and permission-gated; public access logs are not generated for preview mode.
- RSVP summary pages are server-side permission-gated with `rsvps.read`.
- Couple roles are not granted `guest_public_pages.preview` or `guest_public_tokens.manage`.
- RSVP summary is authenticated and permission-gated by `rsvps.read`.
- New public tables have RLS enabled.
- Public wrappers are `security invoker`; privileged helper logic is in `app_private` after the hardening migration.
- Audit snapshots redact RSVP/token sensitive fields, including `token_hash`.
- RSVP/public page access and mutation actions are represented in audit actions.

## RSVP Behavior

- RSVP options are `yes`, `no`, and `maybe`.
- RSVP responses are stored per guest and per event.
- Guests can only RSVP to events assigned to them as invited.
- Previous `yes`, `no`, and operations-owned `locked` responses are locked from guest-side changes.
- Final-response protection is enforced inside the RSVP upsert conflict update, not only by a prior read.
- Previous `maybe` or `pending` responses can be changed by the guest.
- Late responses after an event RSVP deadline are saved with manual-review state.
- `no` responses are treated as excluded from active operational effects.
- `locked` RSVP records are treated as operations-owned final responses and behave like `no` for future attendance, seating, check-in, and reminder consumers.
- `maybe` and `pending` remain active but reviewable for operations.
- Printed-only guests are kept in a manual RSVP flow.
- Invitation download remains a placeholder only.

## Assumptions Made

- The CSV backlog contains `FEAT-RSVP-001` through `FEAT-RSVP-003` for Sprint 5, while the Sprint 5 plan expands the RSVP foundation into more granular feature labels. The implementation uses the CSV feature IDs as the authoritative backlog traceability set and documents the expanded sprint-plan scope separately.
- Full payment recording is out of scope for Sprint 5, so the implementation adds a project-level guest-page access gate and payment-exception reason foundation only.
- Invitation download is a placeholder because real invitation PDF generation starts in Sprint 6.
- QR generation, WhatsApp sending, seating, check-in, contracts, pricing, payments, partner project creation, and full guest-book workflows remain deferred.
- Public guest page visual design is foundational and intentionally limited to safe project, guest, and invited-event data.

## Open Issues Or Blockers

- No Sprint 5 completion blockers remain.
- Real payment module integration is deferred to the contracts/pricing/payments sprint.
- Real invitation PDF generation and download wiring are deferred to Sprint 6.
- QR image generation is deferred.
- WhatsApp sending is deferred.
- Seating/check-in operational consumers should later consume the RSVP operational-effect helper.
- Manual review workflow UI for late/Pending/Maybe RSVP records can be expanded in a later operations sprint.

## Recommended Sprint 6 Scope

- Implement invitation template storage and selection.
- Implement safe invitation PDF generation.
- Keep public guest page QR and future check-in QR tokens separate.
- Add invitation download wiring to the Sprint 5 placeholder.
- Preserve the payment gate and token-security boundaries established in Sprint 5.
