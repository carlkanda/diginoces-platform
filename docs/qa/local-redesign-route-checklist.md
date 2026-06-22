# Local Redesign Route Checklist

Date: 2026-06-18
Branch: `codex/bilingual-ux-simplification-homepage`
Scope: local visual redesign evidence before hosted deployment

## Legend

- `Browser verified`: rendered locally in browser or isolated Playwright context.
- `Source aligned`: route source was updated to the redesign system, but current data did not expose a live record to open.
- `Approval pending`: implemented and checked locally, awaiting final user visual approval.

## Public And Auth Surfaces

| Route | Status | Notes |
| --- | --- | --- |
| `/` | Browser verified, approval pending | Home page uses the Diginoces logo, a strengthened operations-board visual panel, user-facing product copy, and no longer links users to engineering health JSON. |
| `/login` | Browser verified, approval pending | Verified in isolated desktop/mobile Playwright contexts. Uses `Workspace access`, user-facing sign-in copy, and the shared auth copy/action panel structure. |
| `/login/mfa` | Browser verified, approval pending | Verified unauthenticated redirect/entry behavior and mobile layout. Source now uses the shared auth copy/action panel structure plus the operations empty-state treatment for disconnected states. |
| `/g/[guestToken]` | Browser verified via preview/invalid-token paths, approval pending | Public guest page component redesigned and now masks linked-dev QA guest, couple, event, and venue labels through the shared guest-page view. Guest-facing download and message sections use the shared structured section and empty-state treatment; valid-token live record was not separately created for this pass. |
| `/g/[guestToken]/not-found` | Browser verified, approval pending | Public not-found route uses the same RSVP visual language. |

## Workspace Entry

| Route | Status | Notes |
| --- | --- | --- |
| `/platform` | Browser verified, approval pending | Authenticated workspace redesigned as the primary task launcher with account-aware entry points, an access summary matching the home operations-board system, and a clearer empty work-area state. |
| `/platform/projects` | Browser verified, approval pending | Project list uses workspace summary, scannable project rows, visible status/reference/next-step labels, complete accessible row labels, a clearer empty-project state, and masks linked-dev QA demo records from user-facing labels. |
| `/platform/dashboard` | Browser verified, approval pending | Global dashboard aligns to compact operational panels, formats recent activity labels, masks linked-dev QA project labels, gives dashboard/report/activity links explicit workspace/project labels, and now uses the operations-list treatment for recent projects and recent activity. |
| `/platform/reports` | Browser verified, approval pending | Report library and export history use user-facing report/export labels; team-only report descriptions avoid internal implementation wording, report export actions identify the exact CSV being generated, and report rows now use the operations-list treatment. |
| `/platform/audit-logs` | Browser verified, approval pending | Activity history copy and controls avoid raw audit/export field names; activity sources and team-member references are user-facing, filter/export actions have explicit activity-history labels, and export/activity rows now use the operations-list treatment. |

## Project Work

