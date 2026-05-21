# Sprint 13 Plan — Partner / External Provider Model

## 1. Sprint goal

Sprint 13 builds the **Partner / External Provider Model** foundation for the Diginoces platform.

The goal is to allow selected external planners/providers to bring wedding projects to Diginoces and collaborate operationally under Diginoces-controlled rules, branding, pricing, contracts, and permissions.

Sprint 13 must establish:

- partner account/profile foundation;
- partner status and access control;
- partner-created project draft workflow;
- Diginoces/admin approval of partner-created projects;
- tracking which projects were brought by which partner;
- restricted partner dashboard visibility;
- partner project assignment foundation;
- partner communication with the couple through simple project comments/messages;
- strong restrictions on revenue, pricing, payment, discount, exception, internal note, and audit-log visibility;
- audit logging for partner-related actions.

Sprint 13 must not build partner commission management, referral-fee calculation, white-label SaaS, partner billing, partner-controlled pricing, or partner-controlled contracts.

---

## 2. Source documents

Before coding, the agent must read and follow:

- `AGENTS.md`
- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/planning/sprint-12-plan.md`
- `docs/product/12-partner-external-provider-model.md`
- `docs/product/01-product-vision-business-model.md`
- `docs/product/02-user-roles-permissions-access-control.md`
- `docs/product/03-wedding-project-structure.md`
- `docs/product/10-contracts-pricing-payment-controls.md`
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

Sprint 13 depends on Sprint 12 being merged into `main`.

Sprint 13 must assume these foundations already exist:

- secure platform foundation;
- user, role, and permission foundations;
- project and event models;
- project/event membership model;
- guest, RSVP, invitation, messaging, seating, check-in, contract/payment, dashboard, file, and audit foundations;
- project comments or collaboration foundation if already implemented;
- dashboard/report visibility foundations.

If any Sprint 12 dependency is missing, the agent must stop, report the blocker, and avoid creating workaround models that conflict with the planned architecture.

---

## 4. Backlog scope

Sprint 13 focuses on the **Partner / External Provider Model** epic.

Primary epic:

- `EPIC-PART` — Partner / External Provider Model

Primary features:

- `FEAT-PART-001` — Partner account/profile foundation
- `FEAT-PART-002` — Partner status and access controls
- `FEAT-PART-003` — Partner-created project draft workflow
- `FEAT-PART-004` — Diginoces/admin project approval workflow
- `FEAT-PART-005` — Project source/partner tracking
- `FEAT-PART-006` — Partner project assignment foundation
- `FEAT-PART-007` — Partner dashboard restrictions
- `FEAT-PART-008` — Partner-couple project comment thread foundation
- `FEAT-PART-009` — Partner revenue/payment visibility restrictions

If the exact feature IDs differ in the CSV backlog, the agent must use the matching backlog rows and document the actual IDs in the Sprint 13 completion report.

---

## 5. Requirement IDs covered

Sprint 13 should primarily cover or begin coverage for:

- `PART-001` — External planners/providers are partners who bring weddings under Diginoces brand/pricing
- `PART-002` — Each partner has an account with status, contact info, project links, and permissions
- `PART-003` — Partners can create draft wedding projects and submit them for Diginoces/admin approval
- `PART-004` — Partner-created projects require Diginoces/admin approval before couple access
- `PART-005` — Partners cannot manage pricing, see revenue, approve payment exceptions, or view internal notes/audit logs
- `PART-006` — Partners can communicate with couple through project comment thread; Diginoces/admin can see it
- `PART-007` — Version 1 tracks projects brought by partners but does not manage commissions/referral fees
- `ROLE-004` — External partner can create/manage assigned projects but cannot manage sensitive business data
- `ROLE-001` — Role model supports global/project/event/custom roles
- `REP-004` — Partner dashboard shows assigned/originated projects without revenue/payment details
- `PAY-015` — Payment exceptions restricted to Diginoces/admin
- `PV-003` — Diginoces controls pricing, branding, contracts, packages, and client experience
- `REP-006` — Audit logs for sensitive actions
- `TECH-004` — Backend permission enforcement

Sprint 13 may reference future requirements, but it must not implement future modules unless explicitly in scope.

---

## 6. In scope

Sprint 13 may implement the following.

### 6.1 Partner profile model

Add database support for partner profiles.

A partner profile should record:

- partner ID;
- organization/name;
- primary contact name;
- contact email;
- contact phone/WhatsApp;
- status;
- partner type/category;
- notes visible to Diginoces/admin only;
- created_by;
- approved_by;
- approved_at;
- created_at and updated_at timestamps.

Recommended statuses:

```text
pending
active
suspended
inactive
archived
```

Partner profiles must not include commission management in Sprint 13.

### 6.2 Partner user/account linkage

Partner users should be linked to partner profiles.

Support:

- partner admin user;
- partner member/user if needed;
- user-to-partner relationship;
- status;
- permissions;
- invited/active state if supported by existing auth foundation.

The system should prepare for multiple users per partner but may keep the MVP simple if needed.

### 6.3 Partner access control

Partners operate under Diginoces rules.

Partner users may access only:

- their own partner profile if allowed;
- projects they created or were assigned to;
- high-level project/event operational status;
- project comment thread if enabled;
- non-sensitive project data.

Partners must not access:

- Diginoces pricing management;
- revenue amounts;
- payment details;
- discounts/commercial gestures;
- payment exceptions;
- internal notes;
- audit logs;
- global Diginoces dashboards;
- projects they are not assigned to.

### 6.4 Partner-created project draft workflow

Partners can create draft wedding projects.

Partner project creation should capture:

- couple names;
- basic contact details;
- event date(s) if known;
- event types if known;
- planned guest count if known;
- partner notes;
- submission status;
- created_by partner user;
- linked partner profile.

Partner-created projects must begin as draft/submitted, not automatically active.

### 6.5 Diginoces/admin approval workflow

Partner-created projects must be reviewed and approved by Diginoces/admin before couple access is opened.

Workflow:

1. Partner creates draft project.
2. Partner submits project for review.
3. Diginoces/admin reviews the project.
4. Admin approves, rejects, requests changes, or archives.
5. Approved project becomes a normal Diginoces-controlled project.
6. Contract/pricing/payment workflow proceeds under Diginoces control.

Couple access should not open before Diginoces/admin approval and required contract/payment gates.

### 6.6 Partner project tracking

The system must track which projects were brought by each partner.

Track:

- partner ID;
- project ID;
- source type;
- created/submitted by;
- approval status;
- project status;
- operational role if any;
- created_at and updated_at timestamps.

This is tracking only. No commission/referral-fee management in version 1.

### 6.7 Partner dashboard foundation

Partners may have a restricted dashboard.

Partner dashboard may show:

- projects created by the partner;
- projects assigned to the partner;
- approval status;
- project stage;
- event dates;
- operational progress indicators;
- pending actions;
- project comment link.

Partner dashboard must not show:

- revenue;
- payment details;
- discounts;
- payment exceptions;
- internal notes;
- audit logs;
- global dashboards.

### 6.8 Partner-couple project comment thread

Partners may communicate directly with the couple through a simple project comment/message thread.

Sprint 13 should implement or connect to a simple project comment foundation.

Rules:

- Diginoces/admin can see the thread;
- comments are linked to project;
- visibility is clear;
- internal-only Diginoces notes remain separate;
- pricing/payment/contract-sensitive messages should remain controlled by Diginoces/admin;
- comments can be edited only according to existing rules, such as the 15-minute edit window if implemented.

If full project comments are not ready, implement a safe placeholder and document the follow-up.

### 6.9 Internal notes separation

Partner-visible comments must not be confused with internal notes.

Internal notes remain visible only to Diginoces/admin and authorized internal staff.

Partners must not see internal notes.

### 6.10 Revenue and pricing restrictions

Sprint 13 must enforce the commercial restrictions defined earlier.

Partners cannot:

- manage packages;
- manage prices;
- see project total revenue;
- see balance due;
- see payment proof details;
- see discounts/commercial gestures;
- approve payment exceptions;
- see payment exception reasons;
- see internal financial reports.

If the partner dashboard needs a project commercial status, use safe status labels such as:

```text
contract pending
contract approved
payment gate pending
operationally active
```

Do not display amounts.

### 6.11 Partner operational assignment

Partners may be assigned to operational roles on projects they brought or manage.

Assignments should integrate with existing project membership and permission foundations.

Partner assignment must be project-scoped.

Partner access must not become global.

### 6.12 Partner status lifecycle

Partner profiles should support lifecycle management.

Example lifecycle:

```text
pending -> active -> suspended/inactive -> archived
```

Suspended/inactive partners should not create new projects.

Archived partners should retain historical project links but not active access.

### 6.13 Partner audit logging

Partner-related actions that should be audited include:

- partner profile created;
- partner profile approved/activated;
- partner suspended/reactivated;
- partner user invited/linked;
- partner project draft created;
- partner project submitted;
- partner project approved/rejected/requested changes;
- partner assigned/removed from project;
- partner comment posted/edited/deleted if supported;
- unauthorized access attempt to restricted financial/internal data if logged.

Audit logs must not be visible to partners.

### 6.14 Basic UI

Add basic UI for:

- Diginoces/admin partner list;
- partner detail page;
- partner status management;
- partner user linking/invitation foundation;
- partner-created project draft form;
- partner project review queue for Diginoces/admin;
- partner dashboard;
- partner project detail restricted view;
- project comment thread foundation if implemented.

Keep UI simple and permission-aware.

Sprint 13 is not final partner SaaS polish.

---

## 7. Out of scope

Do not implement the following in Sprint 13:

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
- full CRM/lead pipeline unless already separately approved.

If a future dependency is discovered, document it as a follow-up. Do not build it silently.

---

## 8. Recommended database objects

The agent may choose final names based on existing conventions, but the following objects are expected conceptually:

```text
partners
partner_users
partner_project_sources
partner_project_submissions
project_comments
project_comment_visibility
```

Optional, if useful and low-risk:

```text
partner_status_events
partner_access_events
partner_project_assignments
```

The implementation must integrate with existing project, event, user, role, permission, contract/payment, dashboard, comment, and audit foundations.

Do not create commission, referral-fee, partner billing, white-label tenant, or payout tables in Sprint 13.

---

## 9. Recommended backend/API foundations

The agent may implement API routes, server actions, or service modules according to the existing app architecture.

Expected service capabilities:

- create partner profile;
- update partner profile;
- activate/suspend/archive partner;
- link user to partner;
- list partner projects;
- create partner project draft;
- submit partner project for review;
- approve/reject/request changes on partner-created project;
- convert approved partner submission into normal project if needed;
- track partner source on project;
- enforce partner project access;
- compute partner dashboard metrics without revenue/payment details;
- create/list project comments visible to partner/couple/admin;
- separate internal notes from partner-visible comments;
- write audit logs.

All backend operations must enforce permissions server-side.

---

## 10. Permission rules

Sprint 13 must enforce or prepare these permission rules.

### 10.1 Diginoces/admin

Can:

- create/update/approve/suspend/archive partners;
- link partner users;
- review partner-created project submissions;
- approve/reject/request changes;
- view all partner projects;
- view source tracking;
- view internal notes and audit logs;
- manage pricing/contracts/payments separately from partner permissions.

### 10.2 Diginoces staff

Can act according to assigned permissions.

Possible staff permissions:

- view partner profile;
- review partner submissions;
- communicate in project thread;
- manage assigned partner-related projects.

Staff should not automatically manage partner status or sensitive commercial rules unless explicitly granted.

### 10.3 Partner admin/user

Can:

- view own partner profile if allowed;
- create draft wedding projects;
- submit projects for review;
- view status of projects they created or are assigned to;
- communicate with couple through project comment thread if enabled;
- view non-sensitive operational status.

Cannot:

- manage Diginoces pricing;
- view revenue/payment details;
- approve payment exceptions;
- apply discounts;
- manage contracts/templates;
- view internal notes;
- view audit logs;
- view other partners' projects;
- access global admin dashboard.

### 10.4 Bride/groom

Can:

- communicate in the project thread if the project configuration allows partner participation;
- view partner-facing comments relevant to the project.

Cannot:

- access partner admin data;
- access internal notes;
- access audit logs;
- see partner source tracking unless explicitly allowed.

### 10.5 Guest

Guests do not interact with partner functionality in Sprint 13.

---

## 11. Testing expectations

Sprint 13 must add tests for partner model and access restrictions.

At minimum, tests should cover:

- Diginoces/admin can create partner profile;
- unauthorized user cannot create partner profile;
- partner user can create project draft;
- partner-created project starts as draft/submitted and not active;
- couple access is blocked before Diginoces/admin approval;
- Diginoces/admin can approve partner-created project;
- partner project source is tracked;
- partner can see only own/assigned projects;
- partner cannot see revenue amounts;
- partner cannot see payment details;
- partner cannot approve payment exception;
- partner cannot see internal notes;
- partner cannot see audit logs;
- suspended partner cannot create new projects;
- partner comment thread is visible to allowed participants only;
- internal notes remain hidden from partner;
- partner dashboard excludes financial/internal data;
- partner actions produce audit entries or call audit abstraction;
- out-of-scope commission management is not introduced.

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

Sprint 13 is complete only when:

- partner profile foundation exists;
- partner user linkage foundation exists;
- partner status lifecycle exists;
- partner-created project draft workflow exists;
- Diginoces/admin approval workflow exists;
- partner project source tracking exists;
- partner restricted dashboard/view exists;
- partner project comments foundation exists or is safely documented as placeholder;
- internal notes remain separated from partner-visible comments;
- revenue/payment/pricing restrictions are enforced;
- partners cannot approve payment exceptions;
- partners cannot access audit logs;
- no commission/referral-fee management is introduced;
- permission checks are enforced server-side;
- audit logging exists for partner actions;
- tests are added and pass;
- CI passes;
- documentation is updated;
- Sprint 13 completion report is created.

---

## 13. Required deliverables

The Sprint 13 PR must include:

- database migration(s) for partners, partner users, partner project sources/submissions, and comment foundations if needed;
- TypeScript types updated/generated as needed;
- partner profile management logic;
- partner user linkage logic;
- partner-created project draft/submission logic;
- Diginoces/admin approval/rejection/request changes logic;
- partner project source tracking logic;
- restricted partner dashboard logic;
- partner-visible project comment logic or placeholder;
- internal-note separation controls;
- permission checks for partner operations;
- audit integration for partner actions;
- minimal UI for admin partner management and partner dashboard/submission flows;
- tests for partner model and access restrictions;
- documentation updates;
- `docs/planning/sprint-13-completion-report.md`.

---

## 14. Sprint 13 completion report template

The agent must create:

```text
docs/planning/sprint-13-completion-report.md
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
- partner profile behavior implemented;
- partner project submission/approval behavior implemented;
- partner dashboard/access behavior implemented;
- partner communication behavior implemented;
- revenue/payment restriction behavior implemented;
- audit-log behavior implemented;
- assumptions made;
- open issues or blockers;
- out-of-scope items intentionally deferred;
- recommended Sprint 14 scope.

