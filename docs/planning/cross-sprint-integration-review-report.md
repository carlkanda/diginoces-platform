# Cross-Sprint Integration Review Report - Sprints 1-5

## Status

Review and hardening fixes completed on branch `codex/cross-sprint-integration-review`.

This pass reviewed the merged Sprint 1-5 implementation as one integrated system after Sprint 1-4 post-merge hardening. It is not a new product sprint and does not implement Sprint 6 or later features.

Draft PR opened: `#17` - `Cross-Sprint Integration Review - Sprints 1-5`.

## Traceability Anchors

- Sprint 1: issue `#1`, PR `#2`, hardening PR `#13`
- Sprint 2: issue `#3`, PR `#4`, hardening PR `#14`
- Sprint 3: issue `#5`, PR `#6`, hardening PR `#15`
- Sprint 4: issue `#7`, PRs `#8` and `#9`, hardening PR `#16`
- Sprint 5: issue `#10`, PR `#11`

## Findings And Fixes

### Medium - Login Redirect Encoding Was Inconsistent Across Sprint Boundaries

Older Sprint 2 and Sprint 3 server-rendered pages built `/login?next=...` redirects with raw path interpolation, while Sprint 4 pages used `URLSearchParams`. This created inconsistent redirect safety across the authenticated app boundary.

Fixed by adding `buildLoginRedirectPath()` in the auth foundation and using it across platform, project, event, guest, import, RSVP, and public-preview pages. `normalizeInternalPath()` now trims input and rejects literal or encoded control characters and path traversal segments before placing a path into a login redirect.

Follow-up CodeRabbit review found that double-encoded traversal values such as `%252e%252e` could bypass a single decode pass and that backslash-based traversal should also fail closed. `normalizeInternalPath()` now checks each decode layer up to a small maximum and rejects encoded traversal or backslashes after each decode step.

### Medium - Sprint 2 Code Generation Functions Had Unbounded Collision Loops

The latest Sprint 2 database function replacements generated project and event codes in open-ended loops. Advisory locks protected concurrent callers, but a fully exhausted prefix could still run until statement timeout instead of failing predictably.

Fixed with a forward migration that replaces `app_private.generate_project_code()` and `app_private.generate_event_code()` with bounded loops matching their visible sequence widths. Exhaustion now raises an explicit `54000` error instead of relying on timeout behavior.

### Medium - Sprint 3 Assignment Validation Used Authorization SQLSTATEs

`replace_guest_foundation_assignments()` used SQLSTATE `42501` both for unauthenticated access and invalid event/tag IDs. That blurred the boundary between authorization failure and caller validation errors across guest, import, and RSVP workflows that reuse guest event assignments.

Fixed with a forward migration that preserves `42501` for unauthenticated access and changes invalid event/tag ID validation failures to `22023`.

### Medium - Later-Sprint Navigation Was Shown Without Matching Capability Checks

Sprint 2 project detail and Sprint 3 guest list pages linked to Sprint 4 import and Sprint 5 RSVP routes without checking the current user's matching capabilities. Target routes were still protected server-side, but the UI could expose dead links to users with narrower project access.

Fixed by exporting `hasProjectPermission()` from the project API foundation and using it to hide guest import and RSVP links unless the user has `guest_imports.read` or `rsvps.read`. Guest-list creation links now require a create-capable guest permission before rendering.

### Medium - Public Guest Preview Needed An Explicit Page-Level Permission Check

The Sprint 5 public-preview page relied on the preview RPC to enforce `guest_public_pages.preview`. The RPC is still the database backstop, but server-rendered UI should fail closed before loading sensitive guest preview data.

Fixed by requiring `guest_public_pages.preview` on the server page before calling `preview_guest_public_page`.

### Low - Import Audit Types Drifted From Database Audit Actions

Sprint 1's app-level `AuditAction` union did not include Sprint 4 import lifecycle actions. Sprint 4's pure audit action list also included `guest_imports.file_parsed`, which is not emitted by the database audit trigger, and missed `guest_imports.updated` / `guest_import_rows.validation_updated`, which are emitted.

Fixed the app-level audit union, audit summary, and Sprint 4 import action list to match the database-triggered audit actions.

### Low - Backlog Snapshot Docs Listed Nonexistent Artifact Names

`README.md`, `docs/backlog/README.md`, and `docs/backlog/master-requirements-register-source.md` described different CSV snapshot names. Some listed dash-separated files that do not exist in the repository, while the actual exported snapshots use underscore-separated filenames.

