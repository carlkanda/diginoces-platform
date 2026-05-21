# Sprint 9 Plan — Check-in & Wedding-Day Operations

## 1. Sprint goal

Sprint 9 builds the **Check-in & Wedding-Day Operations** foundation for the Diginoces platform.

The goal is to give Diginoces a fast, secure, staff-only check-in system for wedding-day operations, supporting QR scanning, manual search, partial arrivals, printed-only guests, unexpected guest approval, offline readiness, device/station tracking, and real-time operational visibility.

Sprint 9 must establish:

- staff-only check-in access;
- event-specific check-in configuration;
- secure check-in token/QR foundation separate from public guest page tokens;
- QR scan check-in flow;
- manual guest search check-in flow;
- invitation ID / guest name / phone / side / table search foundation;
- Couple partial arrival tracking;
- printed-only guest manual check-in;
- unexpected guest request workflow;
- supervisor approval foundation;
- device/station assignment foundation;
- offline preload/sync foundation;
- VIP/protocol visual highlight at check-in;
- check-in dashboard foundation;
- welcome/table-message integration placeholder only;
- audit logging for all check-in actions.

Sprint 9 must not build contracts, pricing, payments, partner project creation, full WhatsApp automation, or post-event guest-book workflows.

---

## 2. Source documents

Before coding, the agent must read and follow:

