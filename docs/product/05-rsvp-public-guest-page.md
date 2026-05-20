# 05 — RSVP & Public Guest Page

## 1. Document purpose

This document defines the RSVP model and the public guest page for the future Diginoces platform.

The public guest page is the guest-facing space where each guest can RSVP, view event information, download their invitation, see table information when released, and submit wishes for the couple.

---

## 2. Public guest page concept

Each guest should have a secure personal public page.

Guests should access the page without creating an account, using a secure personal link or QR code.

The link must be unique, hard to guess, revocable, and tied to one guest/public page token.

The page should act as a personal event space for the guest, not as a general wedding website.

---

## 3. Guest page visibility and payment gate

Guest public pages should be locked until full payment is confirmed, unless Diginoces/admin grants a payment exception override.

Before payment unlock:

- guests cannot access their public page;
- Diginoces/admin can preview the page;
- couple users cannot preview guest pages;
- invitation sending remains locked.

After payment unlock:

- guest public pages become accessible;
- invitation sending becomes available;
- RSVP becomes active according to event settings.

---

## 4. Guest page design

The internal app should be professional and dashboard-like, but the public guest page should be elegant and wedding-style.

The guest page should use one Diginoces default elegant theme in version 1.

It should include:

- couple photo;
- couple names;
- event details;
- RSVP section;
- invitation download;
- QR/check-in information if applicable;
- table assignment once released;
- wishes submission;
- language selector.

The couple photo should be visible immediately once the page is accessible.

---

## 5. Guest page content

Recommended sections:

1. Welcome / guest display name
2. Couple photo and names
3. Event list
4. RSVP section
5. Download invitation button
6. Table assignment when released
7. Guest wishes form
8. Latest update notice
9. Contact/help information

The guest page should not show:

- full guest list;
- other guests’ data;
- phone numbers;
- internal notes;
- admin comments;
- check-in history;
- payment or contract data.

---

## 6. RSVP model

RSVP should be included in the platform.

Guest answers should be simple:

- Yes;
- No;
- Maybe.

Guests invited to multiple events should use one RSVP flow where they choose their answer per event.

Example:

| Event | RSVP |
|---|---|
| Civil | Yes / No / Maybe |
| Religious | Yes / No / Maybe |
| Reception | Yes / No / Maybe |

---

## 7. RSVP by event

Each event must have its own RSVP deadline.

RSVP statuses must be stored per event because guests may attend one event and decline another.

A single guest page can show all events the guest is invited to, while the system stores event-specific answers.

---

## 8. RSVP change rules

Guests can change their RSVP answer later only if the previous answer was `Maybe`.

Rules:

| Previous answer | Guest can change later? |
|---|---:|
| Yes | No |
| No | No |
| Maybe | Yes |

Diginoces/admin can manually override or unlock RSVP answers when guests contact the team outside the app.

---

## 9. Operational effect of RSVP

RSVP should affect operations.

Rules:

| RSVP | Operational treatment |
|---|---|
| Yes | Included in expected attendance, table capacity, reminders, and check-in |
| Maybe | Included until final decision |
| No | Excluded from expected attendance, table capacity, reminders, and check-in |
| Pending | Included or reviewed depending on deadline stage |

For Couple invitations, a Maybe response keeps the full expected count until changed or manually updated.

---

## 10. RSVP deadline review

When an RSVP deadline passes, guests still marked Pending or Maybe should not be automatically excluded.

They should enter a manual review list for Diginoces/admin and the couple.

Both Diginoces/admin and the couple can mark these guests as Yes, No, or Maybe during review.

All review changes must be logged.

---

## 11. Maybe reminders

Guests who answered Maybe should receive several follow-up reminders before the RSVP deadline.

Default schedule:

- 7 days before RSVP deadline;
- 3 days before RSVP deadline;
- 1 day before RSVP deadline;
- optional same-day final reminder.

Diginoces/admin can customize this schedule per event.

---

## 12. WhatsApp-first RSVP

The preferred RSVP channel is WhatsApp where official API integration is available.

Fallback is the public guest page.

The system should support:

- WhatsApp API mode;
- guided manual WhatsApp mode;
- public guest page RSVP fallback.

---

## 13. Invitation download

Guests should be able to download their own latest invitation PDF from the public guest page.

Rules:

- guest sees only their own invitation;
- latest active version is shown;
- old versions remain archived internally;
- download activity can be tracked;
- admin can disable/regenerate the guest link.

---

## 14. Guest self-editing

Guests can edit allowed information until the RSVP deadline.

Allowed direct edits:

- name spelling correction;
- WhatsApp number correction;
- wish text before closure.

Sensitive edits become requests:

- title/type change;
- additional person;
- event attendance changes after lock;
- table change;
- printed invitation request.

---

## 15. Printed-only guests

Printed-only guests should have RSVP handled manually by Diginoces/couple.

They should not be forced into the digital guest page flow.

Their RSVP source should be recorded as manual, phone call, WhatsApp, in-person confirmation, family confirmation, or other.

---

## 16. Summary

The RSVP and public guest page module should provide a simple, elegant, guest-facing experience while keeping operational data structured for Diginoces.

The page should support RSVP, invitation download, event information, guest wishes, and controlled visibility based on payment, event setup, deadlines, and permissions.
