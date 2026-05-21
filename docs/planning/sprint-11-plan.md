# Sprint 11 Plan — Dashboards, Reports & Audit Logs

## 1. Sprint goal

Sprint 11 builds the **Dashboards, Reports & Audit Logs** foundation for the Diginoces platform.

The goal is to give Diginoces/admin, authorized staff, couples, and eventually partners clear operational visibility over projects, events, guest lists, RSVP, invitations, communication, seating, check-in, contracts, payments, files, and workflow progress.

Sprint 11 must establish:

- global Diginoces admin dashboard foundation;
- project dashboard foundation;
- event dashboard foundation;
- couple dashboard foundation;
- restricted partner dashboard placeholder/foundation if safe;
- role-based dashboard visibility;
- operational summary widgets;
- RSVP summary widgets;
- invitation generation/sending summary widgets;
- seating/check-in summary widgets;
- contract/payment gate summary widgets;
- report export foundation;
- audit-log viewer foundation;
- audit-log filtering foundation;
- audit-log visibility restrictions;
- dashboard/report security controls;
- documented reporting boundaries for MVP.

Sprint 11 must not build guest-book workflows, post-event feedback, full partner SaaS scaling, commission management, advanced BI/analytics, or external accounting integrations.

---

## 2. Source documents

Before coding, the agent must read and follow:

