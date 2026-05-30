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

## Current sprint assignment

```text
Sprint 10 — Contracts, Pricing & Payment Controls
Issue: #26
Issue URL: https://github.com/carlkanda/diginoces-platform/issues/26
Plan: docs/planning/sprint-10-plan.md
Branch: codex/sprint-10-contracts-pricing-payments
PR title: Sprint 10 — Contracts, Pricing & Payment Controls
Completion report: docs/planning/sprint-10-completion-report.md
```

Last completed sprint:

```text
Sprint 9 — Check-in & Wedding-Day Operations
```

Last completed GitHub issue:

```text
#25 — Sprint 9 — Check-in & Wedding-Day Operations
https://github.com/carlkanda/diginoces-platform/issues/25
```

Last completed PR:

```text
#36 — Sprint 9 — Check-in & Wedding-Day Operations
```

Last completed report:

```text
docs/planning/sprint-9-completion-report.md
```

Next planned sprint:

```text
Sprint 11 — Dashboards, Reports & Audit Logs
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

Sprint 10 is active. Implement only the scope described in issue #26 and `docs/planning/sprint-10-plan.md`.

For the active Sprint 10 assignment, read:

- `docs/planning/sprint-10-plan.md`
- `docs/planning/sprint-9-plan.md`
- `docs/product/10-contracts-pricing-payment-controls.md`
- `docs/product/01-product-vision-business-model.md`
- `docs/product/02-user-roles-permissions-access-control.md`
- `docs/product/03-wedding-project-structure.md`
- `docs/product/05-rsvp-public-guest-page.md`
- `docs/product/06-invitation-template-pdf-generation.md`
- `docs/product/07-whatsapp-communication-message-workflows.md`
- `docs/product/13-dashboards-reports-audit-logs.md`
- `docs/technical-design/database-schema-core-entities.md`
- `docs/technical-design/api-backend-service-design.md`
- `docs/technical-design/security-permissions-access-control.md`

## Scope guard

Implement only Sprint 10: Contracts, Pricing & Payment Controls. Do not add Sprint 11 dashboards/reports or any later-sprint product scope.

## Active sprint out of scope

For Sprint 10, do not implement:

- online payment processing;
- tax/VAT handling;
- multi-currency;
- partner commission management;
- full reports/dashboard module;
- post-event workflows;
- e-signature provider integration;
- contract negotiation workflow;
- partner project creation;

Contracts, pricing, and payment controls begin in Sprint 10 only after the sprint is explicitly assigned.

## Workflow

For every implementation task:

1. Identify requirement IDs.
2. Identify backlog items.
3. Identify source documents.
4. Implement only the assigned sprint scope.
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
