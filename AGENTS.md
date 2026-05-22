# AGENTS.md — Diginoces Platform

## Project mission

Build the Diginoces wedding guest-management platform as a responsive web application using the requirements, planning documents, backlog CSV snapshots, and technical design artifacts contained in this repository.

Diginoces is being transformed from a workflow based on Google tools, Canva, WhatsApp, and Python scripts into a professional platform for wedding guest operations.

## Core build rule

No feature may be implemented unless it is linked to a documented requirement ID and an approved sprint/backlog item.

No requirement may be marked complete unless it has been:

1. implemented;
2. tested;
3. reviewed;
4. documented where needed;
5. linked back to the requirements register, backlog item, sprint issue, and pull request.

## Active sprint

Current active implementation sprint:

```text
Sprint 4 — Guest Import & Approval Workflow
```

Current GitHub issue:

```text
#7 — Sprint 4 — Guest Import & Approval Workflow
https://github.com/carlkanda/diginoces-platform/issues/7
```

Authoritative sprint plan:

```text
docs/planning/sprint-4-plan.md
```

Expected branch:

```text
codex/sprint-4-guest-import-approval
```

Expected PR title:

```text
Sprint 4 — Guest Import & Approval Workflow
```

Expected completion report:

```text
docs/planning/sprint-4-completion-report.md
```

## Active sprint sync rule

When the active sprint changes, update both files in the same commit:

```text
AGENTS.md
README.md
```

At minimum, update:

- active sprint name;
- GitHub issue number and URL;
- authoritative sprint plan path;
- expected branch name;
- expected PR title;
- expected completion report path;
- roadmap status table in `README.md`.

Do not leave this file pointing to an old sprint.

## How agents must determine scope

Agents must not infer sprint scope from memory.

For any task, agents must use this order of authority:

1. The assigned GitHub issue.
2. The matching sprint plan in `docs/planning/`.
3. `docs/backlog/master-requirements-register.csv`.
4. `docs/backlog/initial-product-backlog-features.csv`.
5. `docs/backlog/initial-product-backlog-user-stories.csv`.
6. `docs/backlog/initial-product-backlog-tasks.csv`.
7. Product and technical design documents.

If the GitHub issue and sprint plan conflict, stop and report the conflict instead of guessing.

## Required reading before coding

Before making code changes, agents must read:

- this `AGENTS.md` file;
- the assigned GitHub issue;
- the sprint plan matching the assigned issue;
- `docs/agent-system/00-ai-agent-build-system-governance.md`;
- `docs/agent-system/agent-role-prompts.md`;
- `docs/agent-system/agent-execution-workflow.md`;
- `docs/planning/mvp-build-execution-plan.md`;
- `docs/backlog/master-requirements-register.csv`;
- `docs/backlog/initial-product-backlog-epics.csv`;
- `docs/backlog/initial-product-backlog-features.csv`;
- `docs/backlog/initial-product-backlog-user-stories.csv`;
- `docs/backlog/initial-product-backlog-tasks.csv`;
- `docs/backlog/initial-product-backlog-test-cases.csv`;
- relevant product documents under `docs/product/`;
- relevant technical design documents under `docs/technical-design/`.

## Sprint 4 required reading

For the current active sprint, agents must specifically read:

- `docs/planning/sprint-4-plan.md`;
- `docs/planning/sprint-3-plan.md`;
- `docs/product/04-guest-management-guest-lists.md`;
- `docs/product/03-wedding-project-structure.md`;
- `docs/product/02-user-roles-permissions-access-control.md`;
- `docs/technical-design/database-schema-core-entities.md`;
- `docs/technical-design/api-backend-service-design.md`;
- `docs/technical-design/security-permissions-access-control.md`.

## Sprint 4 scope

For Sprint 4, implement only the Guest Import & Approval Workflow foundation:

- guest import session foundation;
- guest import row staging foundation;
- import column mapping foundation;
- CSV parsing support;
- import preview workflow;
- import validation workflow;
- duplicate detection during import;
- bride/groom submit-for-review workflow;
- Diginoces/admin review workflow;
- row-level approval/rejection or partial approval foundation;
- apply-approved-rows workflow to create guest records;
- import history;
- backend permission checks for import operations;
- audit logging for import actions;
- basic UI routes/pages for upload, mapping, preview, review, and import history;
- tests;
- documentation updates;
- `docs/planning/sprint-4-completion-report.md`.

## Sprint 4 out of scope

Do not implement the following in Sprint 4:

- RSVP;
- public guest page;
- invitation generation;
- PDF generation;
- QR generation;
- WhatsApp;
- seating;
- check-in;
- contracts;
- pricing;
- payments;
- partner project creation;
- automatic duplicate merging.

RSVP and public guest page begin in Sprint 5.

## Recommended stack

Use the repository documentation as the source of truth. The recommended stack is:

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
  operations/
```

Agents may refine this structure if needed, but must document the reason in the sprint completion report.

## Required workflow for agents

For every implementation task:

1. Identify the relevant requirement ID(s).
2. Identify the relevant backlog item(s).
3. Identify the source document(s).
4. Confirm the implementation plan.
5. Implement only the approved sprint scope.
6. Add or update tests.
7. Run available checks.
8. Document files created or changed.
9. Update or create the sprint completion report.

## Branch and PR rules

Work should be done in a branch, not directly on `main`, unless explicitly instructed otherwise.

For the current sprint, use:

```text
codex/sprint-4-guest-import-approval
```

Recommended PR title:

```text
Sprint 4 — Guest Import & Approval Workflow
```

The PR must reference issue `#7`.

The PR should start as a draft until implementation, tests, and documentation are ready for review.

## Permission and security rules

Security must be enforced on the backend, not only in the frontend.

Agents must preserve and extend:

- global roles;
- project-level roles;
- event-level roles;
- custom roles;
- sensitive-role handling;
- secure public-token separation where applicable;
- staff-only controls where applicable;
- audit logging for sensitive actions;
- server-side permission checks.

Do not create shortcuts that make later permission enforcement difficult.

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
- private client data;
- real wedding guest data;
- real couple/client data.

## Testing expectations

Every sprint must include tests appropriate to its scope.

At minimum, run and document:

```text
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

If database linting or Supabase checks are available, run and document them. If they cannot be run, explain why in the sprint completion report.

## Documentation expectations

Each sprint must create a completion report:

```text
docs/planning/sprint-N-completion-report.md
```

For the current sprint:

```text
docs/planning/sprint-4-completion-report.md
```

The completion report must include:

- sprint status;
- requirement IDs covered;
- backlog items covered;
- files created or changed;
- database migrations added;
- tests added;
- commands run;
- checks passed or failed;
- security checks performed;
- permission behavior implemented;
- audit-log behavior implemented;
- assumptions made;
- open issues or blockers;
- out-of-scope items intentionally deferred;
- recommended next sprint scope.

## Quality rules

Agents must not:

- implement undocumented features;
- skip tests;
- commit secrets;
- introduce real client or guest data;
- bypass permission design;
- mark incomplete work as complete;
- expand beyond the active sprint scope;
- implement future sprint features because they appear in the backlog.

Agents must:

- preserve traceability;
- document assumptions;
- raise blockers clearly;
- keep the codebase ready for future modules;
- leave the repository in a buildable and reviewable state;
- keep future sprint work out of the current sprint.

## Future sprint reminder

The repository contains sprint plans through Sprint 19. These are planning documents only.

Agents must implement only the sprint assigned in the GitHub issue and active sprint section of this file.

Future sprint plans must not be implemented early unless an explicit approved issue changes the scope.
