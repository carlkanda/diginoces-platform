# Sprint 15 Completion Report - Release Hardening, QA & MVP Launch

## Sprint Status

Status: Merged into `main` through PR `#42`; post-merge linked dev migration applied and verified.

GitHub issue: `#31` - Sprint 15 - Release Hardening, QA & MVP Launch; sprint plan `docs/planning/sprint-15-plan.md`.

## MVP Launch Recommendation

Recommendation: `conditional_go`.

The platform is ready for controlled staging QA after the Sprint 15 merge and linked dev Supabase migration apply. Production launch must wait until:

- any production/staging target separate from the linked dev project has the Sprint 15 migration applied.
- target-environment linked checks are rerun.
- inherited PUBLIC execute grants on authenticated SECURITY DEFINER RPCs are verified closed in the target environment.
- Manual staging QA is recorded.
- Sensitive-role MFA handling is accepted/enforced.
- All launch gates in `docs/planning/mvp-launch-checklist.md` are closed.

Pre-staging launch classification summary:

| Classification | Count | Example items/IDs |
| --- | ---: | --- |
| `launch_blocker` | 0 | No open linked-dev blocker after applying `20260603113922_sprint_15_release_security_grants.sql` and recording RPC grant verification |
| `launch_risk` | 4 | Production MFA enforcement; full locked-list/change-request workflow; production PDF/worker execution; production offline check-in UX |
| `acceptable_mvp_risk` | 6 | `TD-001` Next.js canary; guided manual WhatsApp workflow; manual payments; external Canva workflow; CSV-first exports; provider-backed file registration |
| `post_launch_follow_up` | 7 | Supabase performance advisor cleanup; direct Canva API; online payment processing; native mobile app; advanced BI; partner commissions; AI assistance |

## Requirement Coverage Summary

At-a-glance: 16 of 16 MVP requirement groups reviewed at Sprint 15 scope level.

`docs/backlog/module-coverage.csv` is a read-only exported source snapshot used as assessment evidence: a raw 157-row CSV of module-level source statuses such as `Accepted` and `Not Started`. `docs/planning/mvp-requirements-coverage.md` is the living authoritative implementation tracking ledger where final MVP implementation statuses are recorded and updated. Reviewers should consult the CSV only as source evidence and make status edits in the Markdown ledger through the export -> review -> record flow below.

Sprint 15 reviewed MVP requirement groups `PV-*`, `ROLE-*`, `PROJ-*`, `GM-*`, `RSVP-*`, `INV-*`, `MSG-*`, `SEAT-*`, `CHK-*`, `PAY-*`, `WISH-*`, `PART-*`, `REP-*`, `FILE-*`, `TECH-*`, and `ROAD-*`.

Update process: export `module-coverage.csv`, review and assess it against current implementation evidence, then record the final implementation status in `mvp-requirements-coverage.md`.

## Backlog Coverage Summary

Primary release epic: `EPIC-RELEASE`.

Planned release features reviewed from the sprint plan:

- `FEAT-REL-001`: MVP end-to-end QA pass.
- `FEAT-REL-002`: Role/permission security review.
- `FEAT-REL-003`: RLS and database security review.
- `FEAT-REL-004`: Environment and secrets review.
- `FEAT-REL-005`: Deployment readiness checklist.
- `FEAT-REL-006`: Staging/production smoke test plan.
- `FEAT-REL-007`: Known limitations register.
- `FEAT-REL-008`: Release notes and launch documentation.
- `FEAT-REL-009`: Monitoring and rollback plan.
- `FEAT-REL-010`: MVP launch decision checklist.

The exported backlog CSV snapshots remain source evidence and were only modified to add hyphenated compatibility aliases required by active Sprint 15 docs.

## Files Created Or Changed

