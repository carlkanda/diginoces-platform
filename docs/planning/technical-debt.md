# Technical Debt

## TD-001 - Next.js canary dependency for PostCSS audit resolution

- Status: Open
- Introduced in: Sprint 1 - Secure Platform Foundation
- Related issue: `#1`
- Related requirement IDs: `TECH-001`, `TECH-003`, `TECH-004`

### Context

Sprint 1 moved `next` and `eslint-config-next` to `16.3.0-canary.25` because the latest stable Next.js release available during implementation, `16.2.6`, still pinned `postcss@8.4.31`, which caused `npm audit --omit=dev` to report a moderate PostCSS advisory.

The canary release resolves the audit finding by depending on `postcss@8.5.10`, and the Sprint 1 verification suite passes with the canary dependency.

The canary package specs are pinned exactly while this item is open so lockfile refreshes do not silently advance to a different canary build.

### Latest Stable Recheck

Rechecked on May 23, 2026 during the platform hardening pass after Sprints 1-5:

- `npm view next version` returned `16.2.6`.
- `npm view eslint-config-next version` returned `16.2.6`.
- `npm view next@16.2.6 dependencies --json` still shows `postcss: 8.4.31`.
- `npm audit --omit=dev` passes with the currently pinned canary dependency and reports 0 vulnerabilities.

Because the latest stable Next.js line still pins the vulnerable PostCSS version, this item remains open and the project stays pinned to `16.3.0-canary.25` until a stable Next.js release is safe.

Rechecked again on June 3, 2026 during Sprint 15 release hardening:

- `npm view next version` returned `16.2.7`.
- `npm view eslint-config-next version` returned `16.2.7`.
- `npm view next@16.2.7 dependencies --json` still shows `postcss: 8.4.31`.
- `npm audit --omit=dev` returned `0 vulnerabilities` with the currently pinned canary dependency.
- `npm ci` passed with the currently pinned canary dependency.
- `npm run format:check` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run test` passed.
- `npm run build` passed.
- `npm run db:lint` passed against the linked dev schema.
- `npx supabase@latest db push --linked --dry-run` passed before merge and reported only the pending Sprint 15 security-grants migration.
- Post-merge on June 4, 2026, `20260603113922_sprint_15_release_security_grants.sql` was applied to the linked dev project.
- Post-apply `npx supabase@latest db push --linked --dry-run` passed and reported the remote database is up to date.
- Post-apply `npm run db:lint` passed against the linked dev schema.
- The project pins `next@16.3.0-canary.25` and `eslint-config-next@16.3.0-canary.25` in `apps/web/package.json`; `package-lock.json` locks those exact versions and their matching `@next/*` packages.

Because the latest stable Next.js release still depends on the vulnerable-range PostCSS version, this item remains open for MVP launch readiness and must be rechecked again before production go-live.

Launch impact: TD-001 is non-blocking for controlled MVP pilot launch as an accepted limitation under `docs/planning/mvp-known-limitations.md` (`LIM-002`), provided exact pins remain in place, `npm audit --omit=dev` stays clean, and the item is rechecked before production go-live.

### Risk

Canary framework releases may contain regressions or API changes that are not appropriate for production hardening.

### Required Action

Before production readiness, return `next` and `eslint-config-next` to a stable Next.js release once the stable release line no longer triggers the PostCSS audit issue.

Recheck the latest stable package metadata before production readiness. Do not close this item by switching to a stable release that still depends on `postcss@8.4.31`.

Validation required before closing this item:

- `npm ci`
- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm audit --omit=dev`

### Scope Guard

This item does not authorize any guest management, RSVP, invitations, WhatsApp sending, check-in, contracts, payments, partner project creation, or other out-of-scope Sprint 1 product features.
