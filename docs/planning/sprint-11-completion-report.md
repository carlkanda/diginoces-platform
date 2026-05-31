# Sprint 11 Completion Report - Dashboards, Reports & Audit Logs

## Summary

Sprint 11 implements the dashboards, report catalog/export, and audit-log viewer foundations for issue #27 on branch `codex/sprint-11-dashboards-reports-audit-logs`.

The implementation remains limited to Sprint 11. It does not add guest-book workflows, post-event feedback, partner SaaS scaling, partner commission management, advanced BI analytics, accounting integration, tax/VAT reporting, online payment processing, or future Sprint 12+ scope.

## Requirements Covered

- `REP-001`: Added global, project, event, couple, partner, and operational dashboard foundations with role-aware visibility.
- `REP-002`: Added global internal dashboard route/API gated by `dashboards.global.read`.
- `REP-003`: Added couple dashboard route with public-safe project/RSVP/guest summaries and no audit/revenue/internal report data.
- `REP-004`, `PART-005`: Added restricted partner dashboard placeholder/foundation with explicit partner boundaries and no revenue, payment, audit, or guest personal-data access.
- `REP-005`, `FILE-002`, `FILE-008`: Added report catalog and CSV export metadata foundation through `report_definitions`, `report_exports`, and CSV generation helpers. Sprint 11 records metadata only; object-storage persistence is deferred until storage retention/provider setup is production-ready.
- `REP-006`, `REP-007`: Added internal audit-log viewer, filters, redacted audit CSV export, and `audit_log_exports` metadata.
- `ROLE-002`, `ROLE-003`, `ROLE-004`, `ROLE-005`, `TECH-004`: Added backend permission checks and RLS policies for dashboard, report, and audit operations.
- `PAY-014`: Surfaced payment gate status in project/global dashboard summaries for authorized internal views.

## Backlog Traceability

- Epic: `EPIC-REP`.
- CSV feature rows: `FEAT-REP-001` (Dashboards), `FEAT-REP-002` (Reports and audit logs).
- Sprint plan feature breakdown covered through: `FEAT-REP-001` through `FEAT-REP-010`.
- Story/test anchor present in backlog CSV: `STORY-REP-001`, `TASK-REP-001`, `TEST-REP-001`.
- Related requirement/backlog references: `PAY-014`, `PART-005`.

## Files Created Or Changed

- Added Supabase migration:
  - `supabase/migrations/20260531091009_sprint_11_dashboards_reports_audit_logs.sql`
- Added report/dashboard services and tests:
  - `apps/web/src/lib/reports/report-api.ts`
  - `apps/web/src/lib/reports/report-db.ts`
  - `apps/web/src/lib/reports/report-service.ts`
  - `apps/web/src/lib/reports/reporting-foundation.test.ts`
- Updated RBAC/audit foundations:
  - `apps/web/src/lib/security/permissions.ts`
  - `apps/web/src/lib/audit/audit-log.ts`
- Added API routes:
  - `apps/web/src/app/api/dashboard/route.ts`
  - `apps/web/src/app/api/projects/[projectId]/dashboard/route.ts`
  - `apps/web/src/app/api/events/[eventId]/dashboard/route.ts`
  - `apps/web/src/app/api/reports/route.ts`
  - `apps/web/src/app/api/audit-logs/route.ts`
- Added UI routes/pages:
  - `apps/web/src/app/platform/dashboard/page.tsx`
  - `apps/web/src/app/platform/projects/[projectId]/dashboard/page.tsx`
  - `apps/web/src/app/platform/projects/[projectId]/couple-dashboard/page.tsx`
  - `apps/web/src/app/platform/events/[eventId]/dashboard/page.tsx`
  - `apps/web/src/app/platform/partner-dashboard/page.tsx`
  - `apps/web/src/app/platform/reports/page.tsx`
  - `apps/web/src/app/platform/reports/actions.ts`
  - `apps/web/src/app/platform/audit-logs/page.tsx`
  - `apps/web/src/app/platform/audit-logs/actions.ts`
