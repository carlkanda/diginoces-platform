# Sprint 8 Completion Report - Tables, Seating & Print Materials

## Sprint Status

Implemented and locally verified for review on branch `codex/sprint-8-tables-seating-print-materials`.

Traceability:

- GitHub issue: `#23` - Sprint 8 - Tables, Seating & Print Materials
- Epic: `EPIC-SEAT`
- Features: `FEAT-SEAT-001`, `FEAT-SEAT-002`, `FEAT-SEAT-003`
- Stories: `STORY-SEAT-001`, `STORY-SEAT-002`
- Task: `TASK-SEAT-001`
- Test cases: `TEST-SEAT-001`, `TEST-SEAT-002`, `TEST-RSVP-004`

## Requirement IDs Covered

- `SEAT-001` - event-specific seating
- `SEAT-002` - table-level, seat-level, and mixed assignment modes
- `SEAT-003` - structured table records
- `SEAT-004` - individual and bulk table creation foundation
- `SEAT-005` - occupancy and capacity warnings
- `SEAT-006` - list/table UI and visual map foundation
- `SEAT-007` - unassigned guest tracking
- `SEAT-008` - post-invitation seating-change awareness foundation
- `SEAT-009` - RSVP seating interaction
- `SEAT-010` - VIP/protocol seating notes and markers
- `SEAT-011` - Canva table-card CSV export foundation
- `SEAT-012` - printed invitation workflow status foundation
- `RSVP-010` - RSVP operational effect for seating
- `INV-014` - seating changes can mark invitations as needing regeneration
- `FILE-008` - Canva CSV export metadata/version foundation
- `REP-006` - audit logs for sensitive actions
- `TECH-004` - backend permission enforcement

## Table and Seating Behavior Implemented

- Added event-specific table model with project/event ownership, code, name, description, capacity, display order, status, assignment mode, notes, and map coordinates.
- Added optional seat structure foundation for future seat-level/mixed mode workflows.
- Added active guest-to-table assignment model with optional seat, guest count snapshot, seating notes, VIP/protocol notes, remove/move history, and side-aware permission checks.
- Added single table creation and bulk table creation service/UI foundation.
- Added RSVP-aware occupancy calculation:
  - RSVP `no` remains in assignment history but is excluded from active occupancy.
  - RSVP `yes`, `maybe`, `pending`, `manual_review`, and `locked` remain included.
  - guest title/type default counts are used; invalid/missing counts safely default to `1` with a warning in pure helpers.
- Added unassigned active guest list for invited event guests without active table assignments.
- Added VIP/protocol marker detection through tags and assignment-level notes.
- Added visual seating-map placeholder route using stored/fallback table positions.

## Export and Print Behavior Implemented

- Added table-card CSV export foundation for Canva Bulk Create.
- CSV fields include project code, event name/date, couple names, table code/name/description, capacity, active assigned guest count, guest names, and VIP/protocol marker.
- Export records are stored in `seating_export_files` with filename, version, storage path placeholder, row count, metadata, and redacted audit snapshots.
- Added `printed_invitation_status` foundation column to `invitations`.
- Seating assignment changes mark generated/sent/resent invitations as `needs_regeneration` only when the event invitation template uses `table.name` or `table.code` fields.
- Automatic PDF regeneration is intentionally not implemented.

## Permission and Audit Behavior Implemented

- Added permission slugs:
  - `seating.read`
  - `seating.tables.manage`
  - `seating.assign`
  - `seating.export`
- Role grants:
  - `diginoces_admin` and `operations_manager`: read, table management, assignment, export.
  - `bride`: read and side-aware assignment for bride-side guests.
  - `groom`: read and side-aware assignment for groom-side guests.
  - `event_staff`: read.
- Backend API/server actions call event/project permission checks before loading or mutating seating data.
- Database RPCs enforce authentication, table/event/project compatibility, guest-event invitation, side-aware assignment rights, and seat release on moves/removals.
- RLS enabled on `event_tables`, `event_table_seats`, `guest_table_assignments`, and `seating_export_files`.
- Audit triggers added for table create/update/archive/capacity change, assignment assign/remove/move/update, and export generation/update.
- CSV content is redacted from seating export audit snapshots.

## Files Created or Changed

- `supabase/migrations/20260524083157_sprint_8_tables_seating_print_materials.sql`
- `apps/web/src/lib/seating/seating-service.ts`
- `apps/web/src/lib/seating/seating-db.ts`
- `apps/web/src/lib/seating/seating-api.ts`
- `apps/web/src/lib/seating/seating-foundation.test.ts`
- `apps/web/src/app/api/events/[eventId]/seating/route.ts`
- `apps/web/src/app/platform/events/[eventId]/seating/actions.ts`
- `apps/web/src/app/platform/events/[eventId]/seating/page.tsx`
- `apps/web/src/app/platform/events/[eventId]/seating/map/page.tsx`
- `apps/web/src/app/platform/events/[eventId]/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/page.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/api/health/route.ts`
- `apps/web/src/app/globals.css`
- `apps/web/src/lib/security/permissions.ts`
- `apps/web/src/lib/audit/audit-log.ts`
- `docs/setup/local-development.md`
- `docs/planning/sprint-8-completion-report.md`

## Database Migrations Added

- `20260524083157_sprint_8_tables_seating_print_materials.sql`

Migration contents:

