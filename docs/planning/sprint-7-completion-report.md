# Sprint 7 Completion Report - WhatsApp Communication Workflows

## Sprint Status

Status: implemented and verified locally; draft PR opened for review from the Sprint 7 branch.

Issue: #21 - Sprint 7 - WhatsApp Communication Workflows

Branch: `codex/sprint-7-whatsapp-communication-workflows`

Governance note: `AGENTS.md` and `README.md` were already updated on `main` to Sprint 7 active metadata before this implementation branch; the branch keeps that metadata unchanged and verifies issue `#21`, plan path, expected branch, PR title, and this completion report path remain current.

## Requirements Covered

- `MSG-001` - WhatsApp-first communication with guided manual and API-ready modes.
- `MSG-002` - Approved message template foundation.
- `MSG-003` - French/English template selection and fallback.
- `MSG-004` - Invitation sending readiness checks for payment gate, guest/event assignment, invitation, file, public link, and WhatsApp number.
- `MSG-005` / `RSVP-011` - Maybe follow-up preparation foundation.
- `MSG-006` - Modification/update message preparation foundation.
- `MSG-007` - Welcome/table message placeholder only.
- `MSG-008` - Message status tracking.
- `MSG-009` - Guided manual accountability for staff, guest, event, and status.
- `MSG-010` - Unofficial WhatsApp Web automation remains out of scope.
- `PV-004`, `INV-013`, `PAY-014`, `PAY-015`, `REP-006`, `TECH-005`.

## Backlog Items Covered

- Epic: `EPIC-MSG`
- Features: `FEAT-MSG-001`, `FEAT-MSG-002`, `FEAT-MSG-003`
- Stories: `STORY-MSG-001`, `STORY-MSG-002`
- Tasks: `TASK-MSG-001`, `TASK-MSG-002`
- Tests: `TEST-MSG-001`, `TEST-MSG-002`

## Files Created Or Changed

- `apps/web/src/lib/messages/message-service.ts`
- `apps/web/src/lib/messages/message-db.ts`
- `apps/web/src/lib/messages/message-api.ts`
- `apps/web/src/lib/messages/message-foundation.test.ts`
- `apps/web/src/lib/security/permissions.ts`
- `apps/web/src/lib/audit/audit-log.ts`
- `apps/web/src/app/api/projects/[projectId]/messages/templates/route.ts`
- `apps/web/src/app/api/projects/[projectId]/messages/prepare/route.ts`
- `apps/web/src/app/api/projects/[projectId]/messages/[messageLogId]/status/route.ts`
- `apps/web/src/app/platform/projects/[projectId]/communications/actions.ts`
- `apps/web/src/app/platform/projects/[projectId]/communications/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/communications/templates/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/communications/queue/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/communications/[messageLogId]/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/communications/submit-button.tsx`
- `apps/web/src/lib/messages/message-format.ts`
- `apps/web/src/app/api/health/route.ts`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/platform/projects/[projectId]/page.tsx`
- `supabase/migrations/20260523215729_sprint_7_whatsapp_communication_workflows.sql`
- `docs/setup/local-development.md`
- `docs/planning/sprint-7-completion-report.md`

## Database Migration Added

- `supabase/migrations/20260523215729_sprint_7_whatsapp_communication_workflows.sql`

The migration adds message template/log/queue/status-event foundations, Sprint 7 permissions, RLS policies, grants, audit triggers with rendered-message/WhatsApp redaction, guided manual status RPC, and `sent`/`resent`/`cancelled` invitation status values.

## Tests Added

- `apps/web/src/lib/messages/message-foundation.test.ts`

Coverage includes template language selection/fallback, inactive template blocking, variable rendering, readiness gates, printed-only exception, guided manual status transitions, WhatsApp link generation, resends, modification messages, Maybe follow-up filtering, API-ready adapter behavior, permissions, audit actions, migration evidence, and documentation evidence.

## Commands Run

- `git status --short --branch`
- `git pull`
- `gh api repos/carlkanda/diginoces-platform/issues/21`
- `npx.cmd supabase@latest migration new sprint_7_whatsapp_communication_workflows`
- `npm.cmd --workspace apps/web run test -- --run src/lib/messages/message-foundation.test.ts` - red test failed because the message service did not exist.
- `npm.cmd --workspace apps/web run test -- --run src/lib/messages/message-foundation.test.ts` - passed after implementation.
- `npm.cmd ci` - passed; installed dependencies and reported 0 vulnerabilities.
- `npm.cmd run format` - passed; formatted Sprint 7 files.
- `npm.cmd run format:check` - passed.
- `npm.cmd run lint` - passed after fixing one unused placeholder warning.
- `npm.cmd run typecheck` - passed.
- `npm.cmd run test` - passed; 8 test files and 83 tests passed.
- `npm.cmd run build` - passed.
- `npm.cmd audit --omit=dev` - passed; 0 vulnerabilities.
- `npm.cmd run db:lint` - passed; no schema errors found in `public` or `app_private`.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed; would push only `20260523215729_sprint_7_whatsapp_communication_workflows.sql`.
- `git diff --check` - passed; emitted only a CRLF advisory for `docs/setup/local-development.md`.
- Targeted `rg` secret scan for service-role keys, database URLs/passwords, WhatsApp tokens/secrets, Google secrets, private keys, and production payment keys - passed with no matches.
- Hosted CodeRabbit review fixes applied for strict FormData text handling, queue-page prerequisites, whitespace-preserving template previews, parallel preparation reads, and local setup scope wording.
- Post-review rerun: `npm.cmd run format:check`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run test`, `npm.cmd run build`, `git diff --check`, and targeted secret scan passed.