- `apps/web/src/lib/platform/release-readiness.test.ts`
- `apps/web/src/lib/platform/public-env-check.test.ts`
- `apps/web/src/lib/platform/backlog-alias-sync.test.ts`
- `.gitleaks.toml`
- `.github/workflows/ci.yml`
- `package.json`
- `scripts/check-public-env-vars.mjs`
- `scripts/scan-secrets.mjs`
- `scripts/sync-backlog-aliases.mjs`
- `docs/backlog/README.md`
- `docs/backlog/initial-product-backlog-features.csv`
- `docs/backlog/traceability-matrix.csv`
- `docs/backlog/module-coverage.csv`
- `docs/architecture/file-management-policy.md`
- `docs/planning/mvp-requirements-coverage.md`
- `docs/planning/mvp-known-limitations.md`
- `docs/planning/mvp-release-notes.md`
- `docs/planning/mvp-rollback-plan.md`
- `docs/planning/mvp-launch-checklist.md`
- `docs/planning/sprint-15-completion-report.md`
- `docs/planning/technical-debt.md`
- `docs/qa/mvp-manual-qa-scenarios.md`
- `docs/qa/permissions-review.md`
- `docs/qa/rls-review.md`
- `docs/qa/security-review.md`
- `docs/qa/post-launch-monitoring.md`
- `docs/setup/deployment-readiness.md`
- `docs/setup/qa-artifact-store.md`
- `docs/setup/security-risk-acceptance-template.md`
- `supabase/migrations/20260603113922_sprint_15_release_security_grants.sql`

## Tests Added Or Run

Added `apps/web/src/lib/platform/release-readiness.test.ts` to cover:

- required Sprint 15 release evidence documents exist;
- active-agent backlog CSV alias files remain byte-for-byte compatible with canonical underscore files;
- `TD-001` (Next.js canary dependency tracked in `docs/planning/technical-debt.md`) remains open after the June 3, 2026, stable Next.js recheck;
- Sprint 15 security-grants migration revokes inherited PUBLIC execute on authenticated RPCs and preserves only token-scoped public guest RPCs.

Added `apps/web/src/lib/platform/public-env-check.test.ts` to cover restricted public environment variable names, service-role/private-key/JWT value detection, `.env` discovery, inline-comment handling, and runtime/file violation aggregation.

Added `apps/web/src/lib/platform/backlog-alias-sync.test.ts` to cover canonical backlog alias synchronization, missing source files/directories, empty alias config, malformed alias entries, unsafe path traversal entries, and copy-failure reporting.

Final local test status before merge: 18 test files and 176 tests passing.

Post-merge linked dev database checks were completed on June 4, 2026. The Sprint 15 migration is recorded in linked migration history, linked dry-run reports the remote database is up to date, `npm.cmd run db:lint` reports no schema errors, and the corrected RPC grant verification query in `docs/qa/rls-review.md` returned zero non-allowlisted `PUBLIC`/`anon` execute grants. Production or staging environments separate from this linked dev project must repeat the same target-environment checks before promotion.

## Commands Run

Pre-documentation evidence already gathered:

- `npm.cmd view next version` - passed; returned `16.2.7`.
- `npm.cmd view eslint-config-next version` - passed; returned `16.2.7`.
- `npm.cmd view next@16.2.7 dependencies --json` - passed; latest stable still shows `postcss: 8.4.31`.
- `npx.cmd supabase@latest --version` - passed; returned `2.104.0`.
- `docs/setup/deployment-readiness.md` pins deployment dry-run evidence to `npx supabase@2.104.0` to preserve the verified CLI version from this Sprint 15 run.
- `npx.cmd supabase@latest db --help` - passed; confirmed `advisors` command.
- `npx.cmd supabase@latest migration list --linked` - passed; linked history was aligned through Sprint 14 before the Sprint 15 migration.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed before creating the Sprint 15 migration; remote database was up to date.
- `npm.cmd run db:lint` - passed before Sprint 15 migration; no schema errors.
- `npx.cmd supabase@latest db advisors --linked --type security --level info --fail-on none` - passed; reported SECURITY DEFINER execute-grant warnings.
- `npx.cmd supabase@latest db advisors --linked --type performance --level info --fail-on none` - passed; reported performance follow-ups.
- `npx.cmd supabase@latest migration new sprint_15_release_security_grants` - passed; created `20260603113922_sprint_15_release_security_grants.sql`.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed after the migration file was created locally; dry-run verified `20260603113922_sprint_15_release_security_grants.sql` is pending and ready to apply, but did not execute it against the linked database.

