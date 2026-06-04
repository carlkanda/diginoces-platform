# MVP Requirements Coverage - Sprint 15 Review

Traceability: GitHub issue `#31` - Sprint 15 - Release Hardening, QA & MVP Launch; sprint plan `docs/planning/sprint-15-plan.md`; release backlog `EPIC-RELEASE`, `FEAT-REL-001` through `FEAT-REL-010`.

## Summary

Sprint 15 reviewed MVP coverage against the Master Requirements Register, backlog CSV snapshots, sprint plans, completion reports, hardening reports, migrations, tests, and current source modules after Sprints 1-14. Post-merge linked dev checks on June 4, 2026 applied the Sprint 15 security-grants migration and verified no non-allowlisted `PUBLIC`/`anon` execute grants remain.

The MVP is suitable for controlled dev/staging QA with a conditional launch posture. Core operational foundations exist across projects, guests, imports, RSVP, invitations, messages, seating, check-in, contracts/payments, reports, guest-book, partners, and files. Production go-live still depends on the conditions and limitations documented in `docs/planning/mvp-known-limitations.md` and `docs/planning/mvp-launch-checklist.md`.

## Evidence Sources

- Requirements: `docs/backlog/master-requirements-register.csv`
- Backlog: `docs/backlog/initial-product-backlog-*.csv`
- Coverage snapshots: `docs/backlog/traceability-matrix.csv`, `docs/backlog/module-coverage.csv`
- Sprint reports: `docs/planning/sprint-1-completion-report.md` through `docs/planning/sprint-14-completion-report.md`
- Hardening reports: Sprint 1-4 hardening, cross-sprint review, platform hardening, and post-merge reports where present
- Automated tests: `apps/web/src/lib/**/*.test.ts`
- Database evidence: `supabase/migrations/*.sql`

## Coverage Matrix

| Requirement group | MVP status | Implementation evidence | Test evidence | Launch status |
| --- | --- | --- | --- | --- |
| `PV-*` product vision and platform direction | Implemented as MVP foundation | Next.js app, Supabase foundation, app-owned file registry, manual operational workflows | Platform smoke and module tests | conditional_go |
| `ROLE-*` roles and permissions | Partially implemented | Role registry, permission helpers, RLS/RPC checks, page/API guards | Platform, project, guest, import, RSVP, invitation, message, seating, check-in, contract, report, partner, file tests; see `docs/qa/permissions-review.md` for per-role launch classifications | launch_risk for production MFA enforcement |
| `PROJ-*` projects and events | Implemented | Wedding project, event, membership, lifecycle, codes, CRUD pages/API | `project-foundation.test.ts` | conditional_go |
| `GM-*` guest management | Partially implemented | Guests, titles, tags, side ownership, event assignment, validation, duplicate detection | `guest-foundation.test.ts` | launch_risk for full lock/change-request workflows |
| `GM-004`, `GM-005` guest import | Implemented for CSV MVP | Import sessions, staged rows, mapping, validation, review, apply workflow | `guest-import-foundation.test.ts` | conditional_go |
| `RSVP-*` RSVP and public guest pages | Implemented as foundation | Public guest token, payment/access gate, event RSVP records, Yes/No/Maybe rules | `rsvp-foundation.test.ts` | conditional_go |
| `INV-*`, `PDF-*`, `QR-*` invitations/PDF/QR | Implemented as tested foundation | Event templates, field config, preview approval, generation job records, file/version links | `invitation-foundation.test.ts` | launch_risk for production-grade worker/rendering integration |
| `MSG-*` WhatsApp communication | Implemented as guided/manual and adapter-ready foundation | Message templates, variables, readiness, queue/history, manual send tracking | `message-foundation.test.ts` | acceptable_mvp_risk; production API not included |
| `SEAT-*` seating and print materials | Implemented as foundation | Table plans, assignments, capacity checks, CSV print exports | `seating-foundation.test.ts` | conditional_go |
| `CHK-*` check-in operations | Implemented as foundation | Check-in tokens, event check-in, unexpected guest requests, offline sync metadata | `check-in-foundation.test.ts` | launch_risk for production offline UX |
| `PAY-*` contracts, pricing, payments | Implemented as manual-control foundation | Contracts, pricing, manual payments, gates, exception controls | `contract-foundation.test.ts` | conditional_go; online payments out of scope |
| `WISH-*` guest wishes/guest-book/feedback | Implemented as foundation | Public/couple review flows, export metadata, post-event feedback | `guest-wishes-foundation.test.ts` | conditional_go |
| `PART-*` partner model | Implemented as foundation | Partner profiles, submissions, project drafts, role boundaries | `partner-foundation.test.ts`; manual QA `QA-021` in `docs/qa/mvp-manual-qa-scenarios.md` | conditional_go; commissions out of scope |
| `REP-*` reports, dashboards, audit logs | Implemented as foundation | Operational snapshots, report exports, audit access controls | `reporting-foundation.test.ts` and audit smoke tests | conditional_go |
| `FILE-*` files/storage/retention/archive | Implemented as foundation | File registry, signed downloads, guest file access, retention/archive controls | `file-foundation.test.ts` | conditional_go; full upload UX is provider-backed |
| `TECH-*` architecture/security/integrations | Partially implemented | CI, env placeholders, migrations, Supabase RLS/RPC, release security migration | Platform smoke and Sprint 15 release-readiness tests | acceptable_mvp_risk for TD-001 canary (LIM-002); post_launch_follow_up for Supabase advisor cleanup (LIM-010) |
| `ROAD-*` roadmap/release governance | Implemented for Sprint 15 evidence | Launch checklist, rollback plan, release notes, monitoring plan | Release-readiness artifact test | conditional_go |

