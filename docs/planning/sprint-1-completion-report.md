# Sprint 1 Completion Report - Secure Platform Foundation

## Status

Implemented for review on branch `codex/sprint-1-platform-foundation`.

This report does not mark requirements permanently complete because repository governance still requires review before completion status changes.

## Requirements Covered

- `PV-001`, `PV-002`: secure responsive platform foundation and app shell.
- `ROLE-001`, `ROLE-002`, `ROLE-003`, `ROLE-007`: global/project/event/custom role foundation with sensitive-role MFA markers.
- `REP-006`: append-only audit-log foundation.
- `FILE-001`: app-owned file registry and fail-closed storage abstraction placeholder.
- `TECH-001`, `TECH-003`, `TECH-004`: Next.js/TypeScript workspace, test/check scripts, Supabase/PostgreSQL and storage foundations.

## Files Created Or Changed

- Root workspace: `package.json`, `package-lock.json`, `.env.example`, `.gitignore`, `.prettierrc.json`, `.prettierignore`, `README.md`.
- CI: `.github/workflows/ci.yml`.
- Scripts: `scripts/supabase-db-lint.mjs`.
- Web app: `apps/web/package.json`, `apps/web/next.config.ts`, `apps/web/tsconfig.json`, `apps/web/eslint.config.mjs`, `apps/web/vitest.config.ts`, `apps/web/next-env.d.ts`, `apps/web/.prettierignore`, `apps/web/README.md`.
- Web routes and shell: `apps/web/src/app/**`, `apps/web/src/proxy.ts`.
- Foundations: `apps/web/src/lib/auth/**`, `apps/web/src/lib/supabase/**`, `apps/web/src/lib/security/**`, `apps/web/src/lib/audit/**`, `apps/web/src/lib/storage/**`, `apps/web/src/lib/platform/**`, `apps/web/src/types/database.ts`.
- Database package: `packages/database/package.json`, `packages/database/tsconfig.json`, `packages/database/src/index.ts`, `packages/database/README.md`.
- Supabase: `supabase/config.toml`, `supabase/.gitignore`, `supabase/migrations/20260520153012_sprint_1_foundation.sql`.
- Documentation: `docs/setup/local-development.md`, `docs/planning/sprint-1-completion-report.md`, `docs/planning/technical-debt.md`.

## Tests Added

- `apps/web/src/lib/platform/smoke.test.ts`
- Covers requirement traceability, admin permission grants, sensitive-role MFA marker behavior, storage fail-closed behavior, and audit writer wiring.

## Commands Run

- `git switch -c codex/sprint-1-platform-foundation` - passed after sandbox approval.
- `npx supabase@latest migration new sprint_1_foundation` - passed after sandbox approval.
- `npx supabase@latest init` - passed.
- `npm view ...` package version checks - passed after sandbox approval.
- `npm install` - passed.
- `npm run format` - passed.
- `npm run format:check` - passed after adding app-level `.prettierignore`.
- `npm run lint` - passed after pinning/deduping ESLint to version `9.39.4`.
- `npm run typecheck` - passed.
- `npm run test` - passed, 1 file and 4 tests.
- `npm run build` - passed with Next.js `16.2.6`.
- `npm audit --omit=dev` - failed with 2 moderate advisories from `next -> postcss@8.4.31`; npm reports no available fix.
- Temporary npm override test for `next -> postcss@8.5.15` - reverted because Next still resolved `postcss@8.4.31` internally and `npm audit --omit=dev` still failed.
- `npx supabase@latest db lint` - failed because no local Postgres was running on `127.0.0.1:54322`.
- `docker --version` / `docker info` - failed because Docker is not installed or not available on `PATH`.
- `npx supabase@latest start` - failed because Docker Desktop is not available.
- `npm view next version` - latest stable is `16.2.6`, still using `postcss@8.4.31`.
- `npm view next@canary version` / `dependencies.postcss` - current canary is `16.3.0-canary.25` and uses `postcss@8.5.10`.
- `npm install next@canary eslint-config-next@canary --workspace apps/web` - passed.
- `npm audit --omit=dev` - passed after upgrading Next.js and `eslint-config-next` to `16.3.0-canary.25`.
- `npm install` - passed after pinning the Supabase CLI as a dev dependency for reproducible linked DB linting.
- Final `npm run format:check` - passed.
- Final `npm run lint` - passed.
- Final `npm run typecheck` - passed.
- Final `npm run test` - passed, 1 file and 4 tests.
- Final `npm run build` - passed with Next.js `16.3.0-canary.25`.
- Final `npm audit --omit=dev` - passed with 0 vulnerabilities.
- Added `.github/workflows/ci.yml` for PR/push CI with `npm ci`, format, lint, typecheck, test, and build checks.
- Added `docs/planning/technical-debt.md` with `TD-001` to track returning from Next.js canary to stable before production once stable Next.js resolves the PostCSS audit issue.
- Kept `npm run db:lint` documented as a manual/local linked Supabase check because it requires Supabase CLI authentication.
- `npx supabase@latest projects list` - passed and identified the `diginoces-platform-dev` project.
- `npx supabase@latest link --project-ref <diginoces-platform-dev-ref>` - passed and wrote ignored local CLI metadata under `supabase/.temp`.
- `npx supabase@latest db push --linked --dry-run` - passed and identified `20260520153012_sprint_1_foundation.sql` as pending.
- `npx supabase@latest db push --linked --yes` - passed and applied the Sprint 1 migration to the linked Supabase dev project.
- `npx supabase@latest migration list --linked` - passed and showed local and remote migration `20260520153012` aligned.
- `npx supabase@latest db lint --linked --schema public,private --fail-on error` - passed with no schema errors found.
- `npm run db:lint` - passed after approved access to the existing Supabase CLI authentication; no schema errors found.
- Local HTTP check against `http://127.0.0.1:3000/` - passed with HTTP `200`.
- Local HTTP check against `http://127.0.0.1:3000/api/health` - passed with HTTP `200`.
- `git commit -m "Implement sprint 1 platform foundation"` - passed locally.
- Initial `git push -u origin codex/sprint-1-platform-foundation` - failed because local Git credentials were unavailable: `SEC_E_NO_CREDENTIALS`.
- Escalated `git push -u origin codex/sprint-1-platform-foundation` - passed.
- Draft pull request creation through the GitHub connector - passed: <https://github.com/carlkanda/diginoces-platform/pull/2>.