- `AGENTS.md`
- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/planning/sprint-10-plan.md`
- `docs/product/13-dashboards-reports-audit-logs.md`
- `docs/product/02-user-roles-permissions-access-control.md`
- `docs/product/03-wedding-project-structure.md`
- `docs/product/04-guest-management-guest-lists.md`
- `docs/product/05-rsvp-public-guest-page.md`
- `docs/product/06-invitation-template-pdf-generation.md`
- `docs/product/07-whatsapp-communication-message-workflows.md`
- `docs/product/08-check-in-wedding-day-operations.md`
- `docs/product/09-tables-seating-print-materials.md`
- `docs/product/10-contracts-pricing-payment-controls.md`
- `docs/product/12-partner-external-provider-model.md`
- `docs/product/14-files-storage-retention-security.md`
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

Sprint 11 depends on Sprint 10 being merged into `main`.

Sprint 11 must assume these foundations already exist:

- secure platform foundation;
- project and event models;
- guest and import foundations;
- RSVP and public guest page foundation;
- invitation generation foundation;
- WhatsApp communication foundation;
- seating and print export foundation;
- check-in foundation;
- contract, pricing, and payment controls;
- app-owned storage abstraction;
- audit-log foundation;
- RBAC and permission foundations.

If any Sprint 10 dependency is missing, the agent must stop, report the blocker, and avoid creating workaround models that conflict with the planned architecture.

---

## 4. Backlog scope

Sprint 11 focuses on the **Dashboards, Reports & Audit Logs** epic.

Primary epic:

- `EPIC-REP` — Dashboards, Reports & Audit Logs

Primary features:

- `FEAT-REP-001` — Global admin dashboard foundation
- `FEAT-REP-002` — Project dashboard foundation
- `FEAT-REP-003` — Event dashboard foundation
- `FEAT-REP-004` — Couple dashboard foundation
- `FEAT-REP-005` — Partner dashboard restricted placeholder/foundation
- `FEAT-REP-006` — Operational summary widgets
- `FEAT-REP-007` — Report export foundation
- `FEAT-REP-008` — Audit-log viewer foundation
- `FEAT-REP-009` — Audit-log filtering and export foundation
- `FEAT-REP-010` — Role-based dashboard/report visibility

If the exact feature IDs differ in the CSV backlog, the agent must use the matching backlog rows and document the actual IDs in the Sprint 11 completion report.

---

## 5. Requirement IDs covered

Sprint 11 should primarily cover or begin coverage for:

- `REP-001` — Global, project, event, couple, partner, check-in, and operations dashboards with role-based visibility
- `REP-002` — Global business dashboard visible only to Diginoces/admin and authorized internal roles
- `REP-003` — Couple dashboard shows simplified progress without internal notes, audit, or revenue
- `REP-004` — Partner dashboard shows assigned/originated projects without revenue/payment details
- `REP-005` — Reports export as PDF, Excel, or CSV depending on use case and permissions
- `REP-006` — Internal read-only audit logs for sensitive actions
- `REP-007` — Audit logs visible only to Diginoces/admin and authorized internal roles
- `ROLE-002` — Admin full platform control including reports and audit logs
- `ROLE-003` — Staff access depends on assignment and permissions
- `ROLE-004` — Partners cannot access internal reports or revenue
- `ROLE-005` — Bride/groom cannot access internal notes/audit logs
- `PAY-014` — Payment gate visibility for guest public pages and invitation sending
- `PART-005` — Partner restrictions on revenue/payment/internal notes/audit logs
- `FILE-002` — Project file library categories, where report exports are stored
- `FILE-008` — Store CSV exports with metadata/versioning where applicable
- `TECH-004` — Backend permission enforcement

Sprint 11 may reference future requirements, but it must not implement future modules unless explicitly in scope.

---

## 6. In scope

Sprint 11 may implement the following.

### 6.1 Dashboard service foundation

Add backend/service logic for dashboard metrics.

Dashboard data should be computed through server-side services or safe queries, not directly assembled from unrestricted frontend access.

Metrics should be permission-aware and project/event-scoped where applicable.

The dashboard service foundation should support:

- global admin dashboard;
- project dashboard;
- event dashboard;
- couple dashboard;
- restricted partner dashboard placeholder if safe;
- check-in dashboard reuse or summary integration;
- payment/contract gate summary.

### 6.2 Global admin dashboard

Visible only to Diginoces/admin and authorized internal roles.

The global dashboard should show high-level operational indicators such as:

- active projects;
- upcoming events;
- pending contracts;
- payment-blocked projects;
- projects ready for invitations;
- pending guest imports;
- pending guest changes if implemented;
- RSVP review count;
- check-in readiness status;
- recent audit activity summary;
- partner-originated project count if partner foundation exists;
- operational blockers.

The global dashboard must not be visible to couples, guests, or partners.

### 6.3 Project dashboard

The project dashboard should show project-level progress.

Possible widgets:

- project status;
- event list and event statuses;
- guest count by side;
- guest count by event;
- import/review status;
- RSVP summary;
- invitation generation/sending status;
- table/seating progress;
- check-in readiness;
- contract status;
- payment gate status;
- file/export status;
- workflow checklist progress;
- open operational blockers.

Visibility must depend on role.

Diginoces/admin may see more than staff/couple.

### 6.4 Event dashboard

The event dashboard should show event-specific operational progress.

Possible widgets:

- invited guest count;
- RSVP Yes/No/Maybe/Pending counts;
- invitation generated/sent/failed/needs regeneration counts;
- seating assigned/unassigned counts;
- table occupancy summary;
- check-in expected/arrived/remaining counts;
- unexpected guest request count;
- printed-only count;
- VIP/protocol count;
- deadline status;
- export readiness.

### 6.5 Couple dashboard

The couple dashboard must be simplified and safe.

It may show:

- project status;
- guest-list progress;
- bride/groom guest counts;
- event assignment progress;
- RSVP progress;
- table assignment progress, if visible;
- invitation status at a high level;
- pending couple actions;
- contract approval status;
- payment gate status or simple payment summary, if allowed;
- key deadlines.

It must not show:

- internal notes;
- audit logs;
- staff performance;
- internal revenue reporting;
- partner data;
- hidden operational warnings intended only for Diginoces.

### 6.6 Partner dashboard placeholder/foundation

If partner roles exist, Sprint 11 may add a restricted partner dashboard foundation.

Partner dashboard may show:

- projects brought by partner;
- assigned project statuses;
- operational progress indicators;
- project comments link if implemented;
- high-level milestone status.

Partner dashboard must not show:

- revenue;
- payment details;
- discounts;
- payment exceptions;
- internal notes;
- audit logs;
- global business dashboards.

If partner model is not ready, create only a documented placeholder and defer full partner dashboard to the partner sprint.

### 6.7 Operational summary widgets

Sprint 11 should add reusable dashboard widget foundations.

Suggested widget categories:

- project status;
- event status;
- guest progress;
- RSVP progress;
- invitation progress;
- communication progress;
- seating progress;
- check-in progress;
- contract/payment status;
- file/export status;
- audit/recent activity summary.

Widgets should be role-aware and reusable across dashboards.

### 6.8 Report export foundation

Add report export foundation for CSV and possibly PDF/Excel placeholders.

Minimum Sprint 11 exports:

- project guest summary CSV;
- RSVP summary CSV;
- seating summary CSV;
- check-in summary CSV if check-in data exists;
- payment/contract summary for admin only;
- audit log filtered export for admin only, if safe.

The implementation should support:

- export type;
- scope: global, project, event;
- requested by;
- generated at;
- file registry integration;
- permission checks;
- audit entry for export.

Full polished PDF report generation can be deferred if necessary.

### 6.9 Audit-log viewer foundation

Add an internal audit-log viewer for authorized Diginoces roles.

The audit viewer should support:

- list recent audit logs;
- filter by project if object links allow;
- filter by user;
- filter by action;
- filter by object type;
- filter by date range;
- search reason/comment if safe;
- view old/new value summary where safe.

Audit logs must remain read-only.

Audit logs must not be visible to couples, guests, or partners.

### 6.10 Audit-log export foundation

Authorized users may export filtered audit logs.

Rules:

- export requires admin or authorized internal role;
- export should be audited;
- export should not include secrets;
- exported data should be scoped and filtered;
- export files should be stored/registered only if safe.

### 6.11 Role-based visibility

Dashboard and report access must be enforced server-side.

Rules:

- Diginoces/admin can access global dashboards and internal reports;
- Diginoces staff sees only assigned project/event data unless granted broader access;
- couple sees only their project and simplified dashboards;
- partner sees only assigned/originated project status and no revenue/payment details;
- guest sees no dashboards/reports;
- audit logs are internal only.

Frontend hiding is not enough. Backend/service permissions must enforce access.

### 6.12 Report catalog foundation

Sprint 11 may add a simple report catalog listing available exports.

Report catalog should show:

- report name;
- scope;
- allowed roles;
- output format;
- description;
- status: available, placeholder, post-MVP.

This helps prevent uncontrolled report creation.

### 6.13 File/export integration

Generated report exports should integrate with the app-owned file/storage foundation where available.

Report file records should include:

- project ID or event ID where applicable;
- report type;
- export format;
- generated_by;
- generated_at;
- file ID/storage path;
- status;
- version if needed.

### 6.14 Basic UI

Add basic UI for:

- global admin dashboard;
- project dashboard;
- event dashboard;
- couple dashboard;
- report catalog/export page;
- audit-log viewer;
- dashboard widgets;
- report export action and export history.

Keep UI functional and role-aware.

Sprint 11 is not the final BI/design polish sprint.

### 6.15 Audit logging

Dashboard/report actions that should be audited include:

- report generated;
- report exported;
- audit log viewed if policy requires;
- audit log exported;
- restricted dashboard access denied;
- global dashboard accessed by sensitive role if needed;
- report file downloaded if sensitive.

Do not create excessive noisy logs for every normal dashboard page view unless useful.

---

## 7. Out of scope

Do not implement the following in Sprint 11:

- post-event feedback;
- guest wishes/guest-book workflow;
- full partner SaaS scaling;
- partner commission management;
- advanced BI analytics;
- forecasting;
- automated daily report emails;
- accounting export integration;
- tax/VAT reporting;
- full PDF design reporting engine if it delays core CSV/report foundation;
- external data warehouse integration;
- public marketing website analytics.

If a future dependency is discovered, document it as a follow-up. Do not build it silently.

---

## 8. Recommended database objects

The agent may choose final names based on existing conventions, but the following objects are expected conceptually:

```text
report_definitions
report_exports
dashboard_widget_preferences
audit_log_exports
```

Optional, if useful and low-risk:

```text
dashboard_snapshots
report_export_items
report_access_logs
```

The implementation must integrate with existing project, event, guest, RSVP, invitation, messaging, seating, check-in, contract, payment, file, permission, and audit foundations.

Do not create guest-book, post-event feedback, partner commission, accounting, or advanced BI tables in Sprint 11.

---

## 9. Recommended backend/API foundations

The agent may implement API routes, server actions, or service modules according to the existing app architecture.

Expected service capabilities:

- compute global dashboard metrics;
- compute project dashboard metrics;
- compute event dashboard metrics;
- compute couple dashboard metrics;
- compute restricted partner dashboard metrics if applicable;
- list available reports by role/scope;
- generate CSV report export;
- register report export file;
- list report export history;
- query audit logs with filters;
- export audit logs with permissions;
- enforce dashboard/report visibility rules;
- write audit logs for sensitive export actions.

All backend operations must enforce permissions server-side.

---

## 10. Permission rules

Sprint 11 must enforce or prepare these permission rules.

### 10.1 Diginoces/admin

Can:

- view global dashboard;
- view all project/event dashboards;
- view internal report catalog;
- generate/export internal reports;
- view/export audit logs;
- view payment/contract summaries;
- view operational blockers.

### 10.2 Diginoces staff

Can act according to assigned permissions.

Possible staff permissions:

- view assigned project dashboard;
- view assigned event dashboard;
- export operational reports for assigned scope;
- view limited audit/activity history if granted;
- view check-in/seating/RSVP/invitation summaries.

Staff should not automatically see global revenue, payment exceptions, or full audit logs unless granted.

### 10.3 Bride/groom

Can:

- view simplified couple dashboard for their project;
- view guest-list progress;
- view RSVP progress;
- view invitation/seating/check-in progress where allowed;
- export selected couple-safe reports if implemented.

Cannot:

- view internal audit logs;
- view staff performance;
- view internal notes;
- view revenue/margin;
- view partner data;
- access other projects.

### 10.4 Partner / external provider

Can:

- view restricted dashboard for assigned/originated projects if partner foundation exists;
- see high-level project status and milestones.

Cannot:

- view revenue;
- view payment details;
- view discounts;
- view payment exceptions;
- view internal notes;
- view audit logs;
- view global Diginoces dashboard.

### 10.5 Guest

Guests cannot access dashboards, reports, audit logs, or exports.

---

## 11. Testing expectations

Sprint 11 must add tests for dashboards, reports, and audit-log visibility.

At minimum, tests should cover:

- admin can access global dashboard metrics;
- unauthorized user cannot access global dashboard metrics;
- staff sees only assigned project/event dashboard data;
- couple dashboard excludes internal notes, audit logs, and revenue;
- partner dashboard excludes revenue/payment details and audit logs;
- RSVP summary counts are correct;
- invitation summary counts are correct;
- seating/check-in summary counts are correct when data exists;
- payment gate summary respects permission rules;
- report catalog returns only allowed reports for role;
- CSV report export includes expected columns;
- report export is audited;
- audit-log viewer is internal-only;
- audit-log filters work by action/object/user/date where implemented;
- audit-log export requires admin/internal permission;
- guests cannot access reports or dashboards;
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

Sprint 11 is complete only when:

- global admin dashboard foundation exists;
- project dashboard foundation exists;
- event dashboard foundation exists;
- couple dashboard foundation exists;
- restricted partner dashboard placeholder/foundation exists if applicable;
- core operational summary widgets exist;
- report catalog or report export foundation exists;
- at least CSV report export foundation exists;
- audit-log viewer foundation exists;
- audit-log filtering foundation exists;
- audit-log visibility restrictions are enforced;
- dashboard/report visibility is enforced server-side;
- report/export actions are audited;
- tests are added and pass;
- CI passes;
- documentation is updated;
- Sprint 11 completion report is created.

---

## 13. Required deliverables

The Sprint 11 PR must include:

- database migration(s) if needed for report definitions, report exports, dashboard preferences, or audit-log export records;
- TypeScript types updated/generated as needed;
- dashboard metric service logic;
- role-aware dashboard data access logic;
- global admin dashboard UI foundation;
- project dashboard UI foundation;
- event dashboard UI foundation;
- couple dashboard UI foundation;
- restricted partner dashboard placeholder/foundation if applicable;
- report catalog/export logic;
- CSV export foundation;
- report export file registration where applicable;
- audit-log viewer and filter logic;
- permission checks for dashboard/report/audit operations;
- audit integration for sensitive report/export actions;
- tests for dashboards/reports/audit visibility;
- documentation updates;
- `docs/planning/sprint-11-completion-report.md`.

---

## 14. Sprint 11 completion report template

The agent must create:

```text
docs/planning/sprint-11-completion-report.md
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
- dashboard behavior implemented;
- report/export behavior implemented;
- audit-log viewer behavior implemented;
- role-based visibility behavior implemented;
- audit-log behavior implemented;
- assumptions made;
- open issues or blockers;
- out-of-scope items intentionally deferred;
- recommended Sprint 12 scope.