Fixed by aligning all three documents with the repository's current backlog snapshot artifacts.

### Low - Pure Import Read Helper Did Not Represent Own-Upload Visibility

The Sprint 4 RLS helper allows users with `guest_imports.read` to read an import they uploaded, even when side access later changes. The pure permission helper only modeled side-aware read visibility.

Fixed by allowing `canPerformGuestImportAction(..., "read", ...)` to accept optional `currentUserId` / `uploadedBy` visibility context and return true for own uploaded imports when project-level read permission is present.

### Low - Public RSVP Result Redirects Did Not Encode Guest Tokens Consistently

Public RSVP server-action redirects assumed generated tokens were safe route segments. Generated tokens are hex, but public routes should still encode route data consistently.

Fixed by centralizing public guest result redirects through an encoded helper.

## Files Created Or Changed

- Created `apps/web/src/lib/auth/auth-service.test.ts`.
- Updated auth redirect helpers and login action behavior.
- Updated platform, project, event, guest, guest-import, RSVP, and public-preview server pages.
- Updated project permission helper exports.
- Updated audit foundation types and summary.
- Updated guest import permission/audit helpers and tests.
- Updated Sprint 1 smoke coverage for cross-sprint audit domains.
- Updated backlog snapshot documentation for canonical artifact names.
- Added `supabase/migrations/20260523063041_cross_sprint_integration_hardening.sql`.
- Created this report.

## Database Migrations

Added:

- `supabase/migrations/20260523063041_cross_sprint_integration_hardening.sql`

The migration:

- bounds project and event code generation loops;
- keeps project/event code generation functions private to `app_private`;
- adds explicit guest-side and assignment-management permission checks before assignment/tag replacement;
- preserves the guest assignment RPC signature;
- preserves existing non-default guest event assignment status during assignment upserts and updates the row timestamp on conflict;
- changes invalid event/tag assignment errors to validation SQLSTATE `22023` while keeping unauthenticated access as `42501`.

## Tests Added Or Updated

- Added auth redirect helper tests for internal-path normalization and encoded `next` query behavior.
- Added auth redirect helper tests for encoded control characters and path traversal attempts.
- Added auth redirect helper tests for double-encoded and backslash path traversal attempts.
- Updated guest import foundation tests for own-upload read visibility and database-aligned audit actions.
- Updated platform smoke tests to include Sprint 4 import audit actions in the Sprint 1 audit foundation summary.
- Updated project foundation tests to assert the cross-sprint migration contains bounded code generation and explicit validation SQLSTATE behavior.

## Commands Run

