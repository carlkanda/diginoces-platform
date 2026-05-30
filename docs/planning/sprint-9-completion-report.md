# Sprint 9 Completion Report - Check-in & Wedding-Day Operations

## Summary

Sprint 9 implements the Check-in & Wedding-Day Operations foundation for GitHub issue `#25` on branch `codex/sprint-9-check-in-wedding-day-operations`.

The implementation is limited to the approved Sprint 9 scope: event check-in settings, staff-only access, separate event-specific check-in tokens, QR/manual check-in flows, partial arrivals, printed-only manual lookup, unexpected guest review, device/station assignment, offline preload/sync metadata, conflict representation, VIP/protocol highlight, dashboard metrics, permission checks, audit logging, tests, and local documentation.

## Requirements Covered

- `CHK-001` - staff-only check-in access for logged-in assigned staff.
- `CHK-002` - QR, invitation id, name, phone, side, and table lookup foundation.
- `CHK-003` - event-specific QR/check-in token binding.
- `CHK-004` - mobile/tablet-oriented staff check-in page foundation.
- `CHK-005` - Couple arrival count supports partial arrivals.
- `CHK-006` - second Couple arrival updates count only; welcome/table message remains first-arrival placeholder.
- `CHK-007` - household/family check-in implemented using guest/member-based event assignments.
- `CHK-008` - unexpected guest request workflow.
- `CHK-009` - in-app and manual supervisor approval recording foundation.
- `CHK-010` - VIP/protocol highlight on check-in UI.
- `CHK-011` - offline preload/sync foundation.
- `CHK-012` - printed-only guests can be found and checked in manually.
- `CHK-013` - device/station assignment foundation.
- `CHK-014` - dashboard metrics by table, staff, device, method, duplicate scans, and unexpected guests.
- `INV-007` - public guest page QR tokens and check-in tokens remain separate.
- `INV-008` - check-in tokens use secure short raw values and stored hashes.
- `MSG-007` - welcome/table message duplicate-prevention placeholder.
- `SEAT-010` - VIP/protocol seating notes and tags surface during check-in.
- `REP-006` - check-in actions are audited.
- `TECH-007` - offline preload/sync model and conflict representation foundation.
- `TECH-010` - check-in tokens are separate, revocable, and event-specific.

Backlog traceability:

- Epic: `EPIC-CHK`
- CSV feature rows found and implemented: `FEAT-CHK-001`, `FEAT-CHK-002`, `FEAT-CHK-003`, `FEAT-CHK-004`, `FEAT-CHK-005`
- Sprint plan conceptual feature coverage: `FEAT-CHK-001` through `FEAT-CHK-012`
- Stories: `STORY-CHK-001`, `STORY-CHK-002`, `STORY-CHK-003`
- Tasks: `TASK-CHK-001`, `TASK-CHK-002`
- Tests: `TEST-CHK-001`, `TEST-CHK-002`, `TEST-CHK-003`

## Files Created Or Changed

