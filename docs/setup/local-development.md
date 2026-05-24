# Local Development

## Scope

This guide covers the Sprint 1 foundation setup for issue `#1`, the Sprint 2 project/event foundation for issue `#3`, the Sprint 3 guest-management foundation for issue `#5`, the Sprint 4 CSV guest import and approval workflow for issue `#7`, the Sprint 5 RSVP/public guest page foundation for issue `#10`, the Sprint 6 invitation template/PDF generation foundation for issue `#12`, the Sprint 7 guided WhatsApp communication workflow for issue `#21`, and the Sprint 8 tables/seating/print-materials foundation for issue `#23`. It does not include Excel import, production WhatsApp API sending, unofficial WhatsApp Web automation, check-in, contracts, pricing, payments, partner project creation, automatic duplicate merging, full Canva API integration, full print partner workflow, or full dashboards.

## Prerequisites

- Node.js `20.9.0` or newer. The local checks were run with Node `24.15.0`.
- npm. On this Windows environment, `npm.cmd` was required because PowerShell script execution blocked `npm.ps1`.
- Docker, if you want to run the local Supabase stack. The Sprint 1 database lint check can run against a linked Supabase dev project without Docker.

## Install

```bash
npm install
```

## Environment

Copy the template and fill in local values:

```bash
cp .env.example .env.local
```

Never commit `.env`, `.env.local`, Supabase service-role keys, database passwords, WhatsApp tokens, Google secrets, or private client data.

Required web variables:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_placeholder
```

The web app intentionally uses the Supabase publishable key. Do not expose a service-role key through any `NEXT_PUBLIC_` variable.

## Web App

Start the app:

```bash
npm run dev
```

Default local URL:

```text
http://127.0.0.1:3000
```

Useful checks:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm audit --omit=dev
```

The health endpoint is available at:

```text
http://127.0.0.1:3000/api/health
```

Sprint 2 project/event foundation routes:

```text
http://127.0.0.1:3000/platform/projects
http://127.0.0.1:3000/api/projects
http://127.0.0.1:3000/api/projects/{projectId}
http://127.0.0.1:3000/api/projects/{projectId}/events
http://127.0.0.1:3000/api/events/{eventId}
```

Sprint 3 guest-management foundation routes:

```text
http://127.0.0.1:3000/platform/projects/{projectId}/guests
http://127.0.0.1:3000/platform/projects/{projectId}/guests/new
http://127.0.0.1:3000/platform/projects/{projectId}/guests/{guestId}
http://127.0.0.1:3000/api/projects/{projectId}/guests
http://127.0.0.1:3000/api/guests/{guestId}
```

The project, event, and guest API routes require a Supabase-authenticated session. Mutations also call backend permission RPCs before writing and are protected by database RLS. The Sprint 2 project and event detail pages also call the read permission RPCs before rendering records.

Sprint 4 guest-import foundation routes:

```text
http://127.0.0.1:3000/platform/projects/{projectId}/guest-imports
http://127.0.0.1:3000/platform/projects/{projectId}/guest-imports/new
http://127.0.0.1:3000/platform/projects/{projectId}/guest-imports/{importId}
http://127.0.0.1:3000/platform/projects/{projectId}/guest-imports/{importId}/mapping
http://127.0.0.1:3000/platform/projects/{projectId}/guest-imports/{importId}/review
http://127.0.0.1:3000/api/projects/{projectId}/guest-imports
http://127.0.0.1:3000/api/projects/{projectId}/guest-imports/{importId}
http://127.0.0.1:3000/api/projects/{projectId}/guest-imports/{importId}/mapping
http://127.0.0.1:3000/api/projects/{projectId}/guest-imports/{importId}/submit
http://127.0.0.1:3000/api/projects/{projectId}/guest-imports/{importId}/review
http://127.0.0.1:3000/api/projects/{projectId}/guest-imports/{importId}/apply
```

Sprint 4 accepts CSV content only. Uploaded source files are not persisted; the app stores parsed row JSON, mapping JSON, source filename, and source file type metadata in Supabase. Bride and groom imports remain staged until an authorized Diginoces/admin or operations user reviews rows and applies approved rows into `guests`.

Sprint 5 RSVP and public guest page foundation routes:

