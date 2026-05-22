# Diginoces Platform

This repository contains the source code, technical documentation, backlog snapshots, sprint plans, and AI-agent build control system for the Diginoces wedding guest-management platform.

## Repository purpose

Diginoces is being transformed from a Google tools + Python scripts workflow into a professional responsive web application for wedding guest operations.

The platform covers:

- wedding project and event management;
- guest management and guest imports;
- RSVP and public guest pages;
- Canva-based invitation template and PDF generation;
- WhatsApp-first communication workflows;
- tables, seating, and print exports;
- wedding-day check-in;
- contracts, pricing, and payment controls;
- dashboards, reports, and audit logs;
- guest wishes, guest-book exports, and feedback;
- partner/external provider operations;
- files, storage, retention, and archive;
- post-MVP AI assistance, integrations, partner scaling, and post-launch operations.

## Current build status

Completed:

- **Sprint 1 — Secure Platform Foundation**
- **Sprint 2 — Wedding Projects & Events Foundation**
- **Sprint 3 — Guest Management & Guest Lists Foundation**
- **Sprint 4 — Guest Import & Approval Workflow**

Active sprint:

- **Sprint 5 — RSVP & Public Guest Page**
- GitHub issue: `#10`
- Issue URL: `https://github.com/carlkanda/diginoces-platform/issues/10`
- Sprint plan: `docs/planning/sprint-5-plan.md`
- Expected branch: `codex/sprint-5-rsvp-public-guest-page`
- Expected PR title: `Sprint 5 — RSVP & Public Guest Page`
- Expected completion report: `docs/planning/sprint-5-completion-report.md`

## Active sprint sync rule

Whenever the active sprint changes, update both files in the same commit:

```text
AGENTS.md
README.md
```

Update:

- active sprint name;
- GitHub issue number and URL;
- authoritative sprint plan path;
- expected branch name;
- expected PR title;
- expected completion report path;
- sprint roadmap status table below.

This prevents Codex from reading outdated sprint instructions.

## AI-agent instructions

Codex and other AI coding agents must read `AGENTS.md` before making changes.

`AGENTS.md` defines:

- the active sprint;
- required reading;
- sprint scope;
- out-of-scope boundaries;
- branch and PR naming rules;
- security and secrets rules;
- testing expectations;
- completion report requirements.

Do not ask an agent to “build the whole app.” Always assign one sprint issue at a time.

## Build rule

No feature may be implemented unless it is linked to:

1. a documented requirement ID;
2. a backlog item where applicable;
3. the active sprint plan;
4. the active GitHub issue.

No requirement may be marked complete unless it has been implemented, tested, reviewed, and documented.

## Documentation structure

```text
docs/
  product/
  agent-system/
  backlog/
  technical-design/
  planning/
  setup/
  operations/
```

Important files:

```text
AGENTS.md

docs/planning/sprint-5-plan.md

docs/backlog/master-requirements-register.csv
docs/backlog/traceability-matrix.csv
docs/backlog/module-coverage.csv
docs/backlog/initial-product-backlog-epics.csv
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
| 5 | RSVP & Public Guest Page | Active |
| 6 | Invitation Template & PDF Generation | Planned |
| 7 | WhatsApp Communication Workflows | Planned |
| 8 | Tables, Seating & Print Materials | Planned |
| 9 | Check-in & Wedding-Day Operations | Planned |
| 10 | Contracts, Pricing & Payment Controls | Planned |
| 11 | Dashboards, Reports & Audit Logs | Planned |
| 12 | Guest Wishes, Guest Book & Post-Event Feedback | Planned |
| 13 | Partner / External Provider Model | Planned |
| 14 | Files, Storage, Retention & Archive | Planned |
| 15 | Release Hardening, QA & MVP Launch | Planned |
| 16 | AI Assistance | Post-MVP planned |
| 17 | Advanced Integrations | Post-MVP planned |
| 18 | SaaS / Partner Scaling Enhancements | Post-MVP planned |
| 19 | Post-Launch Operations & Continuous Improvement | Post-launch planned |

## Local development

The web app lives in `apps/web` and is wired through npm workspaces.

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

Local setup details are maintained in:

```text
docs/setup/local-development.md
```

## Environment and secrets

Use `.env.example` for documentation only.

Never commit:

- `.env`;
- `.env.local`;
- Supabase service-role keys;
- database passwords;
- WhatsApp tokens;
- Google credentials;
- API secrets;
- real client data;
- real wedding guest data.

## Pull request expectations

Every sprint PR must include:

- linked issue reference;
- requirement IDs covered;
- backlog items covered;
- files changed;
- database migrations, if any;
- tests added;
- commands run;
- checks passed/failed;
- security checks;
- known assumptions;
- open issues/blockers;
- sprint completion report.

For Sprint 5, the expected completion report is:

```text
docs/planning/sprint-5-completion-report.md
```
