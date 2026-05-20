# MVP Build Execution Plan — Diginoces

## 1. Purpose

This document converts the requirements, backlog, and technical design into a practical MVP build sequence.

The MVP must be built in controlled phases so AI agents do not forget features, skip review gates, or build outside the approved scope.

---

## 2. MVP principle

The first MVP should prove the core Diginoces operating system:

- secure user access;
- project/event setup;
- guest management;
- RSVP;
- invitation generation;
- WhatsApp-first sending workflow;
- table/seating planning;
- check-in;
- contracts/payments;
- files/reports.

Advanced features can come later.

---

## 3. Sprint 1 — Secure platform foundation

Goal: create the technical foundation.

Scope:

- repository structure;
- app shell;
- authentication foundation;
- database connection;
- roles/permissions foundation;
- audit-log foundation;
- file-storage abstraction;
- test setup;
- developer setup guide.

Do not build guest management, invitations, WhatsApp, or check-in yet.

---

## 4. Sprint 2 — Projects and events foundation

Goal: create wedding project and event foundations.

Scope:

- wedding project entity;
- event entity;
- project code generation;
- event code generation;
- project status workflow;
- project members;
- event members;
- basic project dashboard;
- workflow checklist foundation.

---

## 5. Sprint 3 — Guest management foundation

Goal: replace Google Sheets guest-list structure with app-managed guest data.

Scope:

- master guest database;
- bride/groom separate lists;
- manual guest creation;
- tags/categories;
- title/type setup;
- event assignment;
- duplicate detection basics;
- validation rules.

---

## 6. Sprint 4 — Guest import and approval

Scope:

- CSV/Excel import;
- column mapping;
- import preview;
- validation warnings;
- duplicate warnings;
- admin approval/rejection;
- import history.

---

## 7. Sprint 5 — RSVP and public guest page

Scope:

- secure public guest page;
- payment gate;
- RSVP Yes/No/Maybe;
- event-specific RSVP;
- RSVP deadlines;
- Maybe follow-up logic;
- guest preferred language;
- invitation download placeholder;
- written message submission placeholder.

---

## 8. Sprint 6 — Invitation template and PDF foundation

Scope:

- Canva PDF upload;
- template configuration;
- dynamic fields;
- preview/staging;
- QR token generation;
- batch generation job;
- generated file storage;
- version tracking.

---

## 9. Sprint 7 — WhatsApp workflows

Scope:

- message templates;
- guided manual sending;
- invitation sending status;
- reminder status;
- modification messages;
- resend support.

---

## 10. Sprint 8 — Tables and seating

Scope:

- event-specific tables;
- capacities;
- assignments;
- capacity warnings;
- list/table view;
- Canva CSV export for table cards.

---

## 11. Sprint 9 — Check-in

Scope:

- staff-only check-in;
- QR scan flow;
- manual search;
- Couple partial arrivals;
- printed-only manual check-in;
- unexpected guest request;
- check-in dashboard;
- offline preload/sync foundation.

---

## 12. Sprint 10 — Contracts, pricing, payments

Scope:

- package setup;
- contract generation;
- in-app approval;
- payment recording;
- payment gates;
- payment exception;
- addendum foundation.

---

## 13. Sprint 11 — Reports, exports, post-event workflows

Scope:

- dashboards;
- report exports;
- written guest messages review;
- Canva CSV export;
- archive/retention basics;
- post-event feedback foundation.

---

## 14. Completion rule

Each sprint must produce:

- implemented code;
- tests;
- updated documentation;
- requirements covered;
- blockers/open issues;
- next sprint recommendation.

---

## 15. Summary

The MVP should be built progressively. Sprint 1 establishes the foundation; later sprints layer business modules without breaking traceability or security.