Post-merge linked dev evidence gathered on June 4, 2026:

- `gh pr merge 42 --repo carlkanda/diginoces-platform --squash --delete-branch --subject "Sprint 15 — Release Hardening, QA & MVP Launch" --body "Closes #31"` - passed; PR `#42` merged into `main` as `af402fe`, and issue `#31` closed.
- `git switch main` - passed.
- `git pull` - passed; local `main` fast-forwarded from `46eed08` to `af402fe`.
- `npx.cmd supabase@latest migration list --linked` - passed before apply; linked history showed `20260603113922` pending remotely.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed before apply; dry-run listed only `20260603113922_sprint_15_release_security_grants.sql`.
- `npx.cmd supabase@latest db push --linked --yes` - passed; applied `20260603113922_sprint_15_release_security_grants.sql` to the linked dev project.
- `npx.cmd supabase@latest migration list --linked` - passed after apply; local and remote history both show `20260603113922`.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed after apply; remote database is up to date.
- `npm.cmd run db:lint` - passed after apply; no schema errors found in `public` or `app_private`.
- `npx.cmd supabase@latest db advisors --linked --type security --level info --fail-on none` - ran after apply; advisors still report expected `SECURITY DEFINER` warnings for explicitly granted authenticated app RPCs and token-scoped public guest RPCs.
- `npx.cmd supabase@latest db advisors --linked --type performance --level info --fail-on none` - ran after apply; performance follow-ups remain tracked as post-launch cleanup.
- Documented RPC grant verification query from `docs/qa/rls-review.md` - first run returned only the five intended public guest-token RPCs because the allowlist used unnamed signatures while `pg_get_function_identity_arguments` returned named arguments.
- Corrected RPC grant verification query with named public-token signatures - passed; returned zero rows for non-allowlisted `PUBLIC`/`anon` execute grants.

- `npm.cmd --workspace apps/web run test -- --run src/lib/platform/release-readiness.test.ts` - passed, 1 test file and 4 tests.
- `npm.cmd run format` - passed; formatted the new release-readiness test.
- `npm.cmd ci` - passed; installed 496 packages and reported 0 vulnerabilities.
- `npm.cmd run format:check` - passed.
- `npm.cmd run lint` - passed.
- `npm.cmd run typecheck` - passed for web and database workspaces.
- `npm.cmd run test` - passed, 16 test files and 162 tests.
- `npm.cmd run build` - passed; Next.js production build completed successfully.
- `npm.cmd audit --omit=dev` - passed, 0 vulnerabilities.
- `npm.cmd run db:lint` - passed against linked `public` and `app_private` schemas; no schema errors.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed; dry-run would push only `20260603113922_sprint_15_release_security_grants.sql`.
- `npx.cmd supabase@latest db advisors --linked --type security --level info --fail-on none` - ran successfully before merge; at that point the linked DB still reported SECURITY DEFINER execute warnings because the Sprint 15 migration was pending.
- `npx.cmd supabase@latest db advisors --linked --type performance --level info --fail-on none` - ran successfully; reported unindexed foreign-key and multiple-permissive-policy performance follow-ups.
- `git diff --check` - passed; Git printed LF/CRLF warnings for Markdown files only.
- Targeted `rg` secret scan - passed with expected documentation and `.env.example` matches only; no real secrets or private client/guest data were found.

Final verification rerun after review fixes:

- `npm.cmd ci` - passed; installed 496 packages and reported 0 vulnerabilities.
- `npm.cmd run format` - passed; formatted the new platform tests.
- `npm.cmd run format:check` - passed.
- `npm.cmd run lint` - passed.
- `npm.cmd run typecheck` - passed for web and database workspaces.
- `npm.cmd --workspace apps/web run test -- --run src/lib/platform/public-env-check.test.ts src/lib/platform/backlog-alias-sync.test.ts src/lib/platform/release-readiness.test.ts` - passed, 3 test files and 16 tests.
- `npm.cmd run test` - passed, 18 test files and 174 tests.
- `npm.cmd run build` - passed; Next.js production build completed successfully.
- `npm.cmd audit --omit=dev` - passed, 0 vulnerabilities.
- `npm.cmd run env:check-public` - passed.
- `npm.cmd run secrets:scan` - passed.
- `npm.cmd run db:lint` - passed against linked `public` and `app_private` schemas; no schema errors.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed; dry-run would push only `20260603113922_sprint_15_release_security_grants.sql`.
- `npm.cmd run backlog:sync-aliases` - passed; synchronized `traceability-matrix.csv` and `module-coverage.csv` aliases.
- `git diff --check` - passed; Git printed LF/CRLF warnings only.
- `wsl.exe bash -lc "coderabbit review --agent -t uncommitted -c AGENTS.md"` - attempted for local WSL review and timed out after the full 10-minute window without usable output. No GitHub PR existed for this branch at verification time, so hosted CodeRabbit review threads were not available to fetch yet.

Hosted CodeRabbit review follow-up:

- PR `#42` was marked ready for review after the draft PR initially skipped CodeRabbit.
- Hosted CodeRabbit completed on June 4, 2026, and requested 8 actionable changes.
- Follow-up fixes applied: README verification flow includes `npm ci` and `npm run format:check`; backlog alias docs explicitly require committed hyphenated aliases; release-readiness tests include the risk acceptance template and byte-for-byte CSV parity; placeholder detection docs require explicit placeholder signals; launch checklist records opaque evidence IDs instead of direct URLs; controlled-pilot risk template no longer allows unrestricted production; public env checks reject forbidden markers anywhere in public variable names; the secret scanner now preflights `rg`; backlog alias sync handles malformed entries without throwing.
- Post-fix local verification: `npm.cmd run format`, focused platform tests, `npm.cmd run env:check-public`, `npm.cmd run secrets:scan`, `npm.cmd run backlog:sync-aliases`, `npm.cmd run format:check`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run test` (18 files, 175 tests), `npm.cmd audit --omit=dev`, `git diff --check`, `npm.cmd run build`, `npm.cmd run db:lint`, and `npx.cmd supabase@latest db push --linked --dry-run` all passed.
- Hosted CodeRabbit rerun then requested 3 follow-up changes: separate `npm run dev` from the README non-interactive verification sequence, remove the overbroad `SIGNING` public-env marker, and reject backlog alias path traversal or separator entries.
- Second follow-up local verification: focused platform tests passed (3 files, 18 tests), `npm.cmd run env:check-public`, `npm.cmd run backlog:sync-aliases`, `npm.cmd run secrets:scan`, `npm.cmd run format:check`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run test` (18 files, 176 tests), `npm.cmd audit --omit=dev`, `git diff --check`, `npm.cmd run db:lint`, `npm.cmd run build`, and `npx.cmd supabase@latest db push --linked --dry-run` all passed.

## Checks Passed Or Failed

- Passed: install, format check, lint, typecheck, full tests, build, dependency audit, public environment check, maintained secret scan, linked `db:lint`, linked dry-run, Supabase advisor command execution, whitespace check, backlog alias sync, and focused Sprint 15 platform tests.
- CodeRabbit: local WSL CLI review timed out after 10 minutes without output; hosted CodeRabbit review on PR `#42` completed and requested changes that are addressed by the follow-up patch.
- Advisor findings: post-apply security advisors still report expected warnings for explicitly exposed `SECURITY DEFINER` RPCs; the targeted RPC grant verification query confirms no non-allowlisted `PUBLIC`/`anon` execute grants remain in linked dev. Performance warnings are documented as post-launch follow-up unless staging load testing exposes a launch blocker.