- New enums for seating assignment mode, table status, seat status, assignment status, export type/status, and printed invitation status.
- New tables:
  - `event_tables`
  - `event_table_seats`
  - `guest_table_assignments`
  - `seating_export_files`
- New `invitations.printed_invitation_status` column.
- New private helpers for side-aware seating assignment and seating-triggered invitation regeneration.
- New RPCs:
  - `assign_guest_to_event_table`
  - `remove_guest_from_event_table`
- New RLS policies, grants, indexes, updated-at triggers, and audit triggers.

## Tests Added

- `apps/web/src/lib/seating/seating-foundation.test.ts`

Coverage includes:

- table payload and bulk table creation validation;
- positive table capacity;
- RSVP No excluded from active seating occupancy;
- RSVP Maybe included in active seating occupancy;
- Couple/default count contribution;
- over-capacity warnings;
- unassigned active guest list;
- side-aware bride/groom/operations assignment permissions;
- guest-event assignment compatibility;
- VIP/protocol marker in CSV exports;
- table-card CSV expected columns;
- invitation regeneration awareness;
- visual map placeholder behavior;
- migration guardrails for RLS, RPCs, permissions, audit, and out-of-scope modules.

## Commands Run

Passed:

```text
git pull --ff-only
npx.cmd supabase@latest migration new sprint_8_tables_seating_print_materials
npm.cmd run format
npm.cmd run test -- --run src/lib/seating/seating-foundation.test.ts
npm.cmd run typecheck
npm.cmd run test
npm.cmd run lint
npm.cmd run format:check
npx.cmd supabase@latest db push --linked --dry-run
npm.cmd ci
npm.cmd audit --omit=dev
git diff --check
npm.cmd run build
npm.cmd run db:lint
targeted secret scan with rg
wsl.exe bash -lc "coderabbit review --agent -t uncommitted -c AGENTS.md"
```

Failed but resolved/replaced:

```text
npm.cmd run format -- --log-level warn
```

The command passed an extra value through npm into Prettier and failed with `No files matching the pattern were found: "warn"`. The official `npm.cmd run format:check` was rerun and passed.

## Checks Passed or Failed

Passed:

- `npm ci`
- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm audit --omit=dev` - 0 vulnerabilities
- `npx supabase@latest db push --linked --dry-run` - showed only the Sprint 8 migration pending
- `npm run db:lint` - no schema errors on the current linked public/app_private schemas
- `git diff --check` - only expected CRLF conversion warnings on edited files
- targeted secret scan - only the `.env.example` placeholder database URL was detected
- hosted CodeRabbit review follow-up - patched scoped tag reads (`r3294185644`), atomic export version allocation (`r3294185646`), migration test path anchoring (`r3294185649`), TS/DB `couple` seating-read grant parity (`r3294185653`), seat FK delete behavior (`r3294185654`), and null-guarded seat release (`r3294185657`)
- local WSL CodeRabbit review - patched empty project/event code filename fallback in the DB export RPC, then reran with 0 issues

Not run/applied:

- `npx supabase@latest db push --linked --yes` was not run from this feature branch. The Sprint 8 migration should be applied to the linked dev project after PR review/merge, following the existing sprint workflow.

## Security Checks Performed

- Confirmed backend/server actions and API route require authenticated project/event permission checks before seating reads or writes.
- Confirmed database RLS is enabled on new seating tables.
- Confirmed assignment RPCs enforce side-aware bride/groom boundaries and do not rely only on hidden UI controls.
- Confirmed seating export audit redacts CSV content.
- Confirmed no `.env`, `.env.local`, Supabase service-role key, database password, WhatsApp token, Google secret, private key, real client data, or real guest data was added.

## Assumptions Made

- Sprint 8 should remain table/list operational first; the visual seating map is a placeholder/foundation.
- Seat-level and mixed-mode structures are safe to add in schema, but table-level assignment remains the primary functional path.
- Table-card CSV export can store generated CSV content and a storage-path placeholder in app-owned metadata until the later storage/file sprint expands real object storage.
- Bride/groom users can assign only their own side through the database helper; both-side guests require staff/admin or both side permissions.
- RSVP pending/manual review/locked states remain included in active seating until staff manually resolves them.

## Open Issues or Blockers

- The Sprint 8 migration has not been applied to the linked dev database yet; apply it after PR merge.
- Supabase generated TypeScript database types were not regenerated because the pending Sprint 8 migration is not applied to the linked project during this PR. The service uses explicit internal row types following the Sprint 7 pattern.
- Advanced drag-and-drop seating map behavior is intentionally deferred.
- Full seating change request workflow after invitation sending is represented by permission/audit/regeneration awareness only; structured review queue belongs to a future hardening or operations sprint if required.
- CSV files are registered/stored as database-backed export records with storage-path metadata; real object-storage persistence remains tied to the broader file/storage roadmap.

## Out-of-Scope Items Deferred

- check-in;
- WhatsApp sending;
- contracts;
- pricing;
- payments;
- partner project creation;
- full print partner workflow;
- direct Canva API integration;
- automatic PDF regeneration;
- advanced visual drag-and-drop seating map.

## Recommended Sprint 9 Scope

- Staff-only check-in.
- QR scan flow separate from public guest page tokens.
- Manual invitation ID/name/phone/table search.
- Couple partial arrivals.
- Printed-only manual check-in.
- Unexpected guest request workflow.
- Offline preload/sync foundation.
- Check-in dashboard with table, RSVP, and VIP/protocol highlights.
