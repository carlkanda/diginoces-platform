# Technical Design Package — Database Schema and Core Entities

## 1. Purpose

This document defines the recommended PostgreSQL data model for the Diginoces platform.

The schema must support wedding projects, multiple events, users, roles, guests, RSVP, invitations, QR tokens, WhatsApp workflows, tables/seating, contracts, payments, files, check-in, partner operations, notes, reports, and audit logs.

---

## 2. Core schema principles

- Use PostgreSQL as the main relational database.
- Use UUID primary keys for internal records.
- Use readable public codes for staff-facing/project-facing identifiers.
- Separate project-level data from event-level data.
- Enforce permissions at backend level, not only frontend.
- Track important changes through audit logs.
- Never store secrets or API credentials in normal business tables.

---

## 3. Core entities

Recommended core tables:

```text
users
roles
permissions
user_roles
projects
events
project_members
event_members
guests
guest_event_assignments
households
guest_tags
tables
seats
rsvp_records
invitations
invitation_files
qr_tokens
message_templates
message_logs
contracts
contract_addendums
packages
package_items
payments
payment_exceptions
files
check_in_records
unexpected_guest_requests
wishes
comments
internal_notes
audit_logs
workflow_tasks
partners
```

---

## 4. Project and event model

A `project` represents the couple and global wedding relationship.

An `event` represents one celebration inside a project, such as religious ceremony, civil ceremony, reception, or traditional ceremony.

Important rule:

```text
Project → Events → Event-specific guest operations
```

---

## 5. Guest model

Guests exist once at project level.

Event-specific guest data is stored in `guest_event_assignments`.

This allows one guest to attend multiple events without duplicate identity records.

---

## 6. RSVP model

RSVP is stored per guest and per event.

Allowed values:

- pending;
- yes;
- no;
- maybe.

No excludes the guest from expected attendance for that event. Maybe remains included until changed or manually reviewed.

---

## 7. Invitation and QR model

Invitation records are event-specific.

The system should maintain separate tokens for:

- public guest page access;
- check-in QR access.

Invitation files must support versioning and active/latest status.

---

## 8. Check-in model

Check-in records are event-specific and must track:

- guest;
- staff user;
- device/station;
- method;
- timestamp;
- arrival count;
- sync status;
- duplicate/partial states.

---

## 9. File model

Files must support:

- project-level files;
- event-level files;
- guest-specific files;
- file category;
- storage path;
- version;
- active/latest flag;
- access permissions.

---

## 10. Audit log model

Audit logs should record:

- actor user ID;
- action;
- object type;
- object ID;
- old value;
- new value;
- source/method;
- timestamp;
- optional reason/comment.

Audit logs should be append-only.

---

## 11. Implementation note

This document describes core entities conceptually. Actual SQL migrations should be created under:

```text
supabase/migrations/
```

The first implementation sprint should create only the foundation tables needed for authentication, users, roles, projects, audit logs, and storage abstraction.