| Route | Status | Notes |
| --- | --- | --- |
| `/platform/projects/[projectId]` | Browser verified, approval pending | Project detail uses the project hero, work groups, labeled event rows, language labels, and operations-list readiness tasks; linked-dev QA demo project, event, contact, code, and venue labels are masked from user-facing text. Work-area links and repeated event actions now include specific accessible labels for easier navigation, and the checked route has zero old task/record/empty classes. |
| `/platform/projects/[projectId]/dashboard` | Browser verified, approval pending | Project dashboard formats workstream, RSVP, guest-page access, commercial, and check-in labels for scanning; linked-dev QA project and event labels are masked, repeated project/event dashboard actions have explicit accessible labels, and event records now use the operations-list row treatment. |
| `/platform/projects/[projectId]/guests` | Browser verified, approval pending | Guest list and locked state use the guest workspace system; guest rows now use operations-list records with labeled contact, invitation-route, side, status, and accessible profile links, with linked-dev QA guest, project, and event labels masked. Hero actions and side/event filters now carry project- and filter-specific accessible labels. |
| `/platform/projects/[projectId]/guests/new` | Browser verified, approval pending | Manual guest creation form aligned to the redesigned form vocabulary with clearer title/type labels, masked linked-dev project/event labels, field guidance, a user-facing language selector, and project-specific navigation, cancel, and submit labels. |
| `/platform/projects/[projectId]/guests/[guestId]` | Browser verified, approval pending | Guest edit/detail route aligned to the redesigned guest record system with clearer field guidance, guest-page preview navigation, masked seeded guest/project/event labels, hidden seed-only notes, a user-facing language selector, and guest/project-specific navigation, preview, cancel, and save labels. |
| `/platform/projects/[projectId]/guests/[guestId]/public-preview` | Browser verified, approval pending | Admin preview avoids duplicate page headings, embeds public guest view cleanly, labels preview state, event details, RSVP status, guest-profile navigation, guest-list navigation, download availability, and guest-message availability, and masks linked-dev QA guest/couple/event/venue labels. |
| `/platform/projects/[projectId]/rsvps` | Browser verified, approval pending | Guest responses page uses shared operational summaries, masked linked-dev project/event labels, response helper text, follow-up counts, operations-list section framing, per-event deadline/follow-up notes, and project-specific navigation labels. |
| `/platform/projects/[projectId]/guest-imports` | Browser verified, approval pending | Import history route uses helper-labeled summary cards, user-facing import status language, operations-list import rows, accessible import-row labels, project-specific import navigation labels, and masked linked-dev project/import labels. |
| `/platform/projects/[projectId]/guest-imports/new` | Browser verified, approval pending | Guest-list upload page frames CSV as a spreadsheet review, with masked linked-dev project labels, clear side selection, file-or-paste guidance, project-specific navigation/form labels, and `Review columns` next action. |
| `/platform/projects/[projectId]/guest-imports/[importId]` | Browser verified, approval pending | Import detail route masks linked-dev project/import row labels, translates stored statuses such as applied/clear into user-facing language, uses operations-list action and preview sections, and gives import actions project/import-specific labels. |
| `/platform/projects/[projectId]/guest-imports/[importId]/mapping` | Browser verified, approval pending | Mapping page aligns to an action-first workflow, masks linked-dev project labels, keeps clear back navigation, and labels cancel/validate actions with project/import context. |
| `/platform/projects/[projectId]/guest-imports/[importId]/review` | Browser verified, approval pending | Review page masks linked-dev import row labels, translates stored statuses, renders row decisions in operations-list rows, and gives editable row decisions project/import/row-specific labels. |
| `/platform/projects/[projectId]/communications` | Browser verified, approval pending | Communications overview uses masked linked-dev project/guest labels, explanatory summary cards, full language names, operations-list message rows, team-send workflow labels, and project-specific messaging actions. |
| `/platform/projects/[projectId]/communications/templates` | Browser verified, approval pending | Message wording library masks old seeded/internal project, wording labels, and sample message bodies while using full language names, structured saved-wording chips, operations-list section framing, accessible card labels, and project-specific actions. |
| `/platform/projects/[projectId]/communications/queue` | Browser verified, approval pending | Message preparation route masks linked-dev project/event/guest labels and uses messages-to-send workflow language, operations-list queue/history sections, full language names, project-specific preparation actions, and accessible prepared-message rows. |
| `/platform/projects/[projectId]/communications/[messageLogId]` | Browser verified, approval pending | Prepared-message detail masks linked-dev guest labels, seeded rendered-message bodies, sample WhatsApp links, and sample phone numbers while keeping real message previews, full language names, wording version, manual sending status, and explicit outcome controls. |
| `/platform/projects/[projectId]/commercial` | Browser verified, approval pending | Commercial route masks linked-dev QA project, event, and package labels, uses user-facing guest-access, price-estimate, payment, contract, price-adjustment, and exception labels with project-specific action names, and now uses the operations-list/empty-state treatment for package, contract, payment, addendum, and access-history rows. Admin pricing forms use reference/amount labels instead of all-caps sample codes or raw cents wording. |
| `/platform/projects/[projectId]/files` | Browser verified, approval pending | File list masks linked-dev QA project/event/file labels, formats retention/visibility/version labels, uses project-specific file-library, retention, upload, filter, and row action labels, removes placeholder-record jargon, and now uses the operations-list treatment for file rows, file registration, and retention history. |
| `/platform/projects/[projectId]/files/[fileId]` | Browser verified, approval pending | Live file detail route verified with current-version, retention, archive, access-history, safe visibility, non-UUID version-set labels, file-specific download/version/archive controls, operations-list history sections, and user-facing updated-file copy instead of placeholder-version wording. |
| `/platform/projects/[projectId]/guest-book` | Browser verified, approval pending | Guest-book route masks old seeded guest labels, uses keepsake/moderation/export language, now has a dedicated keepsake note-preview/status/action desk, and uses the review-board treatment for message moderation and export history. |
| `/platform/projects/[projectId]/guest-book/couple-review` | Browser verified, approval pending | Couple review route aligned to approval/correction/exclusion workflow, now has a dedicated keepsake note-preview/status/action desk, and uses the review-board treatment for prepared-message decisions and empty states. |
| `/platform/projects/[projectId]/feedback` | Browser verified, approval pending | Feedback/testimonial review copy is user-facing, formats testimonial review states, now has a dedicated feedback note-preview/status/action desk, and uses the review-board treatment for response review plus a clearer couple feedback form panel. |
| `/platform/projects/[projectId]/comments` | Browser verified, approval pending | Comments route masks linked-dev QA project/comment labels, formats author/visibility labels for project collaboration, and now uses the shared hero copy/action structure plus operations-list thread framing. |
| `/platform/projects/[projectId]/couple-dashboard` | Browser verified, approval pending | Couple dashboard route formats guest and RSVP summaries for couple-facing visibility; linked-dev QA project references are masked, and the hero now uses the shared copy/action structure. |

