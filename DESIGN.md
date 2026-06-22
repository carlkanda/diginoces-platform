---
name: Diginoces Wedding Operations Atelier
description: Current-goal Impeccable context for the local full-application redesign of Diginoces. The previous generic direction is rejected. Rebuild one route at a time with shadcn/ui as the structural component base while preserving behavior.
register: product
colors:
  ink: "#10292e"
  inkSoft: "#36545b"
  canvas: "#f6f8f7"
  surface: "#ffffff"
  surfaceRaised: "#fbfdfc"
  surfaceMuted: "#edf2f1"
  border: "#d6e0df"
  borderStrong: "#b8cac8"
  inputBorder: "#c8dad8"
  primary: "#06343b"
  primaryHover: "#082f35"
  primarySoft: "#e1eeec"
  ceremony: "#a9803d"
  ceremonySoft: "#f3ead8"
  success: "#146c4b"
  successSoft: "#edf8f2"
  warning: "#8a5a12"
  warningSoft: "#fff7e8"
  danger: "#b42318"
  dangerSoft: "#fff3f1"
typography:
  family: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
  pageTitle:
    fontSize: "2rem"
    fontWeight: 760
    lineHeight: 1.15
    letterSpacing: "0"
  sectionTitle:
    fontSize: "1.25rem"
    fontWeight: 720
    lineHeight: 1.25
    letterSpacing: "0"
  componentTitle:
    fontSize: "1rem"
    fontWeight: 680
    lineHeight: 1.3
    letterSpacing: "0"
  body:
    fontSize: "0.9375rem"
    fontWeight: 450
    lineHeight: 1.55
    letterSpacing: "0"
  small:
    fontSize: "0.8125rem"
    fontWeight: 520
    lineHeight: 1.4
    letterSpacing: "0"
  label:
    fontSize: "0.8125rem"
    fontWeight: 680
    lineHeight: 1.25
    letterSpacing: "0"
  mono:
    fontFamily: "SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 650
    lineHeight: 1.35
rounded:
  control: "8px"
  card: "12px"
  panel: "12px"
  pill: "999px"
spacing:
  xxs: "4px"
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "36px"
  xxl: "48px"
components:
  shell:
    sidebarBackground: "{colors.primary}"
    sidebarForeground: "#f7fbfa"
    activeBackground: "rgba(255,255,255,0.10)"
  primaryAction:
    background: "{colors.primary}"
    foreground: "{colors.surface}"
    radius: "{rounded.control}"
  secondaryAction:
    background: "{colors.surface}"
    foreground: "{colors.ink}"
    border: "{colors.border}"
    radius: "{rounded.control}"
  card:
    background: "{colors.surface}"
    foreground: "{colors.ink}"
    border: "{colors.border}"
    radius: "{rounded.card}"
  table:
    headerForeground: "{colors.ink}"
    bodyForeground: "{colors.ink}"
    mutedForeground: "{colors.inkSoft}"
    divider: "{colors.border}"
  badge:
    defaultBackground: "{colors.primarySoft}"
    defaultForeground: "{colors.primary}"
    radius: "{rounded.pill}"
---

# Design System: Diginoces Wedding Operations Atelier

## 1. Reinitialized Context

This design context now serves the current goal only: redo the local Diginoces application UI and UX from scratch, one route at a time.

The previous generic redesign direction is rejected. Do not reuse its visual language, component habits, copy tone, page structure, decorative choices, layout rhythm, or navigation approach unless a route is explicitly reworked and approved under the current workflow.

This is not an active sprint implementation pass. The local redesign has been accepted, and hosted deployment preparation is now approved subject to the post-approval checks, review, hosted build, and hosted verification.

Out-of-band requirement context: `UX-REDESIGN-001` / GitHub issue `#131` covers the French-first bilingual UX simplification, public home refinement, representative protected-surface copy and navigation improvements, and hosted-review preparation on branch `codex/bilingual-ux-simplification-homepage`. This requirement is explicitly separate from Sprint 16 AI Assistance and does not authorize AI, Sprint 17, or later product scope.

Existing source is behavior inventory. Preserve route protection, auth, MFA, Supabase data access, server actions, API contracts, validation, audit behavior, permissions, public-token access, and form field names.

Current approval ladder:

1. Inventory.
2. Route intake recorded.
3. Source rebuilt.
4. Checks passed.
5. Browser verified.
6. User accepted.

