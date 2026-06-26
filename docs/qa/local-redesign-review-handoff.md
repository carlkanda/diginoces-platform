# Local Redesign Review Handoff

Date: 2026-06-21

Branch: `codex/bilingual-ux-simplification-homepage`
Status: Local redesign is accepted. Hosted deployment preparation is approved.

## Current Status

- The authoritative checklist is `docs/qa/redesign-rebuild-checklist.md`.
- Route table status: 50 browser-verified routes, 0 blocked routes.
- Latest full local sweep passed after the MFA/public guest blockers, readiness-check hardening, and copy refinements were resolved.
- Remaining gate: clean branch packaging, hosted build, and hosted verification before production promotion.

## Design Direction To Review

Diginoces now uses a restrained product interface for wedding operations:

- deep teal identity with measured ceremony-gold accents;
- shadcn/ui as the component grammar;
- dense but readable operational pages;
- clear breadcrumb/sidebar navigation;
- user-facing event, guest, RSVP, invitation, message, file, partner, report, and audit copy;
- no normal product-screen wording such as sprint, backlog, PR, implementation, migration, or scaffold.

## Suggested Review Path

Start with the route families below instead of checking every route in file order.
Record acceptance or requested changes in `docs/qa/local-redesign-user-acceptance-checklist.md`.
Use `docs/qa/local-redesign-route-review-pack.md` as the full route-by-route review pack.
Use `docs/qa/local-redesign-review-session-guide.md` for concrete local URLs and safe linked-dev record IDs.

1. Public and auth surfaces:
   - `/`
   - `/login`
   - `/login/mfa`
   - `/g/[guestToken]` through the already verified dev guest token flow

2. Workspace orientation:
   - `/platform`
   - `/platform/projects`
   - `/platform/projects/[projectId]`
   - `/platform/projects/[projectId]/dashboard`

3. Guest and RSVP work:
   - guest list
   - guest create/edit
   - staff public preview
   - RSVP summary
   - guest imports
   - guest book and couple review

4. Invitation, messaging, and files:
   - event invitations list/new/detail
   - communications templates, queue, and message detail
   - project and event files

5. Event-day operations:
   - seating list
   - seating map
   - check-in desk
   - QR scan flow

6. Management and evidence:
   - reports
   - audit logs
   - partner directory
   - partner review
   - partner profile detail
   - commercial workspace

## Latest Checks

Recorded in `docs/qa/redesign-rebuild-checklist.md`:

- `npm run redesign:check`
- `npm run redesign:design-system-check`
- `npm run redesign:check:approval` must pass after final local approval is checked in `docs/qa/local-redesign-user-acceptance-checklist.md`
- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- Impeccable detector over product/design context, app routes, and checklist
- route-table parser
- stale QA evidence guard
- product-copy scan
- `git diff --check`

Known note: `git diff --check` reports only existing LF/CRLF warnings.

Final local approval is recorded. Follow `docs/qa/local-redesign-post-approval-runbook.md` before preparing or promoting any hosted deployment.

The requirement-level completion audit is `docs/qa/local-redesign-completion-audit.md`; it records local acceptance and the strict approval gate.

## Dev QA Data Created During Review

Dev-only QA records were created to unblock local visual verification:

- one partner profile for partner detail-route verification;
- one public guest-page token for the approved dev guest;
- one QA auth user, `qa-mfa-redesign@example.com`, with verified TOTP for the MFA OTP branch.
- global `diginoces_admin`, global `operations_manager`, and project-scoped `operations_manager` role assignments for `carlkanda@gmail.com`, so the local review account can access admin and operations pages during linked-dev review.

No passwords, MFA secrets, Supabase keys, or public guest tokens are recorded in this repository.

If the browser still shows an older access state, sign out and sign back in so the local session picks up the current dev role assignment.

## Approval Rule

Hosted deployment preparation is approved because the local review is accepted.

The strict approval gate is `npm run redesign:check:approval`. It must pass after both final approval boxes are checked in `docs/qa/local-redesign-user-acceptance-checklist.md`.

If a page feels generic, unclear, hard to navigate, or inconsistent with the wedding operations direction, record the route and issue in `docs/qa/redesign-rebuild-checklist.md` before changing source so the work does not become repetitive.
