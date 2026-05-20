# 08 — Check-in & Wedding-Day Operations

## 1. Purpose

This document defines the wedding-day check-in and welcome operations for the Diginoces platform.

The goal is to replace the current QR-to-WhatsApp workflow with a real attendance-tracking system that is fast, secure, and usable at the wedding entrance.

---

## 2. Core requirements

The check-in module must support events with at least 400 guests and 2–3 entrance devices.

Target performance:

- ideal: 3–7 seconds per guest/unit;
- maximum acceptable: 10 seconds per guest/unit.

QR scanning should be supported, but it must not be the only check-in method.

---

## 3. Staff-only check-in

Check-in QR codes/links must only be usable by logged-in Diginoces/check-in staff assigned to that event.

Guests and unauthorized users must not be able to trigger check-in.

Each check-in action must record:

- staff user;
- event;
- device/station;
- check-in method;
- guest;
- time;
- arrival count;
- online/offline sync state.

---

## 4. Check-in methods

The system must support:

- QR scanning;
- invitation ID search;
- guest name search;
- phone number search;
- bride/groom side filter;
- table filter;
- manual search for printed-only guests.

If QR scanning is slow, staff should immediately use search without blocking the line.

---

## 5. QR design

Check-in QR codes must be separate from guest public page QR codes.

Check-in QR must:

- identify guest/event securely;
- use short secure tokens;
- be event-specific;
- open staff-facing check-in screen;
- not rely on WhatsApp links.

---

## 6. Couple invitations

For a Couple invitation:

- staff can choose whether 1 or 2 people arrived;
- system supports 0/2, 1/2, and 2/2 states;
- second person can be checked in later;
- welcome/table message is sent/prepared only on first arrival;
- second arrival updates count only.

---

## 7. Household groups

Household/family groups can exist, but check-in is member by member.

Each member has their own invitation, QR/check-in record, and attendance status.

---

## 8. Printed-only guests

Printed-only guests should be checked in manually by name/search, not by QR.

They still have an invitation ID and guest record.

---

## 9. Unexpected guests

If a person is not found on the guest list, staff must not admit them directly.

Workflow:

1. Staff searches guest.
2. If no match, staff creates unexpected guest request.
3. Supervisor approves/rejects in app or manually outside app.
4. Decision is recorded in the app.
5. If approved, guest may be added as exceptional/manual entry.

---

## 10. Offline mode

The check-in module must support poor internet.

Before event:

- assigned devices preload guest list;
- QR/check-in tokens are cached;
- table data and RSVP status are cached.

During event:

- check-in can continue offline;
- data syncs when connection returns;
- duplicate/conflict handling is required.

---

## 11. Device/station assignment

Diginoces/admin should assign devices/stations to staff.

Tracked fields:

- station/device name;
- assigned staff;
- event;
- mode;
- sync status;
- guest list preload status;
- activity count.

---

## 12. Dashboard

The check-in dashboard should show:

- expected guests;
- arrived guests;
- absent guests;
- partial Couple arrivals;
- arrivals by table;
- arrivals by device/staff;
- QR vs manual search counts;
- duplicate scans;
- unexpected guest requests;
- offline sync status.

No automatic slow-station alerts are required in version 1.

---

## 13. VIP/protocol mode

VIP/protocol guests should be visually highlighted on the check-in screen.

No separate supervisor notification is required in version 1.

The screen should show VIP badge, table/seat, and special instructions.

---

## 14. Welcome/table message

After first successful check-in, the system may send or prepare a welcome/table message.

If WhatsApp API is unavailable, the app can show table details for the usher and provide guided manual sending.

---

## 15. Acceptance criteria

- Only authorized staff can check guests in.
- QR and manual search both work.
- Couple partial arrivals are tracked.
- Printed-only guests are manually searchable.
- Unexpected guests require approval.
- Offline preload and sync design is supported.
- Dashboard shows arrivals by table and staff/device.

---

## 16. Summary

Check-in must become a real operational module, not just a QR shortcut. It must be fast, secure, offline-capable, staff-accountable, and linked to RSVP, seating, messaging, and reports.
