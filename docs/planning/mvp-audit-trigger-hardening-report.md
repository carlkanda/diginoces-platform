# MVP Audit Trigger Hardening Report

## Summary

This post-sprint MVP QA hardening pass fixed four linked-dev blockers caused by shared PostgreSQL audit triggers reading or comparing fields from sibling tables with incompatible row types or enum types. A later MVP UI QA pass also hardened login retry behavior, Supabase email rate-limit messaging, implicit magic-link callback compatibility, local loopback callback origin handling, older documented magic-link callback type handling, and public guest file-download storage signing after auth/storage issues blocked protected-route and public-download inspection.

No product scope was added. The fixes are limited to audit trigger implementations, auth retry/error handling, callback compatibility, safe local auth redirect handling, Supabase local Auth config guidance, server-only private Storage signing after backend authorization, and regression tests for already-implemented MVP flows.

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

8. Supabase default implicit-flow magic links can redirect to `/auth/callback#access_token=...`, but URL fragments are unavailable to server route handlers.
   - Fixed by adding a no-store implicit callback bridge that clears the fragment from browser history, posts tokens to a same-origin server route, validates the session with Supabase, and sets SSR cookies.

9. Local magic-link requests submitted from `127.0.0.1` could still receive callbacks on configured `localhost`, leaving Supabase PKCE verifier cookies on the wrong loopback host.
   - Fixed by deriving the magic-link callback origin from the current request origin when both the request and configured app origins are loopback hosts, while falling back to the configured app origin for untrusted external origins.

10. Older Diginoces local setup guidance used `type=email` in the Magic Link template, which current Supabase magic-link verification can treat as the numeric-email OTP flow and reject.
   - Fixed by normalizing callback `type=email` links to `magiclink`, updating the preferred template to `type=magiclink`, and adding local wildcard callback redirect patterns for future Supabase config syncs.

11. Public guest file downloads authorized the guest token in Postgres but attempted to create private Supabase Storage signed URLs with the anonymous SSR client, causing valid guest-visible files to fail with a generic storage `502`.
   - Fixed by adding a server-only `SUPABASE_SECRET_KEY` storage-signing adapter and using it only after `resolve_guest_file_download` authorizes the exact latest active guest-facing file.

## Files Changed

- `apps/web/src/app/auth/callback/implicit/route.ts`
- `apps/web/src/app/auth/callback/route.ts`
- `apps/web/src/app/api/public/guest/[guestToken]/files/[fileId]/download/route.ts`
- `apps/web/src/app/login/actions.ts`
- `apps/web/src/lib/auth/auth-service.ts`
- `apps/web/src/lib/auth/auth-service.test.ts`
- `apps/web/src/lib/files/file-foundation.test.ts`
- `apps/web/src/lib/storage/storage-provider.ts`
- `apps/web/src/lib/storage/storage-provider.test.ts`
- `docs/setup/deployment-readiness.md`
- `docs/setup/local-development.md`
- `supabase/config.toml`
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
- Verify the implicit magic-link callback bridge preserves safe internal next paths, strips unsafe next paths, avoids embedding token values, and rejects malformed callback payloads.
- Verify magic-link callback origin selection preserves safe loopback origins such as `127.0.0.1` and rejects untrusted external origins.
- Verify older documented callback links using `type=email` are normalized to Supabase's `magiclink` verification type.
- Verify private Storage signed URLs use a server-only Supabase secret key and fail closed when it is not configured.
- Verify the public guest file download route uses the server-only storage adapter instead of the anonymous SSR client after token-scoped file authorization.

## Linked Dev Verification

