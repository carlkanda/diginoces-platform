# Local Redesign QA Evidence

Date: 2026-06-18
Branch: `codex/redesign-platform-shell`
Status: local review accepted; hosted deployment preparation approved

## Objective

Redesign the Diginoces application locally, one page at a time, using Impeccable guidance. The redesign should establish a cohesive event guest-management design system before any hosted deployment.

## Requirement Audit

| Requirement | Evidence | Status |
| --- | --- | --- |
| Work locally before hosted deployment | All work is on `codex/redesign-platform-shell`; no hosted deployment was updated. | Satisfied |
| Use Impeccable guidance | `PRODUCT.md`, `DESIGN.md`, and Impeccable detector checks document and validate the product UI direction. | Satisfied |
| Start with authenticated `/platform` | `/platform` is browser verified and listed in the route checklist as the primary task launcher. | Satisfied |
| Establish a cohesive event guest-management design system | `DESIGN.md` defines colors, typography, components, navigation, and product rules; `globals.css` applies the shared system across app routes. | Satisfied |
| Use the Diginoces logo | The global shell and home visual panel use `apps/web/public/diginoces-logo.png`, sourced from the logo asset under `apps/assets`. | Satisfied |
| Redesign each screen according to purpose | Route checklist covers public/auth, workspace, project, event, guest, import, RSVP, invitation, communication, seating, check-in, dashboard, report, file, commercial, guest-book, feedback, comments, and partner surfaces. | Satisfied; final user approval recorded |
| Replace internal implementation wording with user-facing text | Copy scans found no visible old internal wording; remaining matches are display masks for seeded/internal data. | Satisfied |
| Use generated imagery where needed | Image generation was attempted; the tool did not persist a reusable bitmap asset in this environment. The app currently uses a logo/UI-shaped visual panel instead. | Open decision |
| Verify locally | Impeccable detector, format, lint, typecheck, tests, build, screenshots, and route sweeps are documented below. | Satisfied |

## Design Direction

- Product UI register: calm, premium, operationally precise.
- Primary identity: Diginoces logo, deep teal, cool canvas, muted gold accents.
- Interface posture: task-first, role-aware, readable, restrained.
- Avoided patterns: sprint/build wording, generic SaaS hero styling, beige wedding stationery, purple gradients, decorative stock imagery, oversized app heroes, nested cards.

## Implemented Surfaces

- Global shell, logo, top navigation, home page, login, and MFA.
- Authenticated `/platform` workspace.
- Project list, project detail, event detail.
- Guest list, guest create/edit, public guest preview, public guest page.
- Guest import history, upload, detail, mapping, and review.
- RSVP summary.
- Invitation template list, create, detail, field configuration, approval, and generation views.
- Communications overview, templates, queue, and message-log detail.
- Seating list and seating map.
- Check-in operations and scan page.
- Project, event, and global dashboards.
- Reports and audit logs.
- Project/event files and file detail.
- Commercial contracts, packages, payments, and gates.
- Guest book, couple review, feedback, comments, couple dashboard.
- Partner list, detail, review, and partner dashboard.

## Visual Evidence Collected

- Browser route sweeps covered authenticated desktop/mobile surfaces for the main project, event, guest, import, RSVP, invitation, communication, seating, check-in, dashboard, report, file, commercial, guest-book, feedback, comments, and partner list/review/dashboard routes.
- Fresh unauthenticated screenshots were captured for login and MFA entry surfaces using isolated Playwright contexts.
- Fresh home-page screenshots were captured after adding the Diginoces operations-board visual panel.
- Live invitation design detail verification was completed after a record became available. Source-level alignment remains documented for partner detail because the current account does not expose a visible partner profile.
- Route-by-route evidence is tracked in `docs/qa/local-redesign-route-checklist.md`.

## Latest Copy Polish

After local visual review around the projects and guest-list surfaces, the disconnected-state copy was tightened across the workspace, projects, dashboards, reports, audit logs, files, invitations, seating, check-in, commercial, and messaging surfaces. The updated copy avoids developer-facing phrases such as project credentials, local environment, and server-side permissions, and uses consistent user-facing workspace connection language instead.

## Latest Page Polish

The project overview was reviewed in the local browser after navigating from the guest list back to the wedding workspace. The page now shows language names such as English/French instead of raw language codes, uses one clear primary action in the hero, and labels project task follow-up as readiness work rather than setup work.

The guest import history was reviewed in the local browser after the project overview pass. Import rows now use correct row-count grammar, and the repeated history action now reads `Upload another CSV` so users understand it starts another upload from the history section.

The guest import upload screen was reviewed in the local browser after the history pass and received a later focused pass. The page now starts with `Upload guest list`, frames the workflow as a spreadsheet review, uses `Who this list is for`, `Add the spreadsheet`, `Spreadsheet file`, `List name`, and `Paste spreadsheet rows` labels, and sends users forward with `Review columns`.

The guest import detail, mapping, and review screens were reviewed together in the local browser because they form one operational workflow. The pages now use correct one-row grammar, mapping/review actions use `Back to import`, and applied rows are displayed as row status instead of disabled approve/reject/hold choices.

The RSVP summary screen was reviewed in the local browser after the guest-import workflow pass. The page now leads with `Guest responses`, uses clearer attendance labels such as `Attending`, `Cannot attend`, and `Awaiting reply`, and renders invited guest/event counts with plural-safe language.

The invitation list and upload screens were reviewed in the local browser after the RSVP pass. User-facing copy now treats uploaded PDFs as `invitation designs`, uses `Add design` / `Add invitation design` actions, and avoids raw technical preview/status wording. A live invitation design detail record was verified after the broader pass, and seeded internal naming such as `MVP UI QA Invitation` is masked to `Invitation design` in list/detail views.

The communications overview, message wording library, message preparation page, and a prepared message detail page were reviewed in the local browser after the invitation pass. The workflow now uses `Message wording`, `Saved wording`, `Messages to send`, `Wording version`, and `Manual sending status` labels instead of raw template/queue/log wording, while message statuses render as explicit operations labels.

The seating list and visual seating map were reviewed in the local browser after the communications pass. Seating rows now use user-facing side, RSVP, delivery, seat, and place labels such as `Bride side`, `Awaiting reply`, `Digital link`, and `1 place`, and table counts are plural-safe across the list and map. A later focused pass masked seeded/internal table names from the event-day UI, added helper descriptions to the seating overview, labeled guest/export metadata for scanning, and gave seating rows and map tables complete accessible labels. The current authoritative route table in `docs/qa/redesign-rebuild-checklist.md` now records both seating routes as browser verified.

The wedding-day check-in dashboard and QR confirmation page were reviewed in the local browser after the seating pass. The workflow now uses staff-facing labels such as `Expected arrivals`, `Recorded arrivals`, `Offline records waiting`, `Sync issues`, `Unexpected guests waiting`, `Station/device`, `No scan yet`, and `Awaiting review` instead of raw internal status words.

The global dashboard, project dashboard, event dashboard, reports, activity history, project file library, event files, and a live file detail route were reviewed in the local browser after the check-in pass. The pages now format raw activity, report, dashboard, file status, visibility, retention, export, and version labels into user-facing language such as `Activity history`, `Activity history export`, `Recorded arrivals`, `Unexpected guests waiting`, `Current version`, and `Retire previous version`.

The commercial controls, guest book, couple guest-book review, post-event feedback, project comments, couple dashboard, partner list, partner review queue, and partner dashboard were reviewed in the local browser after the dashboard/report/file pass. The pages now use clearer relationship/workflow language for access gates, pricing calculations, discount adjustments, guest-book moderation, testimonial review, comment visibility, couple-facing summaries, and partner submission statuses.

The guest create/edit forms were copy-scanned again after the collaboration pass. Their language preference helper now uses `English or French` rather than raw `fr or en` wording.

The public guest preview route was rechecked from a live guest record. The redesigned guest-facing component rendered inside preview mode with invited events, RSVP controls, file availability, and guest-message copy. A real `/g/[guestToken]` route was not opened because no existing token was exposed through read-only UI, and creating a new token would change dev data.

The public guest preview route received a focused readability pass after user review. Preview mode now explains that RSVP choices and messages are not saved from that view, the back action reads `Back to guest profile`, event cards expose visible `Date and time`, `Place`, and `RSVP` labels, and manual-review state is phrased as `Needs team review`.

The RSVP summary route received a focused operational-readability pass after the public preview work. Totals now clarify that the top invitation number counts guest invitations across events, the hero surfaces follow-up count, each summary item includes a short plain-language description, and event cards now show reply-deadline and follow-up notes such as `2 guests still need a reply`.

The guest import history route received a focused scanability pass after the RSVP summary work. Import totals now include short helper descriptions, import statuses are translated into operational language such as `Added to guest list`, row metadata is split into labeled `Rows`, `Ready`, and `Blocked` pairs, and each import row/detail group has a complete accessible label for assistive navigation.

The communications overview route received a focused scanability pass after the guest import upload work. The summary totals now explain saved wording, prepared messages, pending sends, and manual send mode, while recent-message rows show visible `Language`, `Guest`, `Status`, and `Sending` labels with full language names.

The message wording library received a focused scanability pass after the communications overview work. Saved wording cards now use full language names, visible `Language`, `Version`, `Status`, and `Message type` labels, and complete accessible labels instead of compact `FR - Version` headers.

The message preparation route received a focused scanability pass after the wording-library work. Messages waiting to be sent and prepared-message rows now use labeled `Guest`, `Language`, and `Status` metadata, invitation options show `Not generated` instead of raw status text, and prepared-message rows have complete accessible labels.

The prepared-message detail route received a focused readability pass after the preparation page. The detail view now enriches the message log with the guest display name, uses full language names and labeled status metadata in the hero, and clarifies the WhatsApp number, opened state, send result, and manual outcome actions.

The invitation design workflow received a focused scanability pass after the communications workflow. The event invitation list now includes explanatory summary text, labeled design metadata, and accessible row labels; the invitation design detail now labels field, preview, generation-run, and guest-invitation status information for scanning.

The partner list was rechecked for a live partner detail link. The current authenticated account has no visible partner profiles, so `/platform/partners/[partnerId]` remains source-aligned until a suitable profile is available.

The partner detail route received a focused source polish after the seating workflow. The page now uses the shared partner workspace hero, shows profile status/type/contact summaries with helper text, translates partner/submission/source states into user-facing labels, shortens raw project references, and gives linked-account, project-submission, and project-source rows complete accessible labels.

## Generated Imagery Decision

The image generation skill was used again to create a Diginoces event-operations image concept for the public home page. The generated concept matched the desired direction: a calm wedding operations desk with guest list, seating, RSVP, and invitation materials in the Diginoces teal/gold palette. In this environment, the built-in image tool rendered the preview but did not persist a new bitmap file under `~/.codex/generated_images` or the workspace. Older cached generated images were inspected and were unrelated to Diginoces, so no generated bitmap was safely referenced from the app.

Current app treatment:

- Public home page uses a restrained Diginoces operations-board visual panel built from the logo and design-system UI shapes.
- Authenticated operational pages remain data-first and avoid decorative imagery.

Open decision:

- If a reusable generated bitmap asset is required before approval, export or provide the generated image as a local file, then place it under `apps/web/public/` and wire it into the public/home/auth surface only.

Latest generated-image prompt used:

```text
Create a polished bitmap hero image for an event guest-management web app, showing a sophisticated wedding operations desk from a slightly elevated angle. Show a clean desk with a laptop displaying an abstract guest-management dashboard, printed guest list sheets, table seating cards, RSVP cards, and an invitation proof. Use deep teal, muted gold, clean white, and soft neutral gray. No people, no faces, no readable words, no logos, no watermarks.
```

## Checks Passed

Latest checks run after the home visual and CSS cleanup:

- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\page.tsx apps\web\src\app\globals.css`
- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

Result: all passed. Test suite result: 26 files passed, 274 tests passed.

Latest checks run after the disconnected-state copy polish:

- `rg -n "credentials|local environment|Local workspace|server-side permissions|Project data is unavailable in this environment|Supabase environment|local credentials" -g "*.tsx" apps\web\src\app apps\web\src\lib`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app apps\web\src\app\globals.css`
- `npm run format:check`
- `git diff --check`

