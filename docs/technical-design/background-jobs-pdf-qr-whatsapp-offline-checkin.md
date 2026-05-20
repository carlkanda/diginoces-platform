# Technical Design Package — Background Jobs, PDF, QR, WhatsApp and Offline Check-in

## 1. Purpose

This document defines the background and asynchronous workflows required by the Diginoces platform.

These workflows include PDF generation, QR generation, WhatsApp message processing, reminders, report exports, file cleanup, and offline check-in synchronization.

---

## 2. Core principle

Long-running or scheduled work must not run directly inside normal request/response API calls.

Heavy operations should be queued and processed by workers.

---

## 3. Background job categories

Recommended job categories:

- invitation PDF generation;
- QR token and QR image generation;
- batch invitation generation;
- WhatsApp message preparation/sending;
- reminder scheduling;
- CSV exports;
- report exports;
- offline check-in sync processing;
- file retention/archive cleanup.

---

## 4. PDF generation jobs

PDF generation jobs should support:

- template ID;
- event ID;
- selected guest IDs;
- generation mode;
- dynamic field configuration;
- output file storage;
- generation status;
- error logs.

PDF jobs must update invitation records and file versions.

---

## 5. QR generation jobs

QR generation should create secure tokens for:

- guest public page access;
- staff-only check-in.

The two token types must remain separate.

Tokens must be unique, revocable, and event-aware where needed.

---

## 6. WhatsApp jobs

WhatsApp jobs should support two modes:

- API mode if official WhatsApp integration is available;
- guided manual mode as a fallback.

Message jobs should track:

- guest;
- event;
- message type;
- template version;
- language;
- status;
- error/failure details;
- staff actor if manual.

---

## 7. Reminder jobs

Reminder jobs should support:

- Maybe RSVP reminders;
- event reminders;
- invitation resend reminders if needed;
- customizable schedules per event.

Jobs should stop once the reminder condition no longer applies.

---

## 8. Offline check-in sync

Offline check-in uses preloaded event guest data.

When connection returns, check-in records sync to the server.

Sync must handle:

- duplicate check-ins;
- partial Couple arrivals;
- conflicting device updates;
- unexpected guest approvals;
- timestamp preservation;
- sync status updates.

---

## 9. Job status model

Recommended statuses:

- pending;
- queued;
- running;
- completed;
- failed;
- cancelled;
- retrying.

Jobs should record attempts and failure messages.

---

## 10. Acceptance criteria

- Heavy work is queued.
- PDF generation does not block normal APIs.
- QR token types are separate.
- Message statuses are tracked.
- Reminder jobs respect event-specific schedules.
- Offline check-in sync handles duplicate/conflict cases.

---

## 11. Summary

Background jobs are essential for scalability, reliability, and user experience. They prevent heavy operations from slowing the main app and make PDF, WhatsApp, reminder, and check-in workflows more reliable.
