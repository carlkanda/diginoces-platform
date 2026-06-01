# Sprint 13 Completion Report - Partner / External Provider Model

## Summary

Sprint 13 implemented, reviewed, merged, and applied the partner/external-provider foundation for issue `#29` on branch `codex/sprint-13-partner-provider-model`.

The implementation is limited to partner profiles, partner user linkage, lifecycle status, partner-originated project draft/submission/review flow, project source tracking, restricted partner dashboard visibility, partner-visible project comments, backend permission checks, RLS/RPC foundations, audit hooks, UI routes, documentation, and tests.

The sprint does not implement partner commission management, referral-fee calculation, partner billing, white-label SaaS, partner-controlled pricing, partner-controlled contracts, partner payment exception approval, public partner marketplace, partner payouts, Sprint 14 file-retention/archive scope, or later-sprint product scope.

## Traceability

- GitHub issue: `#29` - Sprint 13 - Partner / External Provider Model.
- Branch: `codex/sprint-13-partner-provider-model`.
- Pull request: `#40` - Sprint 13 - Partner / External Provider Model - https://github.com/carlkanda/diginoces-platform/pull/40.
- Merge commit: `a7a867824de660763a7d9152b962d59f00ced416`.
- Sprint plan: `docs/planning/sprint-13-plan.md`.
- Product source: `docs/product/12-partner-external-provider-model.md`.

## Requirements Covered

- `PART-001`: Partner profiles represent external planners/providers operating under Diginoces brand, pricing, and controls.
- `PART-002`: Partner profiles include contact details, lifecycle status, internal-only notes, and partner user linkage.
- `PART-003`: Active partner users can create project drafts and submit them for Diginoces/admin review.
- `PART-004`: Partner-created projects remain draft/submitted until Diginoces/admin approval.
- `PART-005`, `PAY-015`, `PV-003`: Partner roles and dashboards exclude pricing, revenue, payment details, payment exceptions, internal notes, and audit logs.
- `PART-006`: Project comment foundation supports partner-visible comments while keeping internal-only comments separate.
- `PART-007`: Partner source tracking records projects brought by partners without commission/referral-fee management.
- `ROLE-001`, `ROLE-004`, `TECH-004`: Custom partner role scope, project-scoped partner operator role, backend permission checks, RLS, and RPCs enforce partner access.
- `REP-004`: Restricted partner dashboard shows originated or assigned project status without sensitive commercial data.
- `REP-006`: Partner profile, user, submission, source, assignment, and comment actions are audited with redacted snapshots.

## Backlog Items Covered

- Epic: `EPIC-PART`.
- CSV feature rows present in the backlog snapshot: `FEAT-PART-001`, `FEAT-PART-002`.
- Sprint plan conceptual features covered: partner account/profile, partner status/access controls, partner-created project workflow, Diginoces/admin review, project source tracking, partner assignment foundation, partner dashboard restrictions, project comments, and revenue/payment visibility restrictions.
- Note: the Sprint 13 plan lists conceptual `FEAT-PART-003` through `FEAT-PART-009`, but the current CSV backlog snapshot only contains `FEAT-PART-001` and `FEAT-PART-002`. This report records the actual CSV IDs and the plan-level feature breakdown.

## Files Created Or Changed

- `supabase/migrations/20260531224203_sprint_13_partner_provider_model.sql`
- `supabase/migrations/20260601101836_sprint_13_project_comment_lint_fix.sql`
- `apps/web/src/lib/partners/partner-service.ts`
- `apps/web/src/lib/partners/partner-db.ts`
- `apps/web/src/lib/partners/partner-api.ts`
- `apps/web/src/lib/partners/partner-foundation.test.ts`
- `apps/web/src/lib/security/permissions.ts`
- `apps/web/src/lib/projects/project-permissions.ts`
- `apps/web/src/app/api/partners/route.ts`
- `apps/web/src/app/api/partners/[partnerId]/route.ts`
- `apps/web/src/app/api/partners/[partnerId]/users/route.ts`
- `apps/web/src/app/api/partners/[partnerId]/projects/route.ts`
- `apps/web/src/app/api/partner-project-submissions/[submissionId]/submit/route.ts`
- `apps/web/src/app/api/partner-project-submissions/[submissionId]/review/route.ts`
- `apps/web/src/app/api/projects/[projectId]/comments/route.ts`
- `apps/web/src/app/platform/partners/page.tsx`
- `apps/web/src/app/platform/partners/[partnerId]/page.tsx`
- `apps/web/src/app/platform/partners/review/page.tsx`
- `apps/web/src/app/platform/partners/actions.ts`
- `apps/web/src/app/platform/partner-dashboard/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/comments/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/page.tsx`
- `apps/web/src/app/platform/page.tsx`
- `apps/web/src/app/api/health/route.ts`
- `apps/web/src/app/page.tsx`
- `docs/setup/local-development.md`
- `docs/planning/sprint-13-completion-report.md`

