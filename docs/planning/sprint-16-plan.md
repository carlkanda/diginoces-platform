# Sprint 16 Plan — AI Assistance

## 1. Sprint goal

Sprint 16 builds the **AI Assistance** foundation for the Diginoces platform.

The goal is to add permission-aware smart assistance that helps Diginoces/admin, staff, partners, bride, and groom users work faster without bypassing human approval, role permissions, auditability, or business rules.

Sprint 16 must establish:

- AI assistance architecture foundation;
- permission-aware AI request handling;
- AI suggestion model and audit trail;
- guest name cleanup suggestions;
- phone-number formatting suggestions;
- duplicate detection assistance;
- guest import mapping assistance;
- tag/category suggestion foundation;
- table assignment suggestion foundation;
- message drafting assistance;
- French/English template assistance;
- project status summary assistance;
- operational risk alert foundation;
- guest-message cleanup suggestion foundation;
- strict human approval before changes are applied.

Sprint 16 must not implement autonomous decision-making, automatic contract approval, payment exception approval, unexpected guest approval, automatic message sending, unauthorized data access, or actions that bypass locked workflow stages.

---

## 2. Source documents

Before coding, the agent must read and follow:

- `AGENTS.md`
- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/planning/sprint-15-plan.md`
- `docs/product/15-smart-assistance.md`
- `docs/product/02-user-roles-permissions-access-control.md`
- `docs/product/04-guest-management-guest-lists.md`
- `docs/product/07-whatsapp-communication-message-workflows.md`
- `docs/product/09-tables-seating-print-materials.md`
- `docs/product/11-post-event-messages.md`
- `docs/product/13-dashboards-reports-audit-logs.md`
- `docs/technical-design/api-backend-service-design.md`
- `docs/technical-design/security-permissions-access-control.md`
- `docs/backlog/master-requirements-register.csv`
- `docs/backlog/initial-product-backlog-epics.csv`
- `docs/backlog/initial-product-backlog-features.csv`
- `docs/backlog/initial-product-backlog-user-stories.csv`
- `docs/backlog/initial-product-backlog-tasks.csv`
- `docs/backlog/initial-product-backlog-test-cases.csv`

---

## 3. Sprint dependency

Sprint 16 depends on Sprint 15 being merged into `main`.

Sprint 16 must assume the MVP is already stable and release-hardened.

If Sprint 15 identifies launch blockers or unresolved security issues, Sprint 16 must not proceed until those blockers are resolved.

Sprint 16 should build on these foundations:

- role and permission system;
- audit-log system;
- guest management;
- guest import;
- RSVP/public page;
- invitations;
- WhatsApp/manual messaging;
- seating;
- check-in;
- contracts/payments;
- dashboards/reports;
- guest messages/feedback;
- files/storage;
- partner model.

---

## 4. Backlog scope

Sprint 16 focuses on the **AI Assistance** epic.

Primary epic:

- `EPIC-AI` — AI Assistance

Primary features:

- `FEAT-AI-001` — Permission-aware AI assistance foundation
- `FEAT-AI-002` — AI suggestion and approval workflow
- `FEAT-AI-003` — Guest data cleanup suggestions
- `FEAT-AI-004` — Duplicate detection assistance
- `FEAT-AI-005` — Import mapping assistance
- `FEAT-AI-006` — Message/template drafting assistance
- `FEAT-AI-007` — Table/seating suggestion assistance
- `FEAT-AI-008` — Project status summary assistance
- `FEAT-AI-009` — Operational risk alerts
- `FEAT-AI-010` — Guest-message cleanup suggestions

If the exact feature IDs differ in the CSV backlog, the agent must use the matching backlog rows and document the actual IDs in the Sprint 16 completion report.

---

## 5. Requirement IDs covered

Sprint 16 should primarily cover or begin coverage for:

- `AI-001` — AI assistance available to Diginoces/admin, staff, partners, bride, and groom, not guests in version 1
- `AI-002` — AI suggests, cleans, summarizes, and warns without bypassing human approval
- `AI-003` — AI suggestions respect the current user's permissions
- `AI-004` — Before list lock, bride/groom can apply AI suggestions within their own permissions
- `AI-005` — After list lock, AI suggestions become change requests or staff-controlled actions
- `AI-006` — Applied AI suggestions are audit logged with human user as accountable actor
- `ROLE-001` — Role-based permission model
- `ROLE-005` — Bride/groom own-side restrictions
- `REP-006` — Audit logs for sensitive actions
- `TECH-004` — Backend permission enforcement

Sprint 16 may reference other module requirements when AI assists them, but it must not create new autonomous product capabilities beyond the AI assistance scope.

---

## 6. In scope

Sprint 16 may implement the following.

### 6.1 AI assistance service foundation

Create a central AI assistance service layer.

The service should handle:

- user context;
- role/permission context;
- project/event/guest scope;
- allowed action types;
- data minimization;
- suggestion creation;
- suggestion status;
- application approval;
- audit logging.

AI assistance must never directly write sensitive data without an authorized human approval action.

### 6.2 AI suggestion model

Add database support for AI suggestions.

A suggestion should record:

- suggestion ID;
- project ID;
- event ID if applicable;
- target object type;
- target object ID;
- suggestion type;
- original value snapshot;
- suggested value;
- explanation;
- confidence level if used;
- created_for_user;
- created_by_system;
- status;
- approved_by;
- rejected_by;
- applied_by;
- timestamps;
- audit reference.

Recommended statuses:

```text
pending
accepted
rejected
applied
expired
converted_to_change_request
cancelled
```

### 6.3 Permission-aware AI behavior

AI suggestions must respect the user's role and assignment.

Examples:

- bride cannot request or apply suggestions that modify groom-side guests;
- groom cannot request or apply suggestions that modify bride-side guests;
- partner cannot request revenue/payment suggestions;
- check-in staff cannot use AI to access contracts/payments;
- guests do not use AI assistance in version 1.

Backend permission enforcement is required. Frontend hiding is not enough.

### 6.4 Human approval workflow

AI suggestions must be reviewed by a human before data changes are applied.

Allowed actions:

- accept suggestion;
- reject suggestion;
- edit suggestion before applying;
- convert to change request after lock;
- apply suggestion if user has permission;
- send to Diginoces/admin/staff review.

The human user who applies the suggestion is the accountable actor.

### 6.5 Guest name cleanup suggestions

AI may suggest cleanup for guest names.

Examples:

- capitalization correction;
- whitespace cleanup;
- duplicate punctuation removal;
- title/display-name formatting;
- long name formatting warnings.

AI should not change names automatically.

### 6.6 Phone-number formatting suggestions

AI may suggest normalized phone/WhatsApp number formatting.

Rules:

- preserve original value;
- suggest normalized display/usable value;
- flag ambiguous/invalid numbers;
- never invent missing numbers;
- respect printed-only guest rule.

### 6.7 Duplicate detection assistance

AI may assist duplicate detection by suggesting possible duplicates based on:

- similar names;
- same phone/WhatsApp;
- similar spelling;
- bride/groom overlap;
- imported rows vs existing guests.

AI must not merge duplicates automatically.

### 6.8 Guest import mapping assistance

AI may suggest mapping uploaded CSV/Excel columns to Diginoces fields.

Examples:

- `Nom complet` → `guest.display_name`
- `Téléphone` → `guest.whatsapp_number`
- `Côté` → `guest.side`
- `Titre` → `guest_title_type`

User must confirm mapping before import processing.

### 6.9 Tag/category suggestions

AI may suggest tags/categories for guests.

Examples:

- family;
- friends;
- colleagues;
- VIP;
- protocol;
- printed invitation;
- child;
- follow-up needed.

The user must approve tag assignment.

### 6.10 Table/seating suggestions

AI may suggest table assignments using available data.

Possible criteria:

- guest side;
- family/category tags;
- RSVP status;
- VIP/protocol tags;
- table capacity;
- existing assignments;
- avoid over-capacity.

AI must not override locked seating, capacity warnings, or permissions.

### 6.11 Message/template drafting assistance

AI may draft or improve message templates.

Examples:

- invitation message draft;
- RSVP reminder draft;
- Maybe follow-up draft;
- modification notice draft;
- event reminder draft;
- French/English wording support.

Diginoces/admin or authorized staff must approve templates before operational use.

AI must not send messages automatically.

### 6.12 Project status summary assistance

AI may summarize project status for authorized users.

Summary inputs may include:

- project status;
- event progress;
- guest counts;
- RSVP progress;
- invitation progress;
- seating progress;
- payment gate status;
- check-in readiness;
- open blockers.

The summary must respect the user's visibility.

Partners and couples must not receive internal revenue/audit/internal-note data.

### 6.13 Operational risk alerts

AI may generate risk alerts such as:

- many guests missing WhatsApp numbers;
- many pending RSVP responses near deadline;
- guests not assigned to tables;
- invitation generation failures;
- payment gate still locked;
- check-in not configured near event date;
- duplicate guests likely present.

Risk alerts should be advisory only.

### 6.14 Guest-message cleanup suggestions

AI may suggest cleanup for guest written messages before guest-book export.

Rules:

- preserve original submitted text;
- suggest edited/print-ready version;
- admin/couple review remains required;
- do not change emotional meaning;
- do not publish automatically.

### 6.15 Lock-stage behavior

AI behavior must respect list/workflow locks.

Before lock:

- authorized users may apply suggestions directly within permissions.

After lock:

- suggestions become change requests or staff/admin-controlled actions.

AI must not bypass lock state.

### 6.16 AI audit logging

AI-related actions that should be audited include:

- AI suggestion generated;
- AI suggestion accepted;
- AI suggestion rejected;
- AI suggestion applied;
- AI suggestion converted to change request;
- AI-assisted template draft approved;
- AI-assisted guest data change applied;
- AI-assisted cleanup exported.

Audit entries must identify the human actor who accepted/applied the suggestion.

### 6.17 Basic UI

Add basic UI for:

- AI suggestion panel;
- suggestion review list;
- accept/reject/apply controls;
- explanation/confidence display if used;
- before/after comparison;
- project status summary card;
- risk alert list;
- AI-assisted import mapping review;
- AI-assisted message draft review.

Keep UI simple, transparent, and clearly advisory.

---

## 7. Out of scope

Do not implement the following in Sprint 16:

- autonomous contract approval;
- autonomous payment exception approval;
- autonomous unexpected guest approval;
- automatic WhatsApp sending;
- automatic guest deletion/merge;
- automatic seating overwrite after lock;
- AI access to unauthorized revenue/payment/internal-note/audit data;
- AI assistance for guests;
- direct LLM provider production integration without security review;
- storing sensitive prompts/responses without retention policy;
- advanced AI agents that modify multiple modules without human review;
- predictive business analytics beyond simple advisory risk alerts.

If a future dependency is discovered, document it as a follow-up. Do not build it silently.

---

## 8. Recommended database objects

The agent may choose final names based on existing conventions, but the following objects are expected conceptually:

```text
ai_suggestions
ai_suggestion_events
ai_risk_alerts
ai_prompt_templates
ai_usage_events
```

Optional, if useful and low-risk:

```text
ai_suggestion_batches
ai_assistance_settings
ai_redaction_logs
```

The implementation must integrate with existing user, role, permission, guest, import, message, seating, report, file, and audit foundations.

Do not create autonomous action tables that bypass normal module workflows.

---

## 9. Recommended backend/API foundations

The agent may implement API routes, server actions, or service modules according to the existing app architecture.

Expected service capabilities:

- request AI suggestion;
- create suggestion record;
- list suggestions by project/module/user;
- accept suggestion;
- reject suggestion;
- apply suggestion with permission check;
- convert suggestion to change request;
- generate guest cleanup suggestions;
- generate duplicate suggestions;
- generate import mapping suggestions;
- generate message draft suggestions;
- generate seating suggestions;
- generate project status summary;
- generate risk alerts;
- write audit logs.

All backend operations must enforce permissions server-side.

---

## 10. Permission rules

Sprint 16 must enforce or prepare these permission rules.

### 10.1 Diginoces/admin

Can:

- use AI across authorized platform areas;
- review and apply AI suggestions;
- approve AI-assisted templates;
- view AI suggestions and risk alerts;
- configure AI assistance settings if implemented.

### 10.2 Diginoces staff

Can use AI according to assigned project/event permissions.

Staff should only see and apply suggestions for data they are allowed to access and modify.

### 10.3 Bride/groom

Can use AI for their own allowed project actions, such as:

- cleaning own-side guest names;
- mapping own-side guest import columns;
- suggesting tags for own guests;
- reviewing safe project summaries.

Bride/groom cannot use AI to modify partner-side guest lists or access internal data.

### 10.4 Partner

Can use AI only for assigned project operational areas that partners are allowed to access.

Partners cannot use AI to access revenue, payment details, internal notes, audit logs, or hidden Diginoces data.

### 10.5 Guest

Guests do not use AI assistance in version 1.

---

## 11. Testing expectations

Sprint 16 must add tests for AI assistance permissions and suggestion workflows.

At minimum, tests should cover:

- AI suggestion respects user's permission scope;
- bride cannot get/apply groom-side guest modification suggestion;
- groom cannot get/apply bride-side guest modification suggestion;
- partner cannot request AI summary containing revenue/payment/audit/internal-note data;
- AI suggestion does not apply automatically;
- accepted suggestion requires human actor;
- applied suggestion writes audit entry or calls audit abstraction;
- post-lock suggestion becomes change request or controlled action;
- duplicate suggestion does not auto-merge guests;
- message draft suggestion does not send message;
- guest-message cleanup preserves original text;
- project summary excludes unauthorized fields;
- risk alerts are advisory only;
- guests cannot access AI assistance;
- out-of-scope autonomous actions are not introduced.

CI must continue to pass:

```text
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