---

## 15. Recommended Sprint 12 scope

Sprint 12 should handle:

- guest written-message/wishes collection on public guest page;
- one text message per guest;
- emoji support;
- message editing before deadline;
- Diginoces/admin moderation;
- couple review;
- approved-message CSV export for Canva Bulk Create;
- guest-book file tracking;
- post-event satisfaction feedback from the couple;
- optional public testimonial permission flag.

Sprint 12 should not build partner SaaS scaling or AI assistance unless the approved roadmap changes.

---

## 16. Codex prompt for Sprint 11

Use this prompt when assigning Codex to Sprint 11:

```text
You are the Orchestrator Agent for the Diginoces platform.

Repository: carlkanda/diginoces-platform

Work only on Sprint 11: Dashboards, Reports & Audit Logs.

Before coding, read AGENTS.md and the relevant documents:
- docs/planning/sprint-11-plan.md
- docs/planning/sprint-10-plan.md
- docs/planning/mvp-build-execution-plan.md
- docs/product/13-dashboards-reports-audit-logs.md
- docs/product/02-user-roles-permissions-access-control.md
- docs/product/03-wedding-project-structure.md
- docs/product/04-guest-management-guest-lists.md
- docs/product/05-rsvp-public-guest-page.md
- docs/product/06-invitation-template-pdf-generation.md
- docs/product/07-whatsapp-communication-message-workflows.md
- docs/product/08-check-in-wedding-day-operations.md
- docs/product/09-tables-seating-print-materials.md
- docs/product/10-contracts-pricing-payment-controls.md
- docs/product/12-partner-external-provider-model.md
- docs/product/14-files-storage-retention-security.md
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

codex/sprint-11-dashboards-reports-audit-logs

Implement Sprint 11 only.

Required scope:
1. Add global admin dashboard foundation.
2. Add project dashboard foundation.
3. Add event dashboard foundation.
4. Add couple dashboard foundation.
5. Add restricted partner dashboard placeholder/foundation if applicable.
6. Add role-aware dashboard metric services.
7. Add operational summary widgets.
8. Add report catalog/export foundation.
9. Add CSV report export foundation.
10. Add report export file registration where applicable.
11. Add audit-log viewer foundation.
12. Add audit-log filtering foundation.
13. Add audit-log export foundation if safe.
14. Add permission checks for dashboard/report/audit operations.
15. Add audit logging for sensitive report/export actions.
16. Add tests.
17. Update documentation.
18. Create docs/planning/sprint-11-completion-report.md.
19. Open a draft PR titled: Sprint 11 — Dashboards, Reports & Audit Logs.

Out of scope:
- post-event feedback;
- guest wishes/guest-book workflow;
- partner SaaS scaling;
- partner commission management;
- advanced BI analytics;
- accounting integration;
- tax/VAT reporting.

The PR must reference the Sprint 11 issue.

Do not mark Sprint 11 complete unless tests/checks are documented.
```

---

## 17. Summary

Sprint 11 gives Diginoces operational visibility and control across the modules built so far.

It should make the platform easier to manage by providing role-aware dashboards, report exports, and secure audit-log access without exposing internal, financial, or audit data to unauthorized users.

The expected result is a controlled reporting and monitoring foundation that prepares the platform for guest wishes, guest-book workflows, and post-event feedback in Sprint 12.