## 2. Scene Sentence

Diginoces is used by event operations staff, couples, partners, and event-day crews across laptops, tablets, and phones while coordinating sensitive wedding data, invitations, RSVPs, files, messages, seating, check-in, approvals, reports, and live handoffs.

That scene requires a restrained, high-contrast product interface with stable navigation, calm density, explicit permission cues, touch-safe actions, and copy that helps users act without needing product training.

## 3. Design Thesis

Wedding Operations Atelier.

The product should feel composed, precise, hospitable, and operational. The interface should make a wedding record feel cared for and controlled, not merely stored in an admin dashboard.

Quality references:

- Linear for navigation discipline and low-noise hierarchy.
- Stripe Dashboard for trusted records and permission-sensitive operations.
- Notion database views for approachable structured work.
- Apple Human Interface for familiar controls and touch ergonomics.
- High-end hospitality operations tools for service-minded handoffs.

Anti-references:

- generic SaaS dashboards;
- decorative wedding stationery;
- internal engineering reports;
- dark command-console dashboards;
- repeated identical card grids;
- demo-page component galleries;
- AI-looking gradients, glass panels, bokeh blobs, sketch graphics, and ornamental backgrounds.

## 4. Route Families

### Command Desk

Global and project launchpads. Show orientation, current state, priority queues, and one safe next action.

### Detail Workspace

Weddings, events, guests, invitations, messages, files, partners, commercial controls, and reports. Show identity, status, related navigation, and focused sections.

### Review Queue

Approvals, moderation, import review, preview checks, partner review, and operational exceptions. Use comparable rows, explicit decisions, risk copy, and audit-friendly summaries.

### Guided Form

Creation and setup flows. Group fields, label clearly, preserve field names, show validation guidance, and keep submit/cancel actions stable.

### Public Guest Experience

Guest-facing invitation, RSVP, and message pages. Make them mobile-first, bilingual-ready, invitation-aware, and free of administrative clutter.

### Event-Day Board

Seating, maps, check-in, scanning, and live operations. Use high scan contrast, large touch targets, current state, blockers, and one next action.

### Evidence Surface

Reports, audit history, files, launch readiness, and commercial controls. Use tables, source context, redaction-aware copy, exports, and trust-building empty states.

## 5. Route Intake

Before editing a route, record or infer:

- purpose;
- primary user;
- workflow;
- record or state being controlled;
- risky state or permission boundary;
- safest next action;
- shadcn component choices;
- what the screen teaches a first-time user.

Record the pass in `docs/qa/redesign-rebuild-checklist.md` before moving to another route.

Do not repeat work silently. If a page is revisited, record why: rejected direction, behavior bug, visual issue, accessibility issue, navigation issue, copy issue, browser-review finding, or user feedback.

## 6. shadcn/ui Component Grammar

Project context:

- Next.js App Router.
- React Server Components.
- Tailwind v4.
- shadcn style `base-nova`.
- lucide icons.
- UI alias `@/components/ui`.
- Global tokens in `apps/web/src/app/globals.css`.

Default component map:

- Shell and orientation: `Sidebar`, `Breadcrumb`, `Separator`, `ScrollArea`, `Tooltip`.
- Navigation and discovery: `Tabs`, `Command`, `DropdownMenu`, `Popover`, `Sheet`.
- Actions: `Button`, `AlertDialog`, `Dialog`.
- Records: `Table`, `Badge`, `Empty`, `Skeleton`.
- Forms: `FieldSet`, `FieldGroup`, `Field`, `Input`, `InputGroup`, `Textarea`, `NativeSelect`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `ToggleGroup`, `InputOTP`.
- Guidance: `Alert`, `Card`, `Separator`, `Tooltip`.

Rules:

- Read shadcn docs before unfamiliar component work.
- Use catalog components before custom markup.
- Use full component composition: `CardHeader`, `CardContent`, `CardFooter`, `TableHeader`, `TableBody`, `FieldGroup`, and `Field`.
- Use semantic tokens and component variants before raw color classes.
- Use `gap-*`, not `space-*`, for new layout stacks.
- Use lucide icons only when they improve recognition.
- Keep component vocabulary consistent across pages.

## 7. Color And Identity

Color strategy: restrained product palette.

- Deep teal carries identity, primary actions, active navigation, and selected state.
- Muted gold marks ceremony context and rare premium emphasis. It is not a routine action color.
- White and cool neutral surfaces support long work sessions.
- Green, amber, and red are reserved for state.

