# 13 — Dashboards, Reports & Audit Logs

## 1. Purpose

This document defines dashboards, reports, exports, and audit-log requirements for the Diginoces platform.

---

## 2. Dashboard types

The platform should include dashboards for:

- global Diginoces operations;
- project progress;
- event progress;
- couple view;
- partner view;
- RSVP;
- invitations;
- payments;
- check-in;
- reports and exports.

Dashboards must be role-based.

---

## 3. Global admin dashboard

Visible to Diginoces/admin only.

Should show:

- active projects;
- upcoming events;
- pending contracts;
- payment blocks;
- pending imports;
- pending change requests;
- RSVP reviews;
- partner project counts;
- high-level operational status.

---

## 4. Couple dashboard

The couple dashboard should be simplified.

It should show:

- guest-list progress;
- bride/groom counts;
- event assignments;
- RSVP status;
- table assignment progress;
- invitation status;
- pending actions;
- contract/payment summary;
- key deadlines.

It should not show internal notes, audit logs, staff performance, revenue details, or partner reports.

---

## 5. Partner dashboard

Partners should see projects they brought or manage, but not revenue or payment details.

They may see:

- assigned projects;
- project status;
- operational tasks;
- couple communication thread;
- progress indicators.

---

## 6. Reports

The system should support exports in PDF, Excel, and CSV where appropriate.

Reports may include:

- final guest list;
- guest list by event;
- RSVP report;
- attendance report;
- table/seating report;
- printed invitation list;
- invitation sending report;
- payment summary;
- contract summary;
- change request report;
- event recap.

Couples can export selected reports. Diginoces/admin can export full internal reports.

---

## 7. Audit logs

Audit logs must record sensitive actions and important changes.

Track:

- user;
- role;
- action;
- object type;
- object ID;
- old value;
- new value;
- timestamp;
- source/method;
- reason/comment when available.

Audit logs must be internal and read-only.

---

## 8. Audit areas

Audit logs should cover:

- guest changes;
- imports;
- RSVP overrides;
- table changes;
- invitation generation/regeneration;
- message statuses;
- contracts/addendums;
- payments and exceptions;
- check-in events;
- unexpected guest approvals;
- file uploads/downloads;
- permission changes;
- internal notes.

---

## 9. Summary

Dashboards and reports help manage operations. Audit logs protect trust, accountability, and security. Both are essential for a professional Diginoces platform.
