# Sprint 2 Completion Report - Wedding Projects & Events Foundation

## Status

Implemented for review on branch `codex/sprint-2-projects-events-foundation`.

Draft pull request: <https://github.com/carlkanda/diginoces-platform/pull/4>.

This report does not mark requirements permanently complete because repository governance still requires review before completion status changes.

## Requirements Covered

- `PROJ-001`: wedding project hierarchy foundation with `wedding_projects` as the project-level parent.
- `PROJ-002`: multiple events per wedding project through the `events.project_id` relationship.
- `PROJ-003`: automatically generated unique readable project codes.
- `PROJ-004`: automatically generated and admin-editable event codes.
- `PROJ-007`: generated project/event workflow checklist foundation.
- `ROLE-001`, `ROLE-004`: backend permission checks for global, project, and event access using Sprint 1 RBAC.
- `REP-006`: audit logging for project and event creation/update changes.

## Backlog Items Covered

- `EPIC-PROJ`: Wedding Projects & Events.
- `FEAT-PROJ-001`: Project and event model.
- `FEAT-PROJ-002`: Project and event codes.
- `FEAT-PROJ-003`: Workflow checklist foundation.
- `STORY-PROJ-001`: Admin creates wedding project.
- `STORY-PROJ-002`: Admin creates multiple events.
- `STORY-PROJ-003`: System generates project and event codes.
- `TASK-PROJ-001`: Create project/event tables.
- `TEST-PROJ-001`, `TEST-PROJ-002`, `TEST-PROJ-003`: represented in unit/smoke coverage and database/API design.

## Files Created Or Changed

- Supabase migrations: `supabase/migrations/20260521123000_sprint_2_projects_events.sql`, `supabase/migrations/20260521131500_sprint_2_code_generation_lint.sql`.
- Scripts: `scripts/supabase-db-lint.mjs`.
- Database types: `apps/web/src/types/database.ts`.
- Permission/audit foundations: `apps/web/src/lib/security/permissions.ts`, `apps/web/src/lib/audit/audit-log.ts`.
- Project/event libraries: `apps/web/src/lib/projects/project-codes.ts`, `apps/web/src/lib/projects/project-foundation.ts`, `apps/web/src/lib/projects/project-permissions.ts`, `apps/web/src/lib/projects/project-service.ts`, `apps/web/src/lib/projects/project-api.ts`.
- API routes: `apps/web/src/app/api/projects/route.ts`, `apps/web/src/app/api/projects/[projectId]/route.ts`, `apps/web/src/app/api/projects/[projectId]/events/route.ts`, `apps/web/src/app/api/events/[eventId]/route.ts`.
- UI routes and shell updates: `apps/web/src/app/page.tsx`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/platform/page.tsx`, `apps/web/src/app/platform/projects/page.tsx`, `apps/web/src/app/platform/projects/[projectId]/page.tsx`, `apps/web/src/app/platform/events/[eventId]/page.tsx`, `apps/web/src/app/globals.css`.
- Health endpoint: `apps/web/src/app/api/health/route.ts`.
- Tests: `apps/web/src/lib/projects/project-foundation.test.ts`.
- Documentation: `docs/setup/local-development.md`, `docs/planning/sprint-2-completion-report.md`.

## Tests Added

- `apps/web/src/lib/projects/project-foundation.test.ts`
- Covers Sprint 2 traceability, project code generation, event code generation, scoped project/event permission behavior, create payload validation, and workflow template scope guards.

Existing Sprint 1 smoke tests remain in `apps/web/src/lib/platform/smoke.test.ts`.

## Commands Run

- `git switch -c codex/sprint-2-projects-events-foundation` - passed.
- `npm run typecheck` - passed after completing the Supabase type shape for new tables/functions.
- `npm run test` - passed, 2 files and 9 tests.
- `npm run format` - passed and formatted web source files.
- `npm run format:check` - passed.
- `npm run lint` - passed.
- `npm ci` - initially failed when run in parallel with `npm run build` because Windows locked the Next SWC binary while build was using it.
- `npm install` - passed and repaired `node_modules`.
- `npm ci` - passed when rerun sequentially.
- `npm run build` - initially failed during the parallel `npm ci` collision; passed when rerun sequentially.
- `npm audit --omit=dev` - passed with 0 vulnerabilities.
- `npx supabase@latest db push --linked --dry-run` - passed and identified `20260521123000_sprint_2_projects_events.sql` as pending.
- `npx supabase@latest db push --linked --yes` - passed and applied `20260521123000_sprint_2_projects_events.sql` to the linked Supabase dev project.
- `npm run db:lint` - initially passed against `public,private`; script was corrected to lint `public,app_private`.
- `npm run db:lint` - surfaced two non-failing PL/pgSQL warnings for code-generation loop returns after `app_private` was included.
- `npx supabase@latest db push --linked --dry-run` - passed and identified `20260521131500_sprint_2_code_generation_lint.sql` as pending.
- `npx supabase@latest db push --linked --yes` - passed and applied `20260521131500_sprint_2_code_generation_lint.sql`.
- `npx supabase@latest migration list --linked` - passed and showed local/remote migrations aligned through `20260521131500`.
- Final `npm run db:lint` - passed against `public,app_private` with no schema errors found.
- Local dev server launch with `npm --workspace apps/web run dev -- --hostname 127.0.0.1 --port 3000` - passed.
- In-app browser verification for `http://127.0.0.1:3000/` - passed; homepage showed Sprint 2 foundation modules.
- In-app browser verification for `http://127.0.0.1:3000/platform/projects` - passed; projects page showed the expected secure Supabase-not-configured state.
- Local dev server stop check - passed; `http://127.0.0.1:3000` no longer responded after stopping.
- Secret scan with `rg` for service-role keys, database passwords, WhatsApp tokens, Google secrets, private keys, and OpenAI-style keys - passed with no matches.
- `git commit -m "Implement sprint 2 projects events foundation"` - passed locally.
- `git push -u origin codex/sprint-2-projects-events-foundation` - passed.
- Draft pull request creation through the GitHub connector - passed: <https://github.com/carlkanda/diginoces-platform/pull/4>.

