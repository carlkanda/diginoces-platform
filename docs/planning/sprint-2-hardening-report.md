# Sprint 2 Hardening Report - Projects & Events Foundation

## Status

Implemented as a post-merge hardening pass on branch `codex/sprint-2-post-merge-hardening`.

Target pull request: `Sprint 2 - Projects & Events Hardening`.

Traceability anchors:

- Sprint 2 issue: <https://github.com/carlkanda/diginoces-platform/issues/3>
- Original Sprint 2 PR: <https://github.com/carlkanda/diginoces-platform/pull/4>

This report does not add new Sprint 2 product scope. It hardens the current `main` implementation after Sprints 1-5 and keeps later guest, import, RSVP, invitation, WhatsApp, seating, check-in, contracts, pricing, payments, and partner features out of this pass.

## Requirements And Backlog Reviewed

- `EPIC-PROJ`: Wedding Projects & Events.
- `FEAT-PROJ-001`: Project and event model.
- `FEAT-PROJ-002`: Project and event codes.
- `FEAT-PROJ-003`: Workflow checklist foundation.
- `PROJ-001`: Wedding Project -> Events/Celebrations -> event-specific hierarchy.
- `PROJ-002`: multiple events per wedding project.
- `PROJ-003`: unique readable project codes.
- `PROJ-004`: event codes generated from event type and editable by admin.
- `PROJ-007`: generated project/event workflow checklist foundation.
- `ROLE-001`, `ROLE-004`: global, project-level, and event-level permission foundation.
- `REP-006`: audit logging for project/event/workflow changes.

## Findings And Fixes

### High

- Server-rendered project and event detail pages loaded details through RLS-backed service queries but did not call the explicit permission RPC helpers used by the API routes. Fixed by requiring `projects.read` before rendering `/platform/projects/{projectId}` and `events.read` before rendering `/platform/events/{eventId}`. Permission denial now fails closed with `notFound()`.

### Medium

- The in-memory scoped permission helper already filtered assignments through `getValidRoleAssignments`, but the final grant helper did not independently verify that a role assignment's stored scope matched the role definition scope. Hardened `assignmentGrantsPermission` to require the scope match before honoring grants, and added a regression test for malformed scope/role combinations.

### Historical CodeRabbit Checklist

The original Sprint 2 PR comments were rechecked against current `main`.

- `GET /api/projects/{projectId}/events` now uses `projectExists` plus `listProjectEvents`; no additional fix needed.
- Mobile header wrapping, UTC-safe event date formatting, generic Supabase-not-configured API errors, event date/time validation, nullable PATCH clearing, audit redaction, workflow task audit actions, and advisory locks for code generation were already present in current `main`; no additional migration was required.
- Project/event migrations already enable RLS on Sprint 2 tables and preserve audit triggers for project, event, and workflow task changes.

## Files Changed

- `apps/web/src/app/platform/projects/[projectId]/page.tsx`
- `apps/web/src/app/platform/events/[eventId]/page.tsx`
- `apps/web/src/lib/projects/project-permissions.ts`
- `apps/web/src/lib/projects/project-foundation.test.ts`
- `docs/planning/sprint-2-hardening-report.md`

## Tests Added Or Updated

- Updated `apps/web/src/lib/projects/project-foundation.test.ts` with a regression test proving malformed role/scope assignments do not grant project or event access.

## Commands Run

- `npm run test` - passed before hardening edits, 5 files and 44 tests.
- `npm run typecheck` - passed after hardening edits.
- `npm ci` - passed with 0 vulnerabilities.
- `npm run format:check` - failed once because `apps/web/src/lib/projects/project-permissions.ts` needed Prettier formatting.
- `npm run format` - passed and formatted `apps/web/src/lib/projects/project-permissions.ts`.
- `npm run format:check` - passed after formatting.
- `npm run lint` - passed.
- `npm run typecheck` - passed.
- `npm run test` - passed, 5 files and 45 tests.
- `npm run build` - passed.
- `npm audit --omit=dev` - passed with 0 vulnerabilities.
- `npx supabase@latest db push --help` - passed; confirmed current dry-run flags.
- `npx supabase@latest db lint --help` - passed; confirmed current linked lint flags.
- `npx supabase@latest db push --linked --dry-run` - passed and reported the remote database is up to date.
- `npm run db:lint` - passed against `public,app_private` with no schema errors found.
- `git diff --check` - passed with CRLF conversion warnings only.
- Targeted credential-shaped secret scan with `rg` excluding `node_modules`, `.next`, and `package-lock.json` - passed with no matches.
- `coderabbit review --agent -t committed --base main -c AGENTS.md` through WSL - passed; CodeRabbit raised 0 issues.

## Security Checks Performed

- Verified Sprint 2 API routes still use authenticated Supabase server clients and explicit permission RPC helpers before project/event mutations.
- Verified project/event UI detail routes now call server-side permission RPC helpers before rendering records.
- Verified Sprint 2 audit snapshots redact project/event contact and internal note fields.
- Verified workflow task create/update/delete audit actions are registered in the audit action type and migration trigger logic.
- Verified project and event code generators use per-base advisory transaction locks before checking candidate codes.
- No `.env`, `.env.local`, service-role key, database password, WhatsApp token, Google secret, API secret, real client data, or real guest data was added.

## Assumptions

- This is a post-merge hardening PR against current `main`, not a rewrite of PR `#4`.
- Issue `#3` and PR `#4` remain the Sprint 2 traceability anchors.
- Supabase linked-project checks are available if the local CLI session remains authenticated.
- The project list page continues to rely on RLS for row-level listing because requiring a global `projects.read` permission would block project-scoped couple/member access from seeing their assigned projects.

## Open Issues Or Blockers

- The Supabase CLI reported that a newer CLI version is available, but the linked dry-run and database lint checks passed with the installed CLI.
- No database migration was added in this pass because the reviewed Sprint 2 RLS, audit, and code-generation fixes were already present in current `main`.

## Recommended Next Hardening Scope

- Continue with a Sprint 3 post-merge hardening pass after this PR is reviewed and merged, focused on guest-side permissions, guest validation, duplicate detection, and guest audit redaction.
