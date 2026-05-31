# Diginoces Platform

Diginoces is a responsive web platform for wedding guest operations, replacing the current Google tools + Canva + WhatsApp + Python workflow with a structured app.

## Current status

Completed:

- Sprint 1 — Secure Platform Foundation
- Sprint 2 — Wedding Projects & Events Foundation
- Sprint 3 — Guest Management & Guest Lists Foundation
- Sprint 4 — Guest Import & Approval Workflow
- Sprint 5 — RSVP & Public Guest Page
- Sprint 6 — Invitation Template & PDF Generation
- Sprint 7 — WhatsApp Communication Workflows
- Sprint 8 — Tables, Seating & Print Materials
- Sprint 9 — Check-in & Wedding-Day Operations
- Sprint 10 — Contracts, Pricing & Payment Controls

Current sprint assignment:

```text
Sprint 11 — Dashboards, Reports & Audit Logs
Current issue: #27
Current issue URL: https://github.com/carlkanda/diginoces-platform/issues/27
Current branch: codex/sprint-11-dashboards-reports-audit-logs
Current PR title: Sprint 11 — Dashboards, Reports & Audit Logs
Current sprint plan: docs/planning/sprint-11-plan.md
Current completion report: docs/planning/sprint-11-completion-report.md
Last completed sprint: Sprint 10 — Contracts, Pricing & Payment Controls
Last completed issue: #26
Last completed PR: #37
Last completed report: docs/planning/sprint-10-completion-report.md
Next planned sprint: Sprint 12 — Guest Wishes, Guest Book & Post-Event Feedback
```

## Agent instructions

Codex and other AI agents must read `AGENTS.md` before making changes.

Work must be assigned one sprint issue at a time. Do not ask an agent to build the whole app.

## Important docs

```text
AGENTS.md
docs/planning/mvp-build-execution-plan.md
docs/planning/sprint-11-plan.md
docs/backlog/master-requirements-register.csv
docs/backlog/initial-product-backlog-features.csv
docs/backlog/initial-product-backlog-user-stories.csv
docs/backlog/initial-product-backlog-tasks.csv
docs/backlog/initial-product-backlog-test-cases.csv
```

## Sprint roadmap

| Sprint | Name | Status |
|---:|---|---|
| 1 | Secure Platform Foundation | Completed |
| 2 | Wedding Projects & Events Foundation | Completed |
| 3 | Guest Management & Guest Lists Foundation | Completed |
| 4 | Guest Import & Approval Workflow | Completed |
| 5 | RSVP & Public Guest Page | Completed |
| 6 | Invitation Template & PDF Generation | Completed |
| 7 | WhatsApp Communication Workflows | Completed |
| 8 | Tables, Seating & Print Materials | Completed |
| 9 | Check-in & Wedding-Day Operations | Completed |
| 10 | Contracts, Pricing & Payment Controls | Completed |
| 11 | Dashboards, Reports & Audit Logs | In progress |
| 12 | Guest Wishes, Guest Book & Post-Event Feedback | Planned |
| 13 | Partner / External Provider Model | Planned |
| 14 | Files, Storage, Retention & Archive | Planned |
| 15 | Release Hardening, QA & MVP Launch | Planned |
| 16 | AI Assistance | Post-MVP planned |
| 17 | Advanced Integrations | Post-MVP planned |
| 18 | SaaS / Partner Scaling Enhancements | Post-MVP planned |
| 19 | Post-Launch Operations & Continuous Improvement | Post-launch planned |

## Local development

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Security

Never commit `.env`, `.env.local`, service-role keys, database passwords, WhatsApp tokens, Google credentials, API secrets, real client data, or real wedding guest data.