Identity anchors:

- `apps/assets/Diginoces_Logo.png`
- `apps/web/public/diginoces-logo.png`

Do not use beige wedding-paper defaults, purple-blue gradients, decorative blobs, glass panels, sketch illustrations, ornamental backgrounds, or gradient text.

## 8. Typography

- Use one sans-serif family.
- Use fixed rem sizes for product UI.
- Do not use viewport-fluid product headings.
- Do not use negative letter spacing.
- Do not repeat tiny uppercase tracked labels above sections.
- Do not use display typography in labels, tables, buttons, or forms.
- Use monospace only for real codes, tokens, identifiers, and technical values.

## 9. Layout And Interaction

- Keep page width, grids, controls, and action placement stable.
- Make primary actions visible but not inflated.
- Wrap long names, labels, phone numbers, codes, and generated tokens safely.
- Preserve mobile action order without clipping.
- Use motion only for state feedback, usually 150ms to 220ms.
- Keep focus states visible.
- Include reduced-motion handling whenever animation exists.

## 10. Copy Standard

Use event operations language: wedding, event, guest list, import, review, invitation, RSVP, message queue, table plan, check-in, file, report, audit trail, approval, readiness, handoff.

Do not use internal delivery words in normal product screens: sprint, foundation, MVP, backlog, issue, PR, implementation, migration, hardening, scaffold, test case.

## 11. Verification Workflow

For every route:

1. Record route purpose, pattern, status, and notes in `docs/qa/redesign-rebuild-checklist.md`.
2. Rebuild source while preserving behavior.
3. Run formatting, linting, typechecking, targeted tests, Impeccable detector, and whitespace checks where appropriate.
4. Record command evidence.
5. Browser-review locally before calling the route approved.

If a route was touched during the rejected direction, it remains unapproved until it passes this current workflow.

## 12. Completion Bar

A page passes only when an authorized first-time user can understand where they are, what the page is for, what state the work is in, which actions their role can take, and where to go next.

If a page could be mistaken for a generic admin dashboard, decorative wedding template, demo component page, or internal build report, it is not done.

## 13. Cross-Route Refinement Primitives

Use these shared patterns before creating one-off route treatments.

### Command Navigation

The authenticated shell includes a shadcn `Command` inside `Dialog` through `WorkspaceCommandMenu`.

- Trigger label: `Search workspace` / `Rechercher`.
- Keyboard shortcut: `Ctrl K` or `Cmd K`.
- Global destinations are always available.
- Wedding shortcuts appear only when the current route contains a valid wedding ID.
- Event-day shortcuts appear only when the current route contains a valid event ID.
- Permission copy must be explicit: opening a destination does not bypass role, MFA, or project access.

### Status And Permission Language

Status labels should describe the user's next interpretation, not database values.

- Good: `Awaiting reply`, `Needs review`, `Ready for handoff`, `Payment access locked`, `Invitation approved`.
- Avoid exposing raw values such as `ready_for_review`, `manual_review`, `payment_gate_locked`, or `is_active` unless the value is a real code the user must copy.
- Permission-limited states should say what is available and who can unlock the next step. Do not imply data does not exist when the user simply lacks access.

### Empty States

Use shadcn `Empty` directly for tiny local gaps. Use the shared `OperationalEmptyState` wrapper for route-level,
workflow-level, permission-limited, or filter-driven empty states.

Every empty state should answer:

- what is empty;
- why that is expected or what caused it;
- the safest next action;
- whether the limit is caused by permissions, filters, waiting for review, or no records yet.

When the user can act, put that action in the empty state. When they cannot act, name the role or workflow that can
unlock it.

### Dense Records

Tables remain appropriate for comparison-heavy work. On narrow screens, prefer route-specific record summaries or allow table text to wrap instead of clipping values.

Table headers are sticky by default for scanning long operational lists. Record rows and workflow surfaces should use
the shared hover/focus treatment in `globals.css`. Do not add decorative shadows or one-off colored side borders.

### Motion

Motion is state feedback only. Shared route surfaces use short transitions through `--motion-fast` and `--ease-state`. Reduced-motion users get near-instant transitions through the global `prefers-reduced-motion` rule.


The redesign passes only after the local app is reviewed route by route, browser-verified, approved, and then prepared for hosted deployment through the documented checks and hosted verification path.
