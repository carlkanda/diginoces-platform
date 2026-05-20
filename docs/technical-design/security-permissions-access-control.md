# Technical Design Package — Security, Permissions and Access Control

## 1. Purpose

This document defines the security and access-control design for the Diginoces platform.

---

## 2. Security principles

- Enforce permissions on the backend.
- Use role-based access control.
- Support global, project-level, and event-level permissions.
- Require 2FA for sensitive roles.
- Use secure tokens for public guest pages and check-in.
- Audit sensitive actions.
- Protect files with server-side authorization.

---

## 3. Sensitive roles

2FA should be required for:

- Diginoces admin;
- payment/finance role;
- contract manager;
- check-in supervisor;
- role/permission manager;
- pricing/package manager;
- partner admin.

---

## 4. Permission layers

The system should support:

- global role;
- project assignment;
- event assignment;
- custom permission sets.

---

## 5. Public guest page security

Guests access their own page through secure tokens.

Rules:

- no guest account required;
- token must be hard to guess;
- token can be revoked/regenerated;
- page locked until payment or exception;
- guest sees only their own data.

---

## 6. Check-in security

Check-in requires a logged-in assigned staff user.

Check-in QR codes must not allow anonymous check-in.

Each action records staff user, event, device/station, method, and timestamp.

---

## 7. File security

File access must be permission-controlled.

Guests can access only their own active invitation file.

Internal files such as contracts, payments, internal notes, and reports must be protected by role.

---

## 8. Partner restrictions

Partners must not access:

- revenue;
- payment details;
- payment exceptions;
- internal notes;
- audit logs;
- global business reports.

---

## 9. Audit logs

Audit logs should be append-only and visible only to authorized internal roles.

Audit sensitive changes such as guest edits, RSVP overrides, payments, contracts, file downloads, check-ins, and permission changes.

---

## 10. Summary

Security must be built into the backend and not treated as a UI-only concern. Every sensitive action must be permission-checked and traceable.
