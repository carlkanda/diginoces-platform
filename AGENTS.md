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
Sprint 13 — Partner / External Provider Model
Issue: #29
Issue URL: https://github.com/carlkanda/diginoces-platform/issues/29
Plan: docs/planning/sprint-13-plan.md
Branch: codex/sprint-13-partner-provider-model
PR title: Sprint 13 — Partner / External Provider Model
Completion report: docs/planning/sprint-13-completion-report.md
```

Last completed sprint:

```text
Sprint 12 — Guest Wishes, Guest Book & Post-Event Feedback
```

Last completed GitHub issue:

```text
#28 — Sprint 12 — Guest Wishes, Guest Book & Post-Event Feedback
https://github.com/carlkanda/diginoces-platform/issues/28
```

Last completed PR:

```text
#39 — Sprint 12 — Guest Wishes, Guest Book & Post-Event Feedback
```

Last completed report:

```text
docs/planning/sprint-12-completion-report.md
```

Next planned sprint:

```text
Sprint 14 — Files, Storage, Retention & Archive
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

Sprint 13 is active. Implement only the scope described in issue #29 and `docs/planning/sprint-13-plan.md`.

For the active Sprint 13 assignment, read:

- `docs/planning/sprint-13-plan.md`
- `docs/planning/sprint-12-plan.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/product/12-partner-external-provider-model.md`
- `docs/product/01-product-vision-business-model.md`
- `docs/product/02-user-roles-permissions-access-control.md`
- `docs/product/03-wedding-project-structure.md`
- `docs/product/10-contracts-pricing-payment-controls.md`
- `docs/product/13-dashboards-reports-audit-logs.md`
- `docs/technical-design/database-schema-core-entities.md`
- `docs/technical-design/api-backend-service-design.md`
- `docs/technical-design/security-permissions-access-control.md`

## Scope guard

Implement only Sprint 13: Partner / External Provider Model. Do not add Sprint 14 files/storage/retention/archive scope or any later-sprint product scope.

## Active sprint out of scope

For Sprint 13, do not implement:

- partner commission management;
- referral-fee calculation;
- partner billing;
- white-label SaaS;
- partner-controlled pricing;
- partner-controlled contracts;
- partner payment exception approval;
- partner access to revenue/payment details;
- partner access to internal notes or audit logs;
- public partner marketplace;
- automated partner payout reports;
- multi-tenant white-label branding;
- partner API access;
- full CRM/lead pipeline unless separately approved.

Partner and external provider functionality begins in Sprint 13 only after the sprint is explicitly assigned.

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