- `AGENTS.md`
- `README.md`
- `apps/web/src/app/api/events/[eventId]/check-in/route.ts`
- `apps/web/src/app/api/health/route.ts`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/platform/events/[eventId]/check-in/actions.ts`
- `apps/web/src/app/platform/events/[eventId]/check-in/page.tsx`
- `apps/web/src/app/platform/events/[eventId]/check-in/scan/page.tsx`
- `apps/web/src/app/platform/events/[eventId]/page.tsx`
- `apps/web/src/lib/check-in/check-in-api.ts`
- `apps/web/src/lib/check-in/check-in-db.ts`
- `apps/web/src/lib/check-in/check-in-foundation.test.ts`
- `apps/web/src/lib/check-in/check-in-service.ts`
- `apps/web/src/lib/projects/project-api.ts`
- `apps/web/src/lib/security/permissions.ts`
- `docs/setup/local-development.md`
- `docs/planning/sprint-9-completion-report.md`
- `supabase/migrations/20260530111921_sprint_9_check_in_wedding_day_operations.sql`

## Database And Security Model

The Sprint 9 migration adds:

- check-in enums for settings, token status, methods, sync status, devices, preload status, unexpected guest states, sync batches, and conflicts;
- `check_in_settings`;
- `check_in_devices`;
- `check_in_tokens`;
- `check_in_records`;
- `unexpected_guest_requests`;
- `check_in_preload_snapshots`;
- `check_in_sync_batches`;
- `check_in_sync_conflicts`;
- event/project helper `app_private.user_can_access_check_in_event`;
- check-in audit redaction and audit triggers;
- RPCs for creating tokens, resolving tokens, recording check-in, and reviewing unexpected guest requests;
- RLS policies for new check-in tables;
- event-scoped read policies for guest, RSVP, invitation, and seating context required by assigned check-in staff;
- permissions under `check_in.*`;
- the `check_in_supervisor` role.

Security behavior:

- check-in actions require an authenticated staff user;
- event staff can access only event-bound check-in context;
- public guest page tokens are not accepted as check-in authority;
- check-in token raw values are returned only once and stored as SHA-256 hashes;
- audit snapshots redact token hashes;
- API routes and server actions perform explicit permission checks before mutations;
- RLS remains the database backstop.

## Tests Added

Added `apps/web/src/lib/check-in/check-in-foundation.test.ts`, covering:

- secure token generation, hashing, route construction, and separation from public guest tokens;
- settings and device payload validation;
- event-scoped permission helper behavior for staff/supervisor assignments;
- manual guest search by name, phone, invitation id, table, side, and printed-only state;
- Couple partial arrival state and duplicate welcome/table message suppression;
- RSVP No warnings and VIP/protocol highlights;
- offline preload data and sync conflict representation;
- dashboard metric calculations;
- migration evidence for tables, permissions, audit hooks, and out-of-scope boundaries.

## Commands Run

Passed:

- `npm.cmd ci`
- `npm.cmd run format`
- `npm.cmd run format:check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd --workspace apps/web run test -- --run src/lib/check-in/check-in-foundation.test.ts`
- `npm.cmd run test`
- `npm.cmd run build`
- `npm.cmd audit --omit=dev`
- `npm.cmd run db:lint`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `git diff --check`
- targeted `rg` secret scan

Transient failures fixed:

- `npm.cmd run typecheck` initially failed because a QR scan page rendered an unknown RPC status value directly. The page now narrows the status to a string.
- `npm.cmd run format:check` initially failed on newly added/changed files, then again on `src/app/globals.css` after the VIP panel style. `npm.cmd run format` fixed both, and the final `format:check` passed.

Database check notes:

- `npm.cmd run db:lint` passed with no schema errors.
- `npx.cmd supabase@latest db push --linked --dry-run` succeeded and reported pending linked-dev migrations:
  - `20260524083157_sprint_8_tables_seating_print_materials.sql`
  - `20260530111921_sprint_9_check_in_wedding_day_operations.sql`
- Post-merge update: after PR `#36` was merged, the pending Sprint 8 and Sprint 9 migrations were applied to the linked dev project with `npx.cmd supabase@latest db push --linked --yes`.
- Post-merge verification: `npx.cmd supabase@latest db push --linked --dry-run` now reports the remote database is up to date, and `npm.cmd run db:lint` reports no schema errors.

Secret scan notes:

- The targeted scan reported expected placeholder/documentation text and SQL grants to the Postgres `service_role` role.
- No `.env`, `.env.local`, Supabase service-role key, database password, WhatsApp token, Google secret, private key, API secret, real client data, or real guest data was added.

## Assumptions

- Sprint 8 code and migration are the required dependency for seating/table context.
- The linked dev database is aligned with `main` as of the post-merge Sprint 9 migration push.
- Check-in staff are assigned through event-scoped roles or higher project/global roles.
- Raw QR image generation is not required in Sprint 9; this sprint creates the secure token/link foundation consumed by a future QR renderer.
- Offline support is a preload/sync/conflict foundation, not a production PWA/IndexedDB implementation.
- Welcome/table messaging remains a first-arrival placeholder and does not send WhatsApp automatically.

## Open Issues Or Blockers

- No code blocker remains for the Sprint 9 PR.
- Linked dev DB QA blocker is cleared for Sprint 9; the linked project has the Sprint 8 and Sprint 9 migrations applied.
- Production-grade offline mode still needs PWA/IndexedDB storage and sync UX beyond this foundation.
- Real-time dashboard subscriptions and advanced operational reports remain outside Sprint 9.

## Recommended Sprint 10 Scope

- Proceed with Sprint 10 contracts, pricing, and payment controls after assigning GitHub issue `#26`.
- Keep check-in follow-ups limited to hardening unless explicitly assigned; do not expand into full reporting, WhatsApp automation, guest-book workflows, or partner operations during Sprint 10.