If database linting requires Supabase authentication, keep it documented as a local/manual check unless CI secrets are explicitly configured.

---

## 12. Acceptance criteria

Sprint 16 is complete only when:

- AI assistance service foundation exists;
- AI suggestion model exists;
- permission-aware AI behavior exists;
- human approval workflow exists;
- guest cleanup suggestions exist;
- duplicate assistance exists;
- import mapping assistance exists;
- message draft assistance exists;
- project status summary assistance exists;
- risk alert foundation exists;
- lock-stage behavior is respected;
- unauthorized data is not exposed through AI;
- AI actions are audited with human accountability;
- tests are added and pass;
- CI passes;
- documentation is updated;
- Sprint 16 completion report is created.

---

## 13. Required deliverables

The Sprint 16 PR must include:

- database migration(s) for AI suggestions, events, alerts, and settings if needed;
- TypeScript types updated/generated as needed;
- AI assistance service foundation;
- permission-aware suggestion logic;
- suggestion approval/apply workflow;
- guest cleanup suggestion logic;
- duplicate/import mapping/message/seating/status/risk suggestion foundations;
- audit integration for AI actions;
- minimal UI for suggestions, status summaries, and risk alerts;
- tests for AI permissions and suggestion behavior;
- documentation updates;
- `docs/planning/sprint-16-completion-report.md`.