- `AGENTS.md`
- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/planning/sprint-8-plan.md`
- `docs/product/08-check-in-wedding-day-operations.md`
- `docs/product/09-tables-seating-print-materials.md`
- `docs/product/07-whatsapp-communication-message-workflows.md`
- `docs/product/06-invitation-template-pdf-generation.md`
- `docs/product/05-rsvp-public-guest-page.md`
- `docs/product/04-guest-management-guest-lists.md`
- `docs/technical-design/database-schema-core-entities.md`
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

Sprint 9 depends on Sprint 8 being merged into `main`.

Sprint 9 must assume these foundations already exist:

- secure platform foundation;
- project and event models;
- project/event membership and permissions;
- guest model;
- guest event assignment model;
- RSVP model and operational effect helpers;
- invitation record/file model;
- public guest token foundation;
- message/communication foundation;
- table and seating model;
- VIP/protocol seating foundation;
- app-owned storage abstraction;
- audit-log foundation;
- RBAC and permission foundations.

If any Sprint 8 dependency is missing, the agent must stop, report the blocker, and avoid creating workaround models that conflict with the planned architecture.

---

## 4. Backlog scope

Sprint 9 focuses on the **Check-in & Wedding-Day Operations** epic.

Primary epic:

- `EPIC-CHK` — Check-in & Wedding-Day Operations

Primary features:

- `FEAT-CHK-001` — Staff-only check-in access
- `FEAT-CHK-002` — Event-specific check-in QR/token foundation
- `FEAT-CHK-003` — QR scan check-in flow
- `FEAT-CHK-004` — Manual search check-in flow
- `FEAT-CHK-005` — Couple partial arrivals
- `FEAT-CHK-006` — Printed-only manual check-in
- `FEAT-CHK-007` — Unexpected guest request workflow
- `FEAT-CHK-008` — Check-in supervisor approval workflow
- `FEAT-CHK-009` — Device/station assignment foundation
- `FEAT-CHK-010` — Offline preload/sync foundation
- `FEAT-CHK-011` — VIP/protocol check-in highlight
- `FEAT-CHK-012` — Check-in dashboard foundation

If the exact feature IDs differ in the CSV backlog, the agent must use the matching backlog rows and document the actual IDs in the Sprint 9 completion report.

---

## 5. Requirement IDs covered

Sprint 9 should primarily cover or begin coverage for:

- `CHK-001` — Check-in only by logged-in assigned staff with full accounts
- `CHK-002` — QR scan, invitation ID search, name search, phone search, table search, and side filters
- `CHK-003` — Event-specific QR check-in must not mark attendance for other events
- `CHK-004` — Mobile/tablet-optimized check-in screen
- `CHK-005` — Couple invitations support 0/2, 1/2, and 2/2 arrival states
- `CHK-006` — Second Couple arrival updates count only and does not send duplicate welcome message
- `CHK-007` — Household/family groups checked in member by member, if applicable
- `CHK-008` — Unexpected guests require supervisor approval before entry
- `CHK-009` — Unexpected guest approval supports in-app approval and manual approval recording
- `CHK-010` — VIP/protocol guests visually highlighted on check-in screen
- `CHK-011` — Offline preloaded guest list and sync foundation
- `CHK-012` — Printed-only guests checked in manually by name/search
- `CHK-013` — Assignment of check-in devices/stations to staff/events
- `CHK-014` — Dashboard shows real-time arrivals by table and by staff/device
- `INV-007` — Public guest page QR and check-in QR must remain separate
- `INV-008` — QR codes use secure short tokens
- `MSG-007` — Welcome/table message on first arrival only, placeholder/integration only
- `SEAT-010` — VIP/protocol tags and seating notes
- `REP-006` — Audit logs for sensitive actions
- `TECH-007` — Offline check-in PWA + IndexedDB/preload/sync design
- `TECH-010` — Public guest tokens and check-in tokens are separate and revocable

Sprint 9 may reference future requirements, but it must not implement future modules unless explicitly in scope.

---

## 6. In scope

Sprint 9 may implement the following.

### 6.1 Event-specific check-in configuration

Add or extend event-level check-in settings.

Check-in configuration should support:

- event ID;
- check-in enabled flag;
- check-in start time;
- check-in end time;
- timezone;
- allowed check-in methods;
- offline preload enabled flag;
- unexpected guest handling mode;
- supervisor approval required flag;
- active/inactive status;
- created_at and updated_at timestamps.

Check-in must be event-specific.

Checking into one event must not mark attendance for another event.

### 6.2 Staff-only check-in access

Check-in must require a logged-in staff user assigned to the event or authorized by global/admin permissions.

Rules:

- guests cannot trigger check-in;
- anonymous visitors cannot check in guests;
- public guest page tokens cannot be used as check-in authority;
- staff action must be linked to user ID;
- device/station context should be captured where available.

### 6.3 Check-in token / QR foundation

Add secure check-in token foundation separate from public guest tokens.

Token model should support:

- token ID;
- token value or hashed value;
- token type: `check_in`;
- project ID;
- event ID;
- guest ID or guest event assignment ID;
- invitation ID if applicable;
- active/revoked status;
- created_at timestamp;
- regenerated_at timestamp if applicable;
- last_scanned_at timestamp if useful.

Rules:

- token must be event-specific;
- token must be hard to guess;
- token must be revocable/regeneratable;
- token must not be the same as the public guest page token;
- token alone should not complete check-in unless staff is authenticated and authorized.

### 6.4 QR scan check-in flow

Implement a QR scan endpoint/flow foundation.

When staff scans a check-in QR:

1. Resolve check-in token.
2. Verify token is active.
3. Verify event context.
4. Verify staff is logged in and authorized.
5. Load guest/event/table/RSVP state.
6. Show check-in confirmation screen.
7. Allow valid arrival count selection if needed.
8. Record check-in action.
9. Display result and table/seat information.

The flow should handle:

- invalid token;
- revoked token;
- wrong event token;
- already checked-in guest;
- partial Couple arrival;
- guest RSVP No warning/block according to design;
- guest not assigned to table;
- printed-only guest without QR.

### 6.5 Manual search check-in flow

Check-in must not rely only on QR scanning.

Manual search should support:

- guest display name;
- invitation ID/code;
- WhatsApp/phone number;
- bride/groom side;
- table code/name;
- RSVP status;
- printed-only flag;
- VIP/protocol tag.

Search results should show enough information for staff to identify the correct guest safely without exposing unnecessary private data.

### 6.6 Check-in record model

Add database support for check-in records.

A check-in record should capture:

- project ID;
- event ID;
- guest ID;
- guest event assignment ID;
- invitation ID if available;
- staff user ID;
- device/station ID if available;
- check-in method;
- arrival count;
- total expected count for invitation/unit;
- before/after attendance state;
- timestamp;
- sync status;
- duplicate/override marker if applicable;
- notes/reason where appropriate;
- audit reference where appropriate.

Recommended methods:

```text
qr_scan
manual_name_search
manual_invitation_id
manual_phone_search
manual_table_search
unexpected_guest_approval
offline_sync
```

Recommended sync statuses:

```text
online_synced
offline_pending
sync_conflict
sync_failed
```

### 6.7 Couple partial arrivals

For Couple invitations or title/types with count greater than 1, support partial arrivals.

Rules:

- initial state: 0/2;
- first arrival can set 1/2 or 2/2;
- second person can be checked in later;
- total arrivals cannot exceed allowed count unless supervisor override exists;
- second arrival should update arrival count only;
- welcome/table message should only be prepared/sent on first arrival, if integration exists.

If title/type count is configurable, use the configured count.

### 6.8 Household/family group awareness

If household/family grouping exists, Sprint 9 should respect the rule:

- household grouping helps search/filtering;
- check-in is still member by member;
- each guest/member has their own event attendance state.

If household workflow is not fully implemented yet, document the limitation and keep check-in per guest.

### 6.9 Printed-only manual check-in

Printed-only guests should be checked in manually by name/search.

Rules:

- printed-only guests may not have WhatsApp number;
- printed-only guests may not have a QR;
- they still appear in search if assigned/invited to the event;
- manual check-in records method and staff user;
- printed-only status should be visible to staff.

### 6.10 Unexpected guest workflow

If a person is not found on the list, staff must not admit them directly through normal check-in.

Workflow:

1. Staff searches guest.
2. If no match, staff creates unexpected guest request.
3. Request includes name, side if known, reason, staff user, station, timestamp.
4. Supervisor reviews request.
5. Supervisor approves or rejects in app, or records manual external approval.
6. Approved guest may be recorded as exceptional/manual entry.
7. Decision is audited.

Sprint 9 should not turn unexpected guests into full normal guest-management records unless explicitly and safely designed.

### 6.11 Supervisor approval foundation

Check-in supervisor can:

- view unexpected guest requests;
- approve/reject requests;
- record reason;
- view duplicate/override cases;
- monitor arrivals dashboard.

Supervisor role should be treated as sensitive where possible.

### 6.12 Device/station assignment

Add foundation for check-in stations/devices.

A station/device should record:

- project ID;
- event ID;
- station name;
- assigned staff user ID;
- device label;
- active status;
- last activity timestamp;
- sync status;
- preload status if implemented.

This supports accountability and arrivals by device/staff.

### 6.13 Offline preload foundation

Sprint 9 should prepare offline check-in.

Minimum acceptable foundation:

- define preload dataset structure;
- expose authorized event guest list payload for assigned staff/device;
- include guest identity, RSVP, table, invitation/check-in token data needed for check-in;
- store local/offline state abstraction if practical;
- define sync payload for offline check-ins;
- handle conflict cases conceptually and in tests if practical.

Full PWA offline implementation may be basic, but the architecture must prepare for poor internet wedding-day conditions.

### 6.14 Offline sync foundation

Offline sync should account for:

- duplicate check-ins from two devices;
- partial Couple arrival updates;
- late sync after online check-in already occurred;
- timestamp preservation;
- conflict status;
- staff/device attribution.

Do not silently overwrite conflicting check-in records.

### 6.15 VIP/protocol check-in highlight

VIP/protocol guests should be visually highlighted on the check-in screen.

The screen may show:

- VIP/protocol badge;
- table/seat;
- special seating note;
- special instruction note;
- side/family/protocol tag.

No separate supervisor alert is required in Sprint 9 unless low-risk and documented.

### 6.16 Check-in dashboard foundation

Add a basic check-in dashboard for authorized users.

Dashboard should show:

- expected guests/units;
- arrived guests/units;
- remaining guests/units;
- partial Couple arrivals;
- arrivals by table;
- arrivals by staff;
- arrivals by device/station;
- QR vs manual check-in counts;
- duplicate scan count;
- unexpected guest requests;
- offline pending sync count.

Keep the dashboard operational and simple.

Full reporting belongs to a later report/dashboard sprint.

### 6.17 Welcome/table message integration placeholder

Sprint 9 may integrate with Sprint 7 messaging only as a placeholder or controlled action.

Rule:

- welcome/table message should be prepared/sent only on first successful arrival for a guest/invitation unit;
- second Couple arrival should not send duplicate welcome message;
- if messaging integration is not ready, record a follow-up and display table information to staff.

Do not build full WhatsApp sending in Sprint 9.

### 6.18 Audit logging

Check-in actions that should be audited include:

- guest checked in;
- guest partial arrival updated;
- duplicate scan detected;
- manual search check-in;
- unexpected guest request created;
- unexpected guest approved/rejected;
- supervisor override used;
- offline check-in synced;
- sync conflict detected/resolved;
- check-in token regenerated/revoked;
- device/station assigned;
- check-in settings updated.

Audit logs must not be visible to guests.

---

## 7. Out of scope

Do not implement the following in Sprint 9:

- contracts;
- pricing;
- payments;
- partner project creation;
- full WhatsApp sending automation;
- full message template management beyond integration placeholder;
- full reports/dashboard module;
- final event recap reports;
- post-event guest-book workflow;
- seating management beyond reading existing table/seat data;
- invitation PDF generation;
- guest import workflow;
- public guest page redesign;
- direct hardware scanner integration beyond web/camera/manual flows;
- automatic admission of unexpected guests without approval.

If a future dependency is discovered, document it as a follow-up. Do not build it silently.

---

## 8. Recommended database objects

The agent may choose final names based on existing conventions, but the following objects are expected conceptually:

```text
check_in_settings
check_in_tokens
check_in_records
check_in_devices
unexpected_guest_requests
check_in_sync_batches
check_in_sync_conflicts
```

Optional, if useful and low-risk:

```text
check_in_preload_snapshots
check_in_dashboard_snapshots
check_in_status_events
```

The implementation must integrate with existing project, event, guest, guest event assignment, RSVP, invitation, seating, file, permission, and audit foundations.

Do not create contract, pricing, payment, or partner domain tables in Sprint 9.

---

## 9. Recommended backend/API foundations

The agent may implement API routes, server actions, or service modules according to the existing app architecture.

Expected service capabilities:

- enable/configure check-in for event;
- generate/regenerate check-in token;
- resolve check-in token;
- validate staff check-in permission;
- load check-in guest context;
- check in by QR token;
- check in by manual search;
- update partial arrivals;
- detect duplicate check-in;
- search guests by name/invitation/phone/side/table;
- create unexpected guest request;
- approve/reject unexpected guest request;
- assign check-in station/device;
- produce preload dataset;
- accept offline sync payload;
- detect sync conflicts;
- compute check-in dashboard metrics;
- prepare welcome/table message action if safe;
- write audit logs.

All backend operations must enforce permissions server-side.

---

## 10. Permission rules

Sprint 9 must enforce or prepare these permission rules.

### 10.1 Diginoces/admin

Can:

- configure check-in settings;
- assign staff/devices/stations;
- generate/regenerate/revoke check-in tokens;
- check in guests;
- use manual search;
- approve/reject unexpected guests;
- view check-in dashboard;
- view check-in audit history if allowed.

### 10.2 Check-in supervisor

Can:

- view check-in dashboard;
- approve/reject unexpected guest requests;
- view arrivals by table/staff/device;
- monitor duplicate scans;
- manage assigned check-in staff/stations if granted;
- record manual approval decisions.

Supervisor actions must be auditable.

### 10.3 Check-in staff / usher

Can:

- access check-in mode only for assigned events;
- scan QR codes;
- search guests manually;
- check guests in;
- record partial arrivals;
- create unexpected guest requests;
- view table/seat information for check-in purposes;
- view VIP/protocol highlight.

Cannot:

- edit guest list data generally;
- approve unexpected guests unless supervisor role granted;
- view pricing/payments/contracts;
- export full reports;
- access events they are not assigned to;
- access internal audit logs.

### 10.4 Bride/groom

Bride/groom do not perform check-in in Sprint 9 unless explicitly assigned a staff/check-in role by Diginoces/admin.

They may view high-level attendance progress only if role permissions allow it.

### 10.5 Guest

Guests cannot check themselves in through the public page.

Guest QR/token only identifies the guest/invitation. It does not authorize check-in without staff authentication.

---

## 11. Testing expectations

Sprint 9 must add tests for check-in and wedding-day operations.

At minimum, tests should cover:

- check-in token is separate from public guest token;
- invalid/revoked check-in token fails;
- wrong-event check-in token fails;
- unauthenticated user cannot check in guest;
- unassigned staff cannot check in for event;
- authorized staff can check in by QR token;
- authorized staff can check in by manual search;
- printed-only guest can be checked in manually;
- Couple invitation supports 0/2, 1/2, and 2/2 states;
- arrival count cannot exceed allowed count without override;
- second Couple arrival does not trigger duplicate welcome/table message action;
- duplicate scan is detected;
- RSVP No guest creates warning/block according to design;
- VIP/protocol guest is marked for visual highlight;
- unexpected guest request requires supervisor approval;
- rejected unexpected guest does not become checked in;
- offline sync preserves timestamps;
- offline duplicate/conflict is detected;
- arrivals by table/staff/device metrics calculate correctly;
- check-in actions produce audit entries or call audit abstraction;
- unauthorized users cannot view check-in dashboard;
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

Sprint 9 is complete only when:

- event-specific check-in configuration exists;
- staff-only check-in access is enforced;
- check-in token/QR foundation exists and is separate from public guest tokens;
- QR scan check-in flow exists;
- manual search check-in flow exists;
- printed-only manual check-in exists;
- Couple partial arrivals are supported;
- duplicate scans are detected;
- unexpected guest request and supervisor approval foundation exists;
- device/station assignment foundation exists;
- offline preload/sync foundation exists;
- sync conflicts are handled or clearly represented;
- VIP/protocol highlight exists in check-in UI;
- check-in dashboard foundation exists;
- welcome/table message duplicate-prevention placeholder exists if messaging is integrated;
- permission checks prevent unauthorized check-in actions;
- audit logging exists for check-in actions;
- tests are added and pass;
- CI passes;
- documentation is updated;
- Sprint 9 completion report is created.

---

## 13. Required deliverables

The Sprint 9 PR must include:

- database migration(s) for check-in settings, tokens, records, devices/stations, unexpected guest requests, and sync foundations;
- TypeScript types updated/generated as needed;
- check-in token generation/resolution logic;
- QR scan check-in logic;
- manual search check-in logic;
- partial arrival logic;
- printed-only manual check-in logic;
- unexpected guest request/review logic;
- device/station assignment logic;
- offline preload/sync foundation;
- dashboard metric logic;
- VIP/protocol highlight foundation;
- permission checks for check-in operations;
- audit integration for check-in actions;
- minimal UI for check-in mode, manual search, unexpected guest requests, and dashboard;
- tests for check-in foundation;
- documentation updates;
- `docs/planning/sprint-9-completion-report.md`.

---

## 14. Sprint 9 completion report template

The agent must create:

```text
docs/planning/sprint-9-completion-report.md
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
- check-in token behavior implemented;
- QR/manual check-in behavior implemented;
- partial-arrival behavior implemented;
- unexpected guest workflow implemented;
- offline preload/sync behavior implemented;
- dashboard behavior implemented;
- audit-log behavior implemented;
- assumptions made;
- open issues or blockers;
- out-of-scope items intentionally deferred;
- recommended Sprint 10 scope.

