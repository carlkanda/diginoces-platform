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

Active sprint:

```text
Sprint 7 — WhatsApp Communication Workflows
Issue: #21
Issue URL: https://github.com/carlkanda/diginoces-platform/issues/21
Sprint plan: docs/planning/sprint-7-plan.md
Expected branch: codex/sprint-7-whatsapp-communication-workflows
Expected PR title: Sprint 7 — WhatsApp Communication Workflows
Expected report: docs/planning/sprint-7-completion-report.md
```

## Agent instructions

Codex and other AI agents must read `AGENTS.md` before making changes.

Work must be assigned one sprint issue at a time. Do not ask an agent to build the whole app.

## Build rule

No feature may be implemented unless it is linked to:

1. a documented requirement ID;
2. a backlog item where applicable;
3. the active sprint plan;
4. the active GitHub issue.

No requirement may be marked complete unless it has been implemented, tested, reviewed, and documented.

## Important docs

```text
AGENTS.md
docs/planning/sprint-7-plan.md
docs/backlog/master-requirements-register.csv
docs/backlog/traceability_matrix.csv
docs/backlog/module_coverage.csv
docs/backlog/requirements-lists.csv
docs/backlog/initial-product-backlog-epics.csv
docs/backlog/initial-product-backlog-features.csv
docs/backlog/initial-product-backlog-user-stories.csv
docs/backlog/initial-product-backlog-tasks.csv
docs/backlog/initial-product-backlog-test-cases.csv
docs/backlog/initial-product-backlog-lists.csv
```

## Sprint roadmap

| Sprint | Name                                            | Status              |
| -----: | ----------------------------------------------- | ------------------- |
|      1 | Secure Platform Foundation                      | Completed           |
|      2 | Wedding Projects & Events Foundation            | Completed           |
|      3 | Guest Management & Guest Lists Foundation       | Completed           |
|      4 | Guest Import & Approval Workflow                | Completed           |
|      5 | RSVP & Public Guest Page                        | Completed           |
|      6 | Invitation Template & PDF Generation            | Completed           |
|      7 | WhatsApp Communication Workflows                | Active              |
|      8 | Tables, Seating & Print Materials               | Planned             |
|      9 | Check-in & Wedding-Day Operations               | Planned             |
|     10 | Contracts, Pricing & Payment Controls           | Planned             |
|     11 | Dashboards, Reports & Audit Logs                | Planned             |
|     12 | Guest Wishes, Guest Book & Post-Event Feedback  | Planned             |
|     13 | Partner / External Provider Model               | Planned             |
|     14 | Files, Storage, Retention & Archive             | Planned             |
|     15 | Release Hardening, QA & MVP Launch              | Planned             |
|     16 | AI Assistance                                   | Post-MVP planned    |
|     17 | Advanced Integrations                           | Post-MVP planned    |
|     18 | SaaS / Partner Scaling Enhancements             | Post-MVP planned    |
|     19 | Post-Launch Operations & Continuous Improvement | Post-launch planned |

## Local development

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

See:

```text
docs/setup/local-development.md
```

## Security

Never commit:

- `.env` or `.env.local`;
- Supabase service-role keys;
- database passwords;
- WhatsApp tokens;
- Google credentials;
- API secrets;
- real client data;
- real wedding guest data.

## PR expectations

Every sprint PR must reference the active issue and include requirement IDs, backlog items, files changed, tests, commands run, security checks, assumptions, blockers, and the sprint completion report.
