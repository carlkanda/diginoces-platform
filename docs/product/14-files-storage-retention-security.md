# 14 — Files, Storage, Retention & Security

## 1. Purpose

This document defines how the Diginoces platform should store, organize, secure, version, retain, and archive project files.

---

## 2. Core storage decision

The future app must use its own internal storage system as the official operational storage.

Google Drive may remain a temporary transition tool, but it should not be the future system of record.

---

## 3. File categories

The project file library should support categories such as:

- contracts;
- addendums;
- payment proofs;
- Canva invitation templates;
- generated invitations;
- QR assets;
- imported guest files;
- Canva CSV exports;
- table-card files;
- guest-book exports;
- reports;
- final archives.

---

## 4. File levels

Files may belong to:

- platform/global settings;
- wedding project;
- event;
- guest;
- invitation;
- payment;
- contract;
- report/export.

Guest-specific files must only be accessible to that guest or authorized internal users.

---

## 5. Version history

Important generated files should support versioning.

Examples:

- contract versions;
- invitation PDF versions;
- regenerated invitations;
- Canva CSV export versions;
- guest-book export versions;
- reports.

The system should mark one version as active/latest.

---

## 6. Secure downloads

Guest-facing downloads must be secure and revocable.

Rules:

- guests download only their own invitation;
- public links must be hard to guess;
- admin can disable/regenerate links;
- old file versions remain internal;
- download activity can be logged.

---

## 7. Retention rule

Project files should be retained for 1 year after the wedding.

Recommended lifecycle:

1. Project active.
2. Project completed.
3. Project archived.
4. Files remain accessible for 1 year.
5. Admin is notified before purge/export.
6. Admin can delete, extend retention, or preserve selected business records.

Business records such as contract/payment summaries may later require longer retention.

---

## 8. Upload validation

File uploads must validate:

- allowed file type;
- file size;
- corruption;
- dangerous extensions;
- duplicate uploads;
- project/event association.

No secrets, API keys, or environment files should be uploaded as project files.

---

## 9. Security rules

Storage security must enforce role-based access at backend level.

The frontend must not be trusted as the only security layer.

All sensitive file actions should be audit logged.

---

## 10. Summary

The platform must centralize project files in secure app-owned storage, with categories, permissions, version history, guest-safe downloads, and a 1-year retention policy.
