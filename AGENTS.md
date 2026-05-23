# AGENTS.md — Diginoces Platform

## Mission

Build the Diginoces wedding guest-management platform as a responsive web application using the requirements, sprint plans, backlog CSV snapshots, and technical design documents in this repository.

## Core rule

No feature may be implemented unless it is linked to:

1. a documented requirement ID;
2. a backlog item where applicable;
3. the active sprint plan;
4. the active GitHub issue.

No requirement may be marked complete unless it is implemented, tested, reviewed, documented, and linked back to the requirement/backlog/sprint issue/PR.

## Active sprint

```text
Sprint 7 — WhatsApp Communication Workflows
```

GitHub issue:

```text
#21 — Sprint 7 — WhatsApp Communication Workflows
https://github.com/carlkanda/diginoces-platform/issues/21
```

Authoritative sprint plan:

```text
docs/planning/sprint-7-plan.md
```

Expected branch:

```text
codex/sprint-7-whatsapp-communication-workflows
```

Expected PR title:

```text
Sprint 7 — WhatsApp Communication Workflows
```

Expected completion report:

```text
docs/planning/sprint-7-completion-report.md
```

## Active sprint sync rule

When the active sprint changes, update both `AGENTS.md` and `README.md` in the same commit.

Update the active sprint name, issue number/URL, sprint plan path, branch name, PR title, completion report path, and README roadmap status.

## Required reading before coding

Always read:

- `AGENTS.md`
- the assigned GitHub issue
- the matching sprint plan under `docs/planning/`
- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/backlog/master-requirements-register.csv`
- `docs/backlog/initial-product-backlog-epics.csv`
- `docs/backlog/initial-product-backlog-features.csv`
- `docs/backlog/initial-product-backlog-user-stories.csv`
- `docs/backlog/initial-product-backlog-tasks.csv`
- `docs/backlog/initial-product-backlog-test-cases.csv`
- relevant product documents in `docs/product/`
- relevant technical design documents in `docs/technical-design/`

For Sprint 7, specifically read:

- `docs/planning/sprint-7-plan.md`
- `docs/planning/sprint-6-plan.md`
- `docs/product/07-whatsapp-communication-message-workflows.md`
- `docs/product/06-invitation-template-pdf-generation.md`
- `docs/product/05-rsvp-public-guest-page.md`
- `docs/product/04-guest-management-guest-lists.md`
- `docs/product/10-contracts-pricing-payment-controls.md`
- `docs/technical-design/api-backend-service-design.md`
- `docs/technical-design/background-jobs-pdf-qr-whatsapp-offline-checkin.md`
- `docs/technical-design/security-permissions-access-control.md`

## Sprint 7 scope

Implement only the WhatsApp Communication Workflows foundation:

- message template foundation;
- French/English template support;
- dynamic message variable rendering;
- message readiness validation;
- guided manual WhatsApp sending workflow;
- API-ready messaging adapter abstraction without real credentials;
- message logs and status tracking;
- invitation send/resend preparation workflow;
- Maybe RSVP follow-up foundation;
- event reminder foundation or controlled placeholder;
- modification/update message foundation;
- communication history for authorized users;
- permission checks for template and message actions;
- audit logging for communication actions;
- basic UI for templates, sending queue, guided manual send, and history;
- tests;
- documentation updates;
- `docs/planning/sprint-7-completion-report.md`.

## Sprint 7 out of scope

Do not implement:

- unofficial WhatsApp Web automation;
- production WhatsApp API integration requiring real credentials;
- seating;
- check-in;
- contracts;
- pricing;
- payments;
- invitation PDF generation;
- QR generation;
- partner project creation.

Tables, seating, and print materials begin in Sprint 8.

## Workflow

For every implementation task:

1. Identify requirement IDs.
2. Identify backlog items.
3. Identify source documents.
4. Implement only active sprint scope.
5. Add or update tests.
6. Run checks.
7. Update the sprint completion report.

## Security and secrets

Security must be enforced on the backend, not only in the frontend.

Never commit:

- `.env` or `.env.local`;
- Supabase service role keys;
- database passwords;
- WhatsApp tokens;
- Google credentials;
- API secrets;
- private client data;
- real wedding guest data;
- real couple/client data.

## Testing expectations

At minimum, run and document:

```text
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Run Supabase/database checks when available. If they cannot be run, explain why in the completion report.

## Quality rules

Agents must not implement future sprint features just because they appear in the backlog.

Agents must preserve traceability, document assumptions, raise blockers clearly, and keep the repository buildable and reviewable.
