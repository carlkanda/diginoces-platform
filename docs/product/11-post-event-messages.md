# 11 — Post-Event Messages and Book Export

## 1. Purpose

This document defines how the platform collects short written messages from invited guests and prepares the approved content for a post-event printed book workflow.

---

## 2. Guest submission rules

Guests can submit one text-only message from their personal public page.

Version 1 supports:

- text only;
- emojis;
- one message per guest;
- editing before the configured deadline;
- no audio, video, photo, or file uploads.

---

## 3. Data to store

Each submitted message should store:

- project ID;
- event ID when applicable;
- guest ID;
- original text;
- edited/approved text;
- submitted language;
- submission timestamp;
- edit timestamp;
- review status;
- inclusion status;
- export status.

---

## 4. Review workflow

Recommended workflow:

1. Guest submits a message.
2. System stores it as pending review.
3. Diginoces/admin reviews it.
4. Admin may approve, edit, exclude, or flag it.
5. Couple reviews the cleaned list.
6. Diginoces/admin performs final validation.
7. Approved entries are exported for Canva Bulk Create.

---

## 5. Diginoces/admin review

Diginoces/admin can:

- approve;
- edit;
- exclude;
- flag for correction;
- bulk approve clean entries.

The platform must preserve the original text separately from the edited/approved text.

---

## 6. Couple review

The couple can review the prepared entries before export.

They can:

- approve;
- request correction;
- exclude;
- add a comment for Diginoces/admin.

Diginoces/admin keeps final operational control.

---

## 7. Canva CSV export

Canva remains the design tool in version 1.

The app should generate a clean CSV file containing approved entries only.

Recommended CSV columns:

- guest_display_name;
- message_text;
- event_name;
- couple_name;
- page_order;
- language;
- category;

---

## 8. File storage

The generated CSV and any final exported PDF uploaded back into the app should be stored in the project file library.

Track:

- export date;
- exported by;
- number of entries included;
- number excluded;
- CSV version;
- final file version.

---

## 9. Acceptance criteria

- Guest can submit one text entry.
- Guest can edit before deadline.
- Diginoces/admin can review and moderate.
- Couple can review before export.
- Approved entries export to CSV.
- Export files are stored in app-owned storage.

---

## 10. Summary

This module keeps guest submission simple while making the post-event book workflow structured, reviewable, and ready for Canva Bulk Create.
