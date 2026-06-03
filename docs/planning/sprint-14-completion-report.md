# Sprint 14 Completion Report - Files, Storage, Retention & Archive

## Summary

Sprint 14 implements the files, storage, retention, and archive foundation for issue `#30` on branch `codex/sprint-14-files-storage-retention-archive`.

The implementation is limited to project/event/guest file metadata, categorized file library views, secure signed-download routing, file version/latest tracking, public guest file download checks, retention-policy metadata, project archive lifecycle foundation, file archive/soft-delete foundation, backend permissions, RLS/RPC/storage policy foundations, audit hooks, UI routes, documentation, and tests.

The sprint does not implement advanced digital asset management, automated destructive deletion without admin review, direct Canva API integration, AI assistance, advanced integrations, production storage upload UX beyond provider-backed registration, or Sprint 15/later product scope.

## Traceability

- GitHub issue: `#30` - Sprint 14 - Files, Storage, Retention & Archive.
- Branch: `codex/sprint-14-files-storage-retention-archive`.
- Pull request: `#41` - https://github.com/carlkanda/diginoces-platform/pull/41. Merged to `main` on 2026-06-03; issue `#30` was closed by the merge.
- Sprint plan: `docs/planning/sprint-14-plan.md`.
- Prior sprint plan: `docs/planning/sprint-13-plan.md`.
- Product source: `docs/product/14-files-storage-retention-security.md`.
- Technical sources: `docs/technical-design/database-schema-core-entities.md`, `docs/technical-design/api-backend-service-design.md`, and `docs/technical-design/security-permissions-access-control.md`.

## Requirements Covered

- `FILE-001`: File registry foundation for project, event, guest, invitation, report/export, contract/payment, partner, and archive file categories.
- `FILE-002`: File category metadata and UI filtering.
- `FILE-003`: Validated file registration metadata, MIME/extension checks, unsafe filename rejection, and fail-closed storage provider behavior.
- `FILE-004`, `TECH-004`: Secure server-side signed-download routes, Supabase Storage bucket policies, RLS-backed registry checks, and guest-token-scoped public file downloads.
- `FILE-005`: File metadata, storage path, checksum, size, visibility, status, and category tracking.
- `FILE-006`: File version group, version number, latest-version invariant, and version creation foundation.
- `FILE-007`: Retention-policy metadata, project retention lifecycle fields, and one-year default retention helper.
- `FILE-008`: Project archive lifecycle events and file archive/soft-delete/revoke foundation without physical object deletion.
- `FILE-009`, `REP-006`: File access, archive, retention, and project archive audit logging with redacted sensitive storage metadata.
- `PV-006`, `REP-005`: Export/file metadata can be registered for generated project assets and surfaced in the project file library.
- `ROLE-001`, `ROLE-002`, `ROLE-003`, `ROLE-004`, `ROLE-009`: Role/permission foundation for file read/write/download/archive/version/retention actions.

## Backlog Items Covered

- Epic: `EPIC-FILE`.
- CSV feature rows present in the backlog snapshot: `FEAT-FILE-001`, `FEAT-FILE-002`.
- Sprint plan feature coverage: `FEAT-FILE-001` through `FEAT-FILE-010`.
- Story: `STORY-FILE-001`.
- Task: `TASK-FILE-001`.
- Test: `TEST-FILE-001`.
- Note: the Sprint 14 issue and plan list the full feature breakdown through `FEAT-FILE-010`; the current CSV backlog snapshot contains the file epic and the first file feature rows. This report records both the actual CSV rows and the plan-level feature coverage.

## Files Created Or Changed