```text
http://127.0.0.1:3000/g/{guestPublicToken}
http://127.0.0.1:3000/platform/projects/{projectId}/rsvps
http://127.0.0.1:3000/platform/projects/{projectId}/guests/{guestId}/public-preview
http://127.0.0.1:3000/api/projects/{projectId}/rsvps/summary
http://127.0.0.1:3000/api/projects/{projectId}/guests/{guestId}/public-token
```

Public guest tokens are generated through the authenticated admin/operations API endpoint and stored only as hashes in Supabase. The raw token is returned once to the authorized caller. Public page resolution, RSVP submission, and internal preview are handled through permission-gated Supabase RPCs and RLS-backed tables.

Sprint 5 RSVP behavior:

- Public guest pages stay locked while `wedding_projects.guest_page_access_status` is `locked`.
- Diginoces/admin and operations users can preview the guest page without unlocking the public page.
- Public RSVP is event-specific and supports `yes`, `no`, and `maybe`.
- Guests can RSVP only to events assigned to their guest record.
- RSVP deadlines route late responses into manual review instead of silently overwriting operational state.
- Printed-only guests remain a manual RSVP workflow.
- Sprint 6 implements invitation generation foundation with a PDF worker abstraction and metadata persistence; full production PDF composition and sending, WhatsApp sending, seating, and check-in are deferred to later sprints. See `docs/planning/sprint-6-completion-report.md` for details.

Sprint 6 invitation template and PDF generation foundation routes:

```text
http://127.0.0.1:3000/platform/events/{eventId}/invitations
http://127.0.0.1:3000/platform/events/{eventId}/invitations/new
http://127.0.0.1:3000/platform/events/{eventId}/invitations/{templateId}
http://127.0.0.1:3000/api/events/{eventId}/invitation-templates
http://127.0.0.1:3000/api/invitation-templates/{templateId}/fields
http://127.0.0.1:3000/api/invitation-templates/{templateId}/preview
http://127.0.0.1:3000/api/invitation-templates/{templateId}/approve
http://127.0.0.1:3000/api/invitation-templates/{templateId}/generate
```

Sprint 6 registers Canva-exported PDF template metadata, stores dynamic field coordinates, supports technical preview generation through a tested PDF worker abstraction, gates preview approval and batch generation with backend permissions, and records invitation/job/file-version metadata in Supabase. The public guest page QR/link field uses Sprint 5 `guest_public_page` tokens; future check-in tokens remain separate and inactive until the check-in sprint.

Sprint 7 WhatsApp communication workflow foundation routes:

```text
http://127.0.0.1:3000/platform/projects/{projectId}/communications
http://127.0.0.1:3000/platform/projects/{projectId}/communications/templates
http://127.0.0.1:3000/platform/projects/{projectId}/communications/queue
http://127.0.0.1:3000/platform/projects/{projectId}/communications/{messageLogId}
http://127.0.0.1:3000/api/projects/{projectId}/messages/templates
http://127.0.0.1:3000/api/projects/{projectId}/messages/prepare
http://127.0.0.1:3000/api/projects/{projectId}/messages/{messageLogId}/status
```

Sprint 7 is guided-manual first. It prepares WhatsApp messages, builds `wa.me` links, records staff status changes, and keeps a credential-free API-ready adapter for future official provider work. It does not automate WhatsApp Web and does not require production WhatsApp API credentials. Readiness checks use the existing payment/public-page gate, generated invitation record, active invitation file, event assignment, public guest page link, and guest WhatsApp number. Printed-only guests remain manual.

Sprint 8 tables, seating, and print-materials foundation routes:

```text
http://127.0.0.1:3000/platform/events/{eventId}/seating
http://127.0.0.1:3000/platform/events/{eventId}/seating/map
http://127.0.0.1:3000/api/events/{eventId}/seating
```

Sprint 8 stores event-specific tables, optional seat/mixed-mode structure, active table assignments, seating export records, and printed invitation status foundation in Supabase. The seating page calculates RSVP-aware occupancy: `no` RSVP responses remain in assignment history but are excluded from active capacity counts, while `yes`, `maybe`, and pending/review states remain included. Authorized users can create individual or bulk tables, assign invited guests, remove assignments, view unassigned active guests, and generate table-card CSV exports for Canva Bulk Create. Table assignment changes mark generated/sent invitations as `needs_regeneration` only when the event invitation template uses table fields. The visual seating map is a placeholder/foundation, not advanced drag-and-drop. Check-in, automatic PDF regeneration, print partner workflows, and direct Canva API integration remain out of scope.

