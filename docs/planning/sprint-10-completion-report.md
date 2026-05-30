# Sprint 10 Completion Report - Contracts, Pricing & Payment Controls

## Sprint Status

Implemented and ready for draft PR review.

Sprint 10 is not marked merged or production-complete in this report. The implementation, tests, checks, documentation, and PR traceability are documented here for review.

## Traceability

- GitHub issue: `#26` - Sprint 10 - Contracts, Pricing & Payment Controls
- Branch: `codex/sprint-10-contracts-pricing-payments`
- PR title: `Sprint 10 - Contracts, Pricing & Payment Controls`
- Sprint plan: `docs/planning/sprint-10-plan.md`

## Requirement IDs Covered

- `PAY-001` - one project-level contract generation foundation.
- `PAY-002` - in-app contract display and checkbox approval foundation.
- `PAY-003` - one couple-member approval foundation, with bride/groom permission grants.
- `PAY-004` - no in-app negotiation workflow was added.
- `PAY-005` - addendum table and create foundation for major scope/price changes.
- `PAY-006` - Diginoces-managed service package and add-on foundation.
- `PAY-007` / `PROJ-006` - event-level package/add-on selection while keeping one project contract.
- `PAY-008` - USD-only all-inclusive pricing, no tax/VAT or multi-currency fields.
- `PAY-009` - planned guest count pricing calculation.
- `PAY-010` - planned guest count increase represented as addendum-required path.
- `PAY-011` - planned guest count decrease does not automatically reduce price.
- `PAY-012` - commercial gesture/discount with required reason and audit trigger.
- `PAY-013` - manual payment recording and confirmation foundation.
- `PAY-014` / `RSVP-002` / `MSG-004` - payment gate updates the existing guest public page and invitation-sending gate status.
- `PAY-015` - payment exception override with reason, amount paid, balance, optional conditions, and audit trigger.
- `ROLE-002` - admin role gets full Sprint 10 commercial control.
- `ROLE-004` - partner role receives no pricing, revenue, payment, exception, or contract-control grants.
- `REP-006` - audit triggers/actions added for commercial objects.
- `TECH-004` - backend permission checks added in RLS, RPCs, API routes, and server actions.

## Backlog Items Covered

The issue lists conceptual `FEAT-PAY-001` through `FEAT-PAY-011`. The current CSV backlog groups Sprint 10 under these actual rows:

- `EPIC-PAY` - Contracts, Pricing & Payment Controls.
- `FEAT-PAY-001` - Packages and pricing.
- `FEAT-PAY-002` - Contract approval.
- `FEAT-PAY-003` - Addendums and guest-count changes.
- `FEAT-PAY-004` - Manual payments and gates.
- `STORY-PAY-001` - Admin creates packages and add-ons.
- `STORY-PAY-002` - Groom approves contract in app.
- `STORY-PAY-003` - Admin records payment and unlocks sending.
- `TASK-PAY-001` - Create package/pricing schema.
- `TASK-PAY-002` - Build contract approval flow.
- `TEST-PAY-001` - Admin controls packages only.
- `TEST-PAY-002` - Contract approval unlocks guest lists.
- `TEST-PAY-003` - Full payment unlocks sending.

## Files Created Or Changed

Created:

- `apps/web/src/app/api/projects/[projectId]/commercial/route.ts`
- `apps/web/src/app/api/projects/[projectId]/commercial/contracts/route.ts`
- `apps/web/src/app/api/projects/[projectId]/commercial/packages/route.ts`
- `apps/web/src/app/api/projects/[projectId]/commercial/payments/route.ts`
- `apps/web/src/app/platform/projects/[projectId]/commercial/actions.ts`
- `apps/web/src/app/platform/projects/[projectId]/commercial/page.tsx`
- `apps/web/src/lib/contracts/contract-api.ts`
- `apps/web/src/lib/contracts/contract-db.ts`
- `apps/web/src/lib/contracts/contract-foundation.test.ts`
- `apps/web/src/lib/contracts/contract-gates.ts`
- `apps/web/src/lib/contracts/contract-service.ts`
- `docs/planning/sprint-10-completion-report.md`
- `supabase/migrations/20260530225545_sprint_10_contracts_pricing_payments.sql`

Changed:

- `AGENTS.md`
- `README.md`
- `apps/web/src/app/api/health/route.ts`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guests/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guests/new/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guests/[guestId]/page.tsx`
- `apps/web/src/app/platform/projects/[projectId]/guests/actions.ts`
- `apps/web/src/lib/audit/audit-log.ts`
- `apps/web/src/lib/security/permissions.ts`
- `docs/setup/local-development.md`

## Database Migration Added

Added `supabase/migrations/20260530225545_sprint_10_contracts_pricing_payments.sql`.

The migration adds:

- commercial enums for packages, selections, pricing, contracts, addendums, payments, exceptions, gestures, and guest-list access;
- `service_packages`;
- `service_package_addons`;
- `project_event_package_selections`;
- `pricing_calculations`;
- `contracts`;
- `contract_approvals`;
- `contract_addendums`;
- `payments`;
- `payment_exceptions`;
- `commercial_gestures`;
- `payment_gate_events`;
- `wedding_projects` contract/payment gate columns;
- updated-at triggers, audit triggers, indexes, grants, RLS policies, permission rows, and role-permission grants;
- private/public RPCs for contract approval, payment balance, and payment gate refresh.

The migration is not applied to the linked dev database in this PR. `supabase db push --linked --dry-run` reports it as the single pending migration.

## Package And Pricing Behavior Implemented

- Admin/package-manager-controlled service package and add-on creation.
- Event-level package and add-on selection with planned guest count.
- Deterministic USD pricing calculation from package mode, add-ons, planned guest count, and active commercial gestures.
- Pricing snapshots can be stored for a project.
- Partner roles receive no package/pricing/revenue permissions.

## Contract Generation And Approval Behavior Implemented

- One contract is generated at project level, covering all selected event packages and add-ons.
- Contract version, number, rendered markdown, pricing snapshot, package snapshot, final amount, and latest flag are stored.
- In-app approval requires an explicit checkbox and confirmation text.
- Contract approval records approver/timestamp/confirmation and unlocks the guest-list gate.
- Contract negotiation and e-signature provider flows were not added.

## Addendum Behavior Implemented

- Addendum table and create foundation are present.
- Guest-count increase is represented in service logic as an addendum-required path.
- Guest-count decrease after approval is represented as no automatic price reduction.
- Addendum approval/rejection detail workflows remain a follow-up.

## Payment Recording And Balance Behavior Implemented

- Manual off-platform payment records can be created.
- Payments can be confirmed by authorized users.
- Balance calculation includes approved contract amount, approved addendums, confirmed payments, and active payment exceptions.
- Online payment processing was not added.

## Payment Gate Behavior Implemented

- Payment balance RPC evaluates `locked`, `payment_confirmed`, and `exception_override`.
- Refreshing the payment gate updates the existing `wedding_projects.guest_page_access_status` used by Sprint 5 public guest pages and Sprint 7 invitation/message readiness checks.
- Gate transitions are recorded in `payment_gate_events`.

## Payment Exception Behavior Implemented

- Authorized users can create payment exceptions with reason, amount paid at approval, remaining balance, optional conditions, and optional expiry.
- Exceptions refresh the guest-facing payment gate.
- Partners cannot approve exceptions.

## Revenue Visibility Behavior Implemented

- Pricing/payment/revenue details require explicit Sprint 10 permissions.
- `revenue.read`, `payments.read`, `payments.record`, `payments.confirm`, `payment_exceptions.manage`, and `commercial_gestures.manage` are not granted to partner roles.
- Couples can read contracts and payment summaries, not internal payment rows, commercial gestures, or exception records.

## Audit-Log Behavior Implemented

Audit triggers and TypeScript action names were added for:

- packages and add-ons;
- event package selections;
- pricing calculations;
- contract generation and approval;
- contract approvals;
- addendums;
- payments;
- payment exceptions;
- commercial gestures;
- payment gate events.

Audit snapshots are redacted for commercial amount-heavy fields before entering the audit log.

## Tests Added

Added `apps/web/src/lib/contracts/contract-foundation.test.ts`.

Coverage includes:

- USD all-inclusive package/add-on/planned-guest pricing;
- commercial gesture discounts;
- admin/internal vs partner/couple permission boundaries;
- one project-level contract generation;
- checkbox/confirmation contract approval;
- guest-count increase addendum path;
- no automatic price reduction on guest-count decrease;
- manual payment balance and gate decisions;
- payment exception gate override;
- migration and audit-action evidence.

## Commands Run

- `npm.cmd run format`
- `npm.cmd run lint` - passed.
- `npm.cmd run typecheck` - passed.
- `npm.cmd run test -- --run src/lib/contracts/contract-foundation.test.ts` - passed, 8 tests.
- `npm.cmd ci` - passed, 0 vulnerabilities reported by install audit.
- `npm.cmd run format:check` - passed.
- `npm.cmd run lint` - passed.
- `npm.cmd run typecheck` - passed.
- `npm.cmd run test` - passed, 11 files and 112 tests.
- `npm.cmd run build` - passed.
- `npm.cmd audit --omit=dev` - passed, 0 vulnerabilities.
- `npx.cmd supabase@latest db --help` - run before database commands per Supabase CLI guidance.
- `npx.cmd supabase@latest db lint --help` - run before lint command.
- `npx.cmd supabase@latest db push --help` - run before dry-run command.
- `npm.cmd run db:lint` - passed, no schema errors found on linked schemas.
- `npx.cmd supabase@latest db push --linked --dry-run` - passed; would push `20260530225545_sprint_10_contracts_pricing_payments.sql`.
- `git diff --check` - passed; only Git line-ending warning for `AGENTS.md`.
- Targeted secret scan with `rg` - no real secrets found. Matches were expected documentation warnings and SQL grants to the Postgres `service_role` role.

## Checks Passed Or Failed

Passed:

- install;
- formatting;
- lint;
- typecheck;
- tests;
- build;
- production audit;
- Supabase linked schema lint;
- Supabase linked migration dry-run;
- whitespace check;
- targeted secret scan.

Failed:

- None remaining.

## Security Checks Performed

- Confirmed no `.env` or `.env.local` files were added.
- Confirmed no Supabase service-role key, database password, WhatsApp token, Google secret, private key, API secret, real client data, real couple data, or real guest data was added.
- Confirmed commercial operations are permission-gated in server actions/API helpers and backed by RLS/RPC checks.
- Confirmed package read API now explicitly requires service package read/manage permission instead of relying only on hidden UI or RLS filtering.
- Confirmed guest-list contract gate fails closed unless project status is `contract_approved`.
- Checked Supabase changelog during implementation. The current Data API table-exposure behavior reinforces the explicit grant plus RLS approach used in the migration.

## Assumptions Made

- Sprint 10 applies the migration after PR review/merge, not directly during the feature PR.
- The CSV backlog is authoritative for actual feature IDs, so Sprint 10 maps to `FEAT-PAY-001` through `FEAT-PAY-004`.
- USD-only all-inclusive pricing is sufficient for version 1.
- Source-of-truth payment processing remains outside the app; the platform records and confirms manual/off-platform payments.
- Contract PDF export, e-signature, online payment, tax/VAT, multi-currency, partner commission, and full reporting remain future work.

## Open Issues Or Blockers

- The Sprint 10 migration is pending and should be applied to the linked dev project after PR review/merge.
- Generated Supabase TypeScript database types were not regenerated because the new migration is not yet applied to the linked database. Sprint 10 code uses explicit local row types and untyped Supabase calls for the new tables until the migration is applied.
- Addendum approval/rejection UI is foundation-only; full approval lifecycle can be expanded later if needed.
- Package update/deactivation UI is foundation-only; creation and selection are implemented.

## Out-Of-Scope Items Intentionally Deferred

- Online payment processing.
- Tax/VAT handling.
- Multi-currency pricing.
- Partner commission management.
- Full reports/dashboard module.
- Post-event workflows.
- E-signature provider integration.
- Contract negotiation workflow.
- Partner project creation.

## Recommended Sprint 11 Scope

Sprint 11 should build dashboard and reporting foundations over the Sprint 1-10 data:

- global dashboard foundation;
- project dashboard foundation;
- event dashboard foundation;
- couple dashboard foundation;
- payment summary widgets without exposing partner revenue;
- RSVP/invitation/seating/check-in summary widgets;
- audit-log viewer foundation;
- export/report framework;
- role-based dashboard visibility.