- `supabase/migrations/20260601114646_sprint_14_files_storage_retention_archive.sql`
- `supabase/migrations/20260603034627_sprint_14_post_merge_db_lint_fix.sql`
- `apps/web/src/lib/files/file-service.ts`
- `apps/web/src/lib/files/file-form.ts`
- `apps/web/src/lib/files/file-db.ts`
- `apps/web/src/lib/files/file-api.ts`
- `apps/web/src/lib/files/file-foundation.test.ts`
- `apps/web/src/lib/dates/format-date.ts`
- `apps/web/src/lib/security/permissions.ts`
- `apps/web/src/lib/audit/audit-log.ts`
- `apps/web/src/lib/storage/storage-provider.ts`
- `apps/web/src/lib/platform/smoke.test.ts`
- `apps/web/src/lib/partners/partner-foundation.test.ts`
- `apps/web/src/lib/projects/project-api.ts`
- `apps/web/src/lib/rsvp/public-guest-page-view.tsx`
- `apps/web/src/lib/rsvp/rsvp-service.ts`
- `apps/web/src/app/api/health/route.ts`
- `apps/web/src/app/api/projects/[projectId]/files/route.ts`
- `apps/web/src/app/api/projects/[projectId]/files/[fileId]/route.ts`
- `apps/web/src/app/api/projects/[projectId]/files/[fileId]/download/route.ts`
- `apps/web/src/app/api/projects/[projectId]/files/[fileId]/archive/route.ts`
- `apps/web/src/app/api/public/guest/[guestToken]/files/[fileId]/download/route.ts`
- `apps/web/src/app/platform/projects/[projectId]/files/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/files/[fileId]/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/files/actions.ts`
- `apps/web/src/app/platform/projects/[projectId]/files/retention-action-fields.tsx`
- `apps/web/src/app/platform/events/[eventId]/files/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/page.tsx`
- `apps/web/src/app/platform/events/[eventId]/page.tsx`
- `apps/web/src/app/g/[guestToken]/page.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/globals.css`
- `docs/setup/local-development.md`
- `docs/planning/sprint-14-completion-report.md`

## Database And Security Notes

- Added file enums for category, visibility, status, access action, archive action, retention status, retention notice status, project archive action, and download token status.
- Added `file_categories`, `file_access_events`, `file_retention_policies`, `project_archive_events`, `file_archive_events`, and `file_download_tokens`.
- Expanded existing `public.files` with project/event/guest/invitation associations, storage metadata, version/latest fields, visibility/status, retention metadata, and archive/revoke metadata.
- Added project archive/retention columns to `wedding_projects`.
- Added private helpers for retention defaults, file access checks, batched project-permission checks, and audit snapshot redaction.
- Added permission-gated RPCs for file registration, version creation, file archive/soft-delete, project archive lifecycle, access-event recording, guest file download resolution, and guest file listing.
- Added RLS, grants, indexes, updated-at triggers, audit triggers, and private Supabase Storage buckets for `project-files`, `invitation-files`, and `archive-files`.
- Added category MIME validation, non-negative file-size checks, guarded public/authenticated signed URL generation, and admin-only soft-delete backstops in API/server actions and SQL.
- Added a post-merge corrective migration after linked `db:lint` found cross-sprint SQL issues. The migration keeps the canonical `guest_book_export` file category, updates the Sprint 12 guest-book export RPC to write the Sprint 14-required file metadata, and casts computed file scopes in `register_project_file`.
- Storage routes create short-lived Supabase signed URLs server-side after project/file or guest-token checks. Direct physical deletion of storage objects is intentionally not implemented.
- File audit snapshots redact storage paths, checksums, download-token hashes, denial details, signed-URL expiry metadata, and archive/retention free-text notes.

## UI And API Routes

- Project file library: `/platform/projects/{projectId}/files`.
- Project file detail/version/archive: `/platform/projects/{projectId}/files/{fileId}`.
- Event file list: `/platform/events/{eventId}/files`.
- Project file API: `/api/projects/{projectId}/files`.
- Project file detail API: `/api/projects/{projectId}/files/{fileId}`.
- Authenticated project file download: `/api/projects/{projectId}/files/{fileId}/download`.
- Authenticated project file archive: `/api/projects/{projectId}/files/{fileId}/archive`.
- Public guest file download: `/api/public/guest/{guestPublicToken}/files/{fileId}/download`.
- The home page and `/api/health` now include Sprint 14 status.
- Project, event, and public guest pages link to the new file surfaces where appropriate.