---

## 15. Recommended Sprint 14 scope

Sprint 14 should handle:

- files/storage hardening;
- file retention and archive workflows;
- project archive lifecycle;
- secure file download review;
- storage categories finalization;
- generated file cleanup;
- export/file version management hardening;
- retention notices;
- admin archive controls.

Sprint 14 should not build partner white-labeling, AI assistance, or advanced integrations unless the approved roadmap changes.

---

## 16. Codex prompt for Sprint 13

Use this prompt when assigning Codex to Sprint 13:

```text
You are the Orchestrator Agent for the Diginoces platform.

Repository: carlkanda/diginoces-platform

Work only on Sprint 13: Partner / External Provider Model.

Before coding, read AGENTS.md and the relevant documents:
- docs/planning/sprint-13-plan.md
- docs/planning/sprint-12-plan.md
- docs/planning/mvp-build-execution-plan.md
- docs/product/12-partner-external-provider-model.md
- docs/product/01-product-vision-business-model.md
- docs/product/02-user-roles-permissions-access-control.md
- docs/product/03-wedding-project-structure.md
- docs/product/10-contracts-pricing-payment-controls.md
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

codex/sprint-13-partner-provider-model

Implement Sprint 13 only.

Required scope:
1. Add partner profile foundation.
2. Add partner user linkage foundation.
3. Add partner status lifecycle.
4. Add partner-created project draft workflow.
5. Add partner project submission workflow.
6. Add Diginoces/admin approval/rejection/request-changes workflow.
7. Add partner project source tracking.
8. Add restricted partner dashboard/view.
9. Add partner-visible project comment thread foundation or safe placeholder.
10. Keep internal notes separate from partner-visible comments.
11. Enforce revenue/payment/pricing restrictions.
12. Prevent partners from approving payment exceptions.
13. Prevent partners from accessing audit logs.
14. Add permission checks for partner operations.
15. Add audit logging for partner actions.
16. Add basic UI for partner management and partner project submission/dashboard.
17. Add tests.
18. Update documentation.
19. Create docs/planning/sprint-13-completion-report.md.
20. Open a draft PR titled: Sprint 13 — Partner / External Provider Model.

Out of scope:
- partner commission management;
- referral-fee calculation;
- partner billing;
- white-label SaaS;
- partner-controlled pricing;
- partner-controlled contracts;
- partner payment exception approval;
- public partner marketplace.

The PR must reference the Sprint 13 issue.

Do not mark Sprint 13 complete unless tests/checks are documented.
```

---

## 17. Summary

Sprint 13 adds the controlled partner model that allows Diginoces to scale through external planners/providers without losing control over pricing, contracts, payments, branding, or sensitive business data.

It should allow partners to bring and manage assigned wedding projects operationally, while Diginoces/admin retains approval, commercial control, visibility restrictions, and auditability.

The expected result is a secure partner foundation that prepares the platform for storage/retention hardening and MVP release preparation.
