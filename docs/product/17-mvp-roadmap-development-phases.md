# 17 — MVP Roadmap and Development Phases

## 1. Purpose

This document defines the recommended phased build roadmap for the Diginoces platform.

The goal is to avoid trying to build the whole platform at once and instead deliver a controlled MVP through progressive, testable phases.

---

## 2. Build principle

The project must be built in phases.

Each phase should have:

- clear scope;
- linked requirement IDs;
- backlog tickets;
- acceptance criteria;
- tests;
- review gates;
- completion report.

No feature should be marked complete without implementation, testing, and review evidence.

---

## 3. MVP priority

The MVP should first prove the full operational flow for one wedding project and one or more events.

The MVP must focus on reliability and traceability before advanced automation.

---

## 4. Recommended phases

### Phase 1 — Platform foundation

Build:

- repository setup;
- app shell;
- authentication;
- database connection;
- role/permission foundation;
- audit-log foundation;
- file-storage abstraction;
- test setup.

### Phase 2 — Project and event foundation

Build:

- wedding project model;
- event model;
- project code;
- event code;
- workflow checklist;
- staff assignment;
- project dashboard basics.

### Phase 3 — Guest management

Build:

- master guest database;
- bride/groom separate lists;
- manual guest entry;
- CSV/Excel import;
- import approval;
- duplicate detection basics;
- tags and categories;
- list locking/change requests.

### Phase 4 — RSVP and guest public page

Build:

- public guest page;
- secure guest tokens;
- RSVP Yes/No/Maybe;
- event-specific RSVP;
- RSVP deadlines;
- Maybe reminders logic;
- invitation download placeholder;
- wishes placeholder.

### Phase 5 — Invitation template and generation

Build:

- Canva PDF upload;
- visual template editor first version;
- dynamic fields;
- QR generation;
- sample preview;
- batch generation;
- invitation file storage;
- regeneration/version rules.

### Phase 6 — WhatsApp communication

Build:

- message templates;
- guided manual sending;
- message status tracking;
- invitation sending queue;
- reminder messages;
- modification messages.

### Phase 7 — Tables, seating, and print exports

Build:

- event-specific tables;
- table capacity;
- table assignment;
- list view;
- visual seating view later;
- Canva CSV exports for print materials.

### Phase 8 — Check-in operations

Build:

- staff-only check-in;
- QR scanning;
- manual search;
- Couple partial arrivals;
- printed-only manual check-in;
- unexpected guest approval;
- offline preload/sync design;
- check-in dashboard.

### Phase 9 — Contracts, pricing, and payments

Build:

- package setup;
- contract generation;
- in-app contract approval;
- payment recording;
- payment gates;
- addendums;
- payment exceptions.

### Phase 10 — Reports, files, guest book, partners

Build:

- reports;
- exports;
- guest-written-message workflow;
- Canva CSV for post-event book;
- partner project tracking;
- retention/archive workflows.

---

## 5. Post-MVP items

Post-MVP features include:

- direct Canva integration;
- full WhatsApp API automation if available;
- native mobile app;
- multi-currency;
- commission/referral fee management;
- white-label SaaS;
- advanced AI automation;
- advanced seating map;
- automated print partner integration.

---

## 6. Sprint approach

Each sprint should include:

- sprint goal;
- requirement IDs covered;
- user stories;
- tasks;
- tests;
- acceptance criteria;
- security review where relevant;
- release notes.

---

## 7. Summary

The MVP roadmap should protect Diginoces from scope overload. The platform should be built as a series of controlled phases, starting with secure foundations and progressing toward full wedding guest operations.
