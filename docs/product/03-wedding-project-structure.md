# 03 — Wedding Project Structure

## 1. Document purpose

This document defines the structure of a wedding project inside the future Diginoces platform. It explains how projects, events, guests, packages, contracts, timelines, files, staff assignments, and partner relationships should be organized.

---

## 2. Core structure

The platform should use this hierarchy:

```text
Wedding Project → Events/Celebrations → Event-specific operations
```

A single wedding project represents one couple and their overall wedding service relationship with Diginoces.

Each wedding project can contain multiple events or celebrations, such as:

- civil ceremony;
- customary/traditional ceremony;
- religious ceremony;
- reception/party;
- brunch or other custom celebration.

Each event can have its own guest selection, RSVP deadline, invitation template, table plan, QR/check-in setup, reminders, print exports, and reporting.

---

## 3. Wedding project entity

A wedding project should contain the global information for the couple and the service relationship.

Recommended fields:

- project ID;
- project code;
- bride name;
- groom name;
- preferred contract approver;
- couple photo;
- primary contact;
- preferred language;
- project status;
- partner/source, if any;
- contract status;
- payment status;
- global notes;
- project timeline;
- created by;
- assigned Diginoces staff;
- archive/retention status.

The project code should be automatically generated and unique.

Recommended format:

```text
{COUPLE_CODE}-{YEAR}-{SHORT_UNIQUE_NUMBER}
```

Example:

```text
KAB-2026-001
```

---

## 4. Event entity

Each event belongs to one wedding project.

Recommended event fields:

- event ID;
- event code;
- event name;
- event type;
- event date;
- start/end time;
- venue;
- address/location notes;
- RSVP deadline;
- selected package/add-ons;
- table/seating mode;
- check-in enabled flag;
- invitation template;
- event status;
- staff assigned;
- public guest page visibility rules.

Event codes should be generated automatically from event type and editable by Diginoces/admin.

Examples:

| Event type | Default code |
|---|---|
| Civil | CIV |
| Customary/traditional | COU or TRD |
| Religious | REL |
| Reception | REC |

---

## 5. Master guest database

A wedding project should have one master guest database.

Each guest exists once in the project and can be assigned to one or more events.

This prevents duplicate data and allows phone/name corrections to update everywhere.

Example:

| Guest | Civil | Religious | Reception |
|---|---:|---:|---:|
| Couple Carl Kanda | Yes | Yes | Yes |
| Mr. Eli Mwamba | No | Yes | Yes |
| Mlle./Mme. Isabelle Okito | Yes | No | No |

Project-level guest data includes identity, contact, side, tags, household, and general preferences.

Event-level guest data includes invitation status, RSVP, table/seat assignment, check-in status, and event-specific notes.

---

## 6. Bride and groom lists

The app should preserve separate bride-side and groom-side working lists.

- Bride manages bride-side guests.
- Groom manages groom-side guests.
- Each can view the other side.
- Diginoces/admin can manage both.
- A guest can belong to both sides but must be counted once.

The system should automatically create an operational merged view from the master database.

---

## 7. Packages and pricing per event

Packages are global Diginoces packages, but each event inside a project can have its own selected package and add-ons.

Example:

| Event | Package/add-ons |
|---|---|
| Civil ceremony | Basic guest list + RSVP |
| Religious ceremony | Digital invitations + RSVP |
| Reception | Full package: invitations, RSVP, table cards, check-in, guest book |

The project total is the sum of event packages/add-ons and global adjustments.

---

## 8. One contract per project

The system should generate one contract for the whole wedding project, covering all events and selected packages.

The contract should include:

- couple information;
- all events;
- service package/add-ons per event;
- planned guest count;
- total project amount;
- payment rules;
- guest-count increase rules;
- contract approval terms.

Addendums are used for major changes after contract approval.

---

## 9. Project lifecycle

Recommended project statuses:

| Status | Meaning |
|---|---|
| Lead | Potential client request |
| Draft | Project being prepared |
| Submitted | Partner/staff submitted for review |
| Approved | Diginoces approved project |
| Contract pending | Contract generated, awaiting approval |
| Active | Contract approved and guest-list access open |
| Payment pending | Work can continue but guest-facing access locked |
| Ready for invitations | Payment/exception complete and data validated |
| Event operations | Event is near or in execution |
| Completed | Service delivered |
| Archived | Project retained according to retention policy |

---

## 10. Workflow checklist

Each project should automatically generate workflow tasks based on project/event setup.

The checklist should include:

- contract generation/approval;
- payment confirmation;
- guest-list setup;
- guest import review;
- RSVP setup;
- table/seating planning;
- invitation template upload;
- technical preview;
- invitation generation;
- invitation sending;
- printing exports;
- check-in preparation;
- wishes collection;
- guest-book export;
- post-event feedback.

Tasks may exist at project level or event level.

---

## 11. Staff and partner assignments

The system should support assignments at multiple levels:

- project coordinator;
- event lead;
- invitation manager;
- RSVP manager;
- check-in supervisor;
- print coordinator;
- guest-book reviewer;
- partner responsible for project.

External partners can create projects, but Diginoces/admin must approve them before couple access.

---

## 12. Project files

Each project should have its own file library, with files categorized by type:

- contracts/addendums;
- invitation templates;
- generated invitations;
- Canva CSV exports;
- table cards;
- guest-book exports;
- reports;
- payment proofs;
- imported CSV/Excel files.

The app storage becomes the official storage system.

---

## 13. Summary

The wedding project structure must support multi-event weddings, one master guest database, event-specific operations, project-level contracts, event-level packages, strong permissions, and automated workflow tracking.

This structure is the foundation for all future modules: guest management, RSVP, invitations, check-in, payments, files, dashboards, and partner operations.