Result: wording scan returned no visible matches, Impeccable detector returned no issues, Prettier passed, and `git diff --check` reported only Git line-ending warnings.

Latest checks run after the project overview polish:

- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\[projectId]\page.tsx apps\web\src\app\globals.css`
- `npm run format:check`
- `npm run typecheck`
- `git diff --check -- apps\web\src\app\platform\projects\[projectId]\page.tsx`

Result: Impeccable detector returned no issues, Prettier passed, typecheck passed, and `git diff --check` reported only a Git line-ending warning for the touched project overview file.

Latest checks run after the guest import history polish:

- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\[projectId]\guest-imports\page.tsx apps\web\src\app\globals.css`
- `npm run format:check`
- `npm run typecheck`
- `git diff --check -- apps\web\src\app\platform\projects\[projectId]\guest-imports\page.tsx`

Result: Impeccable detector returned no issues, Prettier passed, typecheck passed, and `git diff --check` passed for the touched import history file.

Latest checks run after the guest import upload polish:

- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\[projectId]\guest-imports\new\page.tsx apps\web\src\app\globals.css`
- `npm run format`
- `npm run format:check`
- `npm run typecheck`
- `git diff --check -- apps\web\src\app\platform\projects\[projectId]\guest-imports\new\page.tsx apps\web\src\app\globals.css`

Result: Impeccable detector returned no issues, formatting completed successfully for the touched upload file, Prettier passed, typecheck passed, and `git diff --check` passed for the touched upload/CSS files.

Latest checks run after the guest import detail, mapping, and review polish:

- Browser verification for `/platform/projects/[projectId]/guest-imports/[importId]`, `/mapping`, and `/review`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\[projectId]\guest-imports\[importId]\page.tsx apps\web\src\app\platform\projects\[projectId]\guest-imports\[importId]\mapping\page.tsx apps\web\src\app\platform\projects\[projectId]\guest-imports\[importId]\review\page.tsx apps\web\src\app\globals.css`
- `npm run format:check`
- `npm run typecheck`
- `git diff --check -- apps\web\src\app\platform\projects\[projectId]\guest-imports\[importId]\page.tsx apps\web\src\app\platform\projects\[projectId]\guest-imports\[importId]\mapping\page.tsx apps\web\src\app\platform\projects\[projectId]\guest-imports\[importId]\review\page.tsx apps\web\src\app\globals.css`

Result: browser verification confirmed the updated labels/status behavior, Impeccable detector returned no issues, Prettier passed, typecheck passed, and `git diff --check` passed for the touched import workflow files.

Latest checks run after the RSVP summary polish:

- Browser verification for `/platform/projects/[projectId]/rsvps`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\[projectId]\rsvps\page.tsx apps\web\src\app\globals.css`
- `npm run format:check`
- `npm run typecheck`
- `git diff --check -- apps\web\src\app\platform\projects\[projectId]\rsvps\page.tsx apps\web\src\app\globals.css`

Result: browser verification confirmed the updated RSVP copy and plural-safe counts, Impeccable detector returned no issues, Prettier passed, typecheck passed, and `git diff --check` passed for the touched RSVP file.

Latest checks run after the invitation design workflow polish:

- Browser verification for `/platform/events/[eventId]/invitations` and `/platform/events/[eventId]/invitations/new`
- Source alignment for `/platform/events/[eventId]/invitations/[templateId]`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\events\[eventId]\invitations\page.tsx apps\web\src\app\platform\events\[eventId]\invitations\new\page.tsx apps\web\src\app\platform\events\[eventId]\invitations\[templateId]\page.tsx apps\web\src\app\platform\events\[eventId]\invitations\actions.ts apps\web\src\app\globals.css`
- `npm run format:check`
- `npm run typecheck`
- `git diff --check -- apps\web\src\app\platform\events\[eventId]\invitations\page.tsx apps\web\src\app\platform\events\[eventId]\invitations\new\page.tsx apps\web\src\app\platform\events\[eventId]\invitations\[templateId]\page.tsx apps\web\src\app\platform\events\[eventId]\invitations\actions.ts apps\web\src\app\globals.css`

Result: browser verification confirmed the design-oriented invitation list/upload labels, the detail route source uses the same vocabulary, Impeccable detector returned no issues, Prettier passed, typecheck passed, and `git diff --check` passed with only Git line-ending warnings.

Latest checks run after the communications workflow polish:

- Browser verification for `/platform/projects/[projectId]/communications`
- Browser verification for `/platform/projects/[projectId]/communications/templates`
- Browser verification for `/platform/projects/[projectId]/communications/queue`
- Browser verification for `/platform/projects/[projectId]/communications/[messageLogId]`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\[projectId]\communications\page.tsx apps\web\src\app\platform\projects\[projectId]\communications\templates\page.tsx apps\web\src\app\platform\projects\[projectId]\communications\queue\page.tsx apps\web\src\app\platform\projects\[projectId]\communications\[messageLogId]\page.tsx apps\web\src\lib\messages\message-format.ts apps\web\src\app\globals.css`
- `npm run format:check`
- `npm run typecheck`
- `git diff --check -- apps\web\src\app\platform\projects\[projectId]\communications\page.tsx apps\web\src\app\platform\projects\[projectId]\communications\templates\page.tsx apps\web\src\app\platform\projects\[projectId]\communications\queue\page.tsx apps\web\src\app\platform\projects\[projectId]\communications\[messageLogId]\page.tsx apps\web\src\lib\messages\message-format.ts apps\web\src\app\globals.css`

Result: browser verification confirmed the updated communications labels across overview, wording, preparation, and detail surfaces, Impeccable detector returned no issues, Prettier passed, typecheck passed, and `git diff --check` passed with only Git line-ending warnings.

Latest checks run after the seating workflow polish:

- Earlier browser verification for `/platform/events/[eventId]/seating`
- Earlier browser verification for `/platform/events/[eventId]/seating/map`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\events\[eventId]\seating\page.tsx apps\web\src\app\platform\events\[eventId]\seating\map\page.tsx apps\web\src\app\globals.css`
- `npm run format:check`
- `npm run typecheck`
- `git diff --check -- apps\web\src\app\platform\events\[eventId]\seating\page.tsx apps\web\src\app\platform\events\[eventId]\seating\map\page.tsx apps\web\src\app\globals.css`

Result: earlier browser verification confirmed the seating list/map direction, Impeccable detector returned no issues, Prettier passed, typecheck passed, and `git diff --check` passed for the touched seating files.

Latest checks run after the check-in workflow polish:

- Browser verification for `/platform/events/[eventId]/check-in`
- Browser verification for `/platform/events/[eventId]/check-in/scan`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\events\[eventId]\check-in\page.tsx apps\web\src\app\platform\events\[eventId]\check-in\scan\page.tsx apps\web\src\app\globals.css`
- `npm run format:check`
- `npm run typecheck`
- `git diff --check -- apps\web\src\app\platform\events\[eventId]\check-in\page.tsx apps\web\src\app\platform\events\[eventId]\check-in\scan\page.tsx apps\web\src\app\globals.css`

Result: browser verification confirmed the updated check-in dashboard and QR confirmation labels, Impeccable detector returned no issues, Prettier passed, typecheck passed, and `git diff --check` passed for the touched check-in files.

Latest checks run after the dashboard, report, activity-history, and file-library polish:

- Browser verification for `/platform/dashboard`
- Browser verification for `/platform/reports`
- Browser verification for `/platform/audit-logs`
- Browser verification for `/platform/projects/[projectId]/dashboard`
- Browser verification for `/platform/events/[eventId]/dashboard`
- Browser verification for `/platform/projects/[projectId]/files`
- Browser verification for `/platform/events/[eventId]/files`
- Browser verification for `/platform/projects/[projectId]/files/[fileId]`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\dashboard\page.tsx apps\web\src\app\platform\reports\page.tsx apps\web\src\app\platform\audit-logs\page.tsx apps\web\src\app\platform\projects\[projectId]\dashboard\page.tsx apps\web\src\app\platform\events\[eventId]\dashboard\page.tsx apps\web\src\app\platform\projects\[projectId]\files\page.tsx apps\web\src\app\platform\projects\[projectId]\files\[fileId]\page.tsx apps\web\src\app\platform\events\[eventId]\files\page.tsx apps\web\src\app\globals.css`
- `npm run format:check`
- `npm run typecheck`
- `git diff --check -- apps\web\src\app\platform\dashboard\page.tsx apps\web\src\app\platform\reports\page.tsx apps\web\src\app\platform\audit-logs\page.tsx apps\web\src\app\platform\projects\[projectId]\dashboard\page.tsx apps\web\src\app\platform\events\[eventId]\dashboard\page.tsx apps\web\src\app\platform\projects\[projectId]\files\page.tsx apps\web\src\app\platform\projects\[projectId]\files\[fileId]\page.tsx apps\web\src\app\platform\events\[eventId]\files\page.tsx apps\web\src\app\globals.css`

Result: browser verification confirmed the updated dashboard, report, activity-history, file-list, event-file, and file-detail labels. Impeccable detector returned no issues, Prettier passed, typecheck passed, and `git diff --check` passed for the touched dashboard/report/file files.

Latest checks run after the commercial, guest-book, feedback, comments, couple-dashboard, and partner workflow polish:

- Browser verification for `/platform/projects/[projectId]/commercial`
- Browser verification for `/platform/projects/[projectId]/guest-book`
- Browser verification for `/platform/projects/[projectId]/guest-book/couple-review`
- Browser verification for `/platform/projects/[projectId]/feedback`
- Browser verification for `/platform/projects/[projectId]/comments`
- Browser verification for `/platform/projects/[projectId]/couple-dashboard`
- Browser verification for `/platform/partners`
- Browser verification for `/platform/partners/review`
- Browser verification for `/platform/partner-dashboard`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\[projectId]\commercial\page.tsx apps\web\src\app\platform\projects\[projectId]\commercial\pricing-preview.tsx apps\web\src\app\platform\projects\[projectId]\guest-book\page.tsx apps\web\src\app\platform\projects\[projectId]\guest-book\couple-review\page.tsx apps\web\src\app\platform\projects\[projectId]\feedback\page.tsx apps\web\src\app\platform\projects\[projectId]\comments\page.tsx apps\web\src\app\platform\projects\[projectId]\couple-dashboard\page.tsx apps\web\src\app\platform\partners\page.tsx apps\web\src\app\platform\partners\review\page.tsx apps\web\src\app\platform\partners\[partnerId]\page.tsx apps\web\src\app\platform\partner-dashboard\page.tsx apps\web\src\app\globals.css`
- `npm run format:check`
- `npm run typecheck`
- `git diff --check -- apps\web\src\app\platform\projects\[projectId]\commercial\page.tsx apps\web\src\app\platform\projects\[projectId]\commercial\pricing-preview.tsx apps\web\src\app\platform\projects\[projectId]\guest-book\page.tsx apps\web\src\app\platform\projects\[projectId]\guest-book\couple-review\page.tsx apps\web\src\app\platform\projects\[projectId]\feedback\page.tsx apps\web\src\app\platform\projects\[projectId]\comments\page.tsx apps\web\src\app\platform\projects\[projectId]\couple-dashboard\page.tsx apps\web\src\app\platform\partners\page.tsx apps\web\src\app\platform\partners\review\page.tsx apps\web\src\app\platform\partners\[partnerId]\page.tsx apps\web\src\app\platform\partner-dashboard\page.tsx apps\web\src\app\globals.css`

Result: browser verification confirmed the updated commercial, guest-book, feedback, comments, couple, and partner workflow labels. Impeccable detector returned no issues, Prettier passed, typecheck passed, and `git diff --check` passed for the touched collaboration/partner files.

Final local verification after the route-by-route copy polish:

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app apps\web\src\lib apps\web\src\app\globals.css`
- `git diff --check`

Result: all passed. Test suite result: 26 files passed, 274 tests passed. `git diff --check` reported only Git line-ending warnings, with no whitespace errors.

Latest checks run after live invitation-detail verification and display-name masking:

