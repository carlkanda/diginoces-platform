# Sprint 7 Plan — WhatsApp Communication Workflows

## 1. Sprint goal

Sprint 7 builds the **WhatsApp Communication Workflows** foundation for the Diginoces platform.

The goal is to make Diginoces communication structured, traceable, permission-aware, and WhatsApp-first, while keeping a safe fallback for markets where official WhatsApp API access is unavailable or not yet configured.

Sprint 7 must establish:

- message template foundation;
- French/English template support;
- dynamic message variables;
- guided manual WhatsApp sending workflow;
- API-ready messaging abstraction;
- message preparation and status tracking;
- invitation sending readiness checks;
- invitation send/resend workflow foundation;
- modification/update message foundation;
- event reminder foundation;
- Maybe RSVP follow-up foundation;
- audit logging for communication actions;
- communication history per guest/event/project.

Sprint 7 must not build seating, check-in, contracts, pricing, payments, guest import, invitation PDF generation, or full WhatsApp API production integration unless the API abstraction is clearly separated from the MVP manual mode.

---

## 2. Source documents

Before coding, the agent must read and follow:

- `AGENTS.md`
- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/planning/sprint-6-plan.md`
- `docs/product/07-whatsapp-communication-message-workflows.md`
- `docs/product/06-invitation-template-pdf-generation.md`
- `docs/product/05-rsvp-public-guest-page.md`
- `docs/product/04-guest-management-guest-lists.md`
- `docs/product/10-contracts-pricing-payment-controls.md`
- `docs/technical-design/api-backend-service-design.md`
- `docs/technical-design/background-jobs-pdf-qr-whatsapp-offline-checkin.md`
- `docs/technical-design/security-permissions-access-control.md`
- `docs/backlog/master-requirements-register.csv`
- `docs/backlog/initial-product-backlog-epics.csv`
- `docs/backlog/initial-product-backlog-features.csv`
- `docs/backlog/initial-product-backlog-user-stories.csv`
- `docs/backlog/initial-product-backlog-tasks.csv`
- `docs/backlog/initial-product-backlog-test-cases.csv`

---

## 3. Sprint dependency

Sprint 7 depends on Sprint 6 being merged into `main`.

Sprint 7 must assume these foundations already exist:

- secure platform foundation;
- project and event models;
- guest model;
- guest event assignment model;
- RSVP foundation;
- public guest page token foundation;
- invitation record model;
- invitation file/version foundation;
- invitation generation validation foundation;
- app-owned storage abstraction;
- audit-log foundation;
- RBAC and permission foundations.

If any Sprint 6 dependency is missing, the agent must stop, report the blocker, and avoid creating workaround models that conflict with the planned architecture.

---

## 4. Backlog scope

Sprint 7 focuses on the **WhatsApp Communication Workflows** epic.

Primary epic:

- `EPIC-MSG` — WhatsApp Communication Workflows

Primary features:

- `FEAT-MSG-001` — Message template foundation
- `FEAT-MSG-002` — Multilingual template support
- `FEAT-MSG-003` — Dynamic message variables
- `FEAT-MSG-004` — Guided manual WhatsApp sending workflow
- `FEAT-MSG-005` — API-ready communication abstraction
- `FEAT-MSG-006` — Message status tracking
- `FEAT-MSG-007` — Invitation send/resend workflow foundation
- `FEAT-MSG-008` — Modification/update message workflow foundation
- `FEAT-MSG-009` — Event reminder foundation
- `FEAT-MSG-010` — Maybe RSVP follow-up foundation

If the exact feature IDs differ in the CSV backlog, the agent must use the matching backlog rows and document the actual IDs in the Sprint 7 completion report.

---

## 5. Requirement IDs covered

Sprint 7 should primarily cover or begin coverage for:

- `MSG-001` — WhatsApp-first communication with API mode plus guided manual mode
- `MSG-002` — Approved templates for invitation, RSVP, reminders, modifications, welcome, and resend messages
- `MSG-003` — French/English templates selected by guest preferred language
- `MSG-004` — Invitation sending gate until full payment/exception and required data are present
- `MSG-005` — Maybe follow-up reminders according to event schedule
- `MSG-006` — Detect changes that may require modification messages and let staff decide action
- `MSG-007` — Welcome/table message on first arrival only, placeholder only if needed
- `MSG-008` — Message statuses including prepared, queued, opened manually, sent, failed, skipped, resent
- `MSG-009` — Guided manual sending records staff, time, guest, event, and status
- `MSG-010` — Avoid unofficial WhatsApp Web automation as the primary method
- `PV-004` — Version 1 must be WhatsApp-first
- `RSVP-011` — Maybe reminders before RSVP deadline
- `INV-013` — Invitation statuses foundation
- `PAY-014` — Full payment unlocks invitation sending and guest public page access
- `PAY-015` — Payment exception override behavior, if already implemented or prepared
- `REP-006` — Audit logs for sensitive actions
- `TECH-005` — Background job pattern for heavy/scheduled tasks

Sprint 7 may reference future requirements, but it must not implement future modules unless explicitly in scope.

---

## 6. In scope

Sprint 7 may implement the following.

### 6.1 Message template model

Add database support for approved message templates.

A message template should record:

- template ID;
- message type;
- language;
- title/name;
- body content;
- variable placeholders;
- active/inactive status;
- version;
- created by;
- approved by, if implemented;
- created_at and updated_at timestamps.

Recommended message types:

```text
invitation
invitation_resend
rsvp_request
maybe_follow_up
event_reminder
modification_notice
welcome_table_placeholder
manual_custom
```

Only approved/active templates should be usable for operational sending.

### 6.2 Multilingual template support

Sprint 7 should support at least French and English templates.

Rules:

- guest preferred language selects template language;
- if the preferred language template is missing, fallback to project default language;
- fallback behavior must be explicit and testable;
- no live unreviewed translation should happen at send time.

### 6.3 Dynamic message variables

Templates should support dynamic variables such as:

```text
{{guest.display_name}}
{{couple.names}}
{{event.name}}
{{event.date}}
{{event.time}}
{{event.venue}}
{{public_guest_page_link}}
{{invitation_download_link}}
{{invitation.id}}
{{rsvp_deadline}}
{{table.name}}
{{table.code}}
```

Sprint 7 should validate that required variables can be resolved before preparing a message.

If a variable depends on a future module, such as table assignment, the template engine should handle it as optional or unavailable without breaking the message workflow.

### 6.4 Message rendering foundation

Add a service/helper that renders a template for a guest/event/project context.

Rendering should:

- select the right template;
- resolve variables;
- return rendered text;
- report missing required variables;
- prevent sending/preparation if required variables are missing;
- avoid exposing internal data in guest-facing messages.

### 6.5 Message log model

Add database support for message logs.

A message log should record:

- project ID;
- event ID, if applicable;
- guest ID, if applicable;
- invitation ID, if applicable;
- message type;
- language;
- template ID/version;
- rendered body or safe rendered preview;
- channel;
- sending mode;
- status;
- prepared by;
- sent/confirmed by;
- timestamps;
- error message if failed;
- audit reference where appropriate.

Recommended statuses:

```text
not_prepared
prepared
queued
opened_manually
sent
failed
skipped
resent
cancelled
```

Recommended modes:

```text
guided_manual
api_ready
api_sent
```

Sprint 7 should prioritize `guided_manual`.

### 6.6 Guided manual WhatsApp sending

Because WhatsApp API availability may be limited, guided manual mode is a first-class MVP workflow.

The app should:

1. select eligible guests/messages;
2. validate readiness;
3. render the correct message;
4. show the target WhatsApp number;
5. provide a WhatsApp click/open link when possible;
6. let staff confirm status: sent, skipped, failed;
7. record staff user and timestamp;
8. move to the next guest/message;
9. avoid sending the wrong invitation/message to the wrong guest.

The system must not rely on unofficial WhatsApp Web automation.

### 6.7 API-ready messaging abstraction

Sprint 7 should prepare a messaging adapter abstraction for future official WhatsApp API use.

The abstraction should support:

- prepare message;
- enqueue message;
- mark sent;
- mark failed;
- track external provider ID if available later;
- switch between manual and API modes.

Do not hardcode unofficial automation.

Do not require real WhatsApp API credentials for Sprint 7.

### 6.8 Invitation sending readiness

Before invitation messages can be prepared or sent, the system should check:

- guest belongs to the project/event;
- guest is invited to the event;
- invitation exists and is generated;
- latest active invitation file exists;
- guest has WhatsApp number unless printed-only/manual exception applies;
- public guest page is unlocked or appropriate message type allows preparation;
- full payment or payment exception is satisfied for guest-facing access/sending if payment gate foundation exists;
- message template exists in the correct language or fallback language.

If payment module is not fully implemented yet, use the existing access-check abstraction and document any gap.

### 6.9 Invitation send/resend workflow

Sprint 7 should support message preparation and tracking for initial invitation sends and resends.

Rules:

- initial send should use the latest active invitation/public page link;
- resend should not create a new invitation file;
- resend should create a separate message log;
- sent/resent status should update message history and optionally invitation status if existing design supports it;
- failed/skipped messages should remain visible for follow-up.

Do not implement PDF generation in Sprint 7. Use Sprint 6 invitation records/files.

### 6.10 Modification/update messages

When guest/invitation/event data changes after invitation generation or sending, the system should prepare a modification/update workflow foundation.

Examples:

- corrected guest name;
- event venue/time changed;
- public guest page link regenerated;
- invitation regenerated;
- RSVP deadline changed.

Sprint 7 should detect or accept a change-reason context and recommend/prepare a modification message.

Staff should decide whether to send it.

### 6.11 Maybe RSVP follow-up foundation

Sprint 7 should prepare reminder/follow-up messages for guests with `Maybe` RSVP status.

Rules:

- event-specific RSVP deadline is used;
- default reminder schedule may be represented as configuration;
- the system should prepare or queue reminders, not necessarily send automatically;
- guided manual sending remains acceptable;
- guests whose RSVP changed away from Maybe should not receive Maybe follow-up.

Do not build a full scheduler if background jobs are not ready. A safe job foundation or manual reminder queue is acceptable.

### 6.12 Event reminder foundation

Sprint 7 may prepare event reminders.

Event reminders should be event-specific and use the guest’s event assignment.

Do not build full calendar/scheduler automation unless already supported by the background-job foundation.

### 6.13 Communication history

Authorized internal users should be able to view communication history for:

- a guest;
- an event;
- a project;
- an invitation.

History should show:

- message type;
- language;
- channel/mode;
- status;
- staff user;
- timestamp;
- failure/skipped reason if present.

Guest users should not see internal communication logs.

### 6.14 Audit logging

Communication-related actions that should be audited include:

- message template created/updated/activated/deactivated;
- message prepared;
- WhatsApp link opened manually;
- message marked sent;
- message marked failed;
- message skipped;
- message resent;
- reminder prepared;
- modification notice prepared;
- template fallback used, if important.

Audit logs must not expose secrets or sensitive provider credentials.

### 6.15 Basic UI

Add basic UI for:

- message template list;
- message template create/edit foundation;
- invitation sending queue/list;
- guided manual send screen;
- message preview;
- status confirmation buttons;
- message history;
- Maybe follow-up list/foundation;
- event reminder list/foundation.

Keep UI simple and operational.

Sprint 7 is not final communication UX polish.

---

## 7. Out of scope

Do not implement the following in Sprint 7:

- unofficial WhatsApp Web automation;
- production WhatsApp API integration requiring real credentials;
- seating/table assignment;
- check-in scan flow;
- check-in welcome message final behavior;
- contracts;
- pricing;
- full payment module;
- invitation PDF generation;
- QR generation;
- guest import;
- full reports/dashboard module;
- partner project creation;
- automatic message sending without human or approved workflow controls;
- full notification center.

If a future dependency is discovered, document it as a follow-up. Do not build it silently.

---

## 8. Recommended database objects

The agent may choose final names based on existing conventions, but the following objects are expected conceptually:

```text
message_templates
message_template_versions
message_logs
message_recipients
message_queue_items
message_render_events
```

Optional, if useful and low-risk:

```text
message_template_variables
message_reminder_rules
message_status_events
```

The implementation must integrate with existing project, event, guest, RSVP, invitation, file, permission, and audit foundations.

Do not create seating, check-in, contract, pricing, payment, or partner domain tables in Sprint 7.

---

## 9. Recommended backend/API foundations

The agent may implement API routes, server actions, or service modules according to the existing app architecture.

Expected service capabilities:

- create/edit message template;
- activate/deactivate template;
- select template by message type and language;
- render message variables;
- validate message readiness;
- create message log;
- prepare invitation message;
- prepare invitation resend message;
- prepare Maybe follow-up message;
- prepare event reminder message;
- prepare modification/update message;
- create guided manual WhatsApp open link;
- mark message opened manually;
- mark message sent;
- mark message failed;
- mark message skipped;
- list message history by guest/event/project;
- write audit logs.

All backend operations must enforce permissions server-side.

---

## 10. Permission rules

Sprint 7 must enforce or prepare these permission rules.

### 10.1 Diginoces/admin

Can:

- manage message templates;
- configure template languages;
- prepare/send/mark messages;
- view communication history;
- manage reminder settings if implemented;
- view failed/skipped message logs.

### 10.2 Diginoces staff

Can act according to assigned permissions.

Possible staff permissions:

- prepare messages;
- use guided manual sending;
- mark messages sent/skipped/failed;
- view communication history for assigned projects/events;
- prepare reminders;
- prepare resends.

Staff should not automatically manage templates unless the RBAC foundation grants that permission.

### 10.3 Bride/groom

Can:

- possibly view high-level communication progress if already supported by role rules.

Cannot:

- send official Diginoces WhatsApp messages from the platform unless explicitly permitted later;
- manage approved templates;
- see internal sending logs beyond allowed progress indicators;
- bypass payment gate or sending readiness checks.

### 10.4 Guest

Guests do not need accounts and do not access the communication history in Sprint 7.

Guest-facing message content is delivered through WhatsApp/manual mode or future API mode, not through an admin message center.

---

## 11. Testing expectations

Sprint 7 must add tests for communication workflows.

At minimum, tests should cover:

- template can be created for a message type and language;
- inactive template cannot be used for operational sending;
- guest preferred language selects correct template;
- fallback language behavior works;
- dynamic variables render correctly;
- missing required variables block preparation;
- invitation message readiness checks generated invitation exists;
- missing WhatsApp number blocks digital send unless printed-only/manual rule applies;
- payment gate/access-check blocks sending when required;
- guided manual mode creates a prepared/opened message log;
- staff confirmation marks message sent;
- failed/skipped status is recorded with reason;
- resend creates separate message log;
- Maybe follow-up excludes guests who are no longer Maybe;
- modification message can be prepared from a change context;
- unauthorized users cannot manage templates;
- unauthorized users cannot mark messages sent;
- communication actions produce audit entries or call audit abstraction;
- out-of-scope modules are not introduced.

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

Sprint 7 is complete only when:

- message template foundation exists;
- French/English template support exists;
- dynamic variable rendering exists;
- message readiness validation exists;
- guided manual WhatsApp workflow exists;
- message log/status tracking exists;
- invitation send/resend preparation exists;
- Maybe follow-up foundation exists;
- modification/update message foundation exists;
- event reminder foundation exists or is documented as controlled placeholder;
- communication history exists for authorized users;
- API-ready messaging abstraction exists without requiring real credentials;
- permission checks prevent unauthorized template and message actions;
- audit logging exists for communication actions;
- tests are added and pass;
- CI passes;
- documentation is updated;
- Sprint 7 completion report is created.

---

## 13. Required deliverables

The Sprint 7 PR must include:

- database migration(s) for message templates, logs, and queue/status foundations;
- TypeScript types updated/generated as needed;
- template management logic;
- message rendering logic;
- message readiness validation logic;
- guided manual WhatsApp workflow logic;
- API-ready messaging adapter abstraction;
- invitation send/resend preparation logic;
- Maybe follow-up preparation logic;
- modification/update message preparation logic;
- communication history logic;
- permission checks for communication operations;
- audit integration for communication actions;
- minimal UI for templates, sending queue, guided manual send, and history;
- tests for communication workflow foundation;
- documentation updates;
- `docs/planning/sprint-7-completion-report.md`.

---

## 14. Sprint 7 completion report template

The agent must create:

```text
docs/planning/sprint-7-completion-report.md
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
- template behavior implemented;
- guided manual sending behavior implemented;
- message status tracking implemented;
- reminder/follow-up behavior implemented;
- audit-log behavior implemented;
- assumptions made;
- open issues or blockers;
- out-of-scope items intentionally deferred;
- recommended Sprint 8 scope.

