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
Sprint 8 — Tables, Seating & Print Materials
```

GitHub issue:

```text
#23 — Sprint 8 — Tables, Seating & Print Materials
https://github.com/carlkanda/diginoces-platform/issues/23
```

Authoritative sprint plan:

```text
docs/planning/sprint-8-plan.md
```

Expected branch:

```text
codex/sprint-8-tables-seating-print-materials
```

Expected PR title:

```text
Sprint 8 — Tables, Seating & Print Materials
```

Expected completion report:

```text
docs/planning/sprint-8-completion-report.md
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

For Sprint 8, specifically read:

- `docs/planning/sprint-8-plan.md`
- `docs/planning/sprint-7-plan.md`
- `docs/product/09-tables-seating-print-materials.md`
- `docs/product/04-guest-management-guest-lists.md`
- `docs/product/05-rsvp-public-guest-page.md`
- `docs/product/06-invitation-template-pdf-generation.md`
- `docs/product/08-check-in-wedding-day-operations.md`
- `docs/product/14-files-storage-retention-security.md`
- `docs/technical-design/database-schema-core-entities.md`
- `docs/technical-design/api-backend-service-design.md`
- `docs/technical-design/security-permissions-access-control.md`

## Sprint 8 scope

Implement only the Tables, Seating & Print Materials foundation:

- event-specific table model;
- table capacity and occupancy foundation;
- table-level guest assignment foundation;
- seat-level/mixed mode structural foundation if safe;
- unassigned guest tracking;
- RSVP-aware seating behavior;
- VIP/protocol seating foundation;
- list/table seating UI foundation;
- visual seating-map placeholder or foundation;
- table-card Canva CSV export foundation;
- printed invitation tracking foundation if not already covered;
- invitation regeneration awareness for table data changes;
- permission checks for table/seating operations;
- audit logging for table/seating/export actions;
- tests;
- documentation updates;
- `docs/planning/sprint-8-completion-report.md`.

## Sprint 8 out of scope

Do not implement:

- check-in;
- WhatsApp sending;
- contracts;
- pricing;
- payments;
- partner project creation;
- full print partner workflow;
- direct Canva API integration;
- automatic PDF regeneration unless already safe and explicitly limited.

Check-in and wedding-day operations begin in Sprint 9.

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
