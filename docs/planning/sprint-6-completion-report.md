# Sprint 6 - Invitation Template & PDF Generation Completion Report

## Status

Implemented for issue #12 and ready for draft PR review: Sprint 6 - Invitation Template & PDF Generation.

## Requirements Covered

- INV-001 through INV-015: event template registration, dynamic fields, coordinate editor foundation, technical preview, preview approval, invitation records, file version metadata, guest public page QR/link field foundation, generation validation, batch job foundation, PDF worker abstraction, long-name fitting, permissions, and audit logging.
- FILE-001, FILE-004, FILE-005, FILE-006, FILE-009: app-owned file metadata and versioning foundations for invitation template PDFs and generated invitation PDFs.
- ROLE-001, ROLE-007, REP-006, RSVP-001, TECH-006, TECH-010: backend permissions, audit trails, public guest page token usage, PDF worker abstraction, and secure token separation.

Backlog scope: EPIC-INV, FEAT-INV-001, FEAT-INV-002, FEAT-INV-003, FEAT-INV-004, STORY-INV-001 through STORY-INV-004, TASK-INV-001 through TASK-INV-003, TEST-INV-001 through TEST-INV-004.

## Files Created Or Changed

- `apps/web/src/lib/invitations/invitation-service.ts`
- `apps/web/src/lib/invitations/invitation-db.ts`
- `apps/web/src/lib/invitations/invitation-api.ts`
- `apps/web/src/lib/invitations/invitation-foundation.test.ts`
- `apps/web/src/app/api/events/[eventId]/invitation-templates/route.ts`
- `apps/web/src/app/api/invitation-templates/[templateId]/fields/route.ts`
- `apps/web/src/app/api/invitation-templates/[templateId]/preview/route.ts`
- `apps/web/src/app/api/invitation-templates/[templateId]/approve/route.ts`
- `apps/web/src/app/api/invitation-templates/[templateId]/generate/route.ts`
- `apps/web/src/app/platform/events/[eventId]/invitations/actions.ts`
- `apps/web/src/app/platform/events/[eventId]/invitations/page.tsx`
- `apps/web/src/app/platform/events/[eventId]/invitations/new/page.tsx`
- `apps/web/src/app/platform/events/[eventId]/invitations/[templateId]/page.tsx`
- `apps/web/src/app/platform/events/[eventId]/page.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/api/health/route.ts`
- `apps/web/src/app/globals.css`
- `apps/web/src/lib/audit/audit-log.ts`
- `apps/web/src/lib/security/permissions.ts`
- `apps/web/src/lib/storage/storage-provider.ts`
- `apps/web/src/types/database.ts`
- `docs/setup/local-development.md`
- `supabase/migrations/20260523120452_sprint_6_invitation_template_pdf_generation.sql`
- `docs/planning/sprint-6-completion-report.md`

Unrelated local files left unstaged and unmodified by this report: `apps/web/AGENTS.md` and `apps/web/CLAUDE.md`.

## Tests Added

- `apps/web/src/lib/invitations/invitation-foundation.test.ts`

Coverage includes:

- Canva-exported PDF metadata validation and file-size/type rejection;
- coordinate field configuration validation;
- preview generation/approval rules;
- public guest page QR/link token separation from future check-in token scope;
- generation readiness validation;
- batch generation eligibility for event-assigned ready guests only;
- generated invitation file versioning;
- long-name text fitting;
- invitation permission gating;
- audit action representation;
- migration/RLS/permission/report evidence.

## Commands Run

- `npm.cmd --workspace apps/web run test -- src/lib/invitations/invitation-foundation.test.ts` - red state verified before implementation.
- `npx.cmd supabase@latest migration new sprint_6_invitation_template_pdf_generation` - created the Sprint 6 migration.
- `npm.cmd --workspace apps/web run test -- src/lib/invitations/invitation-foundation.test.ts`
- `npm.cmd ci`
- `npm.cmd run format:check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run test`
- `npm.cmd run build`
- `npm.cmd audit --omit=dev`
- `npm.cmd run db:lint`
- `npx.cmd supabase@latest db push --linked --dry-run`
- `git diff --check`
- targeted secret scan with `rg`
- `coderabbit review --agent --base main -c AGENTS.md` from WSL
- post-CodeRabbit reruns: `npm run lint`, `npm run typecheck`, targeted Sprint 6 test, `npm run db:lint`, and linked Supabase dry-run
- second `coderabbit review --agent --base main -c AGENTS.md` from WSL
- second post-CodeRabbit reruns: `npm run lint`, `npm run typecheck`, targeted Sprint 6 test, `npm run db:lint`, and linked Supabase dry-run
- third `coderabbit review --agent --base main -c AGENTS.md` from WSL
- third post-CodeRabbit reruns: `npm run lint`, `npm run typecheck`, targeted Sprint 6 test, `npm run db:lint`, and linked Supabase dry-run
- fourth `coderabbit review --agent --base main -c AGENTS.md` from WSL
- fourth post-CodeRabbit reruns: `npm ci`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm audit --omit=dev`, `npm run db:lint`, linked Supabase dry-run, `git diff --check`, and targeted secret scan
- fifth `coderabbit review --agent --base main -c AGENTS.md` from WSL
- fifth post-CodeRabbit reruns: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm audit --omit=dev`, `npm run db:lint`, linked Supabase dry-run, `git diff --check`, and targeted secret scan

