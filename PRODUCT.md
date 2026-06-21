# Product

## Register

product

## Current Goal

Redo the Diginoces local application UI and UX from scratch as a complete product redesign, one page at a time.

This Impeccable context is reinitialized for the current redesign goal only. It replaces the rejected generic redesign direction and must not inherit that direction's layout habits, visual language, copy tone, component choices, or approval status.

This began as local design work. The local experience has been reviewed and accepted; hosted deployment preparation is now approved and must still pass the post-approval checks, PR review, hosted build, and hosted verification before production promotion.

## Reset Rule

Previous redesign work is inventory only. A route is not approved because it was previously edited, source-rebuilt, or browser-opened.

For every route, restart from its purpose:

- what the page is for;
- who uses it;
- which record or workflow it controls;
- what could go wrong;
- what the safest next action is;
- which shadcn components best serve that job;
- what the screen should teach someone seeing it for the first time.

Preserve behavior while redesigning:

- route paths and route protection;
- Supabase, auth, session, and MFA behavior;
- permission checks and server-side access boundaries;
- form field names, server actions, and API contracts;
- validation, audit logging, and data loading behavior;
- public-token access separation from authenticated app access;
- existing product capability.

## Product Purpose

Diginoces is a secure wedding and event operations platform. It helps authorized teams coordinate weddings, events, guest lists, imports, RSVPs, invitations, message queues, files, partners, commercial controls, seating, check-in, reports, and audit trails.

The redesigned app must help users understand:

- where they are;
- which wedding, event, guest, invitation, message, file, table, partner record, approval, report, or access-control item they are handling;
- what state that work is in;
- what needs attention now;
- what their role allows them to do;
- where to go next.

## Users

- Diginoces administrators who manage sensitive access, approvals, evidence, commercial controls, and launch readiness.
- Operations managers who move across many weddings and events while preserving permission boundaries.
- Client-facing staff who prepare guest lists, invitations, messages, files, seating, and event-day handoffs.
- Bride and groom users who need respectful, low-noise screens for guest lists, RSVP state, uploads, and wedding progress.
- Event-day teams who need fast, touch-safe pages for seating, check-in, scanning, and live exceptions.
- Partners and support roles who need narrow workflows with clear limits and safe next steps.

## Working Scene

Users coordinate real weddings under time pressure on laptops, tablets, and phones. They work with sensitive people data, long names, multilingual labels, permission-limited records, live-event states, and operational handoffs.

The product must feel calm enough to trust, structured enough for serious work, and hospitable enough to fit the event-service context.

## Design North Star

Wedding Operations Atelier.

Diginoces should feel precise, composed, practical, and service-minded. It should compete with leading functional product systems without becoming a generic admin dashboard or decorative wedding template.

Use references as operating principles, not skins:

- Linear for navigation discipline and quiet hierarchy.
- Stripe Dashboard for trusted records, permission-sensitive workflows, and operational state.
- Notion database views for approachable structured work and useful empty states.
- Apple Human Interface for familiar controls and touch ergonomics.
- High-end hospitality operations tools for handoff clarity.

The design language must be Diginoces-owned: deep teal identity, measured ceremony accents, strong information scent, calm density, clear status grammar, and user-facing copy that helps real people finish work.

## Anti-References

Do not make Diginoces look or sound like:

- a generic SaaS admin template;
- a decorative wedding stationery site;
- an internal engineering report;
- a dark command console;
- a repeated grid of identical cards;
- a shadcn demo page;
- an AI-generated app skin.

Avoid decorative gradients, glass panels, beige wedding-paper defaults, bokeh or blob backgrounds, sketch illustrations, ornamental icons, inflated hero cards, repeated metric grids, and page copy that explains the build instead of the user task.

## Design Principles

### Purpose Before Layout

Start every page from its job: user, record, workflow, state, risk, and next action. The visual structure follows that job.

### Navigation Teaches The Product

Breadcrumbs, side navigation, tabs, filters, row actions, related links, and empty states should make the product structure understandable to a first-time user.

### Calm Operational Density

Use tables, queues, grouped forms, compact summaries, and stateful empty screens when users need to compare and act. Use cards only for real units of work. Do not nest cards.

### Permissions Are Visible And Safe

Backend checks remain the source of truth. The UI should make role limits understandable without exposing data the user should not see.

### Hospitality In The Copy

Use warm, direct event-operations language. Product screens should say wedding, event, guest list, import, review, invitation, RSVP, message queue, table plan, check-in, file, report, audit trail, approval, readiness, and handoff.

Do not use internal delivery words in normal product screens: sprint, foundation, MVP, backlog, issue, PR, implementation, migration, hardening, scaffold, or test case.

## Page Workflow

Before editing any route:

1. Record route purpose.
2. Record primary user and workflow.
3. Record the controlled record or state.
4. Record the risky state or permission boundary.
5. Record the safest next action.
6. Choose the shadcn components that best fit the job.
7. Decide what the screen should teach a first-time user.
8. Update `docs/qa/redesign-rebuild-checklist.md`.

After editing any route:

1. Confirm behavior and security contracts are preserved.
2. Replace internal build wording with user-facing language.
3. Run focused checks.
4. Run the Impeccable detector.
5. Browser-review locally before calling the route approved.
6. Record evidence in `docs/qa/redesign-rebuild-checklist.md`.

Approval language is strict:

- `Inventory`: route exists or was touched before the current reset.
- `Route intake recorded`: purpose, user, workflow, state, risk, next action, and component choices are recorded.
- `Source rebuilt`: code changed, but the experience is not approved yet.
- `Checks passed`: focused checks and detector output are recorded.
- `Browser verified`: route rendered locally at relevant viewport sizes and preserved behavior.
- `User accepted`: user reviewed the route and approved the direction.

## shadcn/ui Contract

Use shadcn/ui as the structural grammar for the redesign.

- Shell and orientation: `Sidebar`, `Breadcrumb`, `Separator`, `ScrollArea`, `Tooltip`.
- Navigation and discovery: `Tabs`, `Command`, `DropdownMenu`, `Popover`, `Sheet`.
- Actions: `Button`, `AlertDialog`, `Dialog`.
- Records: `Table`, `Badge`, `Empty`, `Skeleton`.
- Forms: `FieldSet`, `FieldGroup`, `Field`, `Input`, `InputGroup`, `Textarea`, `NativeSelect`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `ToggleGroup`, `InputOTP`.
- Guidance: `Alert`, `Card`, `Separator`, `Tooltip`.

Read shadcn documentation before using unfamiliar components or changing component composition. Use catalog components before custom markup. Use semantic tokens and variants before raw color classes.

## Accessibility And Inclusion

The redesign must support:

- WCAG AA contrast;
- visible keyboard focus;
- semantic headings;
- touch-safe controls;
- reduced motion;
- long guest, wedding, event, couple, and partner names;
- phone numbers, codes, and tokens;
- French and English labels;
- mobile layouts without clipping or overlap;
- status that does not depend on color alone;
- clear empty, loading, warning, blocked, and permission-limited states.

## Identity

Use the Diginoces logo as the identity anchor:

- `apps/assets/Diginoces_Logo.png`
- `apps/web/public/diginoces-logo.png`

Generated imagery is optional and must clarify a specific workflow or guest-facing moment. Do not add generic wedding stock, ornamental illustrations, or decoration that competes with task clarity.