---

## 14. Sprint 16 completion report template

The agent must create:

```text
docs/planning/sprint-16-completion-report.md
```

The report must include:

- sprint status;
- requirement IDs covered;
- backlog items covered;
- files created or changed;
- database migrations added;
- tests added;
- commands run;
- checks passed or failed;
- security checks performed;
- AI permission behavior implemented;
- suggestion workflow behavior implemented;
- human approval behavior implemented;
- audit-log behavior implemented;
- assumptions made;
- open issues or blockers;
- out-of-scope items intentionally deferred;
- recommended Sprint 17 scope.

---

## 15. Recommended Sprint 17 scope

Sprint 17 should handle:

- advanced integrations;
- official WhatsApp API integration if available;
- Google Calendar sync;
- deeper Canva integration research/foundation;
- webhook/integration event foundation;
- external provider configuration;
- integration monitoring and error handling.

Sprint 17 should not build SaaS/white-label partner scaling unless the approved roadmap changes.

---

## 16. Codex prompt for Sprint 16

Use this prompt when assigning Codex to Sprint 16:

```text
You are the Orchestrator Agent for the Diginoces platform.

Repository: carlkanda/diginoces-platform

Work only on Sprint 16: AI Assistance.

Before coding, read AGENTS.md and the relevant documents:
- docs/planning/sprint-16-plan.md
- docs/planning/sprint-15-plan.md
- docs/planning/mvp-build-execution-plan.md
- docs/product/15-smart-assistance.md
- docs/product/02-user-roles-permissions-access-control.md
- docs/product/04-guest-management-guest-lists.md
- docs/product/07-whatsapp-communication-message-workflows.md
- docs/product/09-tables-seating-print-materials.md
- docs/product/11-post-event-messages.md
- docs/product/13-dashboards-reports-audit-logs.md
- docs/technical-design/api-backend-service-design.md
- docs/technical-design/security-permissions-access-control.md
- docs/backlog/master-requirements-register.csv
- docs/backlog/initial-product-backlog-epics.csv
- docs/backlog/initial-product-backlog-features.csv
- docs/backlog/initial-product-backlog-user-stories.csv
- docs/backlog/initial-product-backlog-tasks.csv
- docs/backlog/initial-product-backlog-test-cases.csv

Create a new branch:

codex/sprint-16-ai-assistance

Implement Sprint 16 only.

Required scope:
1. Add AI assistance service foundation.
2. Add AI suggestion model.
3. Add permission-aware AI behavior.
4. Add human approval workflow for suggestions.
5. Add guest name cleanup suggestions.
6. Add phone-number formatting suggestions.
7. Add duplicate detection assistance.
8. Add import mapping assistance.
9. Add tag/category suggestion foundation.
10. Add table/seating suggestion foundation.
11. Add message/template drafting assistance.
12. Add project status summary assistance.
13. Add operational risk alert foundation.
14. Add guest-message cleanup suggestions.
15. Add lock-stage behavior for AI suggestions.
16. Add audit logging for AI suggestion actions.
17. Add basic UI for suggestion review, summaries, and risk alerts.
18. Add tests.
19. Update documentation.
20. Create docs/planning/sprint-16-completion-report.md.
21. Open a draft PR titled: Sprint 16 — AI Assistance.

Out of scope:
- autonomous contract approval;
- autonomous payment exception approval;
- autonomous unexpected guest approval;
- automatic WhatsApp sending;
- automatic duplicate merge;
- AI access to unauthorized revenue/payment/internal-note/audit data;
- AI assistance for guests;
- advanced AI agents that modify multiple modules without human review.

The PR must reference the Sprint 16 issue.

Do not mark Sprint 16 complete unless tests/checks are documented.
```

---

## 17. Summary

Sprint 16 introduces AI assistance as a controlled helper, not as an autonomous decision-maker.

It should make Diginoces workflows faster and smarter while preserving permissions, human approval, auditability, and business-rule enforcement.

The expected result is a safe, permission-aware smart assistance foundation that prepares the platform for deeper integrations in Sprint 17.