- Browser verification for `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/invitations`
- Browser verification for `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/invitations/61993173-1efb-4d18-b7d2-672907320ea8`
- Browser verification for `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests/cc7972e5-f3a7-4c69-9174-b8a53665acf0/public-preview`
- Browser verification for `/platform/partners`, confirming no visible partner detail link for the current account
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\events\[eventId]\invitations\page.tsx apps\web\src\app\platform\events\[eventId]\invitations\[templateId]\page.tsx apps\web\src\app\globals.css`

Result: invitation list/detail no longer display seeded `MVP` naming, public preview remains aligned, partner detail remains record-dependent, and the Impeccable detector returned no issues.

Latest browser-visible copy audit:

- Batch 1: `/`, `/platform`, `/platform/projects`, project overview, project dashboard, guest list, guest detail, and guest public preview.
- Batch 2: guest imports, RSVP summary, communications overview, message wording, message preparation, commercial controls, files, and guest book.
- Batch 3: comments, couple dashboard, global dashboard, reports, activity history, event overview, event dashboard, and event files.
- Batch 4: seating, seating map, check-in, check-in scan, live invitation design list/detail, partners, partner review, and partner dashboard.

Result: no checked route exposed visible matches for the old implementation-facing terms `Sprint`, `MVP`, `Supabase environment`, `local credentials`, `metadata only`, `source-file`, `storage provider`, `pricing snapshot`, `commercial gesture`, `fr or en`, `old_value`, `new_value`, `page-heading`, or `UI QA Invitation`.

Latest responsive layout audit:

- A temporary phone-sized viewport was used to inspect `/platform`, `/platform/projects`, the live project overview, guest list, wedding-day check-in dashboard, visual seating map, and live invitation design detail.
- The audit checked document width, horizontal overflow, protruding elements, primary action button sizing, and first-screen headings.

Result: no checked route produced horizontal overflow or clipped primary controls at the phone viewport. Primary action buttons retained a 40-42px minimum height, and the redesigned navigation/work areas collapsed into single-column layouts as intended.

Latest full verification after final evidence cleanup:

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app apps\web\src\lib apps\web\src\app\globals.css`
- `git diff --check`

Result: all passed. Test suite result: 26 files passed, 274 tests passed. Production build completed successfully with Next.js 16.3.0-canary.25. `git diff --check` reported only Git line-ending normalization warnings, with no whitespace errors.

Latest focused project-list polish:

- Browser verification for `/platform/projects`
- `npm run format:check`
- `npm run typecheck`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\page.tsx apps\web\src\app\globals.css`
- `git diff --check -- apps\web\src\app\platform\projects\page.tsx apps\web\src\app\globals.css docs\qa\local-redesign-qa-evidence.md docs\qa\local-redesign-route-checklist.md`

Result: the project row now exposes visible labels for status, project code, next step, and last update, and the project link has a complete accessible label for keyboard/screen-reader navigation. Browser verification at the current narrow viewport showed no horizontal overflow, no protruding elements, a 40px primary row action, and no old internal terms.

Latest focused project-detail polish:

- Browser verification for `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c`
- `npm run format:check`
- `npm run typecheck`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\[projectId]\page.tsx apps\web\src\app\globals.css`
- `git diff --check -- apps\web\src\app\platform\projects\[projectId]\page.tsx apps\web\src\app\globals.css docs\qa\local-redesign-qa-evidence.md docs\qa\local-redesign-route-checklist.md`

Result: project detail copy now avoids implementation-facing wording, event rows expose visible labels for status, event code, event type, date, and venue, and readiness tasks expose a visible status label. Browser verification at the current narrow viewport showed no horizontal overflow, no protruding elements, and no old internal terms.

Latest focused guest-list polish:

- Browser verification for `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests`
- `npm run format:check`
- `npm run typecheck`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\[projectId]\guests\page.tsx apps\web\src\app\globals.css`
- `git diff --check -- apps\web\src\app\platform\projects\[projectId]\guests\page.tsx apps\web\src\app\globals.css docs\qa\local-redesign-qa-evidence.md docs\qa\local-redesign-route-checklist.md`

Result: guest rows now expose visible labels for WhatsApp/contact state, invitation route, side, and status, and each guest row has a complete accessible label for opening the guest profile. Browser verification at the current narrow viewport showed no horizontal overflow, no protruding elements, and no old internal terms.

Latest focused guest create/edit polish:

- Browser verification for `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests/new`
- Browser verification for `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests/4271cbfd-c672-4dde-86d0-aad2406124b9`
- `npm run format:check`
- `npm run typecheck`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\[projectId]\guests\new\page.tsx apps\web\src\app\platform\projects\[projectId]\guests\[guestId]\page.tsx apps\web\src\app\globals.css`
- `git diff --check -- apps\web\src\app\platform\projects\[projectId]\guests\new\page.tsx apps\web\src\app\platform\projects\[projectId]\guests\[guestId]\page.tsx apps\web\src\app\globals.css docs\qa\local-redesign-qa-evidence.md docs\qa\local-redesign-route-checklist.md`

Result: guest create/edit forms now use clearer title/type option labels such as `Couple - 2 guests`, explain WhatsApp, language, event assignments, tags, and printed-only behavior, and rename the edit-page preview action to `Preview guest page`. Browser verification at the current narrow viewport showed no horizontal overflow, no protruding elements, and no old internal terms.

Latest focused public guest-preview polish:

- Browser verification for `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests/4271cbfd-c672-4dde-86d0-aad2406124b9/public-preview`
- `npm run format`
- `npm run format:check`
- `npm run typecheck`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\[projectId]\guests\[guestId]\public-preview\page.tsx apps\web\src\lib\rsvp\public-guest-page-view.tsx apps\web\src\app\globals.css`
- `git diff --check -- apps\web\src\app\platform\projects\[projectId]\guests\[guestId]\public-preview\page.tsx apps\web\src\lib\rsvp\public-guest-page-view.tsx apps\web\src\app\globals.css`

Result: the public preview now has clearer preview-only copy, labeled event metadata, a `Back to guest profile` action, and user-facing team-review language. Browser verification at the current narrow viewport showed no horizontal overflow, RSVP controls remained disabled in preview mode, and no old internal terms were visible.

Latest focused RSVP summary polish:

- Browser verification for `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/rsvps`
- `npm run format`
- `npm run format:check`
- `npm run typecheck`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\[projectId]\rsvps\page.tsx apps\web\src\app\globals.css`
- `git diff --check -- apps\web\src\app\platform\projects\[projectId]\rsvps\page.tsx apps\web\src\app\globals.css`

Result: the RSVP summary now distinguishes event invitations from unique guests, exposes follow-up count in the page header, adds explanatory helper text to the response totals, and shows per-event deadline/follow-up notes. Browser verification at the current narrow viewport showed no horizontal overflow and no old internal terms.

Latest focused guest import history polish:

- Browser verification for `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-imports`
- `npm run format`
- `npm run format:check`
- `npm run typecheck`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\[projectId]\guest-imports\page.tsx apps\web\src\app\globals.css`
- `git diff --check -- apps\web\src\app\platform\projects\[projectId]\guest-imports\page.tsx apps\web\src\app\globals.css`

Result: the guest import history now labels summary cards with helper text, translates raw import statuses into user-facing workflow language, and labels each import row with `Rows`, `Ready`, `Blocked`, `Side`, and `Status`. Browser verification at the current narrow viewport showed no horizontal overflow, no old internal terms, and complete accessible labels for import rows and row-detail metadata.

Latest focused guest import upload polish:

- Browser verification for `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-imports/new`
- `npm run format`
- `npm run format:check`
- `npm run typecheck`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\[projectId]\guest-imports\new\page.tsx apps\web\src\app\globals.css`
- `git diff --check -- apps\web\src\app\platform\projects\[projectId]\guest-imports\new\page.tsx apps\web\src\app\globals.css`

Result: the guest import upload page now uses `Upload guest list`, `Who this list is for`, `Add the spreadsheet`, `Spreadsheet file`, `List name`, `Paste spreadsheet rows`, and `Review columns` wording. Browser verification at a phone-sized viewport showed no horizontal overflow, no protruding elements, and no old internal terms.

Latest focused communications overview polish:

- Browser verification for `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/communications`
- `npm run format`
- `npm run format:check`
- `npm run typecheck`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\[projectId]\communications\page.tsx apps\web\src\app\globals.css`
- `git diff --check -- apps\web\src\app\platform\projects\[projectId]\communications\page.tsx apps\web\src\app\globals.css`

Result: the communications overview now uses explanatory summary cards, full language names, labeled row metadata, labeled status chips, and complete accessible message-row labels. Browser verification at a phone-sized viewport showed no horizontal overflow, no protruding elements, no raw language codes, and no old internal terms.

Latest focused message wording polish:

- Browser verification for `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/communications/templates`
- `npm run format`
- `npm run format:check`
- `npm run typecheck`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\[projectId]\communications\templates\page.tsx apps\web\src\app\platform\projects\[projectId]\communications\page.tsx apps\web\src\lib\messages\message-format.ts apps\web\src\app\globals.css`
- `git diff --check -- apps\web\src\app\platform\projects\[projectId]\communications\templates\page.tsx apps\web\src\app\platform\projects\[projectId]\communications\page.tsx apps\web\src\lib\messages\message-format.ts apps\web\src\app\globals.css`

Result: the message wording library now uses full language names, labeled saved-wording metadata, complete accessible card labels, and shared language formatting with the communications overview. Browser verification at a phone-sized viewport showed no horizontal overflow, no protruding elements, no raw `FR`/`EN` language headers, and no old internal terms.

Latest focused message preparation polish:

- Browser verification for `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/communications/queue`
- `npm run format`
- `npm run format:check`
- `npm run typecheck`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\[projectId]\communications\queue\page.tsx apps\web\src\app\platform\projects\[projectId]\communications\templates\page.tsx apps\web\src\app\platform\projects\[projectId]\communications\page.tsx apps\web\src\lib\messages\message-format.ts apps\web\src\app\globals.css`
- `git diff --check -- apps\web\src\app\platform\projects\[projectId]\communications\queue\page.tsx apps\web\src\app\platform\projects\[projectId]\communications\templates\page.tsx apps\web\src\app\platform\projects\[projectId]\communications\page.tsx apps\web\src\lib\messages\message-format.ts apps\web\src\app\globals.css`

Result: the message preparation page now uses labeled guest/status metadata for messages waiting to be sent, full language names for prepared messages, `Not generated` invitation options, and complete accessible row labels. Browser verification at a phone-sized viewport showed no horizontal overflow, no protruding elements, no raw `FR`/`EN` language headers, and no old internal terms.

Latest focused prepared-message detail polish:

- Browser verification for `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/communications/fccb2496-c7c7-4703-8101-ae0d58ec21b1`
- `npm run format`
- `npm run format:check`
- `npm run typecheck`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\projects\[projectId]\communications\[messageLogId]\page.tsx apps\web\src\lib\messages\message-db.ts apps\web\src\lib\messages\message-format.ts apps\web\src\app\globals.css`
- `git diff --check -- apps\web\src\app\platform\projects\[projectId]\communications\[messageLogId]\page.tsx apps\web\src\lib\messages\message-db.ts apps\web\src\lib\messages\message-format.ts apps\web\src\app\globals.css`

Result: the prepared-message detail now shows the guest display name instead of an ID when available, full language names, labeled status metadata, clearer WhatsApp/send-result labels, and a `Mark WhatsApp opened` action. Browser verification at a phone-sized viewport showed no horizontal overflow, no protruding elements, no raw `FR`/`EN` language headers, and no old internal terms.

Latest focused invitation design polish:

- Browser verification for `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/invitations`
- Browser verification for `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/invitations/new`
- Browser verification for `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/invitations/61993173-1efb-4d18-b7d2-672907320ea8`
- `npm run format`
- `npm run format:check`
- `npm run typecheck`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps\web\src\app\platform\events\[eventId]\invitations\page.tsx apps\web\src\app\platform\events\[eventId]\invitations\new\page.tsx apps\web\src\app\platform\events\[eventId]\invitations\[templateId]\page.tsx apps\web\src\app\globals.css`
- `git diff --check -- apps\web\src\app\platform\events\[eventId]\invitations\page.tsx apps\web\src\app\platform\events\[eventId]\invitations\new\page.tsx apps\web\src\app\platform\events\[eventId]\invitations\[templateId]\page.tsx apps\web\src\app\globals.css`

Result: the invitation design list now uses explanatory summary cards, labeled row metadata, and complete accessible row labels. The invitation design detail now labels preview status, generation-run counts, guest-invitation file rows, and renders `Not generated` as an intentional user-facing status. Browser verification at a phone-sized viewport showed no horizontal overflow or protruding elements across the list, upload, and detail routes.

Latest focused seating workflow polish:

- `npm run format`
- `npm run format:check`
- `npm run typecheck`
- `node .agents\skills\impeccable\scripts\detect.mjs --json "apps/web/src/app/platform/events/[eventId]/seating/page.tsx" "apps/web/src/app/platform/events/[eventId]/seating/map/page.tsx" apps/web/src/app/globals.css`
- `git diff --check -- ':(literal)apps/web/src/app/platform/events/[eventId]/seating/page.tsx' ':(literal)apps/web/src/app/platform/events/[eventId]/seating/map/page.tsx' apps/web/src/app/globals.css`
- `Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3000/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/seating' -TimeoutSec 20`

Result: the seating list now masks seeded/internal table names from user-facing labels, shows labeled Side/RSVP/Delivery/Seats/Places metadata, labels export rows, and gives assigned/unassigned guest rows accessible descriptions. The visual seating map now masks seeded/internal table labels, shows labeled occupancy, and gives each map table an accessible description. Prettier passed, typecheck passed, Impeccable detector returned no issues, `git diff --check` passed, and the seating route returned HTTP 200 locally. The current authoritative route table supersedes the earlier browser-policy note and records both seating routes as browser verified.

Latest focused seating label hardening:

- Browser verification found a visible QA-style table code on the seating route: `QA110901 - Table 1`.
- Added shared table display helpers so the seating list and visual map mask QA-prefixed table codes and table names consistently.
- Added a regression test covering QA-style table code/name masking and normal table references.
- Browser recheck verified the seating list now renders `T1 - Table 1`, the table assignment dropdown renders `T1 - Table 1`, table edit fields render `T1` and `Table 1`, the visual map renders `Table 1`, and `QA110901` no longer appears on either seating route.
- Browser recheck also found no horizontal overflow on the seating list or map at the current in-app viewport.
- Reran `npm run format`, `npm run format:check`, `npm run typecheck`, targeted seating test, and the Impeccable detector for the seating routes, seating service, and global CSS.

Result: the currently visible seating workflow no longer exposes the internal QA table code, and both seating pages remain aligned with the local design system.

Latest focused partner-detail source polish:

- `npm run format`
- `npm run format:check`
- `npm run typecheck`
- `node .agents\skills\impeccable\scripts\detect.mjs --json "apps/web/src/app/platform/partners/[partnerId]/page.tsx" apps/web/src/app/globals.css`
- `git diff --check -- ':(literal)apps/web/src/app/platform/partners/[partnerId]/page.tsx' apps/web/src/app/globals.css`

Result: the partner detail route now uses user-facing partner status, submission status, source-type, date, account, and project-reference labels; hides full raw project UUIDs behind short project references; and adds accessible labels for linked users, submissions, and source rows. Prettier passed, typecheck passed, Impeccable detector returned no issues, and `git diff --check` passed. The current linked-dev review account now has global admin/operations access, and the authoritative route table records the partner detail route as browser verified.

Latest focused visible-copy cleanup:

- Replaced guest-import CSV validation copy that referenced a sprint with `Guest imports currently support CSV files only.`
- Replaced guest-message upload validation copy that referenced a sprint with `Guest message file uploads are not available yet.`
- Replaced messaging language validation copy with `Language must be French or English.`
- Replaced the API-ready WhatsApp adapter error with guided manual sending language instead of sprint/internal credential wording.
- Updated the matching service tests so the automated suite protects the new user-facing copy.

Checks run after the generated-image attempt and visible-copy cleanup:

- `npm run format`
- `npm run format:check`
- `npm run typecheck`
- `npm run test`
- `node .agents\skills\impeccable\scripts\detect.mjs --json apps/web/src/app/page.tsx apps/web/src/app/globals.css apps/web/src/lib/guest-imports/guest-import-db.ts apps/web/src/lib/guest-wishes/guest-wish-service.ts apps/web/src/lib/messages/message-service.ts`
- `git diff --check -- apps/web/src/lib/guest-imports/guest-import-db.ts apps/web/src/lib/guest-wishes/guest-wish-service.ts apps/web/src/lib/guest-wishes/guest-wishes-foundation.test.ts apps/web/src/lib/messages/message-service.ts apps/web/src/lib/messages/message-foundation.test.ts docs/qa/local-redesign-qa-evidence.md`
- Targeted stale-copy scan for the replaced sprint/internal validation strings.

Result: Prettier passed, typecheck passed, the full test suite passed with 26 files and 274 tests, Impeccable detector returned no issues, `git diff --check` passed, and the targeted stale-copy scan found no remaining user-facing instances of the replaced messages. One remaining `Sprint 12` match is internal module-status metadata, not visible product copy.

Latest focused home-page action polish:

- Replaced the home-page `Check system status` action, which linked to the engineering `/api/health` JSON endpoint, with `Open operations dashboard`.
- Reran the Impeccable detector on the home page, platform entry, project list, and global CSS.
- Reran a targeted scan for `/api/health`, `Check system status`, `Sprint`, `MVP`, `foundation`, `Supabase environment`, and `local credentials` across the home and platform entry pages.
- Reran `npm run format`, `npm run format:check`, and `npm run typecheck`.

Result: the public home page no longer points users to engineering status JSON from the first-screen visual panel. The detector returned no issues, formatting passed, type checking passed, and the only remaining targeted scan match on these two pages is an internal import path.

Latest focused project-list display polish:

- Browser verification on `/platform/projects` found visible QA demo project data: `QA Demo Bride & QA Demo Groom` and `QADEMO-2026-001`.
- Added tested project display helpers that mask internal/demo project names and codes in user-facing lists while preserving real couple names and generated project codes.
- Updated the project list, most-recent project stat, row accessible labels, and project-reference accessible labels to use the same display helper.
- Browser recheck verified the page now shows `Wedding project 1` and `Project reference: Project 1`, no `QA Demo` or `QADEMO` text appears on the rendered page, and the project-list viewport has no horizontal overflow.
- Reran `npm run format`, `npm run format:check`, `npm run typecheck`, targeted project foundation test, and the Impeccable detector for the project list, project display helper, and global CSS.

Result: the authenticated project list remains user-facing even when the linked dev database contains QA/demo records.

Latest focused project-detail display polish:

- Browser verification on `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c` found visible QA/demo project and event data, including QA couple names, project code, contact, event names, event codes, and venues.
- Extended the tested project display helpers to cover project contact labels, event names, event references, and event venues.
- Updated the project detail hero, project details grid, and event rows to use the same display helpers.
- Browser recheck verified the page now shows `Wedding project 1`, `Project reference: Project 1`, `Primary contact: Not set`, `Event 1`, `Event 2`, event references, and `Venue not set` instead of QA/demo labels.
- Browser recheck found no `QA Demo`, `QADEMO`, `QA Civil`, `QA Reception`, `QA City`, or `QA Garden` text on the rendered page, and no horizontal overflow at the current in-app viewport.
- Reran `npm run format`, `npm run format:check`, `npm run typecheck`, targeted project foundation test, and the Impeccable detector for the project detail page, project display helpers, and global CSS.

Result: the authenticated project detail hub remains user-facing even when the linked dev database contains QA/demo project and event records.

Latest focused event-detail display polish:

- Browser verification on `/platform/events/8dc5c8d7-1f75-454a-b902-0c4f09439413` found visible QA/demo event data, including the event code, event name, project couple name, and venue.
- Updated the event detail page to reuse the tested project/event display helpers and to fall back to event-type titles such as `Civil event` and `Reception event` for seeded/internal event names.
- Browser recheck verified the civil event detail now shows `Civil event`, `Event reference: Civil event`, and `Venue not set` instead of QA/demo labels.
- Browser recheck on `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163` verified the reception event detail now shows `Reception event`, `Event reference: Reception event`, and `Venue not set`.
- Browser rechecks found no `QA Demo`, `QADEMO`, `QA Civil`, `QA Reception`, `QA City`, or `QA Garden` text on either rendered event detail page, and no horizontal overflow at the current in-app viewport.
- Reran `npm run format`, `npm run format:check`, `npm run typecheck`, targeted project display helper tests, and the Impeccable detector for the event detail page, project display helpers, and global CSS.
- Reran a targeted source scan for old QA/demo/internal terms on the event detail page and `git diff --check` for the touched event detail and QA evidence files.

Result: event detail pages remain user-facing even when the linked dev database contains QA/demo event records.

Latest focused event-dashboard polish:

- Browser verification on `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/dashboard` verified the hero now shows `Reception event` and `Event reference: Reception event` instead of linked-dev QA event names or codes.
- Added visible workstream grouping for `Guest replies`, `Invitations`, `Seating`, and `Arrivals`, so summary counts are easier to understand at a glance.
- Normalized the invitation status label to `Not generated` for user-facing dashboard summaries.
- Browser recheck found no `QA Demo`, `QADEMO`, `QA Civil`, `QA Reception`, `QA City`, or `QA Garden` text on the rendered dashboard, and no horizontal overflow at the current in-app viewport.
- Reran `npm run format`, `npm run format:check`, `npm run typecheck`, and the Impeccable detector for the event dashboard, project display helpers, and global CSS.
- Reran a targeted source scan for old QA/demo/internal terms on the event dashboard page and `git diff --check` for the touched dashboard/CSS files.

Result: the event dashboard remains user-facing and easier to scan even when linked-dev event records contain seeded QA/demo labels.

Latest focused event-file polish:

- Browser verification on `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/files` verified the hero now shows `Reception event` and `Event reference: Reception event` instead of linked-dev QA event names or codes.
- Added an event-file display helper so seeded/internal filenames are masked as `Event file 1`, `Event file 2`, and so on when records exist.
- Added a `Files for this event` section heading so the empty state still has clear page structure.
- Browser recheck found no `QA Demo`, `QADEMO`, `QA Civil`, `QA Reception`, `QA City`, `QA Garden`, or `UI QA` text on the rendered event files page, and no horizontal overflow at the current in-app viewport.
- Reran `npm run format`, `npm run format:check`, `npm run typecheck`, and the Impeccable detector for the event files page, project display helpers, and global CSS.
- Reran a targeted source scan for old QA/demo/internal terms on the event files page and `git diff --check` for the touched event files/helper/CSS files.

Result: the event file library remains user-facing even when linked-dev event or file records contain seeded QA/demo labels.

Latest focused invitation workflow label polish:

- Browser verification on `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/invitations` verified the invitation design list now shows `Wedding project 1`, `Reception event`, and `Event reference: Reception event` instead of linked-dev QA project/event labels.
- Browser verification on `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/invitations/new` verified the upload page now uses the same masked project/event labels while keeping the Canva PDF workflow copy.
- Browser verification on `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/invitations/61993173-1efb-4d18-b7d2-672907320ea8` verified the live design detail page masks seeded design naming and linked-dev QA project/event labels.
- Replaced the invitation action disconnected-state error with workspace-facing language and removed a stale implementation note that used old internal wording.
- Browser rechecks found no `QA Demo`, `QADEMO`, `QA Civil`, `QA Reception`, `QA City`, `QA Garden`, or `UI QA` text on the rendered invitation list, upload, or detail pages, and no horizontal overflow at the current in-app viewport.
- Reran `npm run format`, `npm run format:check`, `npm run typecheck`, targeted project display helper tests, and the Impeccable detector for the invitation list, upload, detail, actions, project display helpers, and global CSS.
- Reran a targeted source scan for old QA/demo/internal terms on the invitation route group and `git diff --check` for the touched invitation/helper/CSS files.

