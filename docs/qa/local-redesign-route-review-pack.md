# Local Redesign Route Review Pack

Date: 2026-06-21

Branch: `codex/redesign-platform-shell`
Status: Accepted for local direction. Hosted deployment preparation is approved.

## Purpose

Use this review pack to inspect the redesigned application without repeating already verified route work. The route list mirrors the authoritative route table in `docs/qa/redesign-rebuild-checklist.md`.

Use `docs/qa/local-redesign-review-session-guide.md` for concrete local review URLs and safe linked-dev record IDs.

Record acceptance or requested changes in `docs/qa/local-redesign-user-acceptance-checklist.md`.

## Public And Auth Surfaces

| Route | Review focus |
| --- | --- |
| `/` | Public product entry, Diginoces identity, workspace routes, and guest-management promise. |
| `/login` | Sign-in guidance, workspace connection state, and form clarity. |
| `/login/mfa` | Two-factor boundary, protected-record copy, and OTP branch clarity. |
| `/g/[guestToken]` | Guest-facing invitation, RSVP, file download, and couple-message experience. |

## Workspace And Project Orientation

| Route | Review focus |
| --- | --- |
| `/platform` | Role-aware launchpad, operating map, and first safe action. |
| `/platform/projects` | Wedding project desk and project-opening flow. |
| `/platform/projects/[projectId]` | Project command center, event table, and readiness navigation. |
| `/platform/projects/[projectId]/dashboard` | Project status signals and workstream summaries. |
| `/platform/projects/[projectId]/couple-dashboard` | Couple-facing progress summary with limited operational noise. |
| `/platform/dashboard` | Cross-wedding operations dashboard, review queue, and activity summary. |

## Guest, RSVP, Import, And Collaboration Work

| Route | Review focus |
| --- | --- |
| `/platform/projects/[projectId]/guests` | Guest list filtering, row scanning, and add/import/RSVP actions. |
| `/platform/projects/[projectId]/guests/new` | Manual guest creation form and validation guidance. |
| `/platform/projects/[projectId]/guests/[guestId]` | Guest profile edit workflow and deactivation guidance. |
| `/platform/projects/[projectId]/guests/[guestId]/public-preview` | Staff preview of guest-facing page without token confusion. |
| `/platform/projects/[projectId]/rsvps` | RSVP totals, event-level responses, and follow-up clarity. |
| `/platform/projects/[projectId]/guest-imports` | CSV import history and status scanning. |
| `/platform/projects/[projectId]/guest-imports/new` | Upload/paste CSV workflow and mapping next step. |
| `/platform/projects/[projectId]/guest-imports/[importId]` | Import session detail, preview rows, and action state. |
| `/platform/projects/[projectId]/guest-imports/[importId]/mapping` | Column mapping review and validation language. |
| `/platform/projects/[projectId]/guest-imports/[importId]/review` | Row approval, rejection, hold decisions, and review safety. |
| `/platform/projects/[projectId]/guest-book` | Keepsake message moderation and export guidance. |
| `/platform/projects/[projectId]/guest-book/couple-review` | Couple review queue and message approval clarity. |
| `/platform/projects/[projectId]/feedback` | Post-event feedback, testimonial review, and private notes. |
| `/platform/projects/[projectId]/comments` | Project conversation visibility and collaboration thread. |

## Invitation, Messaging, And File Workflows

| Route | Review focus |
| --- | --- |
| `/platform/events/[eventId]/invitations` | Event invitation design library and generation readiness. |
| `/platform/events/[eventId]/invitations/new` | Canva PDF registration and next placement step. |
| `/platform/events/[eventId]/invitations/[templateId]` | Field placement, preview approval, and guest invitation file generation. |
| `/platform/projects/[projectId]/communications` | Messaging overview, recent messages, and manual-send mode. |
| `/platform/projects/[projectId]/communications/templates` | French/English message wording library and variable readiness. |
| `/platform/projects/[projectId]/communications/queue` | Manual WhatsApp send preparation and recipient readiness. |
| `/platform/projects/[projectId]/communications/[messageLogId]` | One prepared message, WhatsApp handoff, and outcome recording. |
| `/platform/projects/[projectId]/files` | Project file vault, visibility, versions, and retention work. |
| `/platform/projects/[projectId]/files/[fileId]` | File detail, version history, access history, and archive decisions. |
| `/platform/events/[eventId]/files` | Event-scoped file handoff and related event work. |

## Event-Day Operations

| Route | Review focus |
| --- | --- |
| `/platform/events/[eventId]` | Event command center and safe navigation to event work. |
| `/platform/events/[eventId]/dashboard` | Event-level RSVP, invitation, seating, and arrival signals. |
| `/platform/events/[eventId]/seating` | Table planning, assignment, capacity, and CSV handoff. |
| `/platform/events/[eventId]/seating/map` | Table placement, occupancy, and capacity alerts. |
| `/platform/events/[eventId]/check-in` | Arrival desk, search, QR lookup, station state, and offline handoff. |
| `/platform/events/[eventId]/check-in/scan` | Focused QR confirmation and arrival recording. |

## Management, Evidence, And Partner Work

| Route | Review focus |
| --- | --- |
| `/platform/reports` | Report library, exports, and permission-limited evidence. |
| `/platform/audit-logs` | Activity history, redaction, and export controls. |
| `/platform/projects/[projectId]/commercial` | Packages, pricing, contract approval, payments, and access gates. |
| `/platform/partners` | Partner directory, creation form, and partner action handoffs. |
| `/platform/partners/review` | Partner-submitted wedding project review queue. |
| `/platform/partner-dashboard` | Partner profile selection, submissions, and assigned weddings. |
| `/platform/partners/[partnerId]` | Partner profile detail, linked accounts, submissions, and source tracking. |

## Review Rules

- Review the local app first.
- Deploy only after the post-approval checks, branch packaging, hosted build, and hosted verification pass.
- If a route feels generic or hard to use, record the route and finding in `docs/qa/local-redesign-user-acceptance-checklist.md`.
- If source changes are needed, update `docs/qa/redesign-rebuild-checklist.md` before moving to another route.