- Applied all eight migrations to the linked dev Supabase project.
- Public guest token creation succeeded after the RSVP/public-page audit fix.
- Payment-gate exception override succeeded after the commercial audit fix.
- Public guest message submission succeeded through the guest-facing UI after the guest-wishes audit fix.
- Invitation template insert was verified with a rollback transaction after the invitation audit fix.
- Guided manual WhatsApp flow was verified through template creation, message preparation, opened status, and sent status.
- Auth callback failure was verified locally to redirect to `/login`, preserve `next=/platform/audit-logs`, and show a retryable expired-link message without exposing tokens.
- Supabase Auth magic-link request failure was verified as status `429`, code `over_email_send_rate_limit`; the login UI now surfaces a retry-delay message.
- Supabase SSR magic-link guidance was refreshed against the current [Supabase passwordless email login docs](https://supabase.com/docs/guides/auth/auth-email-passwordless); local setup now documents the preferred `token_hash` email-template link and the app's implicit-flow compatibility bridge.
- Local auth callback origin handling was hardened so requesting a magic link from `127.0.0.1` keeps the callback on the same loopback host instead of forcing the configured `localhost` origin.
- Supabase redirect and email-template guidance was rechecked against the current [Supabase redirect URL docs](https://supabase.com/docs/guides/auth/redirect-urls); local setup now documents `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=magiclink`, and the callback remains compatible with previously documented `type=email` links.
- Supabase API key guidance was rechecked against the current [Supabase API keys docs](https://supabase.com/docs/guides/getting-started/api-keys); public guest file downloads now require a server-only secret key for private Storage signing after backend authorization.

## UI And API QA Evidence

- Home page rendered Sprint 1-14 implementation status with no desktop or mobile horizontal overflow.
- Login page rendered the magic-link form and rate-limit guidance with no desktop or mobile horizontal overflow.
- Invalid public guest page rendered "Invitation link unavailable" with no desktop or mobile horizontal overflow; the expected 404 resource status was observed.
- Protected UI route sweep covered 43 platform/project/event routes and all returned `307` redirects to `/login?next=...`.
- Unauthenticated API sweep covered 67 exported API methods; 66 returned generic `401` JSON and the invalid public guest-file endpoint returned `404`.
- API responses were checked for obvious fixture or secret leakage terms, including the QA email, temporary QA labels, WhatsApp tokens, service-role wording, and guest data markers; no leaks were found.
- Production-mode smoke test on port 3001 returned 200 for `/` and `/login`, 404 for an invalid public guest route, and 307 for `/platform`; `X-Powered-By` was absent.
- Public guest file-link Chrome/CDP QA rendered a disposable guest-visible file row without token-in-body leakage or mobile overflow, found the anonymous-storage-signing `502`, and verified fixture cleanup. Positive signed-object download still needs rerun on a server started with `SUPABASE_SECRET_KEY`.

## Commands Run

- `npm ci` - passed, 0 vulnerabilities reported during install.
- `npm run format:check` - initially failed on touched tests, then passed after formatting.
- `npm run format` - passed.
- `npm run lint` - passed.
- `npm run typecheck` - passed.
- `npm run test` - passed, 18 files and 196 tests.
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
- `npm --workspace @diginoces/web run test -- src/lib/auth/auth-service.test.ts` - passed, 12 auth helper tests after implicit-callback bridge coverage.
- `npm --workspace @diginoces/web run lint -- src/app/auth/callback/route.ts src/lib/auth/auth-service.ts src/lib/auth/auth-service.test.ts` - passed.
- `npm --workspace @diginoces/web run typecheck` - passed.
- `npm --workspace apps/web run test -- --run src/lib/auth/auth-service.test.ts` - passed, 17 auth helper tests after loopback callback-origin coverage.
- `npm --workspace apps/web run test -- --run src/lib/auth/auth-service.test.ts` - first failed as expected for missing older-template type normalization, then passed with 18 auth helper tests after callback type hardening.
- `npm run format:check` - initially failed on the two touched auth files after callback type hardening, then passed after formatting.
- `npm run format` - passed after callback type hardening.
- `npm run lint` - passed after callback type hardening.
- `npm run typecheck` - passed after callback type hardening.
- `npm run test` - passed, 18 files and 202 tests after callback type hardening.
- `npm run build` - passed after callback type hardening.
- `npm audit --omit=dev` - passed, 0 vulnerabilities after callback type hardening.
- `npm run secrets:scan` - passed after callback type hardening.
- `git diff --check` - passed with informational CRLF warnings on touched files only after callback type hardening.
- `npm --workspace apps/web run test -- --run src/lib/storage/storage-provider.test.ts` - first failed as expected for the missing server-only storage-signing helper, then passed after adding it.
- `npm run typecheck` - initially failed on the storage-signing helper env type, then passed after widening the helper input to a string env map.
- Public guest file-download disposable fixture QA - Chrome/CDP rendered the guest-visible file link, then valid download returned the pre-fix generic `502` storage-signing error; fixture rows, access events, token, temp files, and storage object were cleaned up.
- `npm run format:check` - initially failed on touched TypeScript files after storage-signing hardening, then passed after formatting.
- `npm run format` - passed after storage-signing hardening.
- `npm run lint` - passed after storage-signing hardening.
- `npm run typecheck` - passed after storage-signing hardening.
- `npm run test` - passed, 19 files and 205 tests after storage-signing hardening.
- `npm run env:check-public` - passed after adding server-only `SUPABASE_SECRET_KEY` documentation.
- `npm run build` - passed after storage-signing hardening.
- `npm audit --omit=dev` - passed, 0 vulnerabilities after storage-signing hardening.
- `npm run secrets:scan` - passed after storage-signing hardening.
- `git diff --check` - passed with informational CRLF warnings on touched files only after storage-signing hardening.
- `npm run format:check` - passed after loopback callback-origin hardening.
- `npm run lint` - passed after loopback callback-origin hardening.
- `npm run typecheck` - passed after loopback callback-origin hardening.
- `npm run test` - passed, 18 files and 201 tests after loopback callback-origin hardening.
- `npm run build` - passed after loopback callback-origin hardening.
- `npm audit --omit=dev` - passed, 0 vulnerabilities after loopback callback-origin hardening.
- `npm run secrets:scan` - passed after loopback callback-origin hardening.
- `npm run format:check` - passed after implicit-callback bridge changes.
- `npm run lint` - passed after implicit-callback bridge changes.
- `npm run typecheck` - passed after implicit-callback bridge changes.
- `npm run test` - passed, 18 files and 196 tests after implicit-callback bridge changes.
- `npm run build` - passed after implicit-callback bridge changes.
- `npm run env:check-public` - passed.
- `npm run secrets:scan` - passed.
- `npm audit --omit=dev` - passed, 0 vulnerabilities after implicit-callback bridge changes.
- `npm run db:lint` - passed, no schema errors.
- `npx supabase@latest db push --linked --dry-run` - passed, remote database up to date.
- `npm audit --omit=dev` - passed, 0 vulnerabilities.
- `npm run build` - passed after the auth hardening changes.
- `curl.exe http://localhost:3000/auth/callback?next=%2Fplatform%2Faudit-logs` - passed; returned the implicit bridge with `200`, `private, no-store`, CSP, `Referrer-Policy: no-referrer`, and no token values.
- `Invoke-WebRequest http://localhost:3000/auth/callback/implicit` with `text/plain` POST - passed; returned `415` JSON and `private, no-store`.
- `git diff --check` - passed with informational CRLF warnings on touched files only.
- `gh pr checks 48` - passed; Verify and CodeRabbit status checks completed successfully.
- Local Chrome/CDP public UI checks and unauthenticated UI/API sweeps - passed as summarized above.

## Security Review

- No real secrets were added.
- `SUPABASE_SECRET_KEY` is documented as server-only and must never use a `NEXT_PUBLIC_` prefix.
- No `.env` or `.env.local` files were changed.
- Auth callback checks sanitize and preserve only internal `next` paths.
- Implicit magic-link fallback clears URL fragments before posting tokens and validates the session with Supabase server-side before returning the protected redirect target.
- Supabase access, refresh, callback, and public guest tokens were not printed or committed.
- Audit snapshots remain redacted where existing redaction helpers already removed storage paths, filenames, checksums, error messages, and internal moderation/review notes.
- Fixes preserve the same audit action names while moving table-specific field and enum handling into table-specific branches.

## Assumptions

- The linked Supabase project is the dev QA project.
- The existing audit trigger tables and grants remain correct; this pass only fixes trigger runtime safety.
- The invitation upload UI should now pass the database step; the authenticated Chrome session dropped before the full upload UI could be rerun, so the final verification used a rollback insert against the linked DB.
- Protected UI role-by-role inspection still depends on a fresh `diginoces@gmail.com` magic-link login after Supabase email rate limiting clears and after the linked Supabase Magic Link template/redirect allow-list match the documented `type=magiclink` callback URL.
- Positive public guest signed-file download rerun depends on starting the app with server-only `SUPABASE_SECRET_KEY`; the current long-running local dev server on port `3000` was started without that variable.

## Remaining Notes

- Invitation-message sending still correctly requires generated invitations and an active invitation file before preparation.
- Audit-log UI access still requires a global `diginoces_admin` role; the QA account currently has operations-manager coverage.
- Supabase email sending temporarily rate-limited the QA account during local inspection; the app now displays retry guidance and can bridge older implicit-flow magic links, but full authenticated browser QA should continue after a fresh magic link succeeds.