## Database And Security Notes

- Added partner enums for partner status, partner user role/status, project submission status, project source type, approval status, assignment status, comment visibility, and comment actor type.
- Added `partners`, `partner_users`, `partner_project_sources`, `partner_project_submissions`, `partner_project_assignments`, and `project_comments`.
- Added partner access helpers in `app_private` and a public `current_user_can_access_partner` RPC.
- Added permission-gated RPCs for partner user linkage, partner project draft creation, submission, review, and project comment creation.
- Added RLS, grants, indexes, updated-at triggers, and audit triggers for partner-owned tables.
- Hosted CodeRabbit review hardening tightened:
  - partner dashboard partner selection;
  - partner submit/comment UI authorization;
  - server-action permission checks;
  - partner-user least-privilege defaults;
  - partner-scoped permission parity;
  - partner submission/comment raw-write controls;
  - active partner-link checks;
  - author classification;
  - source-note provenance preservation.
- Hosted CodeRabbit rerun hardening tightened:
  - malformed project-comment JSON handling returns the existing invalid-request path;
  - partner dashboard login redirects preserve explicit `partnerId` deep links;
  - partner-user downgrades revoke stale custom-scope `partner_admin` assignments whenever the final role is `member`, and omitted SQL roles default to `member`.
- Partner audit snapshots redact contact details, internal notes, partner notes, review reasons, and sensitive contact fields.
- Partner roles do not receive pricing, revenue, payment, payment-exception, contract-management, internal-note, or audit-log permissions.
- Post-merge linked dev database application exposed a Supabase lint warning for `create_project_comment`; follow-up migration `20260601101836_sprint_13_project_comment_lint_fix.sql` recreates the function with explicit `project_comment_actor_type` enum casts and preserves the same execute grants.

## Tests Added

- `apps/web/src/lib/partners/partner-foundation.test.ts`
  - Partner profile creation and user linkage.
  - Active partner project draft creation/submission without couple access.
  - Suspended partner creation block.
  - Diginoces/admin approve/reject/request-changes review behavior.
  - Partner permission and commercial restriction behavior.
  - Restricted partner dashboard redaction of revenue/payment/internal/audit data.
  - Partner-visible comments separated from internal notes.
  - Partner user linkage defaults to member unless admin is explicitly selected.
  - Partner-scoped dashboard/comment permissions remain available for partner-originated projects.
  - Hosted CodeRabbit regression checks for dashboard partner selection, partner assignment dashboard coverage, event date loading, restricted raw table grants, source-note preservation, and server-action permission gates.
  - Hosted CodeRabbit rerun regression checks for malformed project-comment JSON handling, dashboard login redirect partner preservation, and partner-admin role assignment revocation on downgrade.
  - Partner audit actions without commission/referral/payout/billing scope.
  - Migration, health endpoint, home page, local setup docs, and completion-report evidence.

## Commands Run

