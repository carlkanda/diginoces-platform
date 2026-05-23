# Platform Hardening After Sprints 1-5 Report

## Status

Documentation and operational hardening evidence completed on branch `codex/platform-hardening-sprints-1-5`.

This is a post-merge hardening pass after Sprint 1-5 implementation, Sprint 1-4 hardening, and the cross-sprint integration review. It does not add Sprint 6 product scope or change app, API, database, RLS, or permission behavior.

## Traceability

- Sprint 1: issue `#1`, PR `#2`, hardening PR `#13`.
- Sprint 2: issue `#3`, PR `#4`, hardening PR `#14`.
- Sprint 3: issue `#5`, PR `#6`, hardening PR `#15`.
- Sprint 4: issue `#7`, PRs `#8` and `#9`, hardening PR `#16`.
- Sprint 5: issue `#10`, PR `#11`.
- Cross-sprint integration review: PR `#17`.

## Findings And Fixes

### Low - Linked Supabase Dev Database Status Needed Post-Merge Evidence

PR `#17` documented that the linked remote still had pending hardening migrations because the approved review plan only allowed a dry run. After merge, the linked Supabase project was confirmed to be a dev project, and the pending migrations were applied with `npx supabase@latest db push --linked --yes`.

The follow-up dry run now reports that the remote database is up to date, and `npm run db:lint` reports no schema errors for `public` or `app_private`.

### Low - TD-001 Needed A Fresh Stable Next.js Recheck

`TD-001` remains valid. On May 23, 2026, `npm view next version` and `npm view eslint-config-next version` returned `16.2.6`, and `next@16.2.6` still depends on `postcss@8.4.31`.

The project keeps `next` and `eslint-config-next` pinned to `16.3.0-canary.25` because the current canary dependency tree passes `npm audit --omit=dev` with 0 vulnerabilities. The item must be rechecked before production readiness.

### Low - Local CodeRabbit WSL Full-Diff Review Needs A Documented Fallback

The local WSL CodeRabbit CLI can fail on full-diff reviews with `TRPCClientError` even when `coderabbit doctor` passes. The documented fallback is to run scoped directory reviews locally and rely on hosted CodeRabbit PR review for full-diff coverage.

## Files Changed

- `docs/planning/platform-hardening-after-sprints-1-5-report.md`
- `docs/planning/technical-debt.md`
- `docs/planning/cross-sprint-integration-review-report.md`
- `docs/setup/local-development.md`

## Commands Run

- `git status --short --branch`
- `git log -1 --oneline --decorate`
- `gh auth status`
- `git switch -c codex/platform-hardening-sprints-1-5`
- `npm view next version`
- `npm view eslint-config-next version`
- `npm view next@16.2.6 dependencies --json`
- `npm ci`
- `npm run format:check`
- `npm run lint`
- `npm run test`
- `npm run typecheck`
- `npm run build`
- `npm audit --omit=dev`
- `npm run db:lint`
- `npx supabase@latest db push --linked --dry-run`
- `git diff --check`
- Targeted secret scan with `rg`
- `wsl.exe ... coderabbit --version`
- `wsl.exe ... coderabbit auth status --agent`
- `wsl.exe ... coderabbit review --agent --base main -c AGENTS.md`

## Checks Passed

- Branch was created from clean `main` at merge commit `10dcc6a`.
- `npm ci` passed, installed 496 packages, audited 499 packages, and reported 0 vulnerabilities.
- `npm run format:check` passed.
- `npm run lint` passed.
- `npm run test` passed: 6 files, 56 tests.
- `npm run typecheck` passed, including Next route type generation and database package TypeScript.
- `npm run build` passed with Next.js `16.3.0-canary.25`.
- `npm audit --omit=dev` passed with 0 vulnerabilities.
- `npm run db:lint` passed with no schema errors for `public` and `app_private`.
- `npx supabase@latest db push --linked --dry-run` reported `Remote database is up to date.`
- `git diff --check` passed. Git printed local CRLF conversion warnings for touched Markdown files, but no whitespace errors.
- Targeted secret scan found only the expected placeholder `.env.example` `DATABASE_URL`; no real secrets or private client/guest data were found.
- WSL CodeRabbit full-diff review completed and raised 0 issues.

## Security Review

- No secrets were added.
- No `.env` or `.env.local` files were added.
- No Supabase service-role keys, database passwords, WhatsApp tokens, Google secrets, private keys, or real client/guest data were added.
- No database migration, RLS policy, RPC, API route, or app code was changed.

## Assumptions

- One PR is appropriate because the remaining items are documentation/tooling cleanup and operational evidence, not separate sprint product defects.
- The linked Supabase project used for `db push --linked --yes` is the dev project.
- `TD-001` remains open because the latest stable Next.js line still depends on `postcss@8.4.31`.
- Active sprint metadata in `AGENTS.md` and `README.md` remains unchanged.

## Open Issues Or Blockers

- `TD-001` remains open: return from Next.js canary to stable before production once stable Next.js no longer triggers the PostCSS audit issue.
- Local WSL CodeRabbit full-diff CLI review may still fail with `TRPCClientError`; scoped local reviews and hosted PR review remain the fallback.

## Recommended Sprint 6 Readiness Notes

- Confirm linked Supabase migrations are still current before manual QA.
- Reuse the hardened Sprint 1-5 permission, audit, and redirect helpers for Sprint 6 routes.
- Keep invitation/PDF/QR implementation separated from public guest token and future check-in token behavior.
