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
- Web app: `apps/web/package.json`, `apps/web/next.config.ts`, `apps/web/tsconfig.json`, `apps/web/eslint.config.mjs`, `apps/web/vitest.config.ts`, `apps/web/next-env.d.ts`, `apps/web/.prettierignore`, `apps/web/README.md`.
- Web routes and shell: `apps/web/src/app/**`, `apps/web/src/proxy.ts`.
- Foundations: `apps/web/src/lib/auth/**`, `apps/web/src/lib/supabase/**`, `apps/web/src/lib/security/**`, `apps/web/src/lib/audit/**`, `apps/web/src/lib/storage/**`, `apps/web/src/lib/platform/**`, `apps/web/src/types/database.ts`.
- Database package: `packages/database/package.json`, `packages/database/tsconfig.json`, `packages/database/src/index.ts`, `packages/database/README.md`.
- Supabase: `supabase/config.toml`, `supabase/.gitignore`, `supabase/migrations/20260520153012_sprint_1_foundation.sql`.
- Documentation: `docs/setup/local-development.md`, `docs/planning/sprint-1-completion-report.md`.

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
- Local HTTP check against `http://127.0.0.1:3000/` - passed with HTTP `200`.
- Local HTTP check against `http://127.0.0.1:3000/api/health` - passed with HTTP `200`.
- `git commit -m "Implement sprint 1 platform foundation"` - passed locally.
- `git push -u origin codex/sprint-1-platform-foundation` - failed because local Git credentials were unavailable: `SEC_E_NO_CREDENTIALS`.
- `npm view next version` - latest stable is `16.2.6`.
- `npm view next@canary version` / `dependencies.postcss` - current canary is `16.3.0-canary.24` and uses `postcss@8.5.10`; not adopted because canary framework releases are not recommended for this foundation branch without explicit approval.

## Checks Passed Or Failed

Passed:

- Install
- Format
- Lint
- Typecheck
- Unit/smoke tests
- Production build
- Local web and health endpoint smoke checks

Failed or blocked:

- `npm audit --omit=dev`: moderate PostCSS advisory transitive through Next.js with no npm fix available.
- `supabase db lint`: blocked because Docker Desktop is unavailable, so the local Supabase database cannot be started.
- Draft PR creation: blocked because the branch could not be pushed with the current local Git credentials.

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

## Assumptions Made

- Plain CSS is acceptable for Sprint 1 because the sprint requires a foundation shell, not a full dashboard or final UI system.
- Supabase local Docker stack is optional for this branch; migrations are committed for review and later local application.
- The Browser plugin was not available through tool discovery, so local verification used HTTP checks instead.

## Open Issues Or Blockers

- Review is still required before marking any requirement complete.
- `npm audit --omit=dev` reports a moderate PostCSS advisory through `next@16.2.6`; npm reports no stable fix. A canary Next.js build has a newer PostCSS dependency but was not adopted without approval.
- Supabase migration lint/advisor checks require Docker Desktop and a running local Supabase database.
- Supabase MFA enforcement is represented in role metadata but not enforced until project auth policies are configured.
- GitHub push/PR creation requires re-authentication. `gh auth status` reported an invalid token for `carlkanda`, and `git push` failed with `SEC_E_NO_CREDENTIALS`.

## Recommended Sprint 2 Scope

- Add wedding project and event entities from the Sprint 2 plan.
- Add project/event membership tables using the Sprint 1 RBAC foundation.
- Add server-side permission checks around project/event routes and route handlers.
- Add audit writes for project/event membership changes.
- Keep guest CRUD, RSVP, invitations, WhatsApp, seating, check-in, contracts, payments, and partner project creation out of scope until their documented sprints.