- `npx.cmd supabase@latest migration new sprint_13_partner_provider_model` - created `20260531224203_sprint_13_partner_provider_model.sql`.
- `npm.cmd run test -- --run src/lib/partners/partner-foundation.test.ts` - expected red run failed while Sprint 13 health/home/setup/report wiring was missing.
- `npm.cmd run test -- --run src/lib/partners/partner-foundation.test.ts` - expected red run failed while shared audit summary did not yet include Sprint 13 partner audit domains.
- `npm.cmd run test -- --run src/lib/partners/partner-foundation.test.ts` - passed after Sprint 13 implementation and audit-summary fixes, 9 tests.
- `npm.cmd run format` - passed and formatted the web workspace.
- `npm.cmd run format:check` - passed.
- `npm.cmd ci` - passed, installed 496 packages and reported 0 vulnerabilities.
- `npm.cmd run lint` - passed after rerun following `npm ci`.
- `npm.cmd run typecheck` - passed after rerun following `npm ci`.
- `npm.cmd run test` - passed before hosted review, 14 test files and 140 tests.
- `npm.cmd run build` - passed; Next.js build listed the new partner API/UI routes.
- `npm.cmd audit --omit=dev` - passed, 0 vulnerabilities.
- `npm.cmd run db:lint` - passed against linked `public` and `app_private` schemas, no schema errors found.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed; dry run would push only `20260531224203_sprint_13_partner_provider_model.sql`.
- `git diff --check` - passed; only repository LF/CRLF warnings were printed.
- Targeted secret scan with `rg` - passed for real secrets. The only match was the placeholder `DATABASE_URL=postgresql://postgres:placeholder@localhost:54322/postgres` in `.env.example`.
- Hosted CodeRabbit review on PR #40 - changes requested with 14 actionable comments.
- `npm.cmd run test -- --run src/lib/partners/partner-foundation.test.ts` - passed after hosted CodeRabbit fixes, 12 tests.
- `npm.cmd run lint` - passed after hosted CodeRabbit fixes.
- `npm.cmd run typecheck` - passed after hosted CodeRabbit fixes.
- `npm.cmd run db:lint` - passed after hosted CodeRabbit fixes against linked `public` and `app_private` schemas, no schema errors found.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed after hosted CodeRabbit fixes; dry run would push only `20260531224203_sprint_13_partner_provider_model.sql`.
- Local CodeRabbit review from WSL (`coderabbit review --agent -t uncommitted -c AGENTS.md`) - rerun until clean; final run returned 0 findings.
- `npm.cmd ci` - passed after review fixes, installed 496 packages and reported 0 vulnerabilities.
- `npm.cmd run format:check` - passed after review fixes.
- `npm.cmd run lint` - passed after review fixes.
- `npm.cmd run typecheck` - passed after review fixes.
- `npm.cmd run test` - passed after review fixes, 14 test files and 143 tests.
- `npm.cmd run build` - passed after review fixes; Next.js build listed the partner dashboard, partner profile, review, and project comments routes.
- `npm.cmd audit --omit=dev` - passed after review fixes, 0 vulnerabilities.
- `npm.cmd run db:lint` - passed after review fixes against linked `public` and `app_private` schemas, no schema errors found.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed after review fixes; dry run would push only `20260531224203_sprint_13_partner_provider_model.sql`.
- `git diff --check` - passed after review fixes; only repository LF/CRLF warnings were printed.
- Targeted secret scan with `rg` - passed after review fixes with no matches.
- Hosted CodeRabbit rerun on PR #40 - changes requested with 3 actionable comments.
- `npm.cmd run test -- --run src/lib/partners/partner-foundation.test.ts` - passed after hosted rerun fixes, 12 tests.
- `npm.cmd ci` - passed after hosted rerun fixes, installed 496 packages and reported 0 vulnerabilities.
- `npm.cmd run format:check` - initially failed after hosted rerun fixes because `partner-foundation.test.ts` needed Prettier formatting.
- `npm.cmd run format` - passed and formatted `partner-foundation.test.ts`.
- `npm.cmd run format:check` - passed after formatting.
- `npm.cmd run lint` - passed after hosted rerun fixes.
- `npm.cmd run typecheck` - passed after hosted rerun fixes.
- `npm.cmd run test` - passed after hosted rerun fixes, 14 test files and 143 tests.
- `npm.cmd run build` - passed after hosted rerun fixes; Next.js build listed the partner dashboard, partner profile, review, and project comments routes.
- `npm.cmd audit --omit=dev` - passed after hosted rerun fixes, 0 vulnerabilities.
- `npm.cmd run db:lint` - passed after hosted rerun fixes against linked `public` and `app_private` schemas, no schema errors found.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed after hosted rerun fixes; dry run would push only `20260531224203_sprint_13_partner_provider_model.sql`.
- `git diff --check` - passed after hosted rerun fixes; only repository LF/CRLF warnings were printed.
- Targeted secret scan with `rg` - passed after hosted rerun fixes with no credential matches. A broader policy-text scan matched documentation references to banned secrets only.
- Local CodeRabbit review from WSL (`coderabbit review --agent -t uncommitted -c AGENTS.md`) - passed after hosted rerun fixes with 0 findings.
- Hosted CodeRabbit review on commit `140f3a0` - completed with 1 additional non-blocking actionable comment to key partner-admin grant cleanup off the final `member` role state instead of the previous row state.
- `npm.cmd run test -- --run src/lib/partners/partner-foundation.test.ts` - passed after final hosted CodeRabbit cleanup, 12 tests.
- `npm.cmd run format:check` - passed after final hosted CodeRabbit cleanup.
- `npm.cmd run lint` - passed after final hosted CodeRabbit cleanup.
- `npm.cmd run typecheck` - passed after final hosted CodeRabbit cleanup.
- `npm.cmd run test` - passed after final hosted CodeRabbit cleanup, 14 test files and 143 tests.
- `npm.cmd audit --omit=dev` - passed after final hosted CodeRabbit cleanup, 0 vulnerabilities.
- `npm.cmd run build` - passed after final hosted CodeRabbit cleanup; Next.js build listed the partner dashboard, partner profile, review, and project comments routes.
- `npm.cmd run db:lint` - passed after final hosted CodeRabbit cleanup against linked `public` and `app_private` schemas, no schema errors found.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed after final hosted CodeRabbit cleanup; dry run would push only `20260531224203_sprint_13_partner_provider_model.sql`.
- Local CodeRabbit review from WSL (`coderabbit review --agent -t uncommitted -c AGENTS.md`) - passed after final hosted CodeRabbit cleanup with 0 findings.
- `gh pr merge 40 --squash --subject "Sprint 13 — Partner / External Provider Model (#40)"` - passed; PR `#40` merged into `main`.
- `git switch main` - passed; local checkout switched to `main`.
- `git pull` - passed; local `main` fast-forwarded to merge commit `a7a867824de660763a7d9152b962d59f00ced416`.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed after merge; dry run would push `20260531224203_sprint_13_partner_provider_model.sql`.
- `npx.cmd supabase@latest db push --linked --yes` - passed; applied `20260531224203_sprint_13_partner_provider_model.sql` to the linked dev project.
- `npx.cmd supabase@latest migration new sprint_13_project_comment_lint_fix` - passed; created `20260601101836_sprint_13_project_comment_lint_fix.sql`.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed after the lint-fix migration was added; dry run would push only `20260601101836_sprint_13_project_comment_lint_fix.sql`.
- `npx.cmd supabase@latest db push --linked --yes` - passed; applied `20260601101836_sprint_13_project_comment_lint_fix.sql` to the linked dev project.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed after applying the lint-fix migration; remote database is up to date.
- `npm.cmd run db:lint` - passed after the lint-fix migration; no schema errors found.

