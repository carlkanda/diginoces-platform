# Sprint 17 Plan — Advanced Integrations

## 1. Sprint goal

Sprint 17 builds the **Advanced Integrations** foundation for the Diginoces platform.

The goal is to connect the Diginoces MVP to selected external services in a controlled, secure, auditable, and provider-agnostic way, while preserving the existing manual fallback workflows.

Sprint 17 must establish:

- integration architecture foundation;
- integration provider configuration model;
- official WhatsApp API integration foundation if available;
- WhatsApp API/manual mode switch;
- Google Calendar sync foundation;
- Canva integration research/foundation;
- webhook/integration event foundation;
- integration logs and monitoring;
- integration error handling;
- retry and fallback behavior;
- secure secret/configuration handling;
- audit logging for integration actions.

Sprint 17 must not build SaaS/white-label partner scaling, partner commission management, online payment processing, native mobile apps, or uncontrolled third-party automation.

---

## 2. Source documents

Before coding, the agent must read and follow:

- `AGENTS.md`
- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/planning/sprint-16-plan.md`
- `docs/product/07-whatsapp-communication-message-workflows.md`
- `docs/product/06-invitation-template-pdf-generation.md`
- `docs/product/09-tables-seating-print-materials.md`
- `docs/product/11-post-event-messages.md`
- `docs/product/14-files-storage-retention-security.md`
- `docs/product/16-technical-architecture.md`
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

Sprint 17 depends on Sprint 16 being merged into `main`.

Sprint 17 must assume these foundations already exist:

- secure platform foundation;
- project and event models;
- guest, RSVP, invitation, messaging, seating, check-in, file, report, partner, feedback, and AI assistance foundations;
- WhatsApp guided manual workflow;
- invitation generation and file storage;
- Canva CSV export workflows;
- audit-log foundation;
- RBAC and permission foundations;
- environment/secrets documentation from release hardening.

If any Sprint 16 dependency is missing, the agent must stop, report the blocker, and avoid creating workaround integrations that bypass planned architecture.

---

## 4. Backlog scope

Sprint 17 focuses on the **Advanced Integrations** epic.

Primary epic:

- `EPIC-INT` — Integrations

Primary features:

- `FEAT-INT-001` — Integration provider configuration foundation
- `FEAT-INT-002` — Official WhatsApp API integration foundation
- `FEAT-INT-003` — WhatsApp manual/API mode switching
- `FEAT-INT-004` — Google Calendar sync foundation
- `FEAT-INT-005` — Canva integration research/foundation
- `FEAT-INT-006` — Webhook and integration event foundation
- `FEAT-INT-007` — Integration error handling and retry foundation
- `FEAT-INT-008` — Integration logs and monitoring
- `FEAT-INT-009` — Secure integration secret handling

If the exact feature IDs differ in the CSV backlog, the agent must use the matching backlog rows and document the actual IDs in the Sprint 17 completion report.

---

## 5. Requirement IDs covered

Sprint 17 should primarily cover or begin coverage for:

- `MSG-001` — WhatsApp-first communication with API mode plus guided manual fallback
- `MSG-010` — Avoid unofficial WhatsApp Web automation as primary method
- `TECH-008` — Google Calendar sync can be supported for events and reminders
- `TECH-009` — Canva integration can be explored later; CSV export remains MVP baseline
- `TECH-005` — Background job/queue pattern for heavy and scheduled tasks
- `FILE-008` — Canva/export files stored with metadata and versioning
- `PV-004` — Version 1 communication is WhatsApp-first
- `PV-005` — Canva remains design/export tool while app supplies structured data
- `REP-006` — Audit logs for sensitive actions
- `TECH-004` — Backend permission enforcement

Sprint 17 may reference future integration requirements, but it must not implement new business models or SaaS scaling capabilities unless explicitly in scope.

---

## 6. In scope

Sprint 17 may implement the following.

### 6.1 Integration provider model

Add a provider-agnostic integration model.

An integration provider should record:

- provider ID;
- provider type;
- provider name;
- status;
- configuration metadata;
- environment scope;
- created_by;
- updated_by;
- created_at and updated_at timestamps.

Recommended provider types:

```text
whatsapp_business_api
google_calendar
canva
webhook
custom
```

Sensitive credentials must not be stored in plain database fields unless an approved secrets mechanism is implemented.

### 6.2 Integration status lifecycle

Integration providers should support statuses such as:

```text
not_configured
configured
testing
active
paused
failed
disabled
```

Status changes must be auditable.

### 6.3 Secure integration secret handling

Integration secrets must be handled securely.

Rules:

- do not commit credentials;
- do not expose secrets to the frontend;
- use environment variables or secure secret storage;
- show only masked values in UI;
- audit configuration changes without logging secret values;
- document required environment variables.

Examples:

```text
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_BUSINESS_ACCOUNT_ID
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
CANVA_CLIENT_ID
CANVA_CLIENT_SECRET
```

### 6.4 Official WhatsApp API integration foundation

If official WhatsApp Business API access is available, Sprint 17 may implement the API integration foundation.

The implementation should support:

- provider configuration;
- template/message sending adapter;
- API mode selection;
- message queue integration;
- provider message ID tracking;
- success/failure callbacks or polling foundation;
- retry behavior;
- fallback to guided manual mode.

If real WhatsApp API credentials are unavailable, implement the adapter interface, configuration validation, and mock/test provider only.

Do not use unofficial WhatsApp Web automation.

### 6.5 WhatsApp mode switching

The messaging system should support modes:

```text
guided_manual
api_ready
api_enabled
api_paused
```

Rules:

- guided manual remains available even when API exists;
- if API fails, staff can continue in manual mode;
- message status must clearly indicate the mode used;
- no automatic sending should happen without approved workflow rules.

### 6.6 WhatsApp webhook foundation

If API mode is implemented, prepare webhook foundation for provider events.

Webhook events may include:

- delivered;
- failed;
- read;
- rejected;
- template error;
- rate limit warning.

Webhook processing must:

- verify source/authenticity where possible;
- avoid trusting unverified payloads;
- update message logs safely;
- write integration event logs;
- avoid leaking secrets.

### 6.7 Google Calendar sync foundation

Sprint 17 may implement Google Calendar sync foundation for project/events.

Scope:

- configure Google Calendar provider;
- create/update event calendar entries;
- store external calendar event ID;
- sync Diginoces event date/time/location changes;
- mark sync status;
- handle sync failures;
- audit sync actions.

Rules:

- calendar sync should be optional;
- failure should not break core Diginoces event operations;
- sensitive project data should not be pushed unnecessarily;
- calendar entries should contain safe event information only.

### 6.8 Canva integration research/foundation

Canva remains the design tool, and CSV export remains the reliable baseline.

Sprint 17 may add Canva integration research/foundation:

- document available integration approach;
- create provider placeholder;
- prepare export/import abstraction;
- keep existing CSV workflows intact;
- avoid blocking platform operations on Canva API availability.

Do not replace Canva Bulk Create CSV workflows unless an explicit approved integration is ready.

### 6.9 Webhook/integration event foundation

Create an integration event log foundation.

Integration events should record:

- provider type;
- provider ID;
- event type;
- related project/event/guest/message/file if applicable;
- external reference ID;
- payload summary or redacted payload;
- status;
- error message if failed;
- created_at timestamp.

Raw provider payloads should be redacted or stored carefully to avoid exposing secrets or sensitive data.

### 6.10 Integration retry and fallback behavior

Add retry/fallback rules.

Examples:

- WhatsApp API send fails → mark failed and allow guided manual fallback;
- Calendar sync fails → mark sync_failed and allow retry;
- Canva integration unavailable → use CSV export baseline;
- webhook processing fails → record failed event and do not corrupt message state.

Retries should be bounded and auditable.

### 6.11 Integration monitoring

Add basic monitoring views or summaries:

- integration status;
- recent integration errors;
- failed WhatsApp API messages;
- calendar sync failures;
- webhook processing failures;
- provider paused/disabled status.

This may be integrated into existing dashboards.

### 6.12 Integration admin UI

Add basic admin UI for:

- list integrations;
- view provider status;
- configure non-secret metadata;
- test connection where safe;
- pause/resume provider;
- view integration event logs;
- view error history.

Secret entry should be handled carefully and never exposed back in full.

### 6.13 Audit logging

Integration actions that should be audited include:

- provider configured;
- provider enabled/disabled;
- provider paused/resumed;
- connection tested;
- WhatsApp API message sent/failed;
- manual fallback used after API failure;
- Google Calendar event created/updated/deleted;
- webhook received/processed;
- integration secret changed, without recording secret value;
- Canva integration export/import event if implemented.

---

## 7. Out of scope

Do not implement the following in Sprint 17:

- unofficial WhatsApp Web automation;
- direct Canva replacement of existing design workflow;
- online payment provider integration;
- accounting integrations;
- native mobile apps;
- white-label SaaS;
- partner commission management;
- partner billing;
- advanced AI agents;
- public API for third-party partners;
- full data warehouse/BI integrations;
- automatic destructive sync behavior.

If a future dependency is discovered, document it as a follow-up. Do not build it silently.

---

## 8. Recommended database objects

The agent may choose final names based on existing conventions, but the following objects are expected conceptually:

```text
integration_providers
integration_settings
integration_events
integration_errors
external_references
webhook_events
```

Optional, if useful and low-risk:

```text
integration_retry_jobs
calendar_sync_events
whatsapp_provider_messages
canva_integration_events
```

The implementation must integrate with existing project, event, guest, message, file, dashboard, permission, and audit foundations.

Do not create partner billing, commission, white-label SaaS, or payment provider tables in Sprint 17.

---

## 9. Recommended backend/API foundations

The agent may implement API routes, server actions, background jobs, or service modules according to the existing app architecture.

Expected service capabilities:

- list integration providers;
- configure provider metadata;
- validate provider configuration;
- test provider connection;
- enable/disable provider;
- pause/resume provider;
- send WhatsApp message through API adapter when configured;
- fallback to guided manual mode;
- process WhatsApp provider event/webhook;
- create/update Google Calendar event;
- track external references;
- log integration event;
- handle retry/failure status;
- expose integration monitoring summary;
- write audit logs.

All backend operations must enforce permissions server-side.

---

## 10. Permission rules

Sprint 17 must enforce or prepare these permission rules.

### 10.1 Diginoces/admin

Can:

- configure integrations;
- enable/disable providers;
- view integration logs;
- run safe connection tests;
- manage provider status;
- view integration errors.

### 10.2 Diginoces staff

Can act according to assigned permissions.

Possible staff permissions:

- use configured WhatsApp sending mode;
- retry failed messages;
- view integration status for assigned projects;
- use manual fallback;
- trigger calendar sync if allowed.

Staff should not manage provider credentials unless explicitly granted.

### 10.3 Partner

Partners should not configure global integrations.

Partners may benefit from project communication workflows only within permitted project scope.

Partners must not access provider secrets, integration logs containing sensitive data, or global integration settings.

### 10.4 Bride/groom

Bride/groom do not configure integrations.

They may see safe results of integrations only where part of existing project UI, such as event calendar status or message progress if allowed.

### 10.5 Guest

Guests do not access integration settings or logs.

Guest-facing messages/events are outputs of integrations, not integration controls.

---

## 11. Testing expectations

Sprint 17 must add tests for integration configuration, provider adapters, and failure handling.

At minimum, tests should cover:

- admin can configure provider metadata;
- unauthorized user cannot configure integration provider;
- secrets are not exposed to frontend or logs;
- inactive provider cannot send API message;
- WhatsApp API adapter can produce a send request in test/mock mode;
- WhatsApp API failure records failed status and allows manual fallback;
- guided manual mode remains available when API provider is disabled;
- provider message ID is tracked when available;
- webhook payload is validated or safely rejected;
- Google Calendar sync creates external reference in test/mock mode;
- Calendar sync failure does not break local event data;
- Canva integration placeholder keeps CSV workflow available;
- integration event log redacts sensitive data;
- partner cannot access global integration settings;
- staff without permission cannot manage provider credentials;
- integration actions produce audit entries or call audit abstraction;
- out-of-scope payment/commission/white-label modules are not introduced.

CI must continue to pass:

```text
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

