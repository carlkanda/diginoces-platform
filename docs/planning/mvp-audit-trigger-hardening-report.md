# MVP Audit Trigger Hardening Report

## Summary

This post-sprint MVP QA hardening pass fixed four linked-dev blockers caused by shared PostgreSQL audit triggers reading or comparing fields from sibling tables with incompatible row types or enum types. A later MVP UI QA pass also hardened login retry behavior after expired magic links and Supabase email rate limits blocked protected-route inspection.

No product scope was added. The fixes are limited to audit trigger implementations, auth retry/error handling, and regression tests for already-implemented MVP flows.

## Findings And Fixes

1. Public guest token creation failed because `app_private.audit_rsvp_public_page_change()` read RSVP-only fields while auditing `guest_public_tokens`.
   - Fixed in `20260605000248_mvp_public_token_audit_trigger_fix.sql`.

2. Commercial payment-gate exception creation failed because `app_private.audit_commercial_change()` compared contract-only status values while auditing `payment_exceptions`.
   - Fixed in `20260605001623_mvp_commercial_audit_trigger_fix.sql`.

3. Public guest message submission failed because `app_private.audit_guest_wishes_feedback_change()` read `guest_message_reviews` fields while auditing `guest_messages`.
   - Fixed in `20260605003245_mvp_guest_wishes_audit_trigger_fix.sql`.

4. Invitation template registration failed because `app_private.audit_invitation_change()` compared invitation-only status values while auditing `invitation_templates`.
   - Fixed in `20260605004902_mvp_invitation_audit_trigger_fix.sql`.

5. Invitation audit lifecycle actions could be emitted on ordinary invitation updates when the status value was unchanged.
   - Fixed in `20260605015457_mvp_invitation_status_transition_audit_fix.sql`.

6. Expired or reused Supabase magic links dropped the original protected `next` destination and showed a generic callback failure.
   - Fixed by adding a shared login-error redirect helper and preserving safe `next` paths through `/auth/callback` failures.

7. Supabase Auth email rate limiting returned a generic "Unable to request a magic link" error during MVP QA.
   - Fixed by mapping `over_email_send_rate_limit` and HTTP `429` auth errors to a clear retry-delay message.

## Files Changed

- `apps/web/src/app/auth/callback/route.ts`
- `apps/web/src/lib/auth/auth-service.ts`
- `apps/web/src/lib/auth/auth-service.test.ts`
- `apps/web/src/lib/contracts/contract-foundation.test.ts`
- `apps/web/src/lib/guest-wishes/guest-wishes-foundation.test.ts`
- `apps/web/src/lib/invitations/invitation-foundation.test.ts`
- `apps/web/src/lib/rsvp/rsvp-foundation.test.ts`
- `supabase/migrations/20260605000248_mvp_public_token_audit_trigger_fix.sql`
- `supabase/migrations/20260605001623_mvp_commercial_audit_trigger_fix.sql`
- `supabase/migrations/20260605003245_mvp_guest_wishes_audit_trigger_fix.sql`
- `supabase/migrations/20260605004902_mvp_invitation_audit_trigger_fix.sql`
- `supabase/migrations/20260605011134_mvp_audit_trigger_delete_return_fix.sql`
- `supabase/migrations/20260605012009_mvp_guest_wishes_delete_object_id_fix.sql`
- `supabase/migrations/20260605013031_mvp_guest_wishes_delete_branch_fix.sql`
- `supabase/migrations/20260605015457_mvp_invitation_status_transition_audit_fix.sql`

## Tests Added

- Verify public-token audit triggers do not read RSVP-only fields.
- Verify payment-exception audit triggers do not compare contract-only status values.
- Verify public guest-message inserts do not reference review-only fields.
- Verify invitation-template audit inserts do not compare invitation-only status values.
- Verify invitation status audit actions require a real status transition.
- Verify guest-wishes and invitation audit triggers use the correct `DELETE` return pattern.
- Verify guest-wishes audit `DELETE` object ids use `old.id`.
- Verify login error redirects preserve safe protected `next` paths without broadening query parameters.
- Verify magic-link rate-limit messages cover both Supabase `over_email_send_rate_limit` codes and HTTP `429` statuses independently.

## Linked Dev Verification

- Applied all eight migrations to the linked dev Supabase project.
- Public guest token creation succeeded after the RSVP/public-page audit fix.
- Payment-gate exception override succeeded after the commercial audit fix.
- Public guest message submission succeeded through the guest-facing UI after the guest-wishes audit fix.
- Invitation template insert was verified with a rollback transaction after the invitation audit fix.
- Guided manual WhatsApp flow was verified through template creation, message preparation, opened status, and sent status.
- Auth callback failure was verified locally to redirect to `/login`, preserve `next=/platform/audit-logs`, and show a retryable expired-link message without exposing tokens.
- Supabase Auth magic-link request failure was verified as status `429`, code `over_email_send_rate_limit`; the login UI now surfaces a retry-delay message.

