# Sprint 3 Post-Merge Hardening Report

## Status

Sprint 3 post-merge hardening is implemented on branch `codex/sprint-3-post-merge-hardening` for review. This is a follow-up to issue `#5` and original PR `#6`, applied against current `main` after Sprint 1 and Sprint 2 hardening were merged.

## Traceability

- GitHub issue: `#5` — Sprint 3 — Guest Management & Guest Lists Foundation
- Original PR: `#6` — Sprint 3 — Guest Management & Guest Lists Foundation
- Hardening PR: `Sprint 3 — Guest Management Hardening`
- Epic: `EPIC-GM`
- Features covered by the hardening pass: `FEAT-GM-001`, `FEAT-GM-002`, `FEAT-GM-003`, `FEAT-GM-005`, foundation-only `FEAT-GM-006`
- Requirement IDs: `GM-001`, `GM-002`, `GM-003`, `GM-006`, `GM-007`, `GM-008`, `GM-009`, `GM-011`, `GM-013`, `GM-015`, `PROJ-005`, `ROLE-005`, `REP-006`, `TECH-004`

## Findings And Fixes

- Fixed guest side filtering so `side=both` returns only both-side guests, while `side=bride` and `side=groom` still include both-side records for working-list visibility.
- Added shared side-filter parsing so unsupported `side` values fail closed instead of broadening a guest-list page to all guests.
- Fixed the guest-list event filter links so event filtering still works when the current side filter is `all`.
- Added explicit server-rendered page permission checks before loading guest list, guest creation form data, and guest edit form data.
- Added explicit `guests.deactivate` checks in the API route and server action before active guests can be deactivated.
- Aligned the guest insert RLS policy with the existing `guests.create` permission while preserving bride/groom own-side creation through `guests.manage_bride_side` and `guests.manage_groom_side`.
- Re-checked the previous CodeRabbit findings from PR `#6`; duplicate-candidate manage permissions and project-scoped assignment replacement are already present in current `main`.

## Files Changed

- `apps/web/src/lib/guests/guest-service.ts`
- `apps/web/src/lib/guests/guest-api.ts`
- `apps/web/src/lib/guests/guest-foundation.test.ts`
- `apps/web/src/app/api/projects/[projectId]/guests/route.ts`
- `apps/web/src/app/api/guests/[guestId]/route.ts`
- `apps/web/src/app/platform/projects/[projectId]/guests/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guests/new/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guests/[guestId]/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guests/actions.ts`
- `supabase/migrations/20260522211108_sprint_3_post_merge_hardening.sql`
- `docs/planning/sprint-3-hardening-report.md`

## Database Migration

- `20260522211108_sprint_3_post_merge_hardening.sql`
  - Replaces the guest insert policy with one that allows either `guests.create` project access or side-specific guest management access.
  - Does not add new product tables or future Sprint 4/5 behavior.

## Tests Added

- `apps/web/src/lib/guests/guest-foundation.test.ts`
  - `side=both` filtering returns only both-side guests.
  - Database side-filter values match bride/groom/both visibility rules.
  - Unsupported side filters throw validation errors.
  - Guest creation permission representation includes `guests.create`.
  - Active-to-inactive updates are flagged as requiring `guests.deactivate`.

## Commands Run

- `npm.cmd --workspace apps/web run test -- src/lib/guests/guest-foundation.test.ts`
- `npm.cmd ci`
- `npm.cmd run format:check`
- `npm.cmd run format`
- `npm.cmd run format:check` after formatting
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run test`
- `npm.cmd audit --omit=dev`
- `npm.cmd run build`
- `npm.cmd run db:lint`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `git diff --check`
- Targeted secret scan across changed Sprint 3 hardening files
- `wsl.exe ... coderabbit review --agent -t committed -c AGENTS.md`
- Post-review reruns: `npm.cmd run format:check`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run test`, `npm.cmd run build`, `git diff --check`

## Checks Passed

- Targeted guest foundation test passed: 1 file, 10 tests.
- `npm.cmd ci` passed and reported `found 0 vulnerabilities`.
- Final `npm.cmd run format:check` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run typecheck` passed for web and database workspaces.
- `npm.cmd run test` passed: 5 files, 48 tests.
- `npm.cmd audit --omit=dev` passed with 0 vulnerabilities.
- `npm.cmd run build` passed and included the guest API/UI routes in the route manifest.
- `npm.cmd run db:lint` passed for `public` and `app_private`.
- `npx.cmd supabase@latest db push --linked --dry-run` passed and reported only `20260522211108_sprint_3_post_merge_hardening.sql` as pending.
- `git diff --check` passed.
- Targeted secret scan found no real secrets or private client/guest data.
- CodeRabbit CLI committed review completed and raised one trivial migration style suggestion.
- Post-review verification passed after the event-filter link fix: format check, lint, typecheck, tests, build, and diff check.

## Checks Failed Or Blocked

- Initial `npm.cmd run format:check` failed on Prettier formatting for `guest-foundation.test.ts` and `guest-service.ts`; `npm.cmd run format` was run, and the final `format:check` passed.
- No Supabase authentication blockers occurred; linked `db:lint` and linked migration dry-run both passed.
- CodeRabbit suggested replacing `(select auth.uid())` with `auth.uid()` in the new RLS policy. This was not applied because the repository's Supabase policies consistently use the `(select auth.uid())` initplan pattern and `db:lint` passed with that convention.
- CodeRabbit GitHub review later found that event filter links dropped `eventId` when `side=all`; this was applied as a targeted fix.

## Security Checks Performed

- No `.env` or `.env.local` files were created.
- No Supabase service-role keys, database passwords, WhatsApp tokens, Google secrets, API secrets, private keys, real guest data, or real couple/client data were added.
- Backend API and server action deactivation now explicitly require `guests.deactivate`.
- Server-rendered guest pages now check permissions before loading guest-management data.
- RLS remains the database backstop for guest insert/update and assignment writes.
- Guest import, RSVP, public guest page, invitations, PDF/QR generation, WhatsApp, seating, check-in, contracts, pricing, payments, and partner project creation were not added.

## Assumptions

- This hardening pass targets current `main`, not a rewrite of merged PR `#6`.
- Sprint 3 traceability remains anchored to issue `#5` and PR `#6`.
- Current `main` includes later Sprint 4 and Sprint 5 code, but this branch intentionally changes only shared Sprint 3 guest-management foundations.
- Supabase linked-project checks will be run if local authentication remains available; otherwise they will be documented as blocked.

## Open Issues Or Blockers

- No Sprint 3 hardening blockers remain before PR review.
- CodeRabbit review has been run on the committed hardening diff; the remaining actionable event-filter finding has been fixed.

## Recommended Follow-Up

- Continue with Sprint 4 post-merge hardening after this PR is merged.
- Keep full duplicate merge workflow, CSV/Excel import hardening, RSVP, public guest pages, invitations, WhatsApp, seating, check-in, contracts, pricing, payments, and partner workflows in their own sprint hardening passes.