## Tests Added Or Updated

- `apps/web/src/lib/files/file-foundation.test.ts`
  - Documented file categories.
  - File upload metadata validation and unsafe filename rejection.
  - Zero-byte `File` placeholder metadata parsing and RPC forwarding.
  - Malformed file RPC response fail-fast behavior.
  - MIME/extension mismatch rejection.
  - Version/latest invariant.
  - Guest-token scoped latest active file download checks.
  - File permission helper behavior.
  - File download grant traceability for couple, bride, groom, and partner project operator roles.
  - One-year retention calculation.
  - Retention due status after an extended deadline expires.
  - Archive/soft-delete permission and reason checks.
  - Canva/export metadata redaction.
  - File audit action representation.
  - Migration evidence for enums, tables, RPCs, storage buckets, RLS helpers, and absence of physical storage deletion.
  - Post-merge database-lint fix coverage for `register_project_file` scope casting and `create_guest_book_export` compatibility with the Sprint 14 file registry.
  - Final full-suite status: 15 test files and 158 tests passing after the post-merge database-lint fix.
- `apps/web/src/lib/platform/smoke.test.ts`
  - Updated storage fail-closed smoke test to use the structured signed-read URL input.
- `apps/web/src/lib/partners/partner-foundation.test.ts`
  - Updated the Sprint 13 app-wiring assertion so later sprint home-page status changes do not break the Sprint 13 regression test.

## Commands Run

