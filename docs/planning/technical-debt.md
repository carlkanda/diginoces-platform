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

### Risk

Canary framework releases may contain regressions or API changes that are not appropriate for production hardening.

### Required Action

Before production readiness, return `next` and `eslint-config-next` to a stable Next.js release once the stable release line no longer triggers the PostCSS audit issue.

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