## Checks Passed Or Failed

- Passed: install, format check, lint, typecheck, tests, build, dependency audit, Supabase linked dry-run, Supabase linked dev DB migration application, Supabase linked db lint, whitespace check, and targeted secret scan.
- Failed: one transient lint/typecheck run started in parallel with `npm ci` and failed because local binaries were temporarily unavailable while `node_modules` was being rebuilt. Both commands passed when rerun after `npm ci`.
- Failed and fixed: one hosted-rerun `format:check` run reported Prettier formatting needed in `partner-foundation.test.ts`. `npm.cmd run format` fixed it and the follow-up `format:check` passed.
- Post-review verification and local CodeRabbit reruns are documented above; no local review-loop blocker remains.

## Assumptions

- Partner project creation in Sprint 13 creates a controlled Diginoces project draft and partner submission record, not a partner-owned commercial flow.
- Partner project draft editing is intentionally not exposed in Sprint 13. Partners supply draft details at creation and can submit or respond to Diginoces review outcomes; a dedicated draft-update RPC/UI can be considered in a later sprint if partner self-editing is approved.
- Couple access remains closed until Diginoces/admin approval and existing contract/payment gates.
- Partner comments are text-only project comments. Full CRM/lead-pipeline behavior remains outside Sprint 13.
- Generated Supabase TypeScript types were not refreshed as part of the post-merge metadata/lint-fix commit because the project does not yet use a tracked generated-type refresh workflow.

## Open Issues Or Blockers

- None remain for Sprint 13. PR `#40` is merged, the linked dev database is up to date, and Sprint 14 metadata is prepared in `AGENTS.md` and `README.md`.

## Out Of Scope Intentionally Deferred

- Partner commission management.
- Referral-fee calculation.
- Partner billing and payouts.
- White-label SaaS or tenant branding.
- Partner-controlled pricing, packages, contracts, discounts, or payment exceptions.
- Public partner marketplace.
- Partner API access.
- Sprint 14 file/storage/retention/archive work.

## Recommended Sprint 14 Scope

Sprint 14 should focus on files, storage, retention, archive workflows, generated file cleanup, secure download/review behavior, project archive lifecycle, file/export version hardening, and retention notices. It should not add partner billing, partner white-labeling, AI assistance, or advanced integrations unless the roadmap changes.