- `npx.cmd supabase@latest migration new sprint_14_files_storage_retention_archive` - passed; created `20260601114646_sprint_14_files_storage_retention_archive.sql`.
- `npm.cmd --workspace apps/web run test -- --run src/lib/files/file-foundation.test.ts` - expected red run failed while `@/lib/files/file-service` was not yet implemented.
- `npm.cmd --workspace apps/web run test -- --run src/lib/files/file-foundation.test.ts` - passed after file service implementation, 10 tests.
- `npm.cmd --workspace apps/web run typecheck` - initially failed because `smoke.test.ts` still used the old storage adapter string signature.
- `npm.cmd --workspace apps/web run typecheck` - passed after updating the storage smoke test.
- `npm.cmd --workspace apps/web run test -- --run src/lib/files/file-foundation.test.ts src/lib/platform/smoke.test.ts` - passed, 2 files and 16 tests.
- `npm.cmd run format:check` - initially failed because new and modified files needed Prettier formatting.
- `npm.cmd run lint` - passed with one warning for an unused server-action helper parameter.
- `npm.cmd run format` - passed and formatted the web workspace.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed; dry run would push only `20260601114646_sprint_14_files_storage_retention_archive.sql`.
- `npm.cmd run db:lint` - passed against linked `public` and `app_private` schemas, no schema errors found.
- `npm.cmd ci` - passed, installed 496 packages and reported 0 vulnerabilities.
- `npm.cmd run format:check` - passed after formatting.
- `npm.cmd run lint` - passed after removing the unused parameter.
- `npm.cmd run typecheck` - passed for web and database workspaces.
- `npm.cmd run test` - initially failed because the Sprint 13 home-page wiring regression expected the global status string to stop at Sprint 13.
- `npm.cmd run test` - passed after narrowing the Sprint 13 assertion, 15 test files and 153 tests.
- `npm.cmd run build` - passed; the Next.js build listed the new project/event/public file routes.
- `npm.cmd audit --omit=dev` - passed, 0 vulnerabilities.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed after final edits; dry run would push only `20260601114646_sprint_14_files_storage_retention_archive.sql`.
- `npm.cmd run db:lint` - passed after final edits, no schema errors found.
- `git diff --check` - passed; Git printed an LF/CRLF warning for `docs/setup/local-development.md`.
- Targeted secret scan with `rg` - no real credentials found. Matches were expected documentation/placeholders and SQL grants to the Postgres `service_role` role.
- `wsl.exe ... coderabbit review --agent -t uncommitted -c AGENTS.md` - ran multiple local CodeRabbit review loops from WSL. Actionable issues were patched for signed URL error handling, file visibility validation, MIME/category validation, read/download authorization, admin-only soft delete, audit-event resilience, retention edge cases, public download display consistency, and UI/API permission alignment.
- `npm.cmd run format` - passed after CodeRabbit-driven fixes.
- `npm.cmd run format:check` - passed after CodeRabbit-driven fixes.
- `npm.cmd run lint` - passed after CodeRabbit-driven fixes.
- `npm.cmd run typecheck` - passed after CodeRabbit-driven fixes.
- `npm.cmd run test` - passed after CodeRabbit-driven fixes, 15 test files and 157 tests.
- `npm.cmd run build` - passed after CodeRabbit-driven fixes.
- `npm.cmd audit --omit=dev` - passed after CodeRabbit-driven fixes, 0 vulnerabilities.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed after CodeRabbit-driven fixes; dry run would push only `20260601114646_sprint_14_files_storage_retention_archive.sql`.
- `npm.cmd run db:lint` - passed after CodeRabbit-driven fixes, no schema errors found.
- `git diff --check` - passed after CodeRabbit-driven fixes; Git printed LF/CRLF warnings only.
- Targeted secret scan with `rg` - passed after CodeRabbit-driven fixes, no matches for real secrets or private client/guest data.
- Hosted CodeRabbit review on PR `#41` - changes requested with 8 comments. Fixed explicit archive action validation, unreachable GET JSON handling, zero-byte `File` metadata handling, malformed RPC response guards, previous-version deactivation, authenticated-only access-event RPC execution, guest-visible category validation, and required retention extension dates.
- Local WSL CodeRabbit full uncommitted review - blocked by `TRPCClientError`; scoped reviews were used as the repository-documented workaround.
- `wsl.exe ... coderabbit review --agent -t uncommitted --dir apps/web/src/lib/files -c AGENTS.md` - passed after local review fixes, 0 issues.
- `wsl.exe ... coderabbit review --agent -t uncommitted --dir apps/web/src/app/api -c AGENTS.md` - passed, 0 issues.
- `wsl.exe ... coderabbit review --agent -t uncommitted --dir apps/web/src/app/platform/projects/[projectId]/files ...` - passed after adding zero-byte placeholder tests, 0 issues.
- `wsl.exe ... coderabbit review --agent -t uncommitted --dir supabase/migrations -c AGENTS.md` - passed after splitting category lookup and MIME validation, 0 issues.
- `npm.cmd --workspace apps/web run test -- src/lib/files/file-foundation.test.ts` - passed after hosted/local review fixes, 14 tests.
- `gh pr merge 41 --squash --delete-branch --subject "Sprint 14 — Files, Storage, Retention & Archive" --body "Closes #30"` - passed; PR `#41` merged and issue `#30` closed.
- `npx.cmd supabase@latest db push --linked --yes` - passed after merge; applied `20260601114646_sprint_14_files_storage_retention_archive.sql` to the linked dev database.
- `npm.cmd run db:lint` - initially failed after applying the Sprint 14 migration. Linked schema lint found stale SQL in `public.create_guest_book_export` using the old `guest_book_exports` category and a missing `public.file_scope_type` cast in `public.register_project_file`.
- `npx.cmd supabase@latest migration new sprint_14_post_merge_db_lint_fix` - passed; created `20260603034627_sprint_14_post_merge_db_lint_fix.sql`.
- `npm.cmd --workspace apps/web run test -- src/lib/files/file-foundation.test.ts` - passed after adding the post-merge database-lint regression guard, 15 tests.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed; dry run showed only `20260603034627_sprint_14_post_merge_db_lint_fix.sql` pending.
- `npx.cmd supabase@latest db push --linked --yes` - passed; applied `20260603034627_sprint_14_post_merge_db_lint_fix.sql` to the linked dev database.
- `npm.cmd run db:lint` - passed after the corrective migration, no schema errors found.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed after the corrective migration, remote database is up to date.
- `npm.cmd run format` - passed after the post-merge report, metadata, and test updates.
- `npm.cmd run format:check` - passed after the post-merge updates.
- `npm.cmd run lint` - passed after the post-merge updates.
- `npm.cmd run typecheck` - passed after the post-merge updates.
- `npm.cmd run test` - passed after the post-merge updates, 15 test files and 158 tests.
- `npm.cmd run build` - passed after the post-merge updates.
- `npm.cmd audit --omit=dev` - passed after the post-merge updates, 0 vulnerabilities.
- `npm.cmd run db:lint` - passed after the post-merge updates, no schema errors found.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed after the post-merge updates, remote database is up to date.
- `git diff --check` - passed after the post-merge updates; Git printed LF/CRLF warnings only.
- Targeted secret scan with `rg` - broad scan found only expected documentation warnings and SQL grants to the Postgres `service_role` role, not real secrets or private data.

