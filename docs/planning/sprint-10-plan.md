# Sprint 10 Plan — Contracts, Pricing & Payment Controls

## 1. Sprint goal

Sprint 10 builds the **Contracts, Pricing & Payment Controls** foundation for the Diginoces platform.

The goal is to protect Diginoces business operations by introducing project-level contract generation, in-app contract approval, service packages, planned-guest-count pricing, manual payment recording, payment gates, payment exception controls, and addendum foundation.

Sprint 10 must establish:

- service package and add-on foundation;
- project/event package selection foundation;
- planned guest count pricing foundation;
- one contract per wedding project;
- contract generation from project, event, guest-count, package, and pricing data;
- in-app contract approval by one couple member, preferably groom;
- contract versioning/status foundation;
- addendum foundation for major scope/price changes;
- manual payment recording;
- payment balance tracking;
- payment gate enforcement for guest-facing access and invitation sending;
- payment exception override with reason and audit trail;
- audit logging for contract, pricing, and payment actions.

Sprint 10 must not build partner project creation, full accounting, online payment processing, tax/VAT handling, full reports, or post-event workflows.

---

## 2. Source documents

Before coding, the agent must read and follow:

- `AGENTS.md`
- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/mvp-build-execution-plan.md`
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
- `docs/backlog/master-requirements-register.csv`
- `docs/backlog/initial-product-backlog-epics.csv`
- `docs/backlog/initial-product-backlog-features.csv`
- `docs/backlog/initial-product-backlog-user-stories.csv`
- `docs/backlog/initial-product-backlog-tasks.csv`
- `docs/backlog/initial-product-backlog-test-cases.csv`

---

## 3. Sprint dependency

Sprint 10 depends on Sprint 9 being merged into `main`.

Sprint 10 must assume these foundations already exist:

- secure platform foundation;
- project and event models;
- guest model;
- guest event assignment model;
- invitation generation foundation;
- public guest page foundation;
- WhatsApp communication foundation;
- seating foundation;
- check-in foundation;
- app-owned storage abstraction;
- audit-log foundation;
- RBAC and permission foundations.

If any Sprint 9 dependency is missing, the agent must stop, report the blocker, and avoid creating workaround models that conflict with the planned architecture.

---

## 4. Backlog scope

Sprint 10 focuses on the **Contracts, Pricing & Payment Controls** epic.

Primary epic:

- `EPIC-PAY` — Contracts, Pricing & Payment Controls

Primary features:

- `FEAT-PAY-001` — Service package and add-on foundation
- `FEAT-PAY-002` — Event-level package selection
- `FEAT-PAY-003` — Planned guest count pricing
- `FEAT-PAY-004` — Project contract generation
- `FEAT-PAY-005` — In-app contract approval
- `FEAT-PAY-006` — Contract version/status foundation
- `FEAT-PAY-007` — Addendum foundation
- `FEAT-PAY-008` — Manual payment recording
- `FEAT-PAY-009` — Payment balance tracking
- `FEAT-PAY-010` — Payment gate enforcement
- `FEAT-PAY-011` — Payment exception override

If the exact feature IDs differ in the CSV backlog, the agent must use the matching backlog rows and document the actual IDs in the Sprint 10 completion report.

---

## 5. Requirement IDs covered

Sprint 10 should primarily cover or begin coverage for:

- `PAY-001` — Generate one contract for the whole wedding project
- `PAY-002` — Contract displayed in-app and approved with checkbox confirmation
- `PAY-003` — One couple member approval required; groom preferred approver
- `PAY-004` — No in-app contract negotiation flow in version 1
- `PAY-005` — Addendums for price/scope changes such as added guests/events/services
- `PAY-006` — Diginoces-admin-managed service packages and add-ons
- `PAY-007` — Each event can have its own package/add-ons while project has one contract
- `PAY-008` — Version 1 pricing uses USD only with all-inclusive amounts and no tax breakdown
- `PAY-009` — Pricing based on planned guest count
- `PAY-010` — Guest count increase after contract approval triggers additional amount/addendum workflow
- `PAY-011` — Guest count decrease after contract approval does not automatically reduce price
- `PAY-012` — Commercial gesture/discount with reason and audit trail
- `PAY-013` — Payments handled outside app but manually recorded in app
- `PAY-014` — Full payment unlocks invitation sending and guest public page access
- `PAY-015` — Payment exception override before full payment with reason and audit
- `PROJ-006` — Event packages/add-ons while contract remains project-level
- `RSVP-002` — Guest public page locked until full payment or exception override
- `MSG-004` — Invitation sending blocked until full payment or exception and required data
- `ROLE-002` — Admin has full pricing, payment, contract control
- `ROLE-004` — Partners cannot see revenue or approve payment exceptions
- `REP-006` — Audit logs for sensitive actions
- `TECH-004` — Backend permission enforcement

Sprint 10 may reference future requirements, but it must not implement future modules unless explicitly in scope.

---

## 6. In scope

Sprint 10 may implement the following.

### 6.1 Service package model

Add database support for Diginoces service packages and add-ons.

A service package should record:

- package ID;
- package code;
- package name;
- description;
- base price in USD;
- pricing mode;
- included guest count, if applicable;
- price per additional guest, if applicable;
- active/inactive status;
- created_by;
- created_at and updated_at timestamps.

Add-ons should record:

- add-on ID;
- code;
- name;
- description;
- price in USD;
- pricing mode;
- active/inactive status.

Pricing must be controlled by Diginoces/admin only.

### 6.2 Event-level package selection

Each event inside a wedding project can have its own selected package and add-ons.

The selection should record:

- project ID;
- event ID;
- package ID;
- selected add-ons;
- planned guest count for pricing;
- calculated amount;
- status;
- selected_by;
- timestamps.

The wedding project contract remains one project-level contract covering all events.

### 6.3 Pricing calculation foundation

Pricing should use USD only in version 1.

Rules:

- prices are all-inclusive;
- no tax/VAT breakdown;
- pricing is based on planned guest count;
- event package/add-on amounts roll up to project total;
- decrease in planned guest count after contract approval does not automatically reduce price;
- increase in planned guest count after contract approval triggers additional amount/addendum workflow;
- Diginoces/admin can apply a commercial gesture/discount with reason and audit trail.

The calculation engine should be deterministic and testable.

### 6.4 Planned guest count source

Sprint 10 must define where planned guest count comes from.

Acceptable sources:

- manually entered project/event planned guest count;
- guest/event assignment counts if already reliable;
- admin-confirmed planned guest count snapshot.

Contract pricing should use a stable planned guest count snapshot so the contract does not change unexpectedly.

### 6.5 Contract model

Add database support for contracts.

A contract should record:

- contract ID;
- project ID;
- contract number/code;
- version;
- status;
- generated content or structured contract data;
- pricing snapshot;
- planned guest count snapshot;
- package/add-on snapshot;
- generated_by;
- generated_at;
- approved_by;
- approved_at;
- approval confirmation text;
- active/latest flag;
- file ID if exported to PDF later;
- audit references where appropriate.

Recommended statuses:

```text
draft
generated
sent_for_approval
approved
superseded
cancelled
```

Sprint 10 can store structured contract data and/or rendered markdown/HTML. PDF contract export can be a follow-up unless low-risk.

### 6.6 One contract per project

The system should generate one contract for the whole wedding project.

The contract should include:

- couple information;
- project information;
- all events;
- selected package/add-ons per event;
- planned guest count;
- total amount;
- payment rules;
- guest-count increase rules;
- responsibilities;
- approval confirmation text.

Do not create one contract per event.

### 6.7 In-app contract approval

The contract should be approved inside the app.

Approval requires:

1. contract displayed in app;
2. approver is authorized couple member;
3. confirmation checkbox checked;
4. approval button clicked;
5. approval timestamp recorded;
6. approval confirmation text recorded;
7. contract version recorded;
8. audit log written.

Only one couple member is required to approve. Groom is preferred but bride can approve if configured/allowed.

### 6.8 Contract gate for guest-list access

Guest-list access should open only after contract approval.

Because guest management was already built earlier, Sprint 10 should connect contract approval to the existing access-check/gate foundation without breaking previous sprints.

If guest-list gate was not enforced earlier, Sprint 10 should implement or prepare:

- project contract approval check;
- locked/unlocked guest-list state;
- clear UI messaging.

### 6.9 Addendum foundation

Addendums should be supported for major changes after contract approval.

Addendum triggers:

- planned guest count increase;
- additional event;
- new paid service/add-on;
- major scope change;
- additional charges.

An addendum should record:

- project ID;
- parent contract ID;
- addendum number/code;
- reason;
- old value snapshot;
- new value snapshot;
- additional amount;
- status;
- generated_by;
- approved_by;
- timestamps.

Recommended statuses:

```text
draft
generated
sent_for_approval
approved
rejected
cancelled
```

Minor operational changes should not require addendum.

### 6.10 Manual payment recording

Payments are handled outside the app in version 1, but Diginoces/admin can record them manually.

Payment records should capture:

- project ID;
- contract ID or addendum ID if applicable;
- expected amount;
- paid amount;
- currency, fixed as USD in v1;
- payment method;
- payment date;
- reference/proof note;
- file/proof ID if supported;
- recorded_by;
- notes;
- status;
- timestamps.

Recommended statuses:

```text
recorded
confirmed
rejected
cancelled
```

No online payment processing should be implemented in Sprint 10.

### 6.11 Payment balance tracking

The system should calculate:

- contract total;
- addendum total;
- total expected amount;
- total confirmed paid amount;
- balance due;
- payment completion state.

Full payment should be considered reached only when confirmed payments meet or exceed the expected amount, unless payment exception override exists.

### 6.12 Payment gate enforcement

Full payment unlocks:

- guest public page access;
- invitation sending.

Sprint 10 should connect payment gate checks to existing Sprint 5 and Sprint 7 access/sending checks.

Rules:

- without full payment or approved exception, guest public pages remain locked;
- without full payment or approved exception, invitation sending remains blocked;
- admin preview remains possible where already designed;
- gate decisions are auditable or traceable.

### 6.13 Payment exception override

Diginoces/admin may approve a payment exception override in rare cases.

An exception should record:

- project ID;
- contract ID if applicable;
- approved_by;
- reason;
- amount paid at time of exception;
- remaining balance;
- conditions;
- expiry date if applicable;
- active/revoked status;
- created_at and updated_at timestamps.

Payment exceptions should be sensitive and require admin/sensitive role permissions.

Partners must not approve payment exceptions.

### 6.14 Commercial gesture/discount foundation

Diginoces/admin can apply a commercial gesture or discount.

A discount/gesture should record:

- amount or percentage;
- reason;
- applied_by;
- timestamp;
- affected contract/addendum;
- audit log entry.

The system should distinguish between:

- price reduction before contract approval;
- commercial gesture after contract approval;
- no automatic reduction due to guest count decrease.

### 6.15 Revenue visibility controls

Revenue, pricing, payment, discounts, and balances should be visible only to Diginoces/admin and explicitly authorized internal roles.

External partners must not see revenue amounts, payment details, discounts, or balances.

Couple users may see their own contract/payment summary if designed, but not internal margin/revenue reporting.

### 6.16 Basic UI

Add basic UI for:

- package list and package management for admin;
- event package selection;
- pricing calculation preview;
- project contract generation;
- contract review page;
- contract approval page for authorized couple member;
- payment recording form;
- payment summary/balance view;
- payment gate status;
- payment exception approval page;
- addendum list/detail foundation.

Keep UI functional and secure.

Sprint 10 is not the final commercial dashboard sprint.

### 6.17 Audit logging

Contract, pricing, and payment actions that should be audited include:

- package created/updated/deactivated;
- package selected for event;
- price calculation generated;
- commercial gesture applied;
- contract generated;
- contract sent for approval;
- contract approved;
- contract superseded/cancelled;
- addendum generated;
- addendum approved/rejected;
- payment recorded;
- payment confirmed/rejected/cancelled;
- payment exception created/approved/revoked;
- payment gate unlocked by full payment;
- payment gate unlocked by exception.

Audit logs must not be visible to guests or unauthorized partners.

---

## 7. Out of scope

Do not implement the following in Sprint 10:

- online payment processing;
- card/mobile money payment gateway integration;
- invoice accounting integration;
- tax/VAT breakdown;
- multi-currency pricing;
- partner commission management;
- full partner project creation workflow;
- full revenue dashboard;
- full PDF contract export if it delays core contract approval;
- e-signature provider integration;
- contract negotiation workflow;
- full reports/dashboard module;
- post-event feedback;
- guest-book workflow.

If a future dependency is discovered, document it as a follow-up. Do not build it silently.

---

## 8. Recommended database objects

The agent may choose final names based on existing conventions, but the following objects are expected conceptually:

```text
service_packages
service_package_addons
project_event_package_selections
pricing_calculations
contracts
contract_versions
contract_approvals
contract_addendums
payments
payment_exceptions
commercial_gestures
payment_gate_events
```

Optional, if useful and low-risk:

```text
contract_rendered_sections
payment_proofs
pricing_snapshots
```

The implementation must integrate with existing project, event, guest, invitation, public page, messaging, permission, file, and audit foundations.

Do not create partner commission, online payment gateway, tax, or accounting domain tables in Sprint 10.

---

## 9. Recommended backend/API foundations

The agent may implement API routes, server actions, or service modules according to the existing app architecture.

Expected service capabilities:

- create/update/deactivate service packages;
- create/update/deactivate add-ons;
- assign package/add-ons to event;
- calculate project pricing;
- snapshot planned guest count;
- generate project contract;
- render contract view;
- submit contract for approval;
- approve contract in-app;
- generate addendum;
- approve/reject addendum;
- record payment;
- confirm/reject/cancel payment;
- calculate balance;
- evaluate payment gate;
- create/revoke payment exception;
- apply commercial gesture;
- enforce revenue visibility permissions;
- write audit logs.

All backend operations must enforce permissions server-side.

---

## 10. Permission rules

Sprint 10 must enforce or prepare these permission rules.

### 10.1 Diginoces/admin

Can:

- manage packages and add-ons;
- calculate pricing;
- generate contracts;
- approve/send contract versions;
- record and confirm payments;
- approve payment exceptions;
- apply commercial gestures;
- view revenue/payment details;
- generate addendums;
- view audit history if allowed.

### 10.2 Diginoces staff

Can act according to assigned permissions.

Possible staff permissions:

- view project contract status;
- prepare contract data;
- record payment draft;
- view payment status if authorized;
- see payment gate status;
- prepare addendum draft.

Staff should not automatically manage pricing, approve exceptions, or apply discounts unless explicitly granted.

### 10.3 Bride/groom

Can:

- view own project contract;
- approve contract if designated/allowed;
- view own payment summary if enabled;
- approve addendum if required.

Cannot:

- edit pricing;
- apply discounts;
- approve payment exceptions;
- access internal revenue data;
- see audit logs;
- see other projects.

### 10.4 Partner / external provider

Can:

- see non-sensitive project status if assigned and allowed;
- possibly see that contract/payment is pending/approved without amounts if designed.

Cannot:

- view revenue amounts;
- view payment details;
- manage pricing;
- approve payment exceptions;
- apply discounts;
- manage contract templates;
- access audit logs.

### 10.5 Guest

Guests do not access contracts, pricing, or payments.

Payment gate may affect public page access, but guests should not see sensitive payment details.

---

## 11. Testing expectations

Sprint 10 must add tests for contracts, pricing, and payment controls.

At minimum, tests should cover:

- package can be created by admin;
- unauthorized user cannot manage packages;
- event can select package/add-ons;
- project pricing rolls up event package/add-on totals;
- pricing uses USD only;
- planned guest count increase after contract approval triggers addendum/additional amount path;
- planned guest count decrease after approval does not automatically reduce price;
- commercial gesture requires admin and reason;
- contract generated as one project-level contract covering all events;
- contract approval requires checkbox/confirmation action;
- one authorized couple member can approve;
- unauthorized user cannot approve contract;
- contract approval opens guest-list access gate if implemented;
- manual payment can be recorded and confirmed by authorized user;
- balance due calculates correctly;
- full payment unlocks guest public page access and invitation sending gates;
- unpaid project remains locked for public page/sending;
- payment exception unlocks gate only when active and authorized;
- partner cannot view revenue/payment details;
- payment/contract actions produce audit entries or call audit abstraction;
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

Sprint 10 is complete only when:

- service package/add-on foundation exists;
- event package selection exists;
- planned guest count pricing exists;
- one project-level contract can be generated;
- contract version/status foundation exists;
- in-app contract approval exists;
- contract approval is auditable;
- addendum foundation exists;
- manual payment recording exists;
- payment balance tracking exists;
- payment gate enforcement exists or is connected to existing public page/sending gates;
- payment exception override exists;
- commercial gesture/discount foundation exists;
- revenue visibility restrictions are enforced;
- partner restrictions are enforced;
- tests are added and pass;
- CI passes;
- documentation is updated;
- Sprint 10 completion report is created.

---

## 13. Required deliverables

The Sprint 10 PR must include:

- database migration(s) for packages, pricing, contracts, addendums, payments, exceptions, and gate events;
- TypeScript types updated/generated as needed;
- pricing calculation logic;
- package/add-on management logic;
- contract generation logic;
- contract approval logic;
- addendum foundation logic;
- manual payment recording logic;
- payment balance calculation logic;
- payment gate evaluation logic;
- payment exception logic;
- commercial gesture/discount logic;
- permission checks for contract/pricing/payment operations;
- audit integration for contract/pricing/payment actions;
- minimal UI for packages, contract, approval, payments, exceptions, and gate status;
- tests for contract/pricing/payment foundation;
- documentation updates;
- `docs/planning/sprint-10-completion-report.md`.

---

## 14. Sprint 10 completion report template

The agent must create:

```text
docs/planning/sprint-10-completion-report.md
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
- package/pricing behavior implemented;
- contract generation/approval behavior implemented;
- payment recording/balance behavior implemented;
- payment gate behavior implemented;
- payment exception behavior implemented;
- revenue visibility behavior implemented;
- audit-log behavior implemented;
- assumptions made;
- open issues or blockers;
- out-of-scope items intentionally deferred;
- recommended Sprint 11 scope.