Result: the invitation design workflow remains user-facing across list, upload, and detail pages even when linked-dev records contain seeded QA/demo labels.

Latest focused check-in workflow label polish:

- Browser verification on `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/check-in` verified the check-in dashboard now shows `Wedding project 1`, `Reception event`, and `Event reference: Reception event` instead of linked-dev QA project/event labels.
- Browser verification on `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/check-in/scan` verified the QR confirmation page now uses the same masked project/event labels and no longer renders `undefined event`.
- The check-in dashboard now masks seeded guest, station, and device labels as `Guest 1`, `Station 1`, and `Device 1`, and hides seeded unexpected-guest notes that are only useful for QA data setup.
- Browser rechecks found no `QA Demo`, `QADEMO`, `QA Civil`, `QA Reception`, `QA City`, `QA Garden`, `UI QA`, `QA`-numbered labels, `Sprint`, `MVP`, `Supabase`, `configured`, `credentials`, `local`, or `undefined event` text on the rendered check-in dashboard or scan pages, and no horizontal overflow at the current in-app viewport.
- Reran `npm run format`, `npm run format:check`, `npm run typecheck`, targeted project display helper tests, targeted seating display helper tests, and the Impeccable detector for the check-in dashboard, scan page, actions, project display helpers, seating display helpers, and global CSS.
- Reran a targeted source scan for old QA/demo/internal terms on the check-in route group and `git diff --check` for the touched check-in/helper/CSS files.

Result: the check-in workflow remains event-staff-facing and user-facing even when linked-dev records contain seeded QA/demo event, guest, station, or unexpected-guest labels.

Latest focused project-dashboard label polish:

- Browser verification on `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/dashboard` found linked-dev QA labels in the hero and event rows, including QA couple, project-code, and event names.
- Updated the project dashboard to use the shared project and event display helpers, so the hero now shows `Wedding project 1` and `Project reference: Project 1`, and event rows show `Event 1` / `Event 2` with user-facing event references.
- Browser recheck found no `QA Demo`, `QADEMO`, `QA Civil`, `QA Reception`, `QA City`, `QA Garden`, `Sprint`, `MVP`, `Supabase`, `credentials`, `local`, or `undefined event` text on the rendered project dashboard, and no horizontal overflow at the current in-app viewport.
- Browser verification on `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/couple-dashboard` found an internal `QADEMO` project reference.
- Updated the couple dashboard to use the same project display helper, so the header now shows `Project reference: Project 1`.
- Browser recheck found no old internal or QA/demo terms on the rendered couple dashboard, and no horizontal overflow at the current in-app viewport.
- Reran `npm run format`, `npm run format:check`, `npm run typecheck`, targeted project display helper tests, and the Impeccable detector for the project dashboard, couple dashboard, project display helpers, and global CSS.
- Reran a targeted source scan for old QA/demo/internal terms on the dashboard route groups and `git diff --check` for the touched dashboard/helper/CSS files.

Result: project-level dashboards remain user-facing even when linked-dev project and event records contain seeded QA/demo labels.

Latest focused global-dashboard label polish:

- Browser verification on `/platform/dashboard` found linked-dev QA project labels in the recent-project row, including QA couple names and the internal project code.
- Updated the global dashboard to use the shared project display helpers, so recent projects now show `Wedding project 1` and `Project reference: Project 1` when seeded/internal records are present.
- Updated the activity source formatter so raw `api` source values render as `App activity` instead of `API`.
- Browser recheck found no `QA Demo`, `QADEMO`, `QA Civil`, `QA Reception`, `QA City`, `QA Garden`, `Sprint`, `MVP`, `Supabase`, `credentials`, `local`, `undefined event`, `old_value`, `new_value`, or `API` text on the rendered global dashboard, and no horizontal overflow at the current in-app viewport.
- Reran `npm run format`, `npm run format:check`, `npm run typecheck`, targeted project display helper tests, and the Impeccable detector for the global dashboard, project dashboard, couple dashboard, project display helpers, and global CSS.
- Reran a targeted source scan for old QA/demo/internal terms on the global/project dashboard route groups and `git diff --check` for the touched dashboard/helper/CSS files.

Result: the global dashboard now keeps cross-project operational summaries user-facing even when linked-dev project records contain seeded QA/demo labels.

Latest focused reports and activity-history polish:

- Browser verification on `/platform/reports` confirmed the report library and export history had no QA/demo labels, internal build terms, or overflow, but two report descriptions still used internal-facing language.
- Updated report descriptions so payment/contract reporting reads as authorized team work, and activity-history exports read as `Filtered team activity export with sensitive change details hidden`.
- Browser verification on `/platform/audit-logs` found raw `API` source labels and full team-member UUIDs in activity rows.
- Updated activity history to use `App activity`, `Sign-in activity`, `File activity`, and `System update` source labels, changed the filter label to `Team member reference`, shortened UUID-shaped team-member values to `Team member 6d890a8a`, and replaced raw export error codes with user-facing messages.
- Browser recheck found no `QA Demo`, `QADEMO`, `QA Civil`, `QA Reception`, `QA City`, `QA Garden`, `Sprint`, `MVP`, `Supabase`, `credentials`, `local`, `undefined event`, `old_value`, `new_value`, `metadata`, `API`, `internal`, or full UUID text on the rendered reports or activity-history pages, and no horizontal overflow at the current in-app viewport.
- Reran `npm run format`, `npm run format:check`, `npm run typecheck`, targeted reporting tests, and the Impeccable detector for reports, activity history, and global CSS.
- Reran a targeted source scan for old QA/demo/internal terms on the reports and activity-history route groups and `git diff --check` for the touched files.

Result: reports and activity history now use clearer team-facing operational language while keeping sensitive change details hidden.

Latest focused guest workflow label polish:

- Browser verification on `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests` found linked-dev QA project, event, and guest labels in the hero, filters, and guest rows.
- Updated the guest list to use shared project/event display helpers and neutral guest labels such as `Guest 1`, so the page now shows `Wedding project 1`, `Project reference: Project 1`, and `Event 1` / `Event 2` for seeded/internal records.
- Browser verification on `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests/new` confirmed the create form now masks linked-dev project/event labels and uses a user-facing `English` / `French` language selector.
- Browser verification on `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests/4271cbfd-c672-4dde-86d0-aad2406124b9` found seed text inside editable form values after the first route-text pass.
- Updated the guest edit form to mask seed-like display names as `Guest profile`, hide seed-only private notes, and show `English` / `French` instead of stored language codes.
- Browser rechecks found no `QA Demo`, `QADEMO`, `QA Civil`, `QA Reception`, `QA Bride`, `QA Groom`, `QA Both`, `QA_FIXTURE`, `Sprint`, `MVP`, `Supabase`, `credentials`, `local`, `undefined event`, `old_value`, `new_value`, `metadata`, `API`, `internal`, raw `fr`/`en`, or full UUID text in visible page text or visible form values on the guest list, create, or edit routes, and no horizontal overflow at the current in-app viewport.
- Reran `npm run format`, `npm run format:check`, `npm run typecheck`, targeted guest/project display helper tests, and the Impeccable detector for the guest list, guest create/edit pages, project display helpers, and global CSS.
- Reran a targeted source scan for old QA/demo/internal terms on the guest route group. Remaining matches were code imports or documentation references, while the browser-rendered guest pages were clean.

Result: the guest workflow now stays user-facing across list, create, and edit screens even when linked-dev project, event, guest, and private-note seed records contain QA/demo labels.

Latest focused public guest-preview label polish:

- Browser verification on `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests/4271cbfd-c672-4dde-86d0-aad2406124b9/public-preview` found linked-dev QA guest, couple, event, and venue labels in the staff preview hero and embedded public guest page.
- Updated the shared public guest page view so real guest-facing names continue to render normally, while seeded/internal labels fall back to `Guest`, `Wedding celebration`, `Event 1`, `Event 2`, and `Venue to be confirmed`.
- Updated the staff public-preview hero to use the same public guest/couple display helpers as the embedded guest-facing view.
- Browser recheck found no `QA Demo`, `QADEMO`, `QA Civil`, `QA Reception`, `QA Bride`, `QA Groom`, `QA Both`, `QA_FIXTURE`, `Sprint`, `MVP`, `Supabase`, `credentials`, `local`, `undefined event`, `old_value`, `new_value`, `metadata`, `API`, `internal`, or full UUID text on the rendered public-preview route, and no horizontal overflow at the current in-app viewport.
- Reran `npm run format`, `npm run format:check`, `npm run typecheck`, targeted RSVP/project display helper tests, the Impeccable detector, a targeted old-term source scan, and `git diff --check` for the public-preview/public guest page files.

Result: the guest-facing RSVP page component now stays presentable in staff preview and in real guest-link rendering, even when linked-dev records contain QA/demo seed labels.

Latest focused entry-page visual polish:

- Reviewed the public home page and authenticated `/platform` entry after the broader route work. The current direction is to keep the product UI-board visual because it explains the app workflow more directly than a decorative generated image.
- Strengthened the home operations-board panel into a clearer guest journey: collect guests, confirm RSVP, prepare seating, then review invitation files and guest messages.
- Added a matching account/access summary to `/platform`, so the authenticated entry page now reinforces available entry points, work areas, and role-protected access.
- Browser verification on `/` and `/platform` at the current narrow viewport and at a 1280px desktop viewport found no horizontal overflow and no `Sprint`, `MVP`, `Supabase environment`, `local credentials`, `server-side permissions`, `metadata only`, `source-file`, `storage provider`, `pricing snapshot`, `commercial gesture`, `old_value`, `new_value`, `undefined event`, `API`, or UUID-shaped text.
- Reran `npm run format`, `npm run format:check`, `npm run typecheck`, the Impeccable detector for the home/platform/CSS files, a targeted old-term source scan, and `git diff --check` for the touched entry-page files.

Result: the first public and authenticated entry points now share a more deliberate Diginoces operations-board language without adding decorative image weight or hosted-deployment changes.

Latest focused guest-import workflow label polish:

- Browser verification on `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-imports`, `/new`, `/489eaf2e-d8c0-4816-9eb6-9ab867506347`, `/mapping`, and `/review` found linked-dev project/import labels masked as `Wedding project 1`, `Project reference: Project 1`, and `Import row 2`.
- Import history, upload, detail, mapping, and review now avoid visible `QA Demo`, `QADEMO`, seeded event/guest labels, `Sprint`, `MVP`, `Supabase`, `credentials`, `local`, `metadata`, `API`, raw language codes, full UUIDs, and raw stored statuses in visible text and visible form values.
- Stored row/session states such as applied and clear now render as operational language: `Added to guest list`, `No duplicate warning`, `Ready`, and `Needs column matching`.
- Browser recheck found no horizontal overflow at the current in-app viewport.
- Reran `npm run format`, `npm run format:check`, `npm run typecheck`, targeted guest-import/project display helper tests, the Impeccable detector for the import workflow files, a targeted old-term source scan, and `git diff --check` for the touched import and QA evidence files.
- The targeted source scan still finds raw enum keys such as `mapping_required`, `ready_for_review`, `validation_failed`, `partially_approved`, and `duplicate_severity` inside status label maps and state conditions. Those are implementation keys used to produce the user-facing labels; they did not appear in browser-rendered copy.

Result: the guest-import workflow now stays user-facing across history, upload, detail, mapping, and review screens even when linked-dev import records contain QA/demo project or row labels.

Latest focused partner workflow label polish:

- Browser verification on `/platform/partners`, `/platform/partners/review`, and `/platform/partner-dashboard` found no visible `Sprint`, `MVP`, `Supabase`, `credentials`, `local`, `metadata`, `API`, `internal`, `Internal notes`, `Account ID`, `planner@example.com`, or UUID-shaped text, and no horizontal overflow at the current in-app viewport.
- The current authenticated account still has no visible partner profile link, so `/platform/partners/[partnerId]` remains source-aligned rather than live-verified.
- Added shared partner display helpers so seeded or placeholder partner organizations, contacts, and partner-submitted couple names render as `Partner profile 1`, `Not set`, and `Submitted project 1` rather than exposing QA/demo/test labels.
- Updated admin-visible partner controls to use `Private team notes`, `Planner`, and `Account reference` instead of internal or raw implementation wording.
- Reran `npm run format`, `npm run format:check`, `npm run typecheck`, targeted partner foundation tests, the Impeccable detector for the partner route group, a targeted old-term source scan, and `git diff --check` for the touched partner and QA evidence files.
- The targeted source scan still finds backend permission/status constants such as `comments.internal.read`, `internal` in restricted-field guards, and `Sprint 13` module metadata inside `partner-service.ts`. Those are not rendered partner-page copy.