---

## 15. Recommended Sprint 8 scope

Sprint 8 should handle:

- event-specific tables;
- table capacities;
- guest-to-table assignment;
- table occupancy warnings;
- list/table seating view;
- visual seating map foundation if practical;
- Canva CSV export for table cards;
- printed invitation tracking foundation, if not already covered.

Sprint 8 should not build check-in, contracts, pricing, or payments unless the approved roadmap changes.

---

## 16. Codex prompt for Sprint 7

Use this prompt when assigning Codex to Sprint 7:

```text
You are the Orchestrator Agent for the Diginoces platform.

Repository: carlkanda/diginoces-platform

Work only on Sprint 7: WhatsApp Communication Workflows.

Before coding, read AGENTS.md and the relevant documents:
- docs/planning/sprint-7-plan.md
- docs/planning/sprint-6-plan.md
- docs/planning/mvp-build-execution-plan.md
- docs/product/07-whatsapp-communication-message-workflows.md
- docs/product/06-invitation-template-pdf-generation.md
- docs/product/05-rsvp-public-guest-page.md
- docs/product/04-guest-management-guest-lists.md
- docs/product/10-contracts-pricing-payment-controls.md
- docs/technical-design/api-backend-service-design.md
- docs/technical-design/background-jobs-pdf-qr-whatsapp-offline-checkin.md
- docs/technical-design/security-permissions-access-control.md
- docs/backlog/master-requirements-register.csv
- docs/backlog/initial-product-backlog-epics.csv
- docs/backlog/initial-product-backlog-features.csv
- docs/backlog/initial-product-backlog-user-stories.csv
- docs/backlog/initial-product-backlog-tasks.csv
- docs/backlog/initial-product-backlog-test-cases.csv

Create a new branch:

codex/sprint-7-whatsapp-communication-workflows

Implement Sprint 7 only.

Required scope:
1. Add message template foundation.
2. Add French/English template support.
3. Add dynamic message variable rendering.
4. Add message readiness validation.
5. Add guided manual WhatsApp sending workflow.
6. Add API-ready messaging adapter abstraction without real credentials.
7. Add message logs and status tracking.
8. Add invitation send/resend preparation workflow.
9. Add Maybe RSVP follow-up foundation.
10. Add event reminder foundation or controlled placeholder.
11. Add modification/update message foundation.
12. Add communication history for authorized users.
13. Add permission checks for template and message actions.
14. Add audit logging for communication actions.
15. Add basic UI for templates, sending queue, guided manual send, and history.
16. Add tests.
17. Update documentation.
18. Create docs/planning/sprint-7-completion-report.md.
19. Open a draft PR titled: Sprint 7 — WhatsApp Communication Workflows.

Out of scope:
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

The PR must reference the Sprint 7 issue.

Do not mark Sprint 7 complete unless tests/checks are documented.
```

---

## 17. Summary

Sprint 7 turns generated invitations and RSVP data into controlled WhatsApp-first operational communication.

It should make communication safer, traceable, and structured without depending on unavailable or unofficial WhatsApp automation.

The expected result is a guided manual sending workflow with API-ready architecture, message templates, status tracking, reminders/follow-ups, auditability, and clear preparation for Sprint 8 seating and print operations.
