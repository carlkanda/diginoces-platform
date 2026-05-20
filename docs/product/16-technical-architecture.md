# 16 — Technical Architecture

## 1. Purpose

This document defines the recommended technical architecture for the Diginoces platform.

---

## 2. Recommended version 1 stack

Recommended MVP stack:

- Next.js;
- React;
- TypeScript;
- PostgreSQL;
- Supabase Auth or equivalent;
- Supabase Storage or equivalent app-owned storage;
- Vercel deployment;
- background workers for heavy tasks;
- PWA support for check-in.

---

## 3. Architecture principle

The platform should be a responsive web app first. It should work well on phones, tablets, and laptops.

Native mobile apps are not required in version 1.

---

## 4. Backend modules

Recommended backend modules:

- authentication;
- users and roles;
- projects;
- events;
- guests;
- RSVP;
- invitations;
- files/storage;
- messaging;
- seating;
- check-in;
- contracts;
- pricing/payments;
- partners;
- reports;
- audit logs;
- background jobs.

---

## 5. Database

PostgreSQL is recommended because the system is relational and rule-heavy.

Core entities include:

- users;
- roles;
- wedding projects;
- events;
- guests;
- guest event assignments;
- RSVP records;
- tables/seats;
- invitations;
- QR tokens;
- messages;
- contracts;
- payments;
- files;
- check-ins;
- wishes;
- audit logs.

---

## 6. Background jobs

Heavy or scheduled operations should not run directly in normal API requests.

Background jobs should handle:

- PDF generation;
- QR generation;
- batch invitation generation;
- message queue processing;
- reminders;
- file cleanup;
- exports;
- offline check-in sync processing.

---

## 7. File storage

The app should use app-owned storage for operational files.

Files should be categorized, permission-controlled, and versioned where necessary.

---

## 8. Offline check-in

Offline check-in should use a PWA-style approach:

- preload event guest list;
- store local check-in data in browser storage;
- sync when connection returns;
- handle duplicate/conflict cases.

---

## 9. Integrations

Version 1 integrations may include:

- WhatsApp API or guided manual WhatsApp mode;
- Google Calendar sync;
- Canva CSV export.

Direct Canva integration can be explored later.

---

## 10. Security

Security must be enforced on the backend.

Key rules:

- role-based permissions;
- secure guest tokens;
- secure check-in tokens;
- 2FA for sensitive roles;
- audit logs;
- protected file downloads;
- no secrets in repo.

---

## 11. Summary

The technical architecture should prioritize a secure responsive web platform, structured PostgreSQL data, background jobs for heavy tasks, app-owned storage, and offline-capable check-in.