## Launch Classification

Canonical launch classification counts: `launch_blocker=0`, `launch_risk=4`, `acceptable_mvp_risk=6`, `post_launch_follow_up=7`.

These counts reflect linked-dev status after post-merge Sprint 15 migration apply and RPC grant verification.

- `launch_blocker`: none open in linked dev after applying `20260603113922_sprint_15_release_security_grants.sql` and verifying zero non-allowlisted `PUBLIC`/`anon` execute grants.
- `launch_risk`: production MFA enforcement (`LIM-001`), full locked-list/change-request workflow (`LIM-006`), production PDF/worker execution (`LIM-007`), and production offline check-in UX (`LIM-008`).
- `acceptable_mvp_risk`: `TD-001` Next.js canary (`LIM-002`), guided manual WhatsApp workflow (`LIM-003`), manual payments (`LIM-004`), external Canva workflow (`LIM-005`), CSV-first exports, and provider-backed file registration (`LIM-009`).
- `post_launch_follow_up`: Supabase performance advisor cleanup (`LIM-010`), direct Canva API (`LIM-011`), online payment processing, native mobile app, advanced BI, partner commissions, AI assistance (`LIM-018`).

`LIM-010` is counted as a post-launch performance follow-up only while `docs/qa/rls-review.md` confirms no RLS misconfiguration, wrong-scope access, or unauthorized data exposure; the security escalation rule in `docs/planning/mvp-known-limitations.md` upgrades any confirmed access-control defect to `launch_blocker`.

## Notes

The backlog CSV `Status` columns remain exported source snapshots and still show many rows as `Not started`. Sprint 15 uses the sprint reports, code, tests, and migrations as implementation evidence rather than mutating the source backlog snapshots in this PR.

Known limitation cross-reference: `LIM-001` maps to `ROLE-*`, `LIM-002` and `LIM-010` map to `TECH-*`, `LIM-003` maps to `MSG-*`, `LIM-013` was consolidated into canonical `LIM-003`, `LIM-004` and `LIM-014` map to `PAY-*`, `LIM-005` and `LIM-011` map to `INV-*`/`PDF-*`, `LIM-007` maps to `INV-*`/`PDF-*`/`QR-*`, `LIM-006` maps to `GM-*`, `LIM-008` maps to `CHK-*`, `LIM-009` maps to `FILE-*`, `LIM-012` maps to `REP-*`/`FILE-*`, `LIM-016` maps to `REP-*`, `LIM-017` maps to `PART-*`, and `LIM-015`/`LIM-018` map to `ROAD-*`.
