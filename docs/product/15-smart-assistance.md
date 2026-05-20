# 15 — Smart Assistance

## 1. Purpose

This document defines how the platform can provide smart assistance to Diginoces/admin, staff, partners, bride, and groom users.

The goal is to help users work faster while keeping human approval, permissions, and auditability.

---

## 2. Core principle

Smart assistance should suggest, clean, summarize, and warn.

It should not bypass permissions, approve sensitive decisions, or change locked data without authorized user action.

---

## 3. Supported users

Smart assistance may be available to:

- Diginoces/admin;
- Diginoces staff;
- external planners/providers;
- bride;
- groom;
- wedding planners.

Guests do not need this feature in version 1.

---

## 4. Feature areas

Smart assistance may support:

- guest name cleanup;
- phone-number formatting suggestions;
- duplicate detection;
- guest import column mapping;
- tag/category suggestions;
- table assignment suggestions;
- message drafting;
- French/English template support;
- project status summaries;
- risk alerts;
- submitted text cleanup suggestions;
- backlog and documentation support.

---

## 5. Permission-aware behavior

The assistant must respect the current user’s permissions.

Examples:

- bride cannot modify groom-side guests directly;
- partner cannot see revenue;
- guest-facing data cannot reveal internal notes;
- sensitive changes require authorized approval.

---

## 6. Lock-stage behavior

Before list lock:

- bride/groom can apply suggestions directly within their allowed permissions.

After list lock:

- suggestions become change requests or staff-controlled actions.

---

## 7. Audit logging

When a user applies a suggestion, the audit log should record:

- human user who accepted it;
- affected record;
- old value;
- new value;
- timestamp;
- source marked as smart assistance.

The human user remains the accountable actor.

---

## 8. Boundaries

Smart assistance must not automatically:

- approve contracts;
- approve payment exceptions;
- approve unexpected guests;
- send messages outside the defined workflow;
- alter locked data without approval;
- expose restricted information.

---

## 9. Summary

Smart assistance should make the platform faster and more reliable, but the system must preserve permissions, human approval, audit logs, and business rules.