---

## 15. Recommended Sprint 10 scope

Sprint 10 should handle:

- contract generation foundation;
- in-app contract approval;
- service package and add-on foundation;
- pricing by planned guest count;
- manual payment recording;
- payment gate enforcement;
- payment exception approval;
- addendum foundation.

Sprint 10 should not build partner project creation, full reports, or post-event workflows unless the approved roadmap changes.

---

## 16. Codex prompt for Sprint 9

Use this prompt when assigning Codex to Sprint 9:

```text
You are the Orchestrator Agent for the Diginoces platform.

Repository: carlkanda/diginoces-platform

Work only on Sprint 9: Check-in & Wedding-Day Operations.

Before coding, read AGENTS.md and the relevant documents:
- docs/planning/sprint-9-plan.md
- docs/planning/sprint-8-plan.md
- docs/planning/mvp-build-execution-plan.md
- docs/product/08-check-in-wedding-day-operations.md
- docs/product/09-tables-seating-print-materials.md
- docs/product/07-whatsapp-communication-message-workflows.md
- docs/product/06-invitation-template-pdf-generation.md
- docs/product/05-rsvp-public-guest-page.md
- docs/product/04-guest-management-guest-lists.md
- docs/technical-design/database-schema-core-entities.md
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

codex/sprint-9-check-in-wedding-day-operations

Implement Sprint 9 only.

Required scope:
1. Add event-specific check-in configuration.
2. Add staff-only check-in access enforcement.
3. Add secure event-specific check-in token/QR foundation separate from public guest tokens.
4. Add QR scan check-in flow.
5. Add manual search check-in flow.
6. Add invitation ID/name/phone/side/table search foundation.
7. Add Couple partial arrival tracking.
8. Add printed-only manual check-in.
9. Add unexpected guest request workflow.
10. Add supervisor approval/manual approval recording foundation.
11. Add device/station assignment foundation.
12. Add offline preload/sync foundation.
13. Add sync conflict representation.
14. Add VIP/protocol check-in highlight.
15. Add check-in dashboard foundation.
16. Add welcome/table message duplicate-prevention placeholder if messaging is integrated.
17. Add permission checks for check-in operations.
18. Add audit logging for check-in actions.
19. Add tests.
20. Update documentation.
21. Create docs/planning/sprint-9-completion-report.md.
22. Open a draft PR titled: Sprint 9 — Check-in & Wedding-Day Operations.

Out of scope:
- contracts;
- pricing;
- payments;
- partner project creation;
- full WhatsApp sending automation;
- full reports/dashboard module;
- post-event guest-book workflow;
- invitation PDF generation;
- guest import workflow.

The PR must reference the Sprint 9 issue.

Do not mark Sprint 9 complete unless tests/checks are documented.
```

---

## 17. Summary

Sprint 9 turns the planning, guest, RSVP, invitation, messaging, and seating foundations into a real wedding-day operational check-in system.

It should allow Diginoces staff to check guests in quickly and safely, handle printed-only guests, manage partial arrivals, approve unexpected guests, operate under poor connectivity, and monitor arrivals by table, staff, and device.

The expected result is a secure, auditable, staff-only check-in foundation that prepares the platform for contracts, pricing, and payment controls in Sprint 10.
