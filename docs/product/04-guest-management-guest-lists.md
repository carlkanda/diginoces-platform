# 04 — Guest Management & Guest Lists

## 1. Document purpose

This document defines how guests should be created, imported, organized, validated, edited, locked, merged, tagged, grouped, assigned to events, and prepared for RSVP, invitations, seating, and check-in in the future Diginoces platform.

---

## 2. Core principle

The future app must replace the current Google Sheets guest-list workflow with an in-app guest-management module.

The system should keep the social logic of the current process:

- bride and groom have separate working lists;
- each can see the other side;
- Diginoces/admin can manage all guests;
- the system maintains one master guest database behind the scenes.

---

## 3. Master guest database

Each wedding project must have one master guest database.

A guest should exist once in the project and can be assigned to one or more events.

Guest identity data is project-level. Event-specific data is stored separately.

Project-level guest data includes:

- guest ID;
- invitation display name;
- title/type;
- first/name or full name;
- WhatsApp number;
- preferred language;
- side: bride, groom, or both;
- tags/categories;
- household/family group;
- printed/digital preference;
- notes;
- active/inactive status.

Event-level guest data includes:

- invited/not invited;
- RSVP status;
- invitation status;
- table/seat assignment;
- check-in status;
- event-specific invitation ID;
- event-specific QR/check-in token.

---

## 4. Bride and groom lists

The app should show two separate working lists:

- bride-side guest list;
- groom-side guest list.

Rules:

- bride can edit bride-side guests while the list is unlocked;
- groom can edit groom-side guests while the list is unlocked;
- each can view the partner’s list;
- Diginoces/admin can manage both sides;
- a guest can belong to both sides but must only be counted once.

---

## 5. Guest creation

Users with permission should be able to add guests manually through the app.

Required/default fields:

- title/type;
- full guest name;
- WhatsApp number if digital/WhatsApp invitation;
- side;
- event assignment;
- invitation format;
- tags if needed.

The system should show missing-data warnings before operational workflows.

---

## 6. CSV/Excel import

The system should allow CSV/Excel import for bride/groom users and Diginoces staff.

Import workflow:

1. User uploads CSV/Excel.
2. System previews rows.
3. User maps columns.
4. System validates missing/invalid data.
5. System detects duplicates.
6. User submits import for review.
7. Diginoces/admin approves, rejects, or partially approves.
8. Approved guests become active.

Bride/groom imports do not become active without Diginoces/admin approval.

---

## 7. Duplicate detection

The system should detect possible duplicates across:

- bride-side list;
- groom-side list;
- imports;
- manually entered guests;
- guests assigned to multiple events.

Duplicate signals include:

- same WhatsApp number;
- same or similar name;
- same title + name;
- same person on bride and groom lists;
- similar spelling or capitalization.

The system suggests duplicates. It must not merge automatically without user confirmation.

Both couple users and Diginoces/admin can participate in duplicate resolution.

---

## 8. Guest sides

A guest can belong to:

- bride side;
- groom side;
- both sides.

If a guest belongs to both sides, they remain one guest record and occupy only one invitation/table/check-in record per event.

---

## 9. Guest title/type

The default title/type list may include:

- Mr.;
- Mlle./Mme.;
- Couple.

The future app should allow Diginoces/admin to customize title/type values.

Bride/groom users may create simple title/types, but title/types affecting count above 1 person should require Diginoces/admin review or confirmation.

Each title/type must have a default guest count.

Examples:

| Title/type | Default count |
|---|---:|
| Mr. | 1 |
| Mme | 1 |
| Mlle | 1 |
| Couple | 2 |
| Famille | Custom/admin-controlled |

---

## 10. Household/family grouping

The system should support household/family grouping.

A household helps organize related guests but does not replace individual records.

Rules:

- separate invitations are generated for each member;
- RSVP can be answered by the main household contact on behalf of all members;
- check-in is done member by member;
- household grouping helps filtering, seating, communication, and reporting.

Children are entered as normal guests with a tag such as `Child`.

---

## 11. Tags and categories

The system should support tags/categories beyond bride/groom side.

Examples:

- family;
- friends;
- colleagues;
- church;
- VIP;
- protocol;
- printed invitation;
- digital invitation;
- child;
- special attention;
- follow-up needed.

Bride/groom can create their own tags. Diginoces/admin can also create internal tags visible only to authorized staff.

---

## 12. Bulk editing

The system should support bulk actions, including:

- assign to events;
- remove from events;
- assign to table;
- apply tags;
- change invitation format;
- set RSVP manually;
- export selected guests;
- prepare messages for selected guests.

Bulk editing must follow permissions and list-lock rules.

---

## 13. Guest self-edits

Guests may edit some of their own data from the public guest page until the RSVP deadline.

Allowed direct edits:

- spelling correction;
- WhatsApp number correction;
- one wish/message before deadline.

Sensitive changes should become requests:

- changing title/type;
- adding another person;
- changing event attendance after lock;
- asking for table change;
- asking for printed invitation.

---

## 14. Locking and change requests

Guest lists should become locked after a certain stage.

Recommended stages:

| Stage | Bride/Groom access |
|---|---|
| Guest preparation | Direct edit |
| Table assignment | Direct edit |
| Final review | Direct edit with warnings |
| After invitation generation | Soft lock/change request |
| After invitation sending | Hard lock/change request only |
| Wedding day | Staff/admin only |

After lock, bride/groom submit structured change requests.

Change request types include:

- correct guest name;
- change title;
- change WhatsApp number;
- move guest to table;
- add guest;
- remove/cancel guest;
- change printed/digital invitation preference.

Diginoces staff reviews and decides what follow-up actions are needed.

---

## 15. Printed-only guests

Diginoces/admin may override missing WhatsApp number when a guest will receive printed invitation only.

Printed-only guests:

- still have invitation IDs;
- are tracked in the system;
- use manual RSVP handled by Diginoces/couple;
- are checked in manually by name/search;
- do not receive WhatsApp messages unless a number is later added.

---

## 16. Validation rules

Before invitation generation, the system must check required data.

Typical required data:

- guest title/type;
- guest name;
- event assignment;
- invitation format;
- WhatsApp number for digital guests;
- table assignment if required by event/template;
- public guest page token;
- check-in token.

Guests with missing required data should be blocked from generation until fixed or overridden where allowed.

---

## 17. Summary

Guest management is the operational heart of the platform. The system must replace manual spreadsheet work with structured guest records, controlled permissions, validation, import review, duplicate detection, list locking, change requests, and strong links to RSVP, invitations, seating, check-in, and reports.
