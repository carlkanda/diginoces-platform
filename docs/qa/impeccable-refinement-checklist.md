# Impeccable Refinement Checklist

Date started: 2026-06-22

Branch: `codex/impeccable-app-refinement-pass`

Goal: improve the already-approved Diginoces redesign with shared navigation, state language, empty/permission patterns, mobile scanning, motion feedback, public/auth polish, and reusable design-system documentation without changing product behavior.

## Scope Guard

- Preserve routes, server actions, API contracts, permissions, RLS behavior, auth, MFA, and public-token separation.
- Do not add Sprint 16 AI Assistance, Sprint 17 integrations, WhatsApp automation, payments, contracts workflow changes, or any new product capability.
- Do not reopen the 47-route redesign table unless a touched surface needs new browser evidence.

## Work Tracker

| Area | Purpose | Implementation status | Evidence |
| --- | --- | --- | --- |
| Global command navigation | Help users jump to the right wedding, event, guest, import, RSVP, invitation, message, seating, check-in, report, audit, or partner area without memorizing the sidebar. | Partial | `WorkspaceCommandMenu`, `getWorkspaceCommandGroups`, and command navigation tests. Protected visual check is login-gated in the current browser session. |
| Page action hierarchy | Keep primary search/navigation visible while duplicate top links collapse on mobile. | Completed | Header integration in `RootLayout`; mobile top links hide when the sidebar is the clearer navigation path. |
| Status and empty-state language | Standardize the way the product explains no-results, permission-limited, and workflow-state situations. | Completed | `OperationalEmptyState`, command no-results copy, permission note, and `formatLabel` user-facing status overrides with tests. |
| High-frequency empty states | Teach recovery paths on workspace, projects, reports, audit logs, project overview, project dashboard, guests, imports, RSVP, communications, communications queue, and guest-book pages. | Completed | `OperationalEmptyState` now includes suggested next-step support and is applied across the main route families. |
| Mobile and event-day scanning | Improve touch-safe scanning and dense record comparison without changing event-day workflows. | Completed | Shared CSS transitions, sticky table headers, row focus treatment, mobile wrapping, and event-day surface padding updates in `globals.css` plus `components/ui/table.tsx`. |
| Interaction feedback | Add subtle state transitions for existing workflow surfaces with reduced-motion support. | Completed | Global motion variables and `prefers-reduced-motion` fallback added; Impeccable detector returned no issues. |
| Public/auth polish | Keep entry and sign-in surfaces aligned with the same navigation and language rules. | Completed | Public home and login browser spot-checks passed with no horizontal overflow; workspace command trigger remains hidden on public/auth pages. |
| Design-system documentation | Document the command palette, status grammar, empty states, permission copy, motion, and mobile rules for future route work. | Completed | `DESIGN.md` section 13 and this checklist. |
| Impeccable full-app audit | Record the audit score, fixes applied, and lower-priority route-family notes. | Completed | `docs/qa/impeccable-full-app-audit-report.md`. |

## Checks Recorded

- `npm run format` - passed after the high-frequency empty-state pass.
- `npm ci` - passed after the local dev server exited and released the native `lightningcss` package file.
- `npm run format:check` - passed.
- `npm run lint` - passed.
- `npm run typecheck` - passed.
- `npm run test -- src/components/operational-empty-state.test.ts src/lib/navigation/workspace-command.test.ts src/lib/i18n/static-translations.test.ts src/lib/ui/format-helpers.test.ts` from `apps/web` - passed, 31 focused tests.
- `npm run test` - passed, 314 tests.
- `npm run build` - passed.
- `npm audit --omit=dev` - passed, 0 vulnerabilities.
- `npm run redesign:design-system-check` - passed.
- `npm run redesign:check` - passed, 47 route rows, 47 browser verified, 0 blocked.
- `npm run redesign:check:approval` - passed, 47 route rows, 47 browser verified, 0 blocked.
- Impeccable detector over touched app, component, navigation, UI helper, design, and QA files - passed with `[]`.
- Local CodeRabbit scoped app review - passed with 0 issues after fixes for i18n, empty-state tests, table overflow accessibility, and command-copy tests.
- Local CodeRabbit scoped docs review - passed with 0 issues after fixing traceability and checklist status. Full-diff local CodeRabbit still hit the 10-minute CLI timeout, so hosted PR CodeRabbit remains the final whole-diff review gate.
- `npm run secrets:scan` and targeted `rg` secret scan - passed with no secrets found.
- `git diff --check` - passed with LF-to-CRLF warnings only.
- Chrome browser spot-check - `/`, `/login`, and `/platform` redirect passed with no horizontal overflow and no console errors; visible workspace command trigger count was `0` on public/auth routes.
