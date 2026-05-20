# 09 — Tables, Seating & Print Materials

## 1. Purpose

This document defines table planning, seating assignment, and print-material export workflows for the Diginoces platform.

---

## 2. Event-specific seating

Tables and seating must be managed separately for each event because different celebrations can happen in different locations with different layouts.

Each event should have its own:

- tables;
- capacities;
- table names;
- descriptions;
- seating mode;
- assignment status;
- printable exports.

---

## 3. Assignment modes

Each event can use:

| Mode | Meaning |
|---|---|
| Table-level assignment | Guest is assigned to a table only |
| Seat-level assignment | Guest is assigned to a specific seat |
| Mixed mode | Some tables have seat-level assignment; others are table-only |

The assignment mode is selected per event.

---

## 4. Table fields

Each table should include:

- table ID;
- table number/code;
- table name;
- description;
- capacity;
- event;
- display order;
- status;
- notes.

---

## 5. Seating interface

The app should support both:

- list/table view for fast editing and filtering;
- visual drag-and-drop seating map for planning.

Both views must stay synchronized.

---

## 6. Capacity rules

The system must calculate table occupancy using guest counts.

Examples:

- individual = 1;
- Couple = 2 unless event-specific rules adjust it;
- RSVP No excluded;
- RSVP Maybe included until changed.

The system should warn when a table is full or over capacity.

---

## 7. Assignment permissions

Bride/groom can assign their own guests while the list is unlocked.

Diginoces/admin can review, correct, lock, or override assignments.

After invitation sending, couple changes must become structured change requests.

---

## 8. VIP/protocol seating

VIP/protocol guests should support:

- VIP tag;
- special table/seat display;
- special instruction note;
- visual highlight at check-in.

---

## 9. Print materials

The app should not replace Canva for print design.

It should generate Canva Bulk Create CSV files for:

- table cards;
- guest-book wishes;
- printed invitation lists;
- seating/table lists;
- optional labels or cards.

For table cards, CSV fields may include:

- table ID;
- table name;
- table description;
- couple name;
- event name;
- wedding date;
- capacity;
- assigned guest count.

---

## 10. Printed invitations

The system should track printed invitation needs and statuses.

Printed-only guests:

- do not require WhatsApp number;
- receive manual RSVP handling;
- are checked in manually;
- still have an invitation ID.

---

## 11. Summary

Tables and print materials must be data-driven in the app, while Canva remains responsible for visual design and final print-ready exports.