## Event Work

| Route | Status | Notes |
| --- | --- | --- |
| `/platform/events/[eventId]` | Browser verified, approval pending | Event detail uses event-focused work links, operations-list readiness tasks, explicit accessible navigation labels, and status summaries; linked-dev QA demo event names, event codes, project names, and venues are masked from user-facing text, and the checked route has zero old task/record/empty classes. |
| `/platform/events/[eventId]/dashboard` | Browser verified, approval pending | Event dashboard formats RSVP, seating, arrival, and unexpected-guest labels for event staff; linked-dev QA event labels are masked, event workstream summaries are grouped by task area, and hero actions now carry event-specific accessible labels. |
| `/platform/events/[eventId]/files` | Browser verified, approval pending | Event files route aligned to the file library system with user-facing event and file labels, a clear empty-state heading, masked linked-dev QA event labels, and the operations-list treatment for event file rows. |
| `/platform/events/[eventId]/invitations` | Browser verified, approval pending | Invitation design list uses explanatory summary cards, operations-list design rows, labeled version/file/status metadata, accessible design-row labels, event-specific hero action labels, and masked linked-dev QA project/event labels. |
| `/platform/events/[eventId]/invitations/new` | Browser verified, approval pending | Invitation design upload route uses clear design details, Canva PDF export, event-specific action labels, and masked linked-dev QA project/event labels. |
| `/platform/events/[eventId]/invitations/[templateId]` | Browser verified, approval pending | Verified a live design detail record. Seeded internal naming and linked-dev QA project/event labels are masked, preview/generation/guest-invitation metadata now uses operations-list rows, field positions use user-facing coordinate labels, and workflow actions carry design/event-specific accessible labels. |
| `/platform/events/[eventId]/seating` | Browser verified, approval pending | Seating list/table route uses masked linked-dev project/event/guest/table labels, labeled side, RSVP, delivery, seat/place, table, and export metadata for event-day operations. The route now uses the workbench hero and operations-list/table-card treatment with zero old `record-row` or `task-row` records in the checked view. |
| `/platform/events/[eventId]/seating/map` | Browser verified, approval pending | Seating map route uses the shared visual map system with plural-safe table counts, masked linked-dev project/event/table labels, labeled occupancy, accessible map-table labels, and the workbench hero/action treatment for event-specific navigation. |
| `/platform/events/[eventId]/check-in` | Browser verified, approval pending | Check-in operations route uses user-facing arrival, offline-record, sync-issue, unexpected-guest, station/device, invitation QR, and review-status labels; linked-dev QA labels are masked, and the route now uses the workbench hero plus operations-card/list treatment with zero old `record-row`, `task-row`, `record-list`, `panel-body`, or plain `empty-state` classes in the checked view. |
| `/platform/events/[eventId]/check-in/scan` | Browser verified, approval pending | Scan route aligned to event staff workflow with the workbench hero/action treatment, clear QR-code empty states, masked linked-dev QA event labels, and event-specific check-in/navigation actions. |

## Partner Work

| Route | Status | Notes |
| --- | --- | --- |
| `/platform/partners` | Browser verified, approval pending | Partner list route aligns profile management and review access with formatted partner status/type labels, private team-note wording, safe seeded partner/contact display labels, the shared hero copy/action structure, and operations-list empty/profile rows. |
| `/platform/partners/review` | Browser verified, approval pending | Partner project review route aligns submission review workflow, formatted status labels, safe seeded partner/submission display labels, the shared hero copy/action structure, and operations-list review empty states. |
| `/platform/partner-dashboard` | Browser verified, approval pending | Restricted partner dashboard aligns partner submission work with role-specific controls, formatted status labels, shared hero copy/action structure, and operations-list partner/project/submission rows across visible states. |
| `/platform/partners/[partnerId]` | Source aligned, live record pending | Current account has no visible partner profiles, so no live detail link is available. Source now uses the redesigned workspace system, labeled profile summaries, user-facing partner/submission/source statuses, safe seeded partner/contact/submission labels, shortened project references, and operations-list linked-account/submission/source rows. |

## Open Items Before Hosted Deployment

- Final user visual approval across the local app.
- Home visual direction is set to the product UI-board system. A generated bitmap was explored, but the local app keeps the clearer task-oriented board until a specific screen needs a real image.
- Optional live-record verification for partner detail and valid public guest-token pages if suitable records or a safe test token are available.
