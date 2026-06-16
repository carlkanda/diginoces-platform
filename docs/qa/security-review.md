# Security Review - Sprint 15

## Traceability

- GitHub issue: `#31` - Sprint 15 - Release Hardening, QA & MVP Launch.
- Sprint plan: `docs/planning/sprint-15-plan.md`.
- Requirements/backlog: `ROLE-001`, `ROLE-004`, `ROLE-006`, `ROLE-007`, `ROLE-009`, `TECH-004`, `TECH-010`, `FILE-004`, `FILE-006`, `FILE-009`, `REP-006`, `EPIC-RELEASE`, `FEAT-REL-002`, `FEAT-REL-003`, and `FEAT-REL-004`.
- Review inputs: `AGENTS.md`, Sprint 15 plan, backlog CSV snapshots, product security/permissions docs, technical security design, Supabase migrations, and current source tests.

## Summary

Sprint 15 reviewed repository security posture for secrets, environment variables, dependency audit status, CI, public guest tokens, file access, Supabase grants/RLS, and seed/demo data.

## Environment And Secrets

| Check                               | Result                                            |
| ----------------------------------- | ------------------------------------------------- |
| `.env` and `.env.local` ignored     | Pass; `.gitignore` covers environment files       |
| `.env.example` uses placeholders    | Pass; no real keys are required in the repository |
| Supabase service-role key committed | Not found in targeted scan                        |
| Database passwords committed        | Not found in targeted scan                        |
| WhatsApp tokens committed           | Not found in targeted scan                        |
| Google/API secrets committed        | Not found in targeted scan                        |
| Private client/guest data committed | Not found in targeted scan                        |

Scan details: the targeted secret scan was executed from the repository root on the Sprint 15 branch during verification. The maintained command is:

```text
npm run secrets:scan
```

`scripts/scan-secrets.mjs` keeps each credential pattern as an individual entry and invokes `rg` with the same repository exclusions for maintainability. It is source/config focused to avoid failing on security policy prose; CI Gitleaks remains the full-repository scanner.

See `docs/planning/sprint-15-completion-report.md` for the final command result; matches were expected policy/docs placeholders only.

Dedicated scanner gate: CI runs Gitleaks via `gitleaks/gitleaks-action@e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e` in `.github/workflows/ci.yml` and fails the PR on findings. `.gitleaks.toml` extends the default rules and only allowlists this document's literal placeholder-pattern examples; do not use that allowlist for real credentials, environment files, fixtures, or application code. Record the GitHub Actions secret-scan job result with the launch evidence before production sign-off.

## Dependency And Technical Debt

- `TD-001` remains open. On June 3, 2026, stable `next` and `eslint-config-next` were `16.2.7`, and latest stable Next.js still depended on `postcss: 8.4.31`.
- The project remains pinned to `next@16.3.0-canary.25` and `eslint-config-next@16.3.0-canary.25`.
- This is an approved MVP exception only while `npm audit --omit=dev` passes, CI remains green, the rollback plan remains current, and `TD-001` stays open for a pre-production stable-release recheck.
- Risk accepted for controlled MVP: pre-release framework cadence and possible canary regressions. Mitigation: exact pins, full verification, monitoring, and rollback plan.
- `npm audit --omit=dev` must pass before merge and before launch.

## CI/CD

GitHub Actions CI is expected to run:

- `npm ci`
- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run env:check-public` - Check public environment variables
- `npm run build`

Supabase-linked checks are intentionally local/manual because they require authenticated project access.

## Launch Security Fix

Supabase security advisors showed inherited PUBLIC execute privileges on authenticated `SECURITY DEFINER` RPCs. Sprint 15 adds `20260603113922_sprint_15_release_security_grants.sql` to revoke default public execute and grant explicit access only to intended roles.

Token-scoped public guest RPCs remain explicitly granted to `anon`:

- `public.list_guest_file_downloads(text)`
- `public.resolve_guest_file_download(text, uuid)`
- `public.resolve_guest_public_page(text)`
- `public.submit_public_guest_message(text, text, text, uuid)`
- `public.submit_public_rsvp(text, uuid, public.rsvp_status, text)`

## Advisor Refresh

On June 6, 2026, the linked-dev Supabase advisor refresh returned:

- Security: 34 `authenticated_security_definer_function_executable` warnings, 3 `anon_security_definer_function_executable` warnings, and 1 `auth_leaked_password_protection` warning.
- Performance: 246 `unindexed_foreign_keys` info items, 38 `multiple_permissive_policies` warnings, and 29 `unused_index` info items.

The security-definer warnings align with the documented permission-gated authenticated RPCs and the token-scoped public guest RPC allow-list above. The leaked-password protection warning remains an external Supabase Auth configuration decision before production; it is lower impact while the app exposes magic-link sign-in only, but it should be enabled or formally accepted before any password-based auth surface is exposed. Issue #58 closure evidence `QAART-20260616-LAUNCH-GATE-CLOSURE-001` records the narrow target setting as `password_hibp_enabled=true` on the Supabase Auth config and records why broad `supabase config push` is not acceptable for this gate.

The performance advisor items are launch-risk inputs for staging load testing and post-MVP database tuning, not current app security blockers.

## Low-Privilege Role Boundary Refresh

On PR `#48`, Chrome/CDP QA used the authenticated `carlkanda@gmail.com`
session with temporary linked-dev role assignments to verify exact low-privilege
boundaries:

- `bride` and `groom` roles can mutate only own-side guests when the guest-list
  gate is open, cannot bypass the locked guest-list contract gate through API
  routes, and cannot load cross-side edit forms.
- `partner_admin` can see partner-visible list/profile data only; internal
  notes, review queue, audit logs, reports, commercial, and payment data remain
  denied.
- `event_staff` can load assigned event check-in and scan pages, cannot access
  unrelated event/admin/report routes, and cannot use supervisor override.

Temporary role assignments and disposable linked-dev rows were removed after
verification. Production launch still requires the external QA artifact-store
evidence package for QA-001 through QA-036.

## Seed And Demo Data

No real wedding, couple, client, guest, payment, WhatsApp, or Google data should be committed. Demo data must remain fake and clearly marked if added in a future sprint.

## Security Recommendation

Controlled staging QA can proceed after the Sprint 15 migration is applied. Production go-live is conditional on MFA handling for sensitive roles, successful staging QA, green CI, clean dependency audit, Supabase Auth leaked-password protection sign-off, and no unresolved launch blockers.
