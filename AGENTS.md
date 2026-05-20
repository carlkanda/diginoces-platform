# AGENTS.md — Diginoces Platform

## Project mission

Build the Diginoces wedding guest-management platform as a responsive web application using the requirements, planning documents, and technical design artifacts contained in this repository.

Diginoces is being transformed from a workflow based on Google tools, Canva, WhatsApp, and Python scripts into a professional platform for wedding guest operations.

## Core build rule

No feature may be implemented unless it is linked to a documented requirement ID.

No requirement may be marked complete unless it has been:

1. implemented;
2. tested;
3. reviewed;
4. documented where needed;
5. linked back to the requirements register or sprint issue.

## Current sprint

Current sprint: **Sprint 1 — Secure Platform Foundation**

GitHub issue:

https://github.com/carlkanda/diginoces-platform/issues/1

## Required reading before coding

Before making code changes, agents must read these documents:

- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/first-sprint-plan.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/technical-design/database-schema-core-entities.md`
- `docs/technical-design/api-backend-service-design.md`
- `docs/technical-design/security-permissions-access-control.md`
- `docs/product/16-technical-architecture.md`
- `docs/backlog/master-requirements-register-source.md`

## Sprint 1 scope

Implement only the secure platform foundation.

Sprint 1 may include:

- Next.js / React / TypeScript app scaffold under `apps/web`;
- package/workspace setup validation;
- linting and formatting setup;
- test runner setup;
- environment variable documentation using `.env.example`;
- Supabase/PostgreSQL connection foundation;
- authentication foundation;
- role/permission foundation;
- audit-log foundation;
- file-storage abstraction placeholder;
- developer setup guide;
- at least one smoke test.

## Out of scope for Sprint 1

Do not implement the following in Sprint 1:

- guest CRUD;
- bride/groom guest lists;
- CSV/Excel import;
- RSVP;
- public guest page;
- invitation templates;
- PDF generation;
- QR generation;
- WhatsApp sending;
- table/seating planning;
- check-in;
- contracts;
- pricing;
- payments;
- partner project creation;
- full dashboards beyond placeholders.

If an out-of-scope dependency is discovered, record it as a blocker or follow-up item. Do not silently implement it.

## Recommended stack

Use the repository documentation as the source of truth. The recommended Sprint 1 stack is:

- Next.js;
- React;
- TypeScript;
- PostgreSQL;
- Supabase Auth / Supabase client foundation;
- app-owned storage abstraction;
- responsive web app first.

Do not commit real credentials or secrets.

## Repository structure expectations

The repository should follow this general structure:

```text
apps/
  web/
packages/
  database/
  shared/
  ui/
supabase/
  migrations/
  seed/
docs/
  product/
  agent-system/
  backlog/
  technical-design/
  planning/
  setup/
```

Agents may refine this structure if needed, but must document the reason in the Sprint 1 completion report.

## Required workflow for agents

For every implementation task:

1. Identify the relevant requirement ID(s).
2. Identify the source document(s).
3. Confirm the implementation plan.
4. Implement only the approved sprint scope.
5. Add or update tests.
6. Run available checks.
7. Document files created or changed.
8. Update or create the sprint completion report.

## Permission and security rules

Security must be enforced on the backend, not only in the frontend.

Sprint 1 foundations should prepare for:

- global roles;
- project-level roles;
- event-level roles;
- custom roles;
- 2FA for sensitive roles;
- secure public tokens later;
- staff-only check-in later;
- audit logging for sensitive actions.

Do not create shortcuts that would make later permission enforcement difficult.

## Environment and secrets

Use `.env.example` for documentation only.

Never commit:

- `.env`;
- `.env.local`;
- Supabase service role keys;
- database passwords;
- WhatsApp tokens;
- Google credentials;
- API secrets;
- private client data.

## Testing expectations

Sprint 1 must include at least:

- one smoke test;
- script entries for linting, type checking, testing, and building;
- clear documentation on how to run local checks.

If a test cannot be run, explain why in the completion report.

## Documentation expectations

At minimum, Sprint 1 must create or update:

- `docs/setup/local-development.md`;
- `docs/planning/sprint-1-completion-report.md`.

The completion report must include:

- requirements covered;
- backlog items completed, if applicable;
- files created or changed;
- tests added;
- commands run;
- security checks performed;
- open issues;
- blockers;
- recommended Sprint 2 scope.

## Pull request rules

Work should be done in a branch, not directly on `main`, unless explicitly instructed otherwise.

Recommended branch name:

```text
codex/sprint-1-platform-foundation
```

Recommended PR title:

```text
Sprint 1 — Secure Platform Foundation
```

The PR must reference issue `#1`.

## Quality rules

Agents must not:

- implement undocumented features;
- skip tests;
- commit secrets;
- introduce real client or guest data;
- bypass permission design;
- mark incomplete work as complete;
- expand beyond Sprint 1 scope.

Agents must:

- preserve traceability;
- document assumptions;
- raise blockers clearly;
- keep the codebase ready for future modules;
- leave the repository in a buildable and reviewable state.