- `npm.cmd --workspace apps/web run test -- src/lib/auth/auth-service.test.ts src/lib/guest-imports/guest-import-foundation.test.ts src/lib/platform/smoke.test.ts`
- `npx.cmd prettier --write <touched files>`
- `npx.cmd prettier --write --ignore-unknown <touched files>`
- `npm.cmd --workspace apps/web run test -- src/lib/auth/auth-service.test.ts src/lib/projects/project-foundation.test.ts src/lib/guest-imports/guest-import-foundation.test.ts src/lib/platform/smoke.test.ts`
- `curl.exe -fsSL https://supabase.com/changelog.md`
- `npm.cmd ci`
- `npm.cmd run format:check`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run typecheck`
- `npm.cmd run build`
- `npm.cmd audit --omit=dev`
- `npm.cmd run db:lint`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `git diff --check`
- Targeted secret scan with `rg`
- `wsl.exe ... coderabbit review --agent --base main -c AGENTS.md`
- `wsl.exe ... coderabbit review --agent -t uncommitted -c AGENTS.md`
- `wsl.exe ... git config core.autocrlf true`
- `wsl.exe ... coderabbit doctor`
- `wsl.exe ... coderabbit update`
- `wsl.exe ... coderabbit review --agent --base main --dir apps/web/src/lib/auth -c AGENTS.md`
- `wsl.exe ... coderabbit review --agent --base main --dir supabase/migrations -c AGENTS.md`
- `gh pr checks 17`

## Checks Passed

- Focused tests passed: 3 files, 22 tests.
- Follow-up focused tests passed: 4 files, 35 tests.
- `npm ci` passed and installed 496 packages.
- `npm run format:check` passed.
- `npm run lint` passed.
- `npm run test` passed: 6 files, 56 tests.
- `npm run typecheck` passed.
- `npm run build` passed.
- `npm audit --omit=dev` passed with 0 vulnerabilities.
- `npm run db:lint` passed with no schema errors for `public` and `app_private`.
- `git diff --check` passed.
- Local CodeRabbit CLI review passed with 0 issues.
- Follow-up local CodeRabbit CLI review raised issues around import audit coverage, login action simplification, auth path traversal rejection, backlog artifact naming, project/event code generation loop bounds, and guest assignment validation SQLSTATEs. Valid issues were fixed in this branch.
- Scoped WSL CodeRabbit CLI review of `apps/web/src/lib/auth` raised double-encoded and backslash traversal issues; they were fixed and the scoped rerun completed with 0 findings.
- Scoped WSL CodeRabbit CLI review of `supabase/migrations` raised guest-assignment status/timestamp, project-code lookup, and explicit permission-check issues; valid issues were fixed and the scoped rerun completed with 0 findings.
- GitHub PR checks passed: `Verify` and `CodeRabbit`.

## Checks With Notes

- `npx supabase@latest db push --linked --dry-run` succeeded, but reported that the linked remote would still receive previously merged migrations:
  - `20260522211108_sprint_3_post_merge_hardening.sql`
  - `20260522221804_sprint_4_post_merge_hardening.sql`
  - `20260523063041_cross_sprint_integration_hardening.sql`
- Initial direct `npx prettier --write` over the SQL migration returned a parser inference error for `.sql`; rerunning with `--ignore-unknown` passed, and `npm run format:check` passed.
- Full-diff WSL CodeRabbit CLI retries against both `--base main` and `-t uncommitted` failed before returning findings with `Review failed: Unknown error` / `TRPCClientError`. `coderabbit doctor` passed, the CLI was already current at `0.5.2`, and setting WSL repo `core.autocrlf=true` fixed the Windows/WSL line-ending dirty-tree issue. Directory-scoped CodeRabbit runs are usable as a workaround; the auth-scoped review completed after the double-encoded traversal fix.

This review did not apply remote database migrations because the approved plan required a dry-run only. Before relying on the linked remote environment for manual QA, an operator should decide whether to apply those already-merged migrations with `npx supabase@latest db push --linked --yes`.

## Security Checks Performed

- Verified platform login redirect paths are encoded through a single helper and still normalize to internal paths only.
- Verified login redirects reject encoded control characters and path traversal segments.
- Verified public RSVP result redirects encode the guest token route segment.
- Verified public guest preview now performs an explicit server-side permission check before loading preview data.
- Verified later-sprint navigation links are hidden unless server-checked project permissions allow the destination feature.
- Verified Sprint 4 import audit action names match database-triggered action names.
- Verified Supabase functions added in this pass remain in the private schema where applicable and do not introduce new public tables.
- Ran targeted secret scan for service-role keys, database passwords, WhatsApp tokens, Google secrets, private keys, OpenAI-style keys, and real client/guest data.
- Secret scan found only the expected placeholder `.env.example` `DATABASE_URL`; no real secrets or client/guest records were found.

## Assumptions

- This review is a post-merge hardening pass against current `main`, not a rewrite of any previous sprint PR.
- Existing Sprint 1-5 product behavior remains the source of truth.
- Remote database mutation is outside this review unless explicitly requested.
- Active sprint metadata in `AGENTS.md` and `README.md` remains Sprint 6 because it is factually current and not part of this integration PR.
- TD-001 remains open and tracked because the Next.js canary dependency is not a cross-sprint blocker.

## Open Issues Or Blockers

- The linked Supabase remote reports previously merged Sprint 3 and Sprint 4 hardening migrations as pending during dry-run. This is an operational deployment blocker for linked-remote QA, not a repository build blocker.
- Full-diff local CodeRabbit CLI review from WSL is blocked by a non-recoverable `TRPCClientError`. Directory-scoped local reviews work after aligning WSL Git line-ending config, and the PR can still be reviewed by the GitHub CodeRabbit check after push.

## Recommended Sprint 6 Readiness Notes

- Apply or intentionally defer the pending linked Supabase migrations before manual QA on the linked project.
- Keep invitation/PDF/QR work separated from existing public guest tokens and future check-in tokens.
- Reuse `buildLoginRedirectPath()` for any new authenticated Sprint 6 routes.
- Extend `AuditAction` and database audit triggers together whenever Sprint 6 adds invitation/template actions.
- Keep guest-facing download placeholders permission-gated until real file storage and invitation generation are implemented.