## Checks Passed Or Failed

Passed:

- Install
- Format
- Lint
- Typecheck
- Unit/smoke tests
- Production build
- `npm audit --omit=dev`
- Linked Supabase migration push
- Linked Supabase schema lint with `--schema public,private --fail-on error`
- `npm run db:lint`
- Local web and health endpoint smoke checks
- GitHub Actions CI workflow added for non-secret checks: `npm ci`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.

Failed or blocked:

- None for the current Sprint 1 verification commands.

Notes:

- `npx supabase@latest db lint` without flags still targets a local database and requires Docker/local Postgres; the Sprint 1 check now uses the linked dev project via `npm run db:lint`.

## Security Checks Performed

- `.env.local` remains ignored and was not read or committed.
- `.env.example` uses placeholders only and does not include a service-role key.
- Supabase web client uses public URL plus publishable key only.
- Server-side auth uses Supabase SSR helpers and `getClaims()` before trusting a session.
- Login and callback `next` paths are normalized to prevent external redirect targets.
- RLS is enabled on all Sprint 1 foundation tables.
- Audit logs are protected with update/delete prevention triggers.
- File registry access is fail-closed for anon/authenticated roles until backend authorization policies are implemented.
- Secret scan was run for service-role keys, WhatsApp tokens, Google secrets, private keys, and OpenAI-style keys across source files.
- Supabase link metadata remains under ignored `supabase/.temp`; no database password or service-role key was committed.
- Linked DB lint requires Supabase CLI authentication but does not commit or expose the access token.

## Assumptions Made

- Plain CSS is acceptable for Sprint 1 because the sprint requires a foundation shell, not a full dashboard or final UI system.
- Supabase local Docker stack is optional for this branch; Sprint 1 migration validation can run against the linked Supabase dev project.
- The user explicitly asked to unblock npm audit, so Next.js and `eslint-config-next` were moved to canary `16.3.0-canary.25` because latest stable `16.2.6` still pins vulnerable `postcss@8.4.31`.
- `npm run db:lint` may need access outside a strict filesystem sandbox so the Supabase CLI can read the existing authenticated profile.
- The Browser plugin was not available through tool discovery, so local verification used HTTP checks instead.

## Open Issues Or Blockers

- Review is still required before marking any requirement complete.
- Track Next.js stable releases and move from canary back to stable once a stable release contains the PostCSS fix.
- `TD-001` now tracks the Next.js canary dependency and the required action to return to stable before production.
- Local Docker is still unavailable for developers who want to run the full local Supabase stack, but linked Supabase DB lint is no longer blocked.
- Supabase MFA enforcement is represented in role metadata but not enforced until project auth policies are configured.
- Local `gh auth status` still reports an invalid token for `carlkanda`; the branch push and draft PR were completed through approved Git/GitHub connector paths.

## Recommended Sprint 2 Scope

- Add wedding project and event entities from the Sprint 2 plan.
- Add project/event membership tables using the Sprint 1 RBAC foundation.
- Add server-side permission checks around project/event routes and route handlers.
- Add audit writes for project/event membership changes.
- Keep guest CRUD, RSVP, invitations, WhatsApp, seating, check-in, contracts, payments, and partner project creation out of scope until their documented sprints.