If integration tests need real credentials, use mocked providers in CI and document manual live checks separately.

---

## 12. Acceptance criteria

Sprint 17 is complete only when:

- integration provider configuration foundation exists;
- secure secret handling is documented/enforced;
- WhatsApp API adapter foundation exists or is safely mocked when credentials unavailable;
- WhatsApp manual/API mode switching exists;
- guided manual fallback remains available;
- integration event logging exists;
- integration error handling exists;
- Google Calendar sync foundation exists or controlled placeholder exists;
- Canva integration foundation/research exists while CSV baseline remains intact;
- webhook/event foundation exists if provider event processing is introduced;
- integration monitoring summary exists;
- permission checks prevent unauthorized integration access;
- audit logging exists for integration actions;
- tests are added and pass;
- CI passes;
- documentation is updated;
- Sprint 17 completion report is created.

---

## 13. Required deliverables

The Sprint 17 PR must include:

- database migration(s) for integration providers, events, external references, and errors if needed;
- TypeScript types updated/generated as needed;
- integration provider configuration logic;
- secure configuration/secret handling documentation;
- WhatsApp provider adapter foundation;
- WhatsApp manual/API mode switching logic;
- webhook/event processing foundation if implemented;
- Google Calendar sync foundation or controlled placeholder;
- Canva integration research/foundation while preserving CSV baseline;
- integration logs and monitoring foundation;
- retry/fallback behavior;
- permission checks for integration operations;
- audit integration for integration actions;
- minimal UI for admin integration settings and monitoring;
- tests for integration behavior;
- documentation updates;
- `docs/planning/sprint-17-completion-report.md`.

