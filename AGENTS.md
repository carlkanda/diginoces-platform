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
No active sprint is currently assigned.
```

Last completed sprint:

```text
Sprint 8 — Tables, Seating & Print Materials
```

Last completed GitHub issue:

```text
#23 — Sprint 8 — Tables, Seating & Print Materials
https://github.com/carlkanda/diginoces-platform/issues/23
```

Last completed PR:

```text
#24 — Sprint 8 — Tables, Seating & Print Materials
```

Last completed report:

```text
docs/planning/sprint-8-completion-report.md
```

Next planned sprint:

```text
Sprint 9 — Check-in & Wedding-Day Operations
Plan: docs/planning/sprint-9-plan.md
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

No implementation sprint is active right now. Do not start Sprint 9 or any other new feature work until a GitHub issue and sprint assignment are provided.

For the next planned Sprint 9 assignment, read:

- `docs/planning/sprint-9-plan.md`
- `docs/planning/sprint-8-plan.md`
- `docs/product/08-check-in-wedding-day-operations.md`
- `docs/product/04-guest-management-guest-lists.md`
- `docs/product/05-rsvp-public-guest-page.md`
- `docs/product/06-invitation-template-pdf-generation.md`
- `docs/product/09-tables-seating-print-materials.md`
- `docs/product/10-contracts-pricing-payment-controls.md`
- `docs/product/14-files-storage-retention-security.md`
- `docs/technical-design/database-schema-core-entities.md`
- `docs/technical-design/api-backend-service-design.md`
- `docs/technical-design/background-jobs-pdf-qr-whatsapp-offline-checkin.md`
- `docs/technical-design/security-permissions-access-control.md`

## Scope guard

Until a new sprint is explicitly assigned, do not implement new product scope. Maintenance tasks may only update documentation, tooling, reviews, checks, or already-merged behavior when directly requested.

When Sprint 9 is assigned, implement only the Check-in & Wedding-Day Operations foundation described in `docs/planning/sprint-9-plan.md`.

## Next planned sprint out of scope

For Sprint 9, do not implement:

- WhatsApp sending;
- contracts;
- pricing;
- payments;
- partner project creation;
- full WhatsApp automation;
- post-event guest-book workflows;
- full dashboards beyond the approved Sprint 9 foundation.

Check-in and wedding-day operations begin in Sprint 9.

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
