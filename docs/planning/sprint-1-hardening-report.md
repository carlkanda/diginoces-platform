# Sprint 1 Post-Merge Hardening Report

## Status

Implemented on branch `codex/sprint-1-post-merge-hardening` as a post-merge follow-up to Sprint 1 issue `#1` and merged PR `#2`.

This hardening pass does not reopen Sprint 1 or add product scope. It tightens the secure platform foundation that later sprints depend on.

## Findings Resolved

- CI used floating GitHub Action tags and persisted checkout credentials by default.
- The temporary Next.js canary dependency from `TD-001` used semver ranges instead of exact pins.
- Next.js route type imports in `next-env.d.ts` require generated `.next` type artifacts before `tsc`.
- `/api/health` exposed detailed requirement, feature, and module metadata instead of coarse operational status.
- In-memory role helpers trusted malformed role assignments instead of filtering invalid scope shapes.
- The Sprint 1 database role-assignment constraint allowed scoped assignments without `scope_id`.
- `app_private.user_has_permission` treated a null scoped `p_scope_id` as a wildcard for scoped assignments.
- The file registry allowed non-platform file scopes without `scope_id`.
- Windows line endings could make local `format:check` fail on files that are otherwise Prettier-clean.

## Changes Made

- Pinned `actions/checkout` and `actions/setup-node` to resolved commit SHAs and disabled checkout credential persistence.
- Pinned `next` and `eslint-config-next` exactly to `16.3.0-canary.25` while `TD-001` remains open.
- Updated the web `typecheck` script to run `next typegen` before `tsc --noEmit`, matching the current Next.js route-type workflow.
- Reduced `/api/health` sprint data to counts and high-level status fields.
- Added fail-closed validation for role assignments before granting permissions or checking sensitive-role MFA.
- Added `supabase/migrations/20260522193138_sprint_1_post_merge_hardening.sql` to enforce scoped role/file shape and remove null-as-wildcard scoped permission checks.
- Added smoke-test coverage for malformed role assignments.
- Set Prettier `endOfLine` to `auto` for cross-platform local checks.

## Files Changed

- `.github/workflows/ci.yml`
- `.prettierrc.json`
- `apps/web/package.json`
- `apps/web/src/app/api/health/route.ts`
- `apps/web/src/lib/guests/guest-service.ts`
- `apps/web/src/lib/platform/smoke.test.ts`
- `apps/web/src/lib/projects/project-permissions.ts`
- `apps/web/src/lib/security/permissions.ts`
- `docs/planning/sprint-1-hardening-report.md`
- `docs/planning/technical-debt.md`
- `package-lock.json`
- `supabase/migrations/20260522193138_sprint_1_post_merge_hardening.sql`

## Commands Run

- `git fetch origin`
- `git switch -c codex/sprint-1-post-merge-hardening`
- `gh issue view 1 --repo carlkanda/diginoces-platform --json title,body,state,url,labels`
- `npx.cmd supabase@latest migration --help`
- `npx.cmd supabase@latest db --help`
- `npx.cmd supabase@latest migration new sprint_1_post_merge_hardening`
- `git ls-remote https://github.com/actions/checkout.git refs/tags/v4`
- `git ls-remote https://github.com/actions/setup-node.git refs/tags/v4`
- `npm.cmd install --package-lock-only --ignore-scripts`
- `npm.cmd --workspace apps/web run test -- src/lib/platform/smoke.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `wsl.exe -d Ubuntu --exec /home/carlkanda/.local/bin/coderabbit --version`
- `wsl.exe -d Ubuntu --exec /home/carlkanda/.local/bin/coderabbit auth status --agent`
- `wsl.exe -d Ubuntu --exec /home/carlkanda/.local/bin/coderabbit review --agent --type uncommitted --base origin/main -c AGENTS.md`
- `wsl.exe -d Ubuntu --exec /home/carlkanda/.local/bin/coderabbit review --agent --type committed --base origin/main -c AGENTS.md`
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
- Targeted secret scans with `rg`

## Check Results

Passed:

- `npm.cmd ci`
- `npm.cmd run format:check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run test` with 5 files and 44 tests
- `npm.cmd run build`
- `npm.cmd audit --omit=dev` with 0 vulnerabilities
- `npm.cmd run db:lint` with no schema errors on `public` and `app_private`
- `npx.cmd supabase@latest db push --linked --dry-run`, showing the hardening migration as pending
- `git diff --check`
- Targeted secret scan for private keys, Supabase secret keys/JWTs, Google API keys, and OpenAI-style keys
- CodeRabbit committed review completed with 2 trivial findings; both were applied and revalidated

Failed or blocked:

- First `npm.cmd ci` attempt failed because Windows could not unlink the Next SWC native binary. Retrying outside the sandbox passed.
- CodeRabbit CLI authenticated successfully, but the initial uncommitted review failed before findings with `Review failed: Unknown error` / `TRPCClientError`. The committed review succeeded.

## Security Notes

- No `.env` or `.env.local` files were read or committed.
- No Supabase service-role key, database password, WhatsApp token, Google secret, private key, or real client/guest data was added.
- The hardening migration intentionally fails if ambiguous scoped role assignments or file rows already exist instead of guessing a scope.
- The linked Supabase dry run did not apply the pending migration.

## Open Issues

- `TD-001` remains open: return from Next.js canary to a stable Next.js release before production once the stable release no longer triggers the PostCSS audit issue.