---

## 14. Sprint 17 completion report template

The agent must create:

```text
docs/planning/sprint-17-completion-report.md
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
- WhatsApp integration behavior implemented;
- Google Calendar behavior implemented;
- Canva integration foundation/research summary;
- webhook/event behavior implemented;
- fallback behavior implemented;
- audit-log behavior implemented;
- assumptions made;
- open issues or blockers;
- out-of-scope items intentionally deferred;
- recommended Sprint 18 scope.

---

## 15. Recommended Sprint 18 scope

Sprint 18 should handle:

- SaaS / partner scaling enhancements;
- stronger multi-partner operational model;
- optional white-labeling roadmap/foundation;
- advanced partner analytics without revenue leakage;
- partner onboarding improvements;
- tenant/organization hardening if needed;
- post-MVP growth features.

Sprint 18 should not introduce commission/referral-fee management unless the business policy changes and the requirement is explicitly approved.

---

## 16. Codex prompt for Sprint 17

Use this prompt when assigning Codex to Sprint 17:

```text
You are the Orchestrator Agent for the Diginoces platform.

Repository: carlkanda/diginoces-platform

Work only on Sprint 17: Advanced Integrations.

Before coding, read AGENTS.md and the relevant documents:
- docs/planning/sprint-17-plan.md
- docs/planning/sprint-16-plan.md
- docs/planning/mvp-build-execution-plan.md
- docs/product/07-whatsapp-communication-message-workflows.md
- docs/product/06-invitation-template-pdf-generation.md
- docs/product/09-tables-seating-print-materials.md
- docs/product/11-post-event-messages.md
- docs/product/14-files-storage-retention-security.md
- docs/product/16-technical-architecture.md
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

