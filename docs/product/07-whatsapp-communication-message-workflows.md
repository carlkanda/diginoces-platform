# 07 — WhatsApp Communication & Message Workflows

## 1. Purpose

This document defines the WhatsApp-first communication model for the Diginoces platform, including invitation messages, reminders, RSVP follow-up, modification messages, welcome/table messages, manual fallback flows, and message tracking.

---

## 2. Core communication decision

Version 1 must be WhatsApp-first.

The system should support two sending modes:

| Mode | Purpose |
|---|---|
| WhatsApp API mode | Automatic or semi-automatic sending if official integration is available |
| Guided manual mode | Opens WhatsApp with pre-filled messages and tracks staff action if API is unavailable |

Because WhatsApp API availability can depend on market/provider, guided manual mode must be treated as a first-class fallback, not an afterthought.

---

## 3. Message types

The platform should support structured message workflows for:

- invitation sending;
- invitation resend;
- RSVP request;
- Maybe RSVP follow-up;
- event reminder;
- modification/update notice;
- welcome/table message after check-in;
- payment/contract internal alerts, if later needed.

---

## 4. Message templates

Diginoces/admin should manage approved message templates.

Templates should support dynamic variables such as:

- guest display name;
- couple name;
- event name;
- event date;
- venue;
- RSVP link;
- public guest page link;
- invitation download link;
- table name;
- table number;
- wishes link;
- invitation ID.

---

## 5. Multilingual messages

Version 1 supports French and English.

Messages should be generated automatically based on the guest’s preferred language, using approved multilingual templates.

The system should not rely on unreviewed live translation at send time.

---

## 6. Invitation sending

Invitation sending should be blocked until:

- contract approved;
- full payment confirmed or payment exception approved;
- guest-facing access unlocked;
- required guest data validated;
- invitation PDF generated;
- sending channel is available.

For digital guests, WhatsApp number is required.

For printed-only guests, WhatsApp number can be missing with admin override.

---

## 7. Guided manual sending

Guided manual sending should reduce current manual errors.

The app should:

1. show the next guest to send;
2. show the correct PDF;
3. open WhatsApp with pre-filled message;
4. let staff confirm sent/skipped/failed;
5. track the staff member and timestamp;
6. move to the next guest.

This reduces the risk of sending the wrong PDF or skipping guests.

---

## 8. RSVP reminders

Guests who answer Maybe should receive follow-up reminders before RSVP deadline.

Default schedule:

- 7 days before deadline;
- 3 days before deadline;
- 1 day before deadline;
- optional same-day final reminder.

Diginoces/admin can customize the schedule per event.

---

## 9. Event reminders

Event reminder messages should be event-specific.

For multi-event weddings, reminders must not be vague. They should specify which event is coming.

Example:

- religious ceremony reminder;
- reception reminder;
- civil ceremony reminder.

---

## 10. Modification messages

When guest data changes after invitation sending, the system should identify whether a modification message may be required.

Examples:

- corrected guest name;
- table change;
- invitation regenerated;
- event detail changed;
- WhatsApp number corrected.

The system should recommend actions but staff decides whether to send/regenerate manually or automatically.

---

## 11. Welcome/table message

After check-in, the system should send or prepare a welcome message with table details.

For Couple invitations:

- first arrival sends welcome message;
- second arrival only updates count;
- no duplicate welcome message is sent.

If WhatsApp API is unavailable, the app should show guided manual send or simply display table assignment to the usher.

---

## 12. Message tracking

Each message should have a tracked status.

Possible statuses:

- not prepared;
- prepared;
- queued;
- opened manually;
- sent;
- failed;
- skipped;
- resent;
- cancelled.

Each message log should record:

- guest;
- event;
- message type;
- language;
- channel;
- staff user if manual;
- timestamp;
- status;
- related invitation/file/version if applicable.

---

## 13. Safety boundary

The product should avoid unofficial WhatsApp Web automation as the primary method.

If official API integration is unavailable, use guided manual workflows with tracking.

---

## 14. Summary

The WhatsApp communication module should preserve WhatsApp as the main channel while making communication structured, trackable, safer, multilingual, and linked to guest/invitation/event data.