## Checks Passed Or Failed

Passed:

- Install with `npm ci`.
- Format check.
- Lint.
- Typecheck.
- Unit/smoke tests.
- Production build.
- `npm audit --omit=dev`.
- Linked Supabase migration push.
- Linked Supabase schema lint with `--schema public,app_private --fail-on error`.
- In-app browser smoke verification for the home and projects pages.

Failed or blocked:

- Initial typecheck failed before adding the full Supabase table `Relationships` type shape and stricter `projectYear` narrowing; fixed and re-run successfully.
- Initial parallel `npm ci`/`npm run build` failed because `npm ci` removed dependencies while `next build` was running; both passed when rerun sequentially.
- One in-app browser screenshot attempt timed out on `Page.captureScreenshot`; DOM-based browser verification still passed. No screenshot artifact is required for the sprint.

## Security Checks Performed

- No `.env`, `.env.local`, Supabase service-role key, database password, WhatsApp token, Google secret, or API secret was added.
- Sprint 2 API handlers use the authenticated Supabase server client and do not require service-role secrets.
- Project/event mutations call backend permission RPCs before writes.
- Database RLS is enabled on `wedding_projects`, `events`, `project_members`, `event_members`, and `workflow_tasks`.
- Project/event access helper functions run from `app_private` with constrained public RPC wrappers.
- Project/event inserts and updates write audit rows through database triggers.
- Workflow tasks added in Sprint 2 are limited to setup foundation tasks and do not implement guest, RSVP, invitation, WhatsApp, seating, check-in, contract, pricing, or payment flows.

## Assumptions Made

- Sprint 2 issue is GitHub issue `#3`: <https://github.com/carlkanda/diginoces-platform/issues/3>.
- The user narrowed Sprint 2 to `EPIC-PROJ` plus `FEAT-PROJ-001`, `FEAT-PROJ-002`, and `FEAT-PROJ-003`, so partner project creation from the broader sprint plan was not implemented.
- Project codes use the documented readable format `{COUPLE_CODE}-{YEAR}-{SEQUENCE}`. The sequence is generated by the database for uniqueness.
- Event codes use `{PROJECT_CODE}-{EVENT_TYPE_CODE}` with a numeric suffix only when needed for uniqueness.
- Workflow checklist foundation means generated setup tasks only; downstream task types remain future scope.

## Open Issues Or Blockers

- Review is still required before marking any requirement complete.
- `npm run db:lint` may require access to the developer's authenticated Supabase CLI profile or `SUPABASE_ACCESS_TOKEN` outside the repository.
- There are no UI forms yet; project/event creation is available through the foundation API and database model. Rich operational forms can be added after review if kept in scope.

## Recommended Sprint 3 Scope

- Start guest management only after Sprint 2 review is complete.
- Implement `FEAT-GM-*` items for project-level master guest records and event assignments.
- Keep RSVP, invitations, WhatsApp sending, seating, check-in, contracts, pricing, payments, and partner workflows gated to their documented sprint issues.
