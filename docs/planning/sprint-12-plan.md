# Sprint 12 Plan — Guest Wishes, Guest Book & Post-Event Feedback

## 1. Sprint goal

Sprint 12 builds the **Guest Wishes, Guest Book & Post-Event Feedback** foundation for the Diginoces platform.

The goal is to complete the post-event guest-facing and couple-facing service loop by allowing guests to submit written wishes/messages, allowing Diginoces/admin and the couple to review them, exporting approved content for Canva Bulk Create, tracking guest-book files, and collecting post-event satisfaction feedback from the couple.

Sprint 12 must establish:

- guest written-message/wish submission on the public guest page;
- one text message per guest;
- emoji support;
- edit-before-deadline behavior;
- guest-message review/moderation by Diginoces/admin;
- couple review and approval workflow;
- preservation of original submitted text and edited/approved text;
- approved-message export for Canva Bulk Create;
- guest-book export/file tracking;
- post-event satisfaction feedback from the couple;
- public testimonial permission flag;
- audit logging for moderation, approvals, exports, and feedback actions.

Sprint 12 must not build partner SaaS scaling, partner commission management, advanced AI assistance, full marketing website testimonial publishing, or direct Canva API integration.

---

## 2. Source documents

Before coding, the agent must read and follow:

- `AGENTS.md`
- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/planning/sprint-11-plan.md`
- `docs/product/11-post-event-messages.md`
- `docs/product/05-rsvp-public-guest-page.md`
- `docs/product/13-dashboards-reports-audit-logs.md`
- `docs/product/14-files-storage-retention-security.md`
- `docs/product/01-product-vision-business-model.md`
- `docs/product/02-user-roles-permissions-access-control.md`
- `docs/technical-design/database-schema-core-entities.md`
- `docs/technical-design/api-backend-service-design.md`
- `docs/technical-design/security-permissions-access-control.md`
- `docs/backlog/master-requirements-register.csv`
- `docs/backlog/initial-product-backlog-epics.csv`
- `docs/backlog/initial-product-backlog-features.csv`
- `docs/backlog/initial-product-backlog-user-stories.csv`
- `docs/backlog/initial-product-backlog-tasks.csv`
- `docs/backlog/initial-product-backlog-test-cases.csv`

---

## 3. Sprint dependency

Sprint 12 depends on Sprint 11 being merged into `main`.

Sprint 12 must assume these foundations already exist:

- secure platform foundation;
- project and event models;
- guest model;
- guest public page foundation;
- public guest token foundation;
- RSVP foundation;
- invitation and messaging foundations;
- file/export foundation;
- dashboards/report foundation;
- audit-log foundation;
- RBAC and permission foundations.

If any Sprint 11 dependency is missing, the agent must stop, report the blocker, and avoid creating workaround models that conflict with the planned architecture.

---

## 4. Backlog scope

Sprint 12 focuses on the **Guest Wishes & Guest Book** and **Post-Event Feedback** scope.

Primary epic:

- `EPIC-WISH` — Guest Wishes & Guest Book

Related reporting/file scope:

- `EPIC-REP` — Dashboards, Reports & Audit Logs
- `EPIC-FILE` — Files, Storage, Retention & Security

Primary features:

- `FEAT-WISH-001` — Guest written-message submission
- `FEAT-WISH-002` — One message per guest with edit-before-deadline behavior
- `FEAT-WISH-003` — Diginoces/admin moderation workflow
- `FEAT-WISH-004` — Couple review and approval workflow
- `FEAT-WISH-005` — Preserve original and approved/edited message versions
- `FEAT-WISH-006` — Canva Bulk Create CSV export foundation
- `FEAT-WISH-007` — Guest-book file tracking foundation
- `FEAT-FEEDBACK-001` — Couple post-event satisfaction feedback
- `FEAT-FEEDBACK-002` — Public testimonial permission flag

If the exact feature IDs differ in the CSV backlog, the agent must use the matching backlog rows and document the actual IDs in the Sprint 12 completion report.

---

## 5. Requirement IDs covered

Sprint 12 should primarily cover or begin coverage for:

- `WISH-001` — Guests submit wishes through their public guest page, replacing Google Forms
- `WISH-002` — Version 1 supports text wishes with emojis only; no audio/video/photo uploads
- `WISH-003` — Each guest can submit only one wish and edit the same wish before deadline
- `WISH-004` — Diginoces/admin can review, edit, approve, exclude, and moderate wishes
- `WISH-005` — Preserve original wish and approved/edited wish for printing
- `WISH-006` — Couple can review and approve wishes before guest-book export
- `WISH-007` — Export approved wishes as Canva Bulk Create CSV
- `WISH-008` — Final guest-book CSV/PDF files stored in project file library
- `FILE-001` — App-owned storage as official storage system
- `FILE-002` — Project file library with categories
- `FILE-005` — Version history with active/latest marker
- `FILE-008` — Store Canva CSV exports with metadata and versioning
- `REP-005` — Reports/export foundation as PDF, Excel, or CSV depending on use case
- `REP-006` — Audit logs for sensitive actions
- `ROLE-005` — Bride/groom selected project visibility and restrictions
- `ROLE-009` — Guests access only their own secure public page
- `TECH-004` — Backend permission enforcement

Sprint 12 may reference future requirements, but it must not implement future modules unless explicitly in scope.

---

## 6. In scope

Sprint 12 may implement the following.

### 6.1 Guest written-message submission

Guests should submit a written message from their personal public guest page.

Rules:

- guest accesses the page through existing secure guest token;
- guest sees only their own page;
- guest can submit one written message;
- message is text-only;
- emojis are allowed;
- no audio, video, photo, or file uploads in version 1;
- message must be associated with project and guest;
- event association is optional unless the event-specific design requires it.

### 6.2 One message per guest

Each guest can submit only one written message.

If the guest submits again before the deadline, the system should update the same message rather than create duplicates.

The system should track:

- original submitted text;
- current submitted text;
- edited/approved text;
- submission timestamp;
- last edit timestamp;
- status.

### 6.3 Edit-before-deadline behavior

Guests may edit their own message before the configured deadline.

Deadline may be:

- project-level guest-message deadline;
- event-level guest-message deadline;
- post-event deadline set by Diginoces/admin;
- default deadline if no specific setting exists.

After the deadline, guests should not directly edit the message unless Diginoces/admin reopens or edits it internally.

### 6.4 Message status model

A written message should support statuses such as:

```text
not_submitted
submitted
edited
pending_review
approved
edited_by_admin
excluded
flagged
exported
archived
```

The exact enum names may follow existing conventions.

Statuses must be clear enough to support review, export, and audit.

### 6.5 Diginoces/admin moderation workflow

Diginoces/admin or authorized staff can review guest messages.

Moderation actions may include:

- approve;
- edit approved text;
- exclude;
- flag for correction;
- restore to pending review;
- bulk approve clean messages;
- add internal moderation note.

The original guest-submitted text must be preserved separately from the edited/approved text.

Moderation actions must be audited.

### 6.6 Couple review workflow

The couple should be able to review messages before guest-book export.

Couple users may:

- view submitted/approved messages for their project;
- approve messages;
- request correction;
- exclude a message, if allowed by Diginoces rules;
- comment for Diginoces/admin;
- confirm guest-book content is ready for export.

Diginoces/admin keeps final operational control.

The couple must not access internal moderation/audit logs.

### 6.7 Original vs approved text preservation

The system must store both:

- original submitted text;
- edited/approved text used for export/printing.

This protects authenticity while allowing Diginoces/admin to correct spelling, remove inappropriate content, or format the message for the guest-book workflow.

### 6.8 Canva Bulk Create CSV export

Canva remains the guest-book design tool in version 1.

Sprint 12 should generate a CSV export containing approved messages only.

Recommended columns:

```text
guest_display_name
message_text
project_code
couple_names
event_name
page_order
language
category
submitted_at
approved_at
```

The implementation should support:

- export approved-only messages;
- exclude flagged/excluded messages;
- order messages by chosen logic;
- register export file in app-owned storage/file library;
- record export metadata;
- audit export action.

### 6.9 Guest-book file tracking

The project file library should track:

- guest-book CSV exports;
- final guest-book PDF uploaded back into the app, if applicable;
- export version;
- exported by;
- exported at;
- number of messages included;
- number of messages excluded;
- file status;
- active/latest marker.

If final PDF upload is not implemented in Sprint 12, add a placeholder and document follow-up.

### 6.10 Post-event satisfaction feedback

The couple should be able to submit post-event satisfaction feedback.

Feedback should capture:

- project ID;
- submitted by couple user;
- overall rating;
- service quality rating, if included;
- check-in experience rating, if included;
- invitation/communication experience rating, if included;
- free-text feedback;
- improvement suggestions;
- testimonial text, if separate from feedback;
- permission to use publicly as testimonial;
- submitted_at timestamp.

Keep the feedback form simple and respectful.

### 6.11 Public testimonial permission flag

The couple should be able to choose whether their feedback/testimonial can be used publicly.

The system should store:

- testimonial permission: yes/no;
- permission timestamp;
- approver/submitting user;
- testimonial text;
- public display name preference if implemented;
- internal review status.

Sprint 12 should not publish testimonials automatically to a public marketing website.

Diginoces/admin should review/approve before any external/public use.

### 6.12 Post-event dashboard/report integration

Sprint 12 may add simple dashboard/report indicators:

- number of messages submitted;
- number pending review;
- number approved;
- number excluded;
- guest-book export status;
- feedback submitted/not submitted;
- satisfaction score summary.

Keep dashboard additions minimal and connected to Sprint 11 foundations.

### 6.13 Notification/reminder foundation

If messaging foundation exists, Sprint 12 may prepare placeholders for:

- reminder to guests to submit messages;
- reminder to couple to review messages;
- reminder to couple to submit feedback.

Do not build full automatic messaging unless Sprint 7 background/manual workflows support it cleanly.

### 6.14 Basic UI

Add basic UI for:

- guest public page message submission section;
- message edit before deadline;
- Diginoces/admin moderation list;
- message detail/review screen;
- couple review screen;
- export approved messages action;
- guest-book export history;
- post-event feedback form for couple;
- testimonial permission option;
- feedback review page for Diginoces/admin.

Keep UI simple and operational.

Sprint 12 is not final guest-book design polish.

### 6.15 Audit logging

Guest-message and feedback actions that should be audited include:

- guest message submitted;
- guest message edited;
- guest message approved;
- guest message edited by admin;
- guest message excluded;
- couple approved message;
- couple requested correction;
- guest-book CSV exported;
- final guest-book file uploaded if implemented;
- feedback submitted;
- testimonial permission granted/denied;
- testimonial permission changed;
- feedback reviewed by Diginoces/admin.

Audit logs must not be visible to guests or unauthorized couple users.

---

## 7. Out of scope

Do not implement the following in Sprint 12:

- audio/video/photo guest submissions;
- file uploads from guests;
- direct Canva API integration;
- automatic public testimonial publishing;
- public marketing website testimonial display;
- partner SaaS scaling;
- partner commission management;
- advanced AI moderation or cleanup;
- full notification automation if the messaging workflow is not ready;
- advanced guest-book layout/design editor;
- external survey tool integration;
- full analytics/BI reporting.

If a future dependency is discovered, document it as a follow-up. Do not build it silently.

---

## 8. Recommended database objects

The agent may choose final names based on existing conventions, but the following objects are expected conceptually:

```text
guest_messages
guest_message_reviews
guest_book_exports
post_event_feedback
testimonial_permissions
```

Optional, if useful and low-risk:

```text
guest_message_status_events
guest_book_export_rows
feedback_review_events
```

The implementation must integrate with existing project, guest, public page token, file, report, permission, and audit foundations.

Do not create partner scaling, AI moderation, direct Canva API, or public marketing website tables in Sprint 12.

---

## 9. Recommended backend/API foundations

The agent may implement API routes, server actions, or service modules according to the existing app architecture.

Expected service capabilities:

- submit guest message;
- edit guest message before deadline;
- get guest's own message through public token;
- list project messages for admin/staff;
- moderate message;
- preserve original and approved text;
- list messages for couple review;
- record couple review action;
- export approved messages to CSV;
- register export file;
- list guest-book exports;
- upload/register final guest-book file if implemented;
- submit post-event feedback;
- record testimonial permission;
- review feedback internally;
- compute guest-book/feedback summary metrics;
- write audit logs.

All backend operations must enforce permissions server-side.

---

## 10. Permission rules

Sprint 12 must enforce or prepare these permission rules.

### 10.1 Guest

Can:

- access own public page through secure token;
- submit one written message;
- edit own message before deadline;
- view submission status if exposed.

Cannot:

- see other guests' messages;
- see moderation notes;
- approve own message;
- access guest-book export files unless explicitly allowed later;
- access dashboards or audit logs.

### 10.2 Diginoces/admin

Can:

- view all project messages;
- moderate messages;
- edit approved text;
- approve/exclude messages;
- export approved messages;
- register guest-book files;
- view post-event feedback;
- review testimonial permission;
- decide whether a testimonial may be used publicly;
- view audit history if allowed.

### 10.3 Diginoces staff

Can act according to assigned permissions.

Possible staff permissions:

- view project messages;
- moderate messages;
- prepare exports;
- view feedback summary;
- register guest-book export files.

Staff should not automatically publish testimonials or override permissions unless explicitly granted.

### 10.4 Bride/groom

Can:

- review messages for their project;
- approve/request correction/exclude messages where allowed;
- submit post-event feedback;
- grant or deny testimonial permission;
- view guest-book export status if allowed.

Cannot:

- access internal audit logs;
- view internal moderation notes unless allowed;
- access other projects;
- publish testimonials directly.

### 10.5 Partner / external provider

Partner access to guest messages and feedback should be restricted.

In Sprint 12, partners should not see post-event feedback or testimonial permission unless Diginoces/admin explicitly designs a limited view later.

---

## 11. Testing expectations

Sprint 12 must add tests for guest messages, guest-book exports, and feedback.

At minimum, tests should cover:

- guest can submit one message through own public token;
- guest cannot submit message for another guest;
- guest can edit message before deadline;
- guest cannot edit after deadline;
- emojis are preserved;
- audio/video/photo/file uploads are not accepted;
- original text is preserved after admin edit;
- approved/edited text is used for export;
- admin can approve message;
- admin can exclude message;
- couple can review messages for own project only;
- couple cannot access internal audit/moderation data;
- export includes only approved messages;
- export excludes excluded/flagged/pending messages;
- export CSV includes expected columns;
- export action is audited;
- final guest-book file registration works if implemented;
- couple can submit post-event feedback;
- testimonial permission yes/no is stored;
- testimonial is not public by default without permission;
- unauthorized user cannot view feedback;
- partner cannot view feedback/testimonial permission unless explicitly allowed;
- out-of-scope modules are not introduced.

CI must continue to pass:

```text
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

