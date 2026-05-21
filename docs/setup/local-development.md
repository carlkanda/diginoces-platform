# Local Development

## Scope

This guide covers the Sprint 1 foundation setup for issue `#1`, the Sprint 2 project/event foundation for issue `#3`, and the Sprint 3 guest-management foundation for issue `#5`. It does not include CSV/Excel guest import, RSVP, invitations, WhatsApp sending, table planning, check-in, contracts, pricing, payments, partner project creation, or full dashboards.

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

The project, event, and guest API routes require a Supabase-authenticated session. Mutations also call backend permission RPCs before writing and are protected by database RLS.

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
- The storage adapter is fail-closed until a real provider is configured.