## Supabase

The project has been initialized with Supabase CLI metadata in `supabase/config.toml`.

The current CLI help was checked for these command groups:

```bash
npx supabase@latest --help
npx supabase@latest migration --help
npx supabase@latest db --help
```

To start a local Supabase stack when Docker is available:

```bash
npx supabase@latest start
```

To apply local migrations to the local database:

```bash
npx supabase@latest db reset
```

To link an authenticated Supabase CLI session to a dev project:

```bash
npx supabase@latest link --project-ref <project-ref>
```

To apply pending migrations to the linked dev project:

```bash
npx supabase@latest db push --linked --dry-run
npx supabase@latest db push --linked --yes
```

To lint the linked database schema without a local Docker stack, use the pinned Supabase CLI dev dependency:

```bash
npm run db:lint
```

To create future migrations, use the CLI instead of inventing filenames:

```bash
npx supabase@latest migration new descriptive_name
```

## Known Local Notes

- `npx supabase@latest db lint` without flags targets the local database and still requires a local database on `127.0.0.1:54322`.
- `npm run db:lint` uses `supabase db lint --linked --schema public,app_private --fail-on error` and does not require Docker once the CLI is authenticated and linked.
- The linked lint path still requires access to the developer's Supabase CLI login. In sandboxed environments, grant the command access or set `SUPABASE_ACCESS_TOKEN` outside the repository.
- The Sprint 1 migration enables RLS on all foundation tables and keeps audit logs append-only.
- The Sprint 2 migration enables RLS on project, event, project member, event member, and workflow task tables.
- Sprint 2 project/event creation is audited by database triggers. API handlers use the authenticated user's Supabase session and do not require Supabase service-role secrets.
- The Sprint 3 migration enables RLS on guest title/type, guest tag, guest, guest event assignment, guest tag assignment, and duplicate candidate tables.
- Sprint 3 guest creation and updates are audited by database triggers with guest PII redacted from audit snapshots. API handlers and RLS enforce bride/groom/both side permissions.
- The Sprint 4 migration enables RLS on guest import sessions, rows, and mappings. Import actions are audited by database triggers with raw row data, mapped fields, mapping JSON, validation details, duplicate details, and review notes redacted from audit snapshots.
- Sprint 4 apply actions use a permission-gated Supabase RPC to create approved guest records and event/tag assignments atomically within the database transaction.
- The Sprint 5 migration enables RLS on public guest tokens and event-specific RSVP records. Public tokens are stored as SHA-256 hashes only, and public page access/RSVP actions are audited by RPCs and audit triggers.
- Sprint 5 public RSVP RPCs are callable without a signed-in Supabase user only through token resolution and guest-scoped checks. Admin/operations preview, token generation, token revocation, and RSVP summary remain authenticated and permission-gated.
- The Sprint 6 migration enables RLS on invitation templates, template fields, generation jobs, job items, invitation records, and invitation files. Template source filename, storage path, checksum, and error messages are redacted from invitation audit snapshots.
- Sprint 6 stores generated file metadata and app-owned storage paths, while the storage adapter remains fail-closed until a real provider is configured.
- The Sprint 7 migration enables RLS on message templates, message logs, message queue items, and message status events. Message audit snapshots redact rendered bodies, target WhatsApp numbers, manual WhatsApp URLs, and external provider identifiers.
- Sprint 7 uses guided manual WhatsApp links and status tracking only. Real WhatsApp API credentials, unofficial WhatsApp Web automation, automatic sending, seating, check-in, contracts, pricing, payments, and partner features are intentionally out of scope.
- The Sprint 8 migration enables RLS on event tables, table seats, guest table assignments, and seating export files. Seating assignment RPCs enforce backend permissions, event membership, project/event/table/guest compatibility, and bride/groom side boundaries before writing.
- Sprint 8 seating export audit snapshots redact CSV content. CSV export records store metadata and storage-path placeholders for the app-owned storage foundation; direct Canva API integration and print partner workflow are intentionally out of scope.
- A historical PR `#17` WSL CodeRabbit full-diff review failed with `TRPCClientError` even when `coderabbit doctor` passed; a later PR `#18` full-diff review completed successfully. If the `TRPCClientError` recurs, use scoped directory reviews such as `coderabbit review --agent --base main --dir apps/web/src/lib/auth -c AGENTS.md`, then rely on the hosted CodeRabbit PR review as the full-diff backstop.