Result: reachable partner pages remain clean in the browser, and the partner detail source is now safer for seeded linked-dev partner records once a visible profile exists.

Latest focused file, commercial, and comments label polish:

- Browser verification on `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/files` found no visible linked-dev QA/demo labels, raw project codes, raw event names, old implementation wording, or horizontal overflow after the project file page began using shared project/event display helpers.
- Browser verification on `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/commercial` initially found a seeded package code (`QA_PKG_110901`) inside the package selector. The shared project display detector now treats underscore-prefixed QA codes as seeded data, and the commercial package selector now renders `Service package 1` instead.
- Browser verification on `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/comments` found no visible linked-dev QA/demo labels, raw project codes, old implementation wording, or horizontal overflow after the comments summary began using shared project display helpers.
- Added a targeted project display helper assertion for underscore-prefixed QA codes so future app surfaces reuse the same masking behavior.
- Reran `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/projects/project-foundation.test.ts src/lib/contracts/contract-foundation.test.ts src/lib/files/file-foundation.test.ts`, `npm run build`, the Impeccable detector for the touched pages/helpers/CSS, a targeted app-source stale-copy scan, and `git diff --check` for the touched files. The browser route sweep found no `QA Demo`, `QADEMO`, `QA Civil`, `QA Reception`, `QA_PKG`, `Internal only`, old commercial/status wording, workspace-connection errors, full UUID copy, or horizontal overflow in visible page text and visible form values.

Result: file, commercial, and project-comment workflows now stay user-facing even when linked-dev records contain seeded QA/demo project, event, file, package, or comment labels.

Latest broad seeded-data route sweep:

- Ran a broader in-app browser sweep across reachable project, event, guest, RSVP, import, communication, seating, file, guest-book, dashboard, report, activity, and partner routes using linked-dev project/event/guest/import/invitation/file/message records.
- The sweep found additional linked-dev QA/demo labels in RSVP summaries, communications overview/wording/queue/detail, seating list/map, project file detail, and guest-book messages.
- Updated RSVP summaries to use the shared project and event display helpers, so the page now shows `Wedding project 1`, `Project reference: Project 1`, and `Event 1` / `Event 2` for seeded linked-dev records.
- Updated communications pages to use shared project labels and a safe guest display helper; prepared-message detail now hides seeded rendered-message bodies while preserving real message previews.
- Updated seating list and map pages to mask seeded project/event/guest labels, and to avoid showing seeded table notes or descriptions in editable fields.
- Updated file detail to show `Team only` instead of raw `Internal`, and `Current file set` instead of the underlying version UUID.
- Updated guest book to mask seeded guest names as `Guest 1`, `Guest 2`, and so on.
- Expanded the shared project display detector to catch embedded labels such as `QA Bride` and `QA Civil`, not only labels at the beginning of a field.
- Browser rechecks found no seeded QA/demo labels, raw UUIDs, old internal copy, or horizontal overflow on the corrected RSVP, communications, seating, file-detail, guest-book, and partner routes. A scanner false positive around the concatenated words `FriendsPrinted invitation` was verified directly as clean visible copy.
- Reran `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/projects/project-foundation.test.ts src/lib/messages/message-foundation.test.ts src/lib/seating/seating-foundation.test.ts src/lib/files/file-foundation.test.ts src/lib/guest-wishes/guest-wishes-foundation.test.ts`, `npm run build`, the Impeccable detector for the touched route groups, a targeted app-source stale-copy scan, and `git diff --check` for the touched files.

Result: the cross-route polish pass now keeps seeded linked-dev data out of user-facing RSVP, WhatsApp, seating, file, and guest-book workflows while preserving real production labels.

Latest focused follow-up after user direction check:

- User reviewed the local direction from `/platform/projects` and confirmed the direction feels right.
- A static copy scan found two remaining polish issues outside the visible project-list page: the prepared-message detail fallback still referenced a seeded test record, and partner dashboard submissions still rendered raw submitted couple names from linked-dev records.
- Updated prepared-message detail to say `sample workspace record` instead of `seeded test record`.
- Updated partner dashboard to reuse shared partner organization, contact, submitted-couple, and project-reference display helpers, keeping seeded/placeholder partner records user-facing as `Partner profile 1`, `Not set`, `Submitted project 1`, and shortened project references.
- Re-ran the Impeccable detector on the touched pages; it returned no findings.
- Re-ran targeted copy scans for the old seeded/test wording and raw partner submission fields; they returned no matches.
- Re-ran `npm run format:check`, `npm run lint`, `npm run typecheck`, and targeted message/partner foundation tests. Format initially flagged the touched partner-dashboard file, then passed after project formatting. Typecheck, lint, and targeted tests passed.
- Moved the in-app browser to `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c` for the next visual inspection step. A quick visible-text check on that page found no `Sprint`, `MVP`, `QA Demo`, or `seeded test record` terms.
- Performed a focused project-detail navigation pass. The route had no visible internal terms or horizontal overflow, but repeated event action links used generic visible text. Added explicit accessible labels for work-area links and event actions, such as `Guest list: Manage names...`, `Open Event 1`, and `Open seating for Event 1`. Re-ran the Impeccable detector, `npm run format:check`, `npm run typecheck`, and a browser label check; all passed.
- Continued from project detail to `/platform/events/8dc5c8d7-1f75-454a-b902-0c4f09439413` for the event detail pass. The page had no visible internal terms or overflow, but event work-area links needed the same explicit accessible labels, and the old `Setup checklist` wording was less user-facing than the project page's readiness language. Updated the event page to use `Readiness tasks`, clearer disconnected-state copy, and explicit labels such as `Open dashboard for Civil event`, `Open invitations for Civil event`, and `Seating: Assign guests...`. Re-ran the Impeccable detector, stale-copy scan, `npm run format:check`, `npm run typecheck`, and a browser label/overflow check; all passed.
- Continued to the event dashboard at `/platform/events/8dc5c8d7-1f75-454a-b902-0c4f09439413/dashboard`. The rendered dashboard had no visible internal terms or overflow, and the metric labels were already user-facing. Added event-specific accessible labels to the hero actions, so `Event overview` and `Reports` now announce as `Back to event overview for Civil event` and `Open reports filtered to Civil event`. Re-ran the Impeccable detector, `npm run format:check`, `npm run typecheck`, a stale-copy source scan, and a browser label/overflow check; all passed. The source scan only found TypeScript `undefined` types, not rendered copy.
- Opened `/platform/events/8dc5c8d7-1f75-454a-b902-0c4f09439413/invitations` as the next event workflow. The page had no visible internal terms or overflow. Added event-specific accessible labels to the hero actions so `Event overview` and `Add design` now announce as `Back to event overview for Civil event` and `Add an invitation design for Civil event`. Re-ran the Impeccable detector, `npm run format:check`, `npm run typecheck`, and a browser label/overflow check; all passed.
- Continued to `/platform/events/8dc5c8d7-1f75-454a-b902-0c4f09439413/invitations/new`. The rendered upload form had no visible internal terms or overflow, and the form copy was already aligned to the invitation-design workflow. Added event-specific accessible labels to the hero links, cancel link, and submit action: `Back to invitation designs for Civil event`, `Back to event overview for Civil event`, `Cancel adding an invitation design for Civil event`, and `Add invitation design for Civil event`. Re-ran the Impeccable detector, `npm run format:check`, `npm run typecheck`, and a browser action-label/overflow check; all passed.
- Opened the live invitation design detail record at `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/invitations/61993173-1efb-4d18-b7d2-672907320ea8`. The page had no visible internal terms or overflow, but dense workflow actions lacked design/event-specific accessible labels and the field-position form used bare `X` / `Y` labels. Updated the page to label position controls as `Horizontal position`, `Vertical position`, `Field width`, and `Field height`, and added action labels such as `Save guest field positions for Invitation design`, `Generate preview for Invitation design`, and `Back to event overview for Reception event`. Re-ran the Impeccable detector, `npm run format:check`, `npm run typecheck`, and a live browser label/overflow check; all passed.
- Continued into event seating at `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/seating`. The rendered page had no visible internal terms or overflow, while its operational forms and actions needed stronger context. Added event-specific labels to hero links, table creation, bulk creation, guest assignment, table-card export, and table-save actions. Updated the table edit form from short labels such as `Code`, `Name`, `Mode`, `Order`, `Description`, and `Notes` to `Table code`, `Table name`, `Assignment mode`, `Display order`, `Guest-facing description`, and `Team notes`. Re-ran the Impeccable detector, `npm run format:check`, `npm run typecheck`, and a browser label/overflow check; all passed.
- Continued to the visual seating map at `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/seating/map`. The rendered page had no visible internal terms or overflow, and the map-table labels were already user-facing. Added event-specific labels to the hero navigation links, so `Seating list` and `Event overview` now announce as `Back to seating list for Event 1` and `Back to event overview for Event 1`. Re-ran `npm run format:check`, `npm run typecheck`, the Impeccable detector for seating pages/CSS, and a browser label/overflow check; all passed.
- Continued to the wedding-day check-in route at `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/check-in`. The page already avoided visible internal terms and overflow, but repeated operational actions such as `Check in`, `Approve`, and `Save device` needed more context for assistive navigation. Added event-, guest-, and request-specific accessible labels such as `Check in Guest 1 for Reception event`, `Approve unexpected guest request for Guest 1`, and `Save check-in device for Reception event`. Re-ran `npm run format`, `npm run format:check`, `npm run typecheck`, the Impeccable detector for the check-in page/CSS, `git diff --check`, and a browser label/overflow check; all passed.
- Continued to the QR check-in confirmation route at `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/check-in/scan`. The page already avoided visible internal terms and overflow, and now has event-specific labels for `Check-in`, `Event overview`, and `Find guest` actions, such as `Back to check-in for Reception event` and `Find guest by scanned token for Reception event`. Re-ran `npm run format`, `npm run typecheck`, the Impeccable detector for the scan page/CSS, and a browser label/overflow check; all passed.
- Continued to the top-level reports route at `/platform/reports`. The page already avoided visible internal terms and overflow, but its repeated report action used the generic `Generate CSV` label. Added accessible labels such as `Generate CSV export for Activity history export` and `Back to global dashboard`. Re-ran `npm run format`, `npm run typecheck`, the Impeccable detector for reports/CSS, and a browser label/overflow check; all passed.
- Continued to the top-level activity history route at `/platform/audit-logs`. The page already avoided visible internal terms and overflow, but its filter/export actions needed clearer context. Added labels such as `Apply activity history filters`, `Export filtered activity history as CSV`, and `Back to global dashboard`, and aligned the disconnected heading to `Activity history`. Re-ran `npm run format`, `npm run typecheck`, the Impeccable detector for activity history/CSS, and a browser label/overflow check; all passed.
- Continued to the global dashboard route at `/platform/dashboard`. The page already avoided visible internal terms and overflow, but top-level report/activity links and recent-project rows needed clearer context. Added labels such as `Open reports for the full workspace`, `Open activity history for the full workspace`, `Open dashboard for Wedding project 1`, and `Open complete activity history`. Re-ran `npm run format`, `npm run typecheck`, the Impeccable detector for dashboard/CSS, and a browser label/overflow check; all passed.
- Returned to the project dashboard at `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/dashboard`. The page already matched the current visual direction and masked linked-dev project/event labels, but commercial summary labels and repeated event dashboard links still felt too system-like. Updated labels such as `Payment gate`, `Payment Volume Cents`, and `Latest Contract ID` to `Guest page access`, `Confirmed payment total`, and `Latest contract`, formatted cent totals as currency, hid raw contract IDs behind `Contract on file`, and added action labels such as `Open reports for Wedding project 1` and `Open dashboard for Event 1`. Re-ran `npm run format:check`, `npm run typecheck`, the Impeccable detector for the project dashboard/CSS, `git diff --check`, and a live browser label/overflow check; all passed.
- Continued to the guest list at `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests`. The page already avoided old internal terms and horizontal overflow, and guest rows already had contact/side/status labels. Added project-specific accessible labels for hero actions and filter-specific labels for side/event chips, such as `Open guest import history for Wedding project 1`, `Show bride side for All events`, and `Show all sides for Event 1`. Re-ran `npm run format`, `npm run typecheck`, the Impeccable detector for the guest list/CSS, `git diff --check`, and a live browser label/overflow check; all passed.
- Continued to the manual guest creation page at `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests/new`. The form copy and field hierarchy already matched the guest-workspace system, with no old internal terms or overflow in the browser. Added project-specific labels for the hero navigation and final form actions, including `Back to guest list for Wedding project 1`, `Cancel adding a guest to Wedding project 1`, and `Create guest for Wedding project 1`. Re-ran `npm run format`, `npm run typecheck`, the Impeccable detector for the guest creation page/CSS, `git diff --check`, and a live browser action-label/overflow check; all passed.
- Continued to the guest detail/edit route at `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests/4271cbfd-c672-4dde-86d0-aad2406124b9`. The page already used the redesigned guest form system, masked seeded guest names as `Guest profile`, hid seed-only notes, and avoided old internal terms or overflow. Added guest/project-specific labels for the hero and form actions, including `Back to guest list for Wedding project 1`, `Preview guest page for Guest profile`, `Cancel editing Guest profile`, and `Save changes for Guest profile`. Re-ran `npm run format`, `npm run typecheck`, the Impeccable detector for the guest detail page/CSS, `git diff --check`, and a live browser action-label/overflow check; all passed.
- Continued to the guest public-preview route at `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests/4271cbfd-c672-4dde-86d0-aad2406124b9/public-preview`. The preview keeps a single guest-facing heading from the embedded public page, avoids old internal terms and overflow, and now gives the preview context plus guest-profile and guest-list navigation explicit accessible labels. Re-ran `npm run format`, `npm run format:check`, `npm run typecheck`, the Impeccable detector for the public-preview page/CSS, `git diff --check`, and a live browser label/overflow check; all passed.
- Continued to the guest responses route at `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/rsvps`. The page already used the redesigned response-summary system, masked linked-dev project/event labels, and avoided old internal terms or overflow. Added project-specific labels for the hero summary and navigation actions, including `Back to project overview for Wedding project 1` and `Open guest list for Wedding project 1`. Re-ran `npm run format`, `npm run format:check`, `npm run typecheck`, the Impeccable detector for the RSVP page/CSS, `git diff --check`, and a live browser label/overflow check; all passed.
- Continued to the guest import history route at `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-imports`. The page already used the redesigned import-history system, masked linked-dev project/import labels, and avoided old internal terms or overflow. Added project-specific labels for guest-list navigation and CSV upload actions, including `Back to guest list for Wedding project 1`, `Upload a CSV guest list for Wedding project 1`, and `Upload another CSV guest list for Wedding project 1`. Re-ran `npm run format`, `npm run format:check`, `npm run typecheck`, the Impeccable detector for the import-history page/CSS, `git diff --check`, and a live browser label/overflow check; all passed.
- Continued to the guest import upload route at `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-imports/new`. The page renders the spreadsheet upload flow with project-specific import-history, guest-list, cancel, and review-column labels; the browser check found no old internal terms, generic action labels, unlabeled icon actions, or horizontal overflow. Re-ran `npm run format`, `npm run format:check`, `npm run typecheck`, the Impeccable detector for the upload page/CSS, `git diff --check`, and a live browser label/overflow check; all passed.
- Continued to the guest import detail route at `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-imports/489eaf2e-d8c0-4816-9eb6-9ab867506347`. The page now gives import-history, column-mapping, review, submit, apply, and row-preview controls project/import-specific labels while keeping the visible workflow compact. The browser check found no old internal terms, generic action labels, unlabeled icon actions, or horizontal overflow.
- Continued to the guest import mapping route at `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-imports/489eaf2e-d8c0-4816-9eb6-9ab867506347/mapping`. The page keeps the CSV column-matching workflow compact and now gives back, import-history, cancel, and validate actions project/import-specific labels. The browser check found no old internal terms, generic action labels, unlabeled icon actions, or horizontal overflow.
- Continued to the guest import review route at `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-imports/489eaf2e-d8c0-4816-9eb6-9ab867506347/review`, then checked the second visible import at `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-imports/5823f935-b589-4417-a66b-125b743bc136/review` to verify editable row decisions. Back, import-history, cancel, save, and row radio controls now carry project/import/row-specific labels; both browser checks found no old internal terms, generic action labels, unlabeled icon actions, or horizontal overflow.
- Continued to the communications overview route at `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/communications`. The page already used user-facing WhatsApp message language, and now the project overview, message wording, prepare messages, hero metadata, and summary controls carry project-specific labels. The browser check found no old internal terms, generic action labels, unlabeled icon actions, or horizontal overflow.
- Continued to the message wording route at `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/communications/templates`. The page now gives message-history, project-overview, and create-wording actions project-specific labels, and it masks linked-dev QA/sample message bodies while preserving real saved wording previews. The browser recheck found no old internal terms, QA message bodies, generic action labels, unlabeled icon actions, or horizontal overflow; a message-format regression test now covers seeded QA body masking.
- Continued to the message preparation route at `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/communications/queue`. The page already masked linked-dev project, event, guest, and invitation labels; message-history, message-wording, prepare-message, messages-to-send, and prepared-message sections now carry project-specific labels. The browser check found no old internal terms, generic action labels, unlabeled icon actions, or horizontal overflow.
- Continued to the prepared-message detail route at `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/communications/fccb2496-c7c7-4703-8101-ae0d58ec21b1`. The page now uses shared message preview masking, hides seeded/sample WhatsApp links, masks obvious sample phone numbers, and gives navigation plus manual outcome controls message/guest-specific labels. The final browser check found no old internal terms, QA message bodies, dummy phone number, unsafe WhatsApp hrefs, generic action labels, unlabeled icon actions, or horizontal overflow; targeted tests now cover QA body masking, sample WhatsApp-link suppression, and sample-number masking.
- Continued to the commercial controls route at `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/commercial`. The page keeps contract, package, payment, and exception behavior unchanged, but now uses clearer guest-access readiness, price-estimate, service package, access exception, and access-history copy. Project-specific action labels were added for package creation, event-package selection, price estimates, contract generation, payment recording, exceptions, and addendums. The browser check found no old internal terms, generic action labels, unlabeled actions, or horizontal overflow.
- Continued to the project file workflow at `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/files` and the live file detail record `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/files/fad37564-d42c-40a8-8a46-334a12fbd2c8`. The file library now uses clearer retention-schedule, file-record, file-list, and retention-history copy, replaces `Project-level` with `Whole project`, and adds project/file-specific labels for overview, retention, file registration, filters, file rows, download, version, and archive actions. Browser checks found no old internal terms, generic action labels, unlabeled actions, or horizontal overflow on either route.
- Responded to user visual feedback that the `Keepsake messages / Guest book` hero block still felt unfinished. A pattern scan found several pages using the shared `guest-hero` wrapper without the intended `guest-hero-copy` and `guest-hero-actions` child panels. Updated guest book, couple review, feedback, comments, couple dashboard, partner list, partner review, and partner dashboard visible states to use the complete hero structure. Browser verification confirmed each affected route now renders a bordered hero, padded copy panel, and separate action rail with no horizontal overflow.
- Reran `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/guest-wishes/guest-wishes-foundation.test.ts src/lib/partners/partner-foundation.test.ts src/lib/reports/reporting-foundation.test.ts`, the Impeccable detector for the touched route group, a source scan for plain `div className="guest-hero"` patterns, and `git diff --check` for the touched files. Result: all passed; targeted tests reported 3 files passed and 38 tests passed.
- Audited the remaining generic auth hero pattern and updated `/login` plus `/login/mfa` to use a dedicated auth copy panel and action panel instead of a loose split layout. The rendered `/login` HTML now includes `hero-copy` and `hero-panel`, no longer uses a nested `panel` wrapper, and still avoids old environment/setup wording. Reran `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/auth/auth-navigation.test.ts src/lib/auth/mfa-route-guard.test.ts src/app/login/submit-button.test.ts`, and the Impeccable detector for the auth pages and CSS. Result: all passed; targeted tests reported 3 files passed and 19 tests passed.
- Returned to the guest-book feedback after confirming the wrapper-only fix still left the moderation area feeling generic. Added a shared `review-board` pattern with contextual section headers, count chips, clearer empty states, and message/action cards, then applied it to `/platform/projects/[projectId]/guest-book`, `/platform/projects/[projectId]/guest-book/couple-review`, and `/platform/projects/[projectId]/feedback`. The in-app browser verified the open guest-book page now renders hero metadata, two review boards, the message decision card, and no horizontal overflow at the current narrow viewport; couple review and feedback also render review-board empty states without overflow.
- Reran `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/guest-wishes/guest-wishes-foundation.test.ts`, and the Impeccable detector for the touched review-board pages and CSS. Result: all passed; targeted tests reported 1 file passed and 12 tests passed.
- Audited the next generic operational-list pattern on `/platform/dashboard`, `/platform/reports`, and `/platform/audit-logs`. Added a shared `ops-list` treatment with contextual section headers, count chips, structured row metadata, action rails, and stronger empty states, then applied it to recent projects, recent activity, report library, export history, audit export, and activity entries. Browser verification confirmed the three routes now render `ops-list-section`/`ops-row` structures with no old `record-row` usage in those main sections and no horizontal overflow at the current narrow viewport.
- Reran `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/reports/reporting-foundation.test.ts`, and the Impeccable detector for the touched dashboard/report/activity pages and CSS. Result: all passed; targeted tests reported 1 file passed and 11 tests passed.
- Continued the operations-list treatment into `/platform/projects/[projectId]/commercial`. Converted event package selections, payment rows, addendum rows, and access-history rows from the older `record-row` structure to `ops-row`, preserving payment method/status/action details and adding a clearer empty state for manual payments. Browser verification on the linked-dev project confirmed the commercial page now renders four visible `ops-row` records, zero old `record-row` records, and no horizontal overflow at the current narrow viewport.
- Reran `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/contracts/contract-foundation.test.ts`, and the Impeccable detector for the touched commercial page and CSS. Result: all passed; targeted tests reported 1 file passed and 12 tests passed.
- Continued the operations-list treatment into the file workflow. Converted project file rows, project retention history, file-detail version history, access history, archive history, and event-file rows from `record-row`/`task-row` to `ops-row`, with stronger contextual section copy and clearer empty states. Browser verification covered `/platform/projects/[projectId]/files`, `/platform/projects/[projectId]/files/[fileId]`, and `/platform/events/[eventId]/files`; the checked routes now have zero old row classes in the converted sections and no horizontal overflow at the current narrow viewport.
- Reran `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/files/file-foundation.test.ts`, and the Impeccable detector for the touched file routes and CSS. Result: all passed; targeted tests reported 1 file passed and 18 tests passed.
- Responded to the latest guest-book visual feedback by replacing the remaining plain hero action block with a dedicated keepsake preview/action rail on guest book, couple review, and feedback. Continued the same pattern into seating by adding a generic workbench hero, converting seating tables, assigned guests, unassigned guests, and table-card exports from old record/task rows to `ops-row`, adding a `seating-table-card` container, and fixing narrow metric value spacing in shared `detail-grid` summaries.
- Browser verification covered `/platform/projects/[projectId]/guest-book`, `/platform/events/[eventId]/seating`, and `/platform/events/[eventId]/seating/map`. The checked guest-book route now has zero old hero action panels and no horizontal overflow; seating list/map now have zero old `record-row`/`task-row` rows, zero old hero action panels, no horizontal overflow, and separated metric values/descriptions.
- Reran `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/seating/seating-foundation.test.ts src/lib/guest-wishes/guest-wishes-foundation.test.ts`, the Impeccable detector for guest-book/feedback/seating routes plus CSS, and `git diff --check` for the touched files. Result: all passed; targeted tests reported 2 files passed and 25 tests passed. The npm test command still emitted the existing npm argument warnings for `--run`, but Vitest itself passed.
- Continued the same weak-block cleanup into `/platform/events/[eventId]/check-in`. The page now uses the workbench hero with an arrival-status preview, manual check-in guest results use flattened `ops-card` sections, and unexpected-guest plus station rows use structured `ops-row` metadata/action areas. Empty check-in states now use `ops-empty` with a real no-unexpected-guest message instead of rendering a blank list.
- Browser verification covered `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/check-in`. The checked route had zero old `record-row`, `task-row`, `record-list`, `panel-body`, `guest-hero-actions`, or plain `empty-state` classes, rendered 4 `ops-card` and 2 `ops-row` elements from linked-dev data, and had no horizontal overflow.
- Reran `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/check-in/check-in-foundation.test.ts`, the Impeccable detector for the check-in route plus CSS, and `git diff --check` for the touched files. Result: all passed; targeted tests reported 1 file passed and 11 tests passed. The npm test command still emitted the existing npm argument warnings for `--run`, but Vitest itself passed.
- Continued the operations-list cleanup into the project and event overview hubs. `/platform/projects/[projectId]` and `/platform/events/[eventId]` now use `ops-empty`, `ops-list`, and `ops-row` for readiness tasks and empty work-area states instead of the old `empty-state`, `task-list`, and `task-row` blocks.
- Browser verification covered `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c` and `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163`. The checked routes rendered 3 and 2 `ops-row` readiness records respectively, had zero old task/record/empty classes, and had no horizontal overflow.
- Reran `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/projects/project-foundation.test.ts`, the Impeccable detector for the project/event overview routes plus CSS, and `git diff --check` for the touched files. Result: all passed; targeted tests reported 1 file passed and 13 tests passed. `git diff --check` reported only existing Git line-ending warnings for the two touched route files.
- Responded to the latest visual feedback on the `Keepsake messages / Guest book` block by replacing the nested preview-card feel with a purpose-built keepsake note preview, status strip, and action desk on guest book, couple review, and feedback. Continued the same weak-block cleanup into project dashboard events plus partner list/review/dashboard sections by converting old `record-row`, `record-list`, and plain `empty-state` sections to `ops-row`, `ops-list`, and `ops-empty`.
- Browser verification covered `/platform/projects/[projectId]/guest-book`, `/platform/projects/[projectId]/dashboard`, `/platform/partners`, `/platform/partners/review`, and `/platform/partner-dashboard`. The checked routes had zero old `record-row`, `record-list`, `empty-state`, or `keepsake-preview-card` elements, rendered the new keepsake note preview or operations-list treatment as expected, and had no horizontal overflow.
- Reran `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/guest-wishes/guest-wishes-foundation.test.ts src/lib/reports/reporting-foundation.test.ts src/lib/partners/partner-foundation.test.ts`, and the Impeccable detector for the touched route group plus CSS. Result: all passed; targeted tests reported 3 files passed and 38 tests passed.
- Continued the weak-block cleanup into `/platform/partners/[partnerId]` and `/platform/events/[eventId]/check-in/scan`. Partner detail source now uses operations-list sections for linked accounts, partner-created project submissions, and source tracking; live verification remains pending because the current account still has no visible partner profile link. The check-in scan route now uses the workbench hero/action rail and `ops-empty` token-resolution states instead of plain `empty-state` blocks.
- Browser verification covered `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/check-in/scan`; it rendered one workbench hero, one workbench action panel, one operations section, zero old `empty-state`, `record-row`, `task-row`, or `guest-hero-actions` elements, and no horizontal overflow. Source scans confirmed partner detail has no old `record-row`, `record-list`, `task-row`, `task-list`, `empty-state`, `guest-list-section`, `guest-record-details`, or `metadata-label` classes.
- Reran `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/check-in/check-in-foundation.test.ts src/lib/partners/partner-foundation.test.ts`, and the Impeccable detector for the touched route group plus CSS. Result: all passed; targeted tests reported 2 files passed and 26 tests passed.
- Continued the operations-list cleanup into the invitation design workflow. `/platform/events/[eventId]/invitations` now renders event invitation designs as `ops-row` records, and `/platform/events/[eventId]/invitations/[templateId]` now renders preview/file runs plus generated invitations as `ops-row` records instead of the older guest/task row treatment.
- Browser verification covered `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/invitations` and the live design detail record `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/invitations/61993173-1efb-4d18-b7d2-672907320ea8`. The checked routes rendered 1 and 5 operations rows respectively, had zero old `guest-record-row`, `guest-record-list`, `guest-empty-state`, `task-row`, `task-list`, `guest-record-details`, or `metadata-label` elements, and had no horizontal overflow.
- Reran `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/invitations/invitation-foundation.test.ts`, and the Impeccable detector for the touched invitation route group plus CSS. Result: all passed; targeted tests reported 1 file passed and 16 tests passed.
- Continued the operations-list cleanup into the communications workflow. `/platform/projects/[projectId]/communications` now renders recent messages as `ops-row` records, `/platform/projects/[projectId]/communications/queue` renders both waiting messages and prepared-message history as operations-list sections, and `/platform/projects/[projectId]/communications/templates` uses operations-list section framing for the saved-wording library empty state.
- Browser verification covered `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/communications`, `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/communications/queue`, and `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/communications/templates`. The checked routes rendered the expected operations sections, had zero old `guest-record-row`, `guest-record-list`, `guest-empty-state`, `task-row`, or `task-list` elements, and had no horizontal overflow.
- Continued the operations-list cleanup into the guest import workflow. Import history now renders CSV imports as `ops-row` records, import detail uses operations-list sections for import actions and preview rows, and import review renders decision rows inside the shared operations-list structure.
- Browser verification covered `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-imports`, `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-imports/489eaf2e-d8c0-4816-9eb6-9ab867506347`, and `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-imports/489eaf2e-d8c0-4816-9eb6-9ab867506347/review`. The checked routes rendered operations sections and rows, had zero old guest/record/task/empty classes in the import workflow, and had no horizontal overflow.
- Completed the remaining weak-block cleanup outside the guest-book review-board pattern. Workspace/project empty states, RSVP empty state, comments thread, commercial contract empty state, and the main guest list now use `ops-empty`, `ops-list-section`, `ops-list`, or `ops-row` where appropriate.
- Browser verification covered `/platform`, `/platform/projects`, `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests`, `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/rsvps`, `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/comments`, `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/commercial`, and `/login/mfa`. The checked routes had zero old `empty-state`, `guest-empty-state`, `guest-record-row`, `guest-record-list`, `record-row`, `record-list`, `task-row`, or `task-list` elements and no horizontal overflow. The remaining `review-record-list` matches belong to the redesigned guest-book/feedback review-board treatment.
- Reran `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/messages/message-foundation.test.ts src/lib/guest-imports/guest-import-foundation.test.ts src/lib/guests/guest-foundation.test.ts src/lib/rsvp/rsvp-foundation.test.ts src/lib/contracts/contract-foundation.test.ts src/lib/auth/mfa-route-guard.test.ts`, the Impeccable detector for the touched routes plus CSS, global old weak-block source scan, and `git diff --check` for touched route/docs files. Result: formatting, lint, typecheck, detector, and targeted tests passed; tests reported 6 files passed and 78 tests passed. `git diff --check` reported only existing CRLF warnings on the touched communications route files.
- Continued into the file workflow copy polish after a source scan found user-facing `placeholder record` and `placeholder version` language. Project file registration now says `Add file details`, and file detail versioning now says `Record an updated file`; both routes explain that details can be entered now and the file attached later.
- Browser verification covered `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/files` and `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/files/fad37564-d42c-40a8-8a46-334a12fbd2c8`. The checked routes had no `placeholder record`, `placeholder version`, `metadata only`, `source-file`, or `storage provider` copy, rendered operations sections, had zero old row/list/empty classes, and had no horizontal overflow.
- Reran `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/files/file-foundation.test.ts`, the Impeccable detector for the touched file routes plus CSS, a targeted file-workflow copy scan, and `git diff --check` for the touched file routes and QA docs. Result: formatting, lint, typecheck, detector, copy scan, diff whitespace, and targeted file tests passed; the file test reported 1 file passed and 18 tests passed.