If database linting requires Supabase authentication, keep it documented as a local/manual check unless CI secrets are explicitly configured.

---

## 12. Acceptance criteria

Sprint 12 is complete only when:

- guest written-message submission exists on the public guest page;
- one-message-per-guest rule is enforced;
- edit-before-deadline behavior exists;
- text-only plus emoji support exists;
- admin/staff moderation foundation exists;
- original and approved/edited message versions are preserved;
- couple review foundation exists;
- approved-message Canva CSV export exists;
- guest-book export/file tracking foundation exists;
- post-event feedback form exists for couple;
- testimonial permission flag exists;
- testimonial is not public by default without permission and admin review;
- role-based access restrictions are enforced;
- audit logging exists for message, export, and feedback actions;
- tests are added and pass;
- CI passes;
- documentation is updated;
- Sprint 12 completion report is created.

---

## 13. Required deliverables

The Sprint 12 PR must include:

- database migration(s) for guest messages, reviews, guest-book exports, feedback, and testimonial permissions;
- TypeScript types updated/generated as needed;
- public guest message submission logic;
- edit-before-deadline logic;
- moderation logic;
- couple review logic;
- approved-message CSV export logic;
- guest-book export/file registration logic;
- post-event feedback submission logic;
- testimonial permission logic;
- summary metrics where useful;
- permission checks for guest/couple/admin/staff access;
- audit integration for guest-message/export/feedback actions;
- minimal UI for public submission, moderation, couple review, export, and feedback;
- tests for guest messages, exports, and feedback;
- documentation updates;
- `docs/planning/sprint-12-completion-report.md`.