## Checks Passed Or Failed

- `npm ci`: passed, 496 packages installed, 0 vulnerabilities reported by install audit.
- `npm run format:check`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: passed, 7 files and 70 tests.
- `npm run build`: passed; build includes Sprint 6 API and platform invitation routes.
- `npm audit --omit=dev`: passed, 0 vulnerabilities.
- `npm run db:lint`: passed, no schema errors found on linked public/app_private schemas.
- `npx supabase@latest db push --linked --dry-run`: passed; dry run reports one pending migration, `20260523120452_sprint_6_invitation_template_pdf_generation.sql`.
- `git diff --check`: passed; only line-ending warnings were reported for touched text files.
- Targeted secret scan: no real secrets found. The scan matched only `.env.example` placeholder `DATABASE_URL` and package-lock integrity hashes in the broader pass.
- Local CodeRabbit CLI review: raised 11 issues. All valid fixes were applied, including template/event binding checks for server actions, zero coordinate support, atomic template field saving through an RPC, stricter API fields payload validation, centralized PDF engine metadata, and invitation file update audit coverage.
- Local CodeRabbit CLI rerun: raised 5 issues. All valid fixes were applied, including stricter generation mode validation, platform-neutral repo-root test helpers, reduced duplicate server-action permission checks, simpler preview route error handling, and set-based batch generation SQL.
- Third local CodeRabbit CLI rerun: raised 11 issues. Valid fixes were applied, including file-scope enum constants sync, strict `guestIds` validation, font-family UI input support, PDF upload MIME/header validation, RPC response validation, route catch cleanup, and safer preview permission/not-found behavior. The API-layer audit suggestion was reviewed and skipped because preview generation is already persisted by the database audit trigger on the template status transition.
- Fourth local CodeRabbit CLI rerun: raised 10 issues. Valid fixes were applied, including form-control consistency, operations manager requirement traceability, typed default field alignment, server-side upload size and coordinate validation, consistent preview route authorization errors, template-detail pagination defaults, fields parsing helper, and event-assignment validation in the PDF worker abstraction.
- Fifth local CodeRabbit CLI rerun: raised 7 low-severity issues. Valid fixes were applied, including fuller operations manager requirement traceability, form CSS consolidation/comments, template upload metadata-only documentation, binary-search text fitting, text-width heuristic documentation, and structured invitation API error logging.

## Security Checks Performed

Implemented security controls include:

- backend permission checks for template read/create/update/approval and invitation read/generate operations;
- RLS policies on Sprint 6 tables;
- audit triggers for template, preview, generation job, invitation, and file-version actions;
- source filename, storage path, checksum, and error message redaction from invitation audit snapshots;
- public guest page token usage remains separate from future `check_in` token scope.
- template preview, approval, and generation server actions re-check that the template belongs to the current event before mutating it.
- template field replacement is atomic through the `save_invitation_template_fields` RPC.
- invitation generation job enqueueing uses set-based inserts/upserts instead of row-by-row loops.
- server action PDF uploads validate MIME type or `%PDF` magic bytes before registration.
- server action field coordinates are bounded before reaching the service layer.

## Assumptions Made

- Sprint 6 can use a tested PDF worker abstraction instead of production-grade PDF rendering.
- Canva integration means Canva-exported PDF registration in this sprint, not Canva API integration.
- Source-file byte persistence remains behind the existing storage abstraction; this sprint records metadata and app-owned storage paths.
- Public guest page QR/link dynamic fields use Sprint 5 guest public page tokens; future check-in token generation remains out of scope.

## Open Issues Or Blockers

- No blocker remains for Sprint 6 review.
- Full production PDF composition, source-file byte persistence, rendered QR images, and invitation sending are not completed in Sprint 6. The sprint implements a tested PDF worker abstraction, metadata/version foundations, and public guest page QR/link dynamic field foundations.

## Recommended Sprint 7 Scope

- WhatsApp communication workflow foundation.
- Invitation sending workflow that consumes generated invitation file records.
- Production PDF renderer/storage provider hardening if required before external pilot use.
