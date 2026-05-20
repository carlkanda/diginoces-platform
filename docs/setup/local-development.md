# Local Development

## Scope

This guide covers Sprint 1 foundation setup for issue `#1`. It does not include guest management, RSVP, invitations, WhatsApp sending, table planning, check-in, contracts, pricing, payments, partner project creation, or full dashboards.

## Prerequisites

- Node.js `20.9.0` or newer. The local checks were run with Node `24.15.0`.
- npm. On this Windows environment, `npm.cmd` was required because PowerShell script execution blocked `npm.ps1`.
- Docker, if you want to run the local Supabase stack.

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

Required Sprint 1 web variables:

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
```

The health endpoint is available at:

```text
http://127.0.0.1:3000/api/health
```

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

To create future migrations, use the CLI instead of inventing filenames:

```bash
npx supabase@latest migration new descriptive_name
```

## Known Local Notes

- `supabase db lint` requires a local database on `127.0.0.1:54322`.
- The Sprint 1 migration enables RLS on all foundation tables and keeps audit logs append-only.
- The storage adapter is fail-closed until a real provider is configured.