## Security Checks Performed

- Reviewed `.gitignore` handling for environment files.
- Reviewed `.env.example` placeholder-only posture.
- Rechecked `TD-001` against current stable Next.js package metadata.
- Ran Supabase security advisors and added a migration to remove inherited PUBLIC execute grants on authenticated application RPCs.
- Preserved intentional `anon` access only for token-scoped public guest file/message RPCs.
- Added `.gitleaks.toml` with `[extend] useDefault = true` and a narrow allowlist for documented placeholder patterns in `docs/qa/security-review.md`; default Gitleaks rules remain enabled.
- Added release-readiness regression tests around the security-grants migration.

## RLS/Database Review Summary

RLS/database review is documented in `docs/qa/rls-review.md`.

Launch-blocking database finding fixed in this branch:

- Authenticated application `SECURITY DEFINER` RPCs inherited PUBLIC execute privileges. Sprint 15 migration revokes inherited public access and grants explicit authenticated/service-role access.

Remaining database follow-ups:

- Repeat migration apply, linked dry-run, `db:lint`, advisors, and RPC grant verification for any staging or production target that is separate from the linked dev project.
- Address performance advisor cleanup before higher-volume production.

## Secrets/Environment Review Summary

Environment and secrets review is documented in `docs/qa/security-review.md` and `docs/setup/deployment-readiness.md`.

Maintained source/config secret scan completed cleanly through `npm run secrets:scan`. CI Gitleaks remains the full-repository secret gate. No real credentials or private data were found.

## Deployment Readiness Summary

Deployment readiness is documented in `docs/setup/deployment-readiness.md`.

Required production gates:

- green CI;
- Supabase migration applied;
- clean `db:lint`;
- clean dependency audit;
- targeted secret scan;
- manual staging smoke QA;
- accepted MFA handling for sensitive roles;
- rollback/fallback owner acknowledgement.

## Known Limitations

Known limitations are documented in `docs/planning/mvp-known-limitations.md`.

Key launch risks:

- sensitive-role MFA enforcement/configuration;
- Next.js canary dependency `TD-001`;
- production PDF/worker execution hardening;
- production offline check-in UX;
- full guest-list lock/change-request workflow;
- Supabase performance advisor cleanup.

## Launch Blockers

Fixed in branch:

- inherited PUBLIC execute grants on authenticated SECURITY DEFINER RPCs.

Open before production:

- Repeat the linked dev database verification against the actual production/staging target if it is a separate Supabase project.
- Complete manual staging QA and classify failures.

## Launch Risks

- Sensitive role MFA must be enforced/configured or launch must stay restricted.
- Guided manual WhatsApp and manual payments require operational discipline.
- TD-001 canary dependency remains open.
- Full offline check-in and worker execution should be rehearsed before real event operations.

## Post-Launch Follow-Ups

- Move back to stable Next.js when the stable release no longer depends on vulnerable-range PostCSS.
- Implement full MFA enforcement flow if operational Supabase controls are not enough.
- Address Supabase performance advisor items.
- Harden production worker execution for PDF/QR/generation queues.
- Expand offline check-in to full PWA-grade behavior.
- Add official WhatsApp API integration if approved.
- Add online payments only when business process requires it.
- Continue with Sprint 16 AI Assistance only after MVP readiness gates are accepted.

## Rollback Plan Summary

Rollback plan is documented in `docs/planning/mvp-rollback-plan.md`. Preferred database recovery is a forward corrective migration, not destructive rollback. Operational fallback remains the existing Google/Canva/WhatsApp/manual check-in workflow.

## Recommended Next Scope

Sprint 15 is merged, and the next planned sprint is Sprint 16 - AI Assistance. Sprint 16 should not begin until MVP launch risks are explicitly accepted or converted into follow-up issues.