- Updated existing navigation/health/docs:
  - `apps/web/src/app/platform/page.tsx`
  - `apps/web/src/app/platform/projects/[projectId]/page.tsx`
  - `apps/web/src/app/platform/events/[eventId]/page.tsx`
  - `apps/web/src/app/api/health/route.ts`
  - `docs/setup/local-development.md`
  - `docs/planning/sprint-11-completion-report.md`

## Database And Security Notes

- Added `report_scope_type`, `report_export_format`, `report_export_status`, and `dashboard_scope_type` enums.
- Added `report_definitions`, `report_exports`, `audit_log_exports`, and `dashboard_widget_preferences`.
- Added RLS and grants for new report/audit/dashboard tables.
- Added internal audit-log select policy gated by `audit.read`.
- Added audit triggers for report exports and audit-log exports.
- Added permission slugs:
  - `dashboards.global.read`
  - `dashboards.project.read`
  - `dashboards.event.read`
  - `dashboards.couple.read`
  - `dashboards.partner.read`
  - `reports.catalog.read`
  - `reports.export`
  - `reports.internal.read`
  - `audit.export`
- Role grants keep couples and partners away from revenue and audit data.
- Audit-log CSV export excludes `old_value` and `new_value`.

## Tests Added

- `apps/web/src/lib/reports/reporting-foundation.test.ts`
  - Verifies Sprint 11 role grants and restricted couple/partner permissions.
  - Verifies dashboard visibility derivation.
  - Verifies report catalog filtering.
  - Verifies CSV escaping.
  - Verifies audit-log filtering and redacted export shape.
  - Verifies migration foundations and route files exist.

## Commands Run

- `npm ci` - passed, 0 vulnerabilities reported by install audit.
- `npm run format` - passed, formatted web workspace.
- `npm run format:check` - passed.
- `npm run lint` - passed.
- `npm run typecheck` - passed.
- `npm run test -- --run src/lib/reports/reporting-foundation.test.ts` - passed, 7 tests.
- `npm run test` - passed, 12 test files and 119 tests.
- `npm run build` - passed.
- `npm audit --omit=dev` - passed, 0 vulnerabilities.
- `npm run db:lint` - passed, no schema errors in linked `public` and `app_private` schemas.
- `npx supabase@latest db push --linked --dry-run` - passed, would push `20260531091009_sprint_11_dashboards_reports_audit_logs.sql`.
- `git diff --check` - passed, only LF/CRLF warning for `docs/setup/local-development.md`.
- Targeted secret scan with `rg` - passed with no real secret patterns found. A broader scan only matched placeholder `.env.example` values and SQL `grant ... to service_role` statements, not keys.

## Checks Passed Or Failed

- Passed: install, format check, lint, typecheck, tests, build, dependency audit, Supabase linked db lint, Supabase linked dry-run, whitespace check, targeted secret scan.
- Failed: none.

## Assumptions

- Sprint 11 may store report export metadata without object-storage persistence because storage retention/provider setup remains a production readiness concern.
- CSV is the implemented Sprint 11 export format. PDF/Excel remain represented as planned/future placeholders through the report format enum and report catalog constraints.
- The linked Supabase project is a development project. The Sprint 11 migration was dry-run only and should be pushed after PR merge, following the established workflow.
- The generated Supabase TypeScript types were not regenerated in this PR because the linked dev database has not yet applied the Sprint 11 migration. New Sprint 11 tables are accessed through internal typed service shapes and untyped Supabase query helpers until the migration is applied.

## Open Issues Or Blockers

- Pending after merge: apply `20260531091009_sprint_11_dashboards_reports_audit_logs.sql` to the linked dev database.
- Pending after migration application: regenerate Supabase TypeScript types from the linked project if the project workflow requires generated DB types to include Sprint 11 objects.
- Object-storage persistence for report files remains deferred; Sprint 11 records export metadata and generated CSV responses only.

## Recommended Sprint 12 Scope

- Start Sprint 12 guest wishes/guest-book and post-event feedback only if assigned by the active sprint plan and issue.
- Keep Sprint 12 separate from advanced BI, partner commissions, accounting, tax/VAT, and full partner SaaS scaling unless explicitly assigned.
- After the Sprint 11 migration is merged/applied, consider a short follow-up to regenerate Supabase database types and verify report export metadata against real dev data.