## Checks Passed Or Failed

- Passed: install, format check, lint, typecheck, tests, build, dependency audit, linked Supabase dry-run, linked Supabase schema lint, whitespace check, targeted secret scan, and local WSL CodeRabbit review loops with actionable findings addressed.
- Failed and fixed: initial file-foundation test red run, storage smoke-test typecheck, Prettier formatting, one lint warning, one stale Sprint 13 home-page assertion, and the post-merge linked `db:lint` findings for guest-book export file-category compatibility and `register_project_file` scope casting.
- Post-merge database state: the Sprint 14 migration and the corrective post-merge lint-fix migration were applied to the linked dev database; linked dry-run now reports the remote database is up to date and `db:lint` reports no schema errors. Final post-merge verification also passed format check, lint, typecheck, full tests, build, dependency audit, whitespace check, and targeted secret scan.

## Security Checks Performed

- Confirmed no `.env` or `.env.local` was added.
- Confirmed no Supabase service-role key, database password, WhatsApp token, Google secret, private key, API secret, real client data, real couple data, or real guest data was added.
- File registration rejects unsafe filenames, service-role/private-key-looking filenames, script/executable extensions, unsupported extensions, MIME/extension mismatches, negative-size files, and files larger than 50 MB. Zero-byte metadata is allowed for valid placeholder/provider-backed records.
- Storage access remains server-mediated through RLS/RPC checks and signed URL generation.
- Public guest downloads are scoped to the hashed public guest token and the target guest record, and only latest active guest-facing files can resolve.
- File archive and retention actions require backend permissions and audit events.

## Assumptions

- Sprint 14 stores and governs file metadata plus storage paths. Full browser-to-storage upload UX and production storage provider hardening can be extended later without changing the registry/security model.
- The linked Supabase project is the dev project. The Sprint 14 migration was applied after PR merge, then a corrective lint-fix migration was applied after linked `db:lint` exposed cross-sprint SQL compatibility issues.
- Guest-facing files are only downloadable when registered as latest, active, guest-visible files bound to the resolved public guest token.
- Automated destructive deletion is intentionally excluded; archive/soft-delete metadata and review flows are the approved Sprint 14 behavior.
- Supabase Storage buckets remain private, and signed URLs are created only after server-side access checks.

## Open Issues Or Blockers

- No Sprint 14 merge or linked-database blocker remains. The linked dev database is up to date and `db:lint` reports no schema errors after the post-merge corrective migration.
- Direct object upload UX is still provider-backed/foundation-only. Sprint 14 registers metadata and paths, but does not implement a complete browser upload workflow.

## Out Of Scope Intentionally Deferred

- Advanced digital asset management.
- Automated destructive storage deletion without admin review.
- Direct Canva API integration.
- AI assistance.
- Advanced external integrations.
- White-label SaaS.
- Partner commission management, partner billing, and partner-controlled commercial flows.
- Sprint 15 or later product scope.

## Recommended Sprint 15 Scope

Sprint 15 should focus on the roadmap’s next approved scope and can build on the Sprint 14 file registry for generated assets, downloads, and retention evidence. It should not add automated file destruction, advanced asset-management workflows, or production third-party integrations unless those are explicitly added to the Sprint 15 issue and plan.