codex/sprint-17-advanced-integrations

Implement Sprint 17 only.

Required scope:
1. Add integration provider configuration foundation.
2. Add secure integration secret/config handling documentation and enforcement.
3. Add official WhatsApp API adapter foundation or mocked provider if credentials are unavailable.
4. Add WhatsApp manual/API mode switching.
5. Ensure guided manual fallback remains available.
6. Add WhatsApp provider event/webhook foundation if safe.
7. Add Google Calendar sync foundation or controlled placeholder.
8. Add Canva integration research/foundation while preserving CSV baseline.
9. Add integration event/error logging.
10. Add retry/fallback behavior.
11. Add integration monitoring summary.
12. Add permission checks for integration operations.
13. Add audit logging for integration actions.
14. Add basic admin UI for integration settings and monitoring.
15. Add tests.
16. Update documentation.
17. Create docs/planning/sprint-17-completion-report.md.
18. Open a draft PR titled: Sprint 17 — Advanced Integrations.

Out of scope:
- unofficial WhatsApp Web automation;
- online payment provider integration;
- accounting integrations;
- native mobile apps;
- white-label SaaS;
- partner commission management;
- partner billing;
- public third-party API.

The PR must reference the Sprint 17 issue.

Do not mark Sprint 17 complete unless tests/checks are documented.
```

---

## 17. Summary

Sprint 17 connects Diginoces to selected external services while preserving safe manual fallback workflows.

It should prepare official WhatsApp API support, Google Calendar sync, Canva integration foundations, webhook/event handling, integration monitoring, and secure configuration controls.

The expected result is a safe integration layer that prepares the platform for broader SaaS/partner scaling improvements in Sprint 18.