---

## 14. Sprint 12 completion report template

The agent must create:

```text
docs/planning/sprint-12-completion-report.md
```

The report must include:

- sprint status;
- requirement IDs covered;
- backlog items covered;
- files created or changed;
- database migrations added;
- tests added;
- commands run;
- checks passed or failed;
- security checks performed;
- guest-message behavior implemented;
- moderation behavior implemented;
- couple review behavior implemented;
- CSV export behavior implemented;
- guest-book file tracking behavior implemented;
- feedback/testimonial behavior implemented;
- audit-log behavior implemented;
- assumptions made;
- open issues or blockers;
- out-of-scope items intentionally deferred;
- recommended Sprint 13 scope.

---

## 15. Recommended Sprint 13 scope

Sprint 13 should handle:

- partner/external provider model;
- partner accounts;
- partner-created project draft workflow;
- Diginoces/admin approval of partner-created projects;
- partner project tracking;
- partner project comments with couple;
- partner dashboard restrictions;
- no commission management in version 1;
- revenue visible only to Diginoces/admin.

Sprint 13 should not build full SaaS white-labeling, commission/referral-fee management, or partner billing unless the approved roadmap changes.

---

## 16. Codex prompt for Sprint 12

Use this prompt when assigning Codex to Sprint 12:

```text
You are the Orchestrator Agent for the Diginoces platform.

Repository: carlkanda/diginoces-platform

Work only on Sprint 12: Guest Wishes, Guest Book & Post-Event Feedback.

Before coding, read AGENTS.md and the relevant documents:
- docs/planning/sprint-12-plan.md
- docs/planning/sprint-11-plan.md
- docs/planning/mvp-build-execution-plan.md
- docs/product/11-post-event-messages.md
- docs/product/05-rsvp-public-guest-page.md
- docs/product/13-dashboards-reports-audit-logs.md
- docs/product/14-files-storage-retention-security.md
- docs/product/01-product-vision-business-model.md
- docs/product/02-user-roles-permissions-access-control.md
- docs/technical-design/database-schema-core-entities.md
- docs/technical-design/api-backend-service-design.md
- docs/technical-design/security-permissions-access-control.md
- docs/backlog/master-requirements-register.csv
- docs/backlog/initial-product-backlog-epics.csv
- docs/backlog/initial-product-backlog-features.csv
- docs/backlog/initial-product-backlog-user-stories.csv
- docs/backlog/initial-product-backlog-tasks.csv
- docs/backlog/initial-product-backlog-test-cases.csv

Create a new branch:

codex/sprint-12-guest-wishes-feedback

Implement Sprint 12 only.

Required scope:
1. Add guest written-message submission on the public guest page.
2. Enforce one text message per guest.
3. Support emoji text and reject audio/video/photo/file uploads.
4. Add edit-before-deadline behavior.
5. Add Diginoces/admin moderation workflow.
6. Preserve original submitted text and edited/approved text.
7. Add couple review workflow.
8. Add approved-message Canva CSV export.
9. Add guest-book export/file tracking foundation.
10. Add post-event satisfaction feedback form for couple.
11. Add public testimonial permission flag.
12. Ensure testimonials are not public by default and require permission/admin review.
13. Add permission checks for guest/couple/admin/staff access.
14. Add audit logging for message, export, and feedback actions.
15. Add basic UI for submission, moderation, couple review, export, and feedback.
16. Add tests.
17. Update documentation.
18. Create docs/planning/sprint-12-completion-report.md.
19. Open a draft PR titled: Sprint 12 — Guest Wishes, Guest Book & Post-Event Feedback.

Out of scope:
- audio/video/photo guest submissions;
- direct Canva API integration;
- automatic public testimonial publishing;
- partner SaaS scaling;
- partner commission management;
- advanced AI assistance;
- full marketing website testimonial publishing.

The PR must reference the Sprint 12 issue.

Do not mark Sprint 12 complete unless tests/checks are documented.
```

---

## 17. Summary

Sprint 12 completes the post-event experience loop for Diginoces.

It should let guests submit written messages, let Diginoces and the couple review and approve them, export clean guest-book data for Canva, track guest-book files, and collect satisfaction feedback with explicit testimonial permission.

The expected result is a controlled, auditable post-event workflow that prepares the platform for partner/external provider features in Sprint 13.