## UI And API QA Evidence

- Home page rendered Sprint 1-14 implementation status with no desktop or mobile horizontal overflow.
- Login page rendered the magic-link form and rate-limit guidance with no desktop or mobile horizontal overflow.
- Invalid public guest page rendered "Invitation link unavailable" with no desktop or mobile horizontal overflow; the expected 404 resource status was observed.
- Protected UI route sweep covered 43 platform/project/event routes and all returned `307` redirects to `/login?next=...`.
- Unauthenticated API sweep covered 67 exported API methods; 66 returned generic `401` JSON and the invalid public guest-file endpoint returned `404`.
- API responses were checked for obvious fixture or secret leakage terms, including the QA email, temporary QA labels, WhatsApp tokens, service-role wording, and guest data markers; no leaks were found.
- Production-mode smoke test on port 3001 returned 200 for `/` and `/login`, 404 for an invalid public guest route, and 307 for `/platform`; `X-Powered-By` was absent.

## Commands Run

- `npm ci` - passed, 0 vulnerabilities reported during install.
- `npm run format:check` - initially failed on touched tests, then passed after formatting.
- `npm run format` - passed.
- `npm run lint` - passed.
- `npm run typecheck` - passed.
- `npm run test` - passed, 18 files and 188 tests.
- `npm run build` - passed.
- `npm audit --omit=dev` - passed, 0 vulnerabilities.
- `npm run db:lint` - passed, no schema errors.
- `npx supabase@latest db push --linked --yes` - passed, applied `20260605015457_mvp_invitation_status_transition_audit_fix.sql`.
- `npx supabase@latest db push --linked --dry-run` - passed, remote database up to date after applying migrations.
- `git diff --check` - passed with an informational CRLF warning for one touched test file.
- Targeted secret scan - passed; no service-role keys, database URLs, WhatsApp tokens, Google secrets, private keys, auth refresh/access tokens, or QA public token values found in changed files.
- `coderabbit review --agent -t committed -c AGENTS.md` - initially reported two minor `DELETE` return issues and one trivial report-wording issue; all were addressed.
- `coderabbit review --agent -t uncommitted -c AGENTS.md` - reported guest-wishes `DELETE` object-id and DELETE old-row handling issues; addressed with follow-up migration hardening.
- `coderabbit review --agent -t uncommitted -c AGENTS.md` - final rerun passed with 0 issues.
- Hosted CodeRabbit review reported missing invitation status-transition guards; addressed with `20260605015457_mvp_invitation_status_transition_audit_fix.sql`.
- `coderabbit review --agent -t uncommitted -c AGENTS.md` - final rerun after the hosted review fix passed with 0 issues.
- `npm --workspace @diginoces/web run test -- src/lib/auth/auth-service.test.ts` - passed, 8 auth helper tests after CodeRabbit follow-up coverage.
- `npm --workspace @diginoces/web run lint -- src/app/auth/callback/route.ts src/lib/auth/auth-service.ts src/lib/auth/auth-service.test.ts` - passed.
- `npm --workspace @diginoces/web run typecheck` - passed.
- `npm run env:check-public` - passed.
- `npm run secrets:scan` - passed.
- `npm run db:lint` - passed, no schema errors.
- `npx supabase@latest db push --linked --dry-run` - passed, remote database up to date.
- `npm audit --omit=dev` - passed, 0 vulnerabilities.
- `npm run build` - passed after the auth hardening changes.
- `gh pr checks 48` - passed; Verify and CodeRabbit status checks completed successfully.
- Local Chrome/CDP public UI checks and unauthenticated UI/API sweeps - passed as summarized above.

## Security Review

- No real secrets were added.
- No `.env` or `.env.local` files were changed.
- Auth callback checks sanitize and preserve only internal `next` paths.
- Supabase access, refresh, callback, and public guest tokens were not printed or committed.
- Audit snapshots remain redacted where existing redaction helpers already removed storage paths, filenames, checksums, error messages, and internal moderation/review notes.
- Fixes preserve the same audit action names while moving table-specific field and enum handling into table-specific branches.

## Assumptions

- The linked Supabase project is the dev QA project.
- The existing audit trigger tables and grants remain correct; this pass only fixes trigger runtime safety.
- The invitation upload UI should now pass the database step; the authenticated Chrome session dropped before the full upload UI could be rerun, so the final verification used a rollback insert against the linked DB.
- Protected UI role-by-role inspection still depends on a fresh `diginoces@gmail.com` magic-link login after Supabase email rate limiting clears.

## Remaining Notes

- Invitation-message sending still correctly requires generated invitations and an active invitation file before preparation.
- Audit-log UI access still requires a global `diginoces_admin` role; the QA account currently has operations-manager coverage.
- Supabase email sending temporarily rate-limited the QA account during local inspection; the app now displays the retry guidance, but full authenticated browser QA should continue after a fresh magic link succeeds.