---

## 15. Recommended Sprint 11 scope

Sprint 11 should handle:

- global dashboard foundation;
- project dashboard foundation;
- event dashboard foundation;
- couple dashboard foundation;
- partner dashboard placeholder only if needed;
- RSVP/invitation/seating/check-in/payment summary widgets;
- report export foundation;
- audit-log viewer foundation;
- role-based dashboard visibility.

Sprint 11 should not build post-event guest-book workflows or partner scaling unless the approved roadmap changes.

---

## 16. Codex prompt for Sprint 10

Use this prompt when assigning Codex to Sprint 10:

```text
You are the Orchestrator Agent for the Diginoces platform.

Repository: carlkanda/diginoces-platform

Work only on Sprint 10: Contracts, Pricing & Payment Controls.

Before coding, read AGENTS.md and the relevant documents:
- docs/planning/sprint-10-plan.md
- docs/planning/sprint-9-plan.md
- docs/planning/mvp-build-execution-plan.md
- docs/product/10-contracts-pricing-payment-controls.md
- docs/product/01-product-vision-business-model.md
- docs/product/02-user-roles-permissions-access-control.md
- docs/product/03-wedding-project-structure.md
- docs/product/05-rsvp-public-guest-page.md
- docs/product/06-invitation-template-pdf-generation.md
- docs/product/07-whatsapp-communication-message-workflows.md
- docs/product/13-dashboards-reports-audit-logs.md
- docs/technical-design/database-schema-core-entities.md
- docs/technical-design/api-backend-service-design.md
- docs/technical-design/security-permissions-access-control.md
- docs/backlog/master-requirements-register.csv
- docs/backlog/initial-product-backlog-epics.csv
- docs/backlog/initial-product-backlog-features.csv
- docs/backlog/initial-product-backlog-user-stories.csv
- docs/backlog/initial-product-backlog-tasks.csv
- docs/backlog/initial-product-backlog-test-cases.csv

Create a new branch:

codex/sprint-10-contracts-pricing-payments

Implement Sprint 10 only.

Required scope:
1. Add service package and add-on foundation.
2. Add event-level package selection.
3. Add planned guest count pricing foundation.
4. Add project-level pricing calculation.
5. Add one-contract-per-project generation foundation.
6. Add contract version/status foundation.
7. Add in-app contract approval with checkbox/confirmation.
8. Add addendum foundation for major scope/price changes.
9. Add manual payment recording.
10. Add payment balance tracking.
11. Add payment gate enforcement for guest public page and invitation sending.
12. Add payment exception override with reason/audit trail.
13. Add commercial gesture/discount foundation.
14. Add revenue visibility restrictions.
15. Add permission checks for pricing/contract/payment operations.
16. Add audit logging for contract/pricing/payment actions.
17. Add basic UI for packages, pricing, contract, approval, payments, and gate status.
18. Add tests.
19. Update documentation.
20. Create docs/planning/sprint-10-completion-report.md.
21. Open a draft PR titled: Sprint 10 — Contracts, Pricing & Payment Controls.

Out of scope:
- online payment processing;
- tax/VAT handling;
- multi-currency;
- partner commission management;
- full reports/dashboard module;
- post-event workflows;
- e-signature provider integration;
- contract negotiation workflow.

The PR must reference the Sprint 10 issue.

Do not mark Sprint 10 complete unless tests/checks are documented.
```

---

## 17. Summary

Sprint 10 protects the Diginoces business model by adding contract, pricing, and payment controls.

It should ensure that guest work is contract-gated, guest-facing access and invitation sending are payment-gated, revenue remains visible only to authorized Diginoces roles, and all commercial exceptions are auditable.

The expected result is a controlled commercial foundation that prepares the platform for dashboards, reports, and operational monitoring in Sprint 11.