## Checks Passed Or Failed

- Targeted Sprint 7 test red state was verified before implementation.
- An early parallel format/lint/typecheck attempt was started before `npm ci` had finished and failed because local binaries were not yet available; the checks were rerun after install completion and passed.
- `npm ci`, `format:check`, `lint`, `typecheck`, `test`, `build`, `npm audit --omit=dev`, `db:lint`, Supabase linked dry-run, `git diff --check`, and targeted secret scan passed.

## Security Checks Performed

- No real WhatsApp credentials, API tokens, database passwords, service-role keys, Google secrets, or private client/guest data were added.
- Production WhatsApp API sending is represented only by a credential-free adapter that queues API-ready work and refuses real send attempts.
- Guided manual mode uses a `wa.me` link only; no unofficial WhatsApp Web automation is introduced.
- Backend permission checks use `message_templates.read`, `message_templates.manage`, `messages.read`, `messages.prepare`, and `messages.send`.
- Supabase RLS policies gate template, log, queue, and status-event tables by project permission.
- Message audit snapshots redact rendered body, target WhatsApp number, manual WhatsApp URL, and provider IDs.

## Template Behavior Implemented

- Templates are project-scoped and support message type, language, body, variables, status, and version.
- French and English are supported.
- Active templates are required for operational preparation.
- Preferred language is selected first with explicit fallback to project default language.

## Guided Manual Sending Behavior Implemented

- Staff can prepare a WhatsApp message from project, event, guest, invitation, public-link, and template context.
- Prepared logs store target guest/event/invitation context, rendered body, channel, mode, status, staff actor, and timestamps.
- Staff can open the WhatsApp link manually and mark messages opened, sent, failed, skipped, or resent.

## Message Status Tracking Implemented

Statuses represented: `not_prepared`, `prepared`, `queued`, `opened_manually`, `sent`, `failed`, `skipped`, `resent`, `cancelled`.

## Reminder And Follow-Up Behavior Implemented

- Maybe follow-up candidate filtering includes only guests still marked `maybe`.
- Event reminder and welcome/table workflows are controlled placeholders through message types and template/queue support. Full scheduling and check-in behavior remain future scope.

## Audit-Log Behavior Implemented

- Message template create/update/activate/deactivate actions are audited.
- Message prepared/opened/sent/failed/skipped/resent actions are audited.
- Reminder and modification preparation actions are audited.

## Assumptions Made

- Sprint 7 remains guided-manual first.
- Source public guest tokens are not recoverable from stored token hashes; authorized staff supply or generate the guest page link through the existing public-token foundation.
- Full payment status is represented by the existing `guest_page_access_status` foundation until Sprint 10 builds full payment records.
- API mode is intentionally credential-free in Sprint 7.

## Open Issues Or Blockers

- Full scheduler/worker execution for reminders is deferred; queue/status foundations are present.
- Full production WhatsApp API provider integration requires future credentials and provider selection.
- Sprint 7 migration is validated by linked dry-run but is not applied to the linked dev database until after PR review/merge.

## Out-Of-Scope Items Deferred

- Unofficial WhatsApp Web automation.
- Production WhatsApp API integration requiring real credentials.
- Seating and table assignment.
- Check-in.
- Contracts, pricing, and payments.
- Invitation PDF generation or QR generation.
- Partner project creation.

## Recommended Sprint 8 Scope

Sprint 8 should proceed with event-specific tables, capacities, guest-to-table assignment, seating views, occupancy warnings, and print-material export foundations without expanding check-in or payment scope.