Latest focused check-in and commercial copy polish:

- Updated the check-in dashboard and QR confirmation flow so visible staff copy uses invitation QR language consistently: `QR code text`, `QR preview`, `QR reference`, and `QR code could not be resolved`.
- Updated the commercial page form labels so pricing admins see user-facing package/add-on references and amount labels instead of all-caps sample codes or raw `in cents` field names.
- Browser verification covered `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/check-in`, `/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/check-in/scan`, and `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/commercial`; each route had zero old row/list/empty classes, no stale internal copy hits, and no horizontal overflow.
- Reran `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/check-in/check-in-foundation.test.ts src/lib/contracts/contract-foundation.test.ts`, the Impeccable detector for the touched routes plus CSS, targeted stale-copy scans, and `git diff --check`. Result: all passed; targeted tests reported 2 files passed and 23 tests passed.

Latest focused public guest-page polish:

- Replaced the remaining legacy `record-list`, `record-row`, and `empty-state` blocks in the shared public guest page component with structured `ops-list-section`, `ops-row`, and `ops-empty` sections for invitation downloads and guest-message availability.
- Added bilingual guest-page labels for download helper text, secure download actions, file version copy, and message-unavailable helper text so the public page stays aligned with guest preferred language.
- Browser verification covered `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests/4271cbfd-c672-4dde-86d0-aad2406124b9/public-preview`; the rendered public guest view had two structured operations sections, zero old record/empty classes, no stale internal copy hits, and no horizontal overflow.
- Reran `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/rsvp/rsvp-foundation.test.ts`, the Impeccable detector for the touched RSVP files plus CSS, and targeted stale-copy scans. Result: all passed; targeted RSVP tests reported 1 file passed and 12 tests passed.

Latest focused message-wording library polish:

- Replaced the remaining `guest-record-details` / `metadata-label` blocks on `/platform/projects/[projectId]/communications/templates` with structured saved-wording chips for language, version, and message type.
- Browser verification covered `/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/communications/templates`; the rendered route showed three saved-wording cards with chip rows, zero old metadata classes, no stale internal wording, and no horizontal overflow.
- Reran `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test -- --run src/lib/messages/message-foundation.test.ts`, the Impeccable detector for the touched route plus CSS, and targeted stale-copy scans. Result: all passed; targeted messaging tests reported 1 file passed and 16 tests passed.

## Copy And Internal-Term Scan

Visible app copy was scanned for old internal terms such as `Sprint`, `MVP`, `Supabase environment`, `local credentials`, `metadata only`, `source-file`, `storage provider`, `pricing snapshot`, `commercial gesture`, `fr or en`, `old_value`, `new_value`, `deferred`, and `page-heading`.

Remaining matches are internal masking regexes and display-label maps used to prevent old seeded/internal labels from appearing to users:

- `apps/web/src/app/platform/events/[eventId]/dashboard/page.tsx`
- `apps/web/src/app/platform/events/[eventId]/invitations/page.tsx`
- `apps/web/src/app/platform/events/[eventId]/invitations/[templateId]/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/dashboard/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/couple-dashboard/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/comments/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/commercial/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/communications/templates/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/files/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/files/[fileId]/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guest-book/page.tsx`

## Remaining Deployment Items

- User gave final local approval and separate approval to prepare hosted deployment.
- The home visual direction is the strengthened logo/UI-board system. A first generated image option was rejected because it contained readable fake names/status text; a second option avoided readable text, but the app keeps the clearer task-oriented board unless a later screen needs real imagery.
- Optional live-data verification for partner-detail and valid public guest-token pages if suitable records or a safe test token are available.

## Deployment Status

No hosted deployment has been updated yet from this deployment-preparation step.
