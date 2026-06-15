# Deployment Readiness - MVP

Traceability: GitHub issue `#31`; sprint plan `docs/planning/sprint-15-plan.md`; release backlog `EPIC-RELEASE`, especially `FEAT-REL-004`, `FEAT-REL-005`, and `FEAT-REL-006`. Every production-facing gate must remain linked to a requirement ID, backlog item, active sprint plan, and active GitHub issue per project policy.

## Scope

This document covers MVP deployment readiness after Sprint 15 release hardening. It is not a production hosting contract; it is the operational checklist for deploying the current Diginoces web app to staging or controlled MVP launch.

## Required Environment Variables

Use real values only in local `.env.local`, the staging host, or the production host. Do not commit them.

Do not configure `NODE_ENV` through `.env.local`, `.env`, or hosting-provider
env settings. Next.js and npm set `NODE_ENV` for `dev`, `build`, and `start`;
an env-file override can make production smoke tests run with an unintended
mode.

| Variable | Purpose | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/server Supabase project URL | Public value, still environment-specific |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key | Public browser key, not service role |
| `SUPABASE_SECRET_KEY` | Server-side private Storage signed URL generation | Server-only Supabase `sb_secret_...` key; required for guest file downloads after token-scoped backend authorization |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy server-side private Storage signed URL generation | Server-only legacy JWT fallback; keep empty unless a legacy project still requires it |
| `DATABASE_URL` | Local tooling database connection | Placeholder only in `.env.example`; do not commit real password |
| `WHATSAPP_MODE` | `manual` or future adapter mode | MVP should use `manual` unless approved provider credentials exist |

## Supabase Setup

1. Confirm the target project is the intended dev/staging/production project.
2. Apply migrations in order.
3. Run `npx supabase@2.104.0 db push --linked --dry-run`.
4. Run `npm run db:lint`.
5. Run Supabase security advisors and performance advisors.
6. Confirm private storage buckets exist and remain private.
7. Confirm public guest token RPCs are intentionally public and token-scoped.
8. Confirm all other authenticated app RPCs do not inherit PUBLIC execute grants after Sprint 15 migration:
   - Run the post-apply query in `docs/qa/rls-review.md`.
   - Expect zero rows outside the documented token-scoped public RPCs.
   - Cross-check step 7 to confirm the public guest token RPCs remain intentionally public and token-scoped.
   - Record the engineering lead/operations lead sign-off in `docs/planning/mvp-launch-checklist.md` under `Security & Access`.
   - The sign-off entry must include signer name, role, date, and a link to the post-apply RLS query results.

## Application Deployment

Selected targets:

- Staging hosting target: Vercel staging deployment.
- Production domain target: `diginoces.com`, with DNS currently managed through
  Bluehost.
- The Vercel connector returned the CLI/Git-integration deployment path on
  June 15, 2026. The Vercel CLI created a local `.vercel` project link, and
  `.vercel` is ignored so provider metadata is not committed.
- Vercel staging build evidence `VCL-STAGING-20260615-001` is stored in the
  external runbook. The preview deployment reached `READY` after setting the
  Vercel project framework to `nextjs` and output directory to
  `apps/web/.next`.
- Vercel Preview environment configuration and a fresh `READY` deployment are
  recorded externally under `VCL-STAGING-20260615-002`. The configured Preview
  variables include the app URL, public Supabase URL/key aliases, storage
  provider/bucket, MFA flag, and WhatsApp mode.
- Preview server-side `SUPABASE_SECRET_KEY` configuration, Vercel automation
  bypass setup, and protected app-level smoke are recorded externally under
  `VCL-STAGING-20260615-003`. Header-based bypass smoke returned `200` for `/`
  and `/api/health`; the health response reported `status: ok` and
  `supabaseConfigured: true`.
- Full scenario evidence remains pending. Run the QA handoff before production
  sign-off and keep bypass secrets, deployment URLs, and raw logs in the
  external runbook or vault only.

1. Run local verification: `npm ci`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run env:check-public`, `npm run build`, and `npm audit --omit=dev`.
2. Confirm CI runs the same core checks on the PR.
3. Deploy the branch to staging.
4. Configure environment variables in the hosting provider.
5. Confirm no Supabase secret or legacy service-role key is exposed as `NEXT_PUBLIC_*`; CI also runs `npm run env:check-public` to block public variable names or values containing service-role/private-key markers.
6. Run the smoke checklist in `docs/planning/mvp-launch-checklist.md`.
7. Run Supabase/database checks when linked project access is available: `npm run db:lint`, `npx supabase@2.104.0 db push --linked --dry-run`, and Supabase advisors.

Use the pinned Supabase CLI version above for deployment-readiness evidence. Sprint 15 verification used `npx supabase@latest`, which resolved to `2.104.0`; the pinned command preserves that verified tool version. Update the documented version intentionally after compatibility is verified against the linked dev project and CI/local database lint behavior.

## Storage Readiness

- Buckets for project, invitation, and archive files must stay private.
- Signed download URLs must be created only through server routes/RPCs after permission checks.
- Public guest file downloads require `SUPABASE_SECRET_KEY` or the legacy `SUPABASE_SERVICE_ROLE_KEY` on the server because the anonymous public guest page session cannot sign private `project-files` objects directly.
- Zero-byte placeholder file metadata must follow the provider-backed registration policy in `docs/architecture/file-management-policy.md`.
- Do not enable direct public object access for generated invitations, guest files, contracts, payment proofs, archives, or reports.

## Monitoring Setup

1. Configure a hosted uptime monitor, hosting-provider synthetic check, or custom scheduled health poll for the home page and `/api/health`.
2. Use 5-minute sampling for MVP unless the hosting provider supports a stricter interval without extra operational load.
3. Alert when 2 consecutive checks fail or when the app error rate exceeds 5% for 15 minutes, matching `docs/qa/post-launch-monitoring.md`.
4. Route alerts to email and dashboard channels named in the external release
   runbook; do not commit private inbox URLs, personal phone numbers, or private
   contact details.
5. Assign Carl as monitoring owner and Diginoces operations as backup owner in
   `docs/planning/mvp-launch-checklist.md` before production.
6. Store monitor configuration screenshots, alert rule IDs, and test alert evidence in the QA artifact store.

## Deployment Gates

Deployment to production should not proceed unless:

- CI is green.
- Linked database dry-run is clean after migrations are applied.
- `npm run db:lint` passes.
- `npm audit --omit=dev` reports 0 vulnerabilities or accepted documented exceptions.
- Targeted secret scan has no real secrets/private data.
- MFA handling for sensitive roles is accepted or enforced.
- Manual staging QA has been run and failures are classified.
- Rollback and manual fallback paths are understood by operations.
