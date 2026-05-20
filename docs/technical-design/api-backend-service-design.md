# Technical Design Package — API and Backend Service Design

## 1. Purpose

This document defines the backend service architecture and API organization for the Diginoces platform.

---

## 2. Backend principles

- Backend must enforce permissions.
- Business gates must be enforced server-side.
- Sensitive changes must create audit logs.
- Long-running work must run in background jobs.
- API responses should be consistent and predictable.

---

## 3. Recommended service modules

```text
auth-service
user-role-service
project-service
event-service
guest-service
rsvp-service
invitation-service
message-service
seating-service
checkin-service
contract-service
payment-service
file-service
report-service
audit-service
partner-service
workflow-service
```

---

## 4. API endpoint groups

Recommended endpoint groups:

```text
/api/auth
/api/users
/api/roles
/api/projects
/api/events
/api/guests
/api/imports
/api/rsvp
/api/invitations
/api/messages
/api/tables
/api/check-in
/api/contracts
/api/payments
/api/files
/api/reports
/api/partners
/api/public/guest
```

---

## 5. Business gates

Backend must enforce:

- contract approval before guest-list access;
- full payment or exception before invitation sending;
- full payment or exception before guest public page access;
- list lock after invitation sending;
- event-specific permissions;
- staff-only check-in;
- partner revenue restrictions.

---

## 6. Audit behavior

API actions that change important data must write audit logs.

Examples:

- guest created/updated/deleted;
- RSVP changed;
- table assignment changed;
- payment recorded;
- contract approved;
- invitation generated/regenerated;
- check-in performed;
- unexpected guest approved;
- permissions changed.

---

## 7. Background job triggers

APIs may enqueue jobs for:

- PDF generation;
- QR generation;
- batch invitation generation;
- message sending/preparation;
- report exports;
- reminder scheduling;
- archive cleanup.

---

## 8. Error handling

API errors should return structured responses:

```json
{
  "error": {
    "code": "PAYMENT_REQUIRED",
    "message": "Invitation sending is locked until full payment is confirmed.",
    "details": {}
  }
}
```

---

## 9. Testing expectations

Backend must include tests for:

- permissions;
- business gates;
- validation;
- audit logging;
- background job enqueueing;
- public token access;
- check-in access.

---

## 10. Summary

The backend must be the guardian of business rules, permissions, data integrity, and auditability. The frontend should never be the only enforcement layer.
