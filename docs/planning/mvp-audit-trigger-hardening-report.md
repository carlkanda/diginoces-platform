# MVP Audit Trigger Hardening Report

## Summary

This post-sprint MVP QA hardening pass fixed four linked-dev blockers caused by shared PostgreSQL audit triggers reading or comparing fields from sibling tables with incompatible row types or enum types. A later MVP UI QA pass also hardened login retry behavior, Supabase email rate-limit messaging, implicit magic-link callback compatibility, local loopback callback origin handling, Supabase token-hash magic-link callback type handling, email-code sign-in fallback behavior, public guest page security headers, and public guest file-download storage signing after auth/storage issues blocked protected-route and public-download inspection.

No product scope was added. The fixes are limited to audit trigger implementations, auth retry/error handling, callback compatibility, safe local auth redirect handling, Supabase local Auth config guidance, server-only private Storage signing after backend authorization, tokenized public-route response hardening, and regression tests for already-implemented MVP flows.

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

10. A follow-up local authentication failure exposed a Supabase callback type mismatch risk between `type=email` and `type=magiclink` token-hash links.
   - Fixed by verifying the received callback type first, trying the paired `email`/`magiclink` fallback if needed, updating the preferred local template to `type=email`, and adding local wildcard callback redirect patterns for future Supabase config syncs.

11. Public guest file downloads authorized the guest token in Postgres but attempted to create private Supabase Storage signed URLs with the anonymous SSR client, causing valid guest-visible files to fail with a generic storage `502`.
   - Fixed by adding a server-only `SUPABASE_SECRET_KEY` storage-signing adapter and using it only after `resolve_guest_file_download` authorizes the exact latest active guest-facing file.

12. A fresh local `Authentication callback failed` report occurred while Supabase magic-link requests were rate-limited, leaving QA without a browser session.
   - Fixed by adding a 6-digit email-code fallback that verifies Supabase email OTPs server-side, preserves safe `next` paths, and keeps the existing magic-link callback flow intact.

13. Public guest token pages initially lacked explicit token-route security headers in local header checks.
   - Fixed by adding `/g/:guestToken` route headers and proxy response hardening for `no-store`, `no-referrer`, `nosniff`, and `noindex, nofollow`. Production `next build`/`next start` verification confirmed the stricter headers; dev mode still forces `Cache-Control: no-cache`.

## Files Changed

- `apps/web/src/app/auth/callback/implicit/route.ts`
- `apps/web/src/app/auth/callback/route.ts`
- `apps/web/src/app/api/public/guest/[guestToken]/files/[fileId]/download/route.ts`
- `apps/web/src/app/login/actions.ts`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/platform/projects/[projectId]/commercial/page.tsx`
- `apps/web/next.config.ts`
- `apps/web/src/proxy.ts`
- `apps/web/src/proxy.test.ts`
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
- Verify current documented callback links using `type=email` are tried before `magiclink`, while `type=magiclink` links are tried before `email` for compatibility.
- Verify email OTP code normalization accepts 6-digit codes with whitespace and rejects malformed values before Supabase verification.
- Verify tokenized public guest pages receive private no-store, no-referrer, nosniff, and noindex response headers while unrelated routes do not.
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
- Supabase redirect and email-template guidance was rechecked against the current [Supabase redirect URL docs](https://supabase.com/docs/guides/auth/redirect-urls); local setup now documents `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`, and the callback remains compatible with `type=magiclink` links by trying the paired fallback if the received type is rejected.
- Supabase API key guidance was rechecked against the current [Supabase API keys docs](https://supabase.com/docs/guides/getting-started/api-keys); public guest file downloads now require a server-only secret key for private Storage signing after backend authorization.
- The linked-dev account metadata for `diginoces@gmail.com` was inspected without tokens or secrets; the account exists, email is confirmed, MFA has a verified TOTP factor, a recent session recorded `aal2`, and global `diginoces_admin`/`operations_manager` role assignments exist.
- A production `next build`/`next start` check verified `/g/:guestToken` responses carry `no-store`, `no-referrer`, `nosniff`, and `noindex, nofollow`. Disposable public-token header fixtures were cleaned from linked dev and the local temp token file was removed.
- The AAL2 admin/operations browser session completed a disposable guest-import review/apply flow: CSV upload, mapping, validation, submit-for-review, one approved row, one held row, apply-approved-rows, `status=applied`, one created guest, and the expected import audit actions. Cleanup removed the disposable guest, import session, rows, mappings, and dependent records; follow-up verification returned zero remaining rows for every checked table.

## UI And API QA Evidence

- Home page rendered Sprint 1-14 implementation status with no desktop or mobile horizontal overflow.
- Login page rendered the magic-link form and rate-limit guidance with no desktop or mobile horizontal overflow.
- Invalid public guest page rendered "Invitation link unavailable" with no desktop or mobile horizontal overflow; the expected 404 resource status was observed.
- Protected UI route sweep covered 43 platform/project/event routes and all returned `307` redirects to `/login?next=...`.
- Unauthenticated API sweep covered 67 exported API methods; 66 returned generic `401` JSON and the invalid public guest-file endpoint returned `404`.
- API responses were checked for obvious fixture or secret leakage terms, including the QA email, temporary QA labels, WhatsApp tokens, service-role wording, and guest data markers; no leaks were found.
- Production-mode smoke test on port 3001 returned 200 for `/` and `/login`, 404 for an invalid public guest route, and 307 for `/platform`; `X-Powered-By` was absent.
- Public guest file-link Chrome/CDP QA rendered a disposable guest-visible file row without token-in-body leakage or mobile overflow, found the anonymous-storage-signing `502`, and verified fixture cleanup. A follow-up linked-dev service-level signed-download check verified invalid token status `invalid`, valid file resolution `ok`, private object fetch `200`, `download` filename parameter present, and no public guest token in the signed URL. Browser-route positive download still needs rerun on a server process started with `SUPABASE_SECRET_KEY`.
- Guest-import admin Chrome/CDP QA rendered upload, mapping, preview/detail, review, and applied detail pages with no visible app error, no 404, no horizontal overflow, and no unlabeled controls on the final detail page. The test used a disposable CSV fixture and verified partial approval applied only the approved row while held rows did not create guests.
- Commercial Chrome/CDP QA rendered package/add-on creation, event selection, pricing, commercial gesture, generated contract, contract approval, confirmed payment, payment exception, and mobile final states. The pass found and fixed unlabeled commercial gesture, approval confirmation, and addendum controls, then reran with zero unlabeled visible controls, no horizontal overflow, no 404, and no visible app errors.

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
- Public guest file-download service-level linked-dev QA - passed after storage-signing hardening; invalid token resolved to `invalid`, valid token resolved the exact guest file, server-only private Storage signing produced a signed URL, object fetch returned `200`, the `download` filename parameter was present, and the signed URL did not contain the public guest token. Fixture rows, access events, token, temp files, and storage object were cleaned up.
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
- `npm run test -- apps/web/src/lib/auth/auth-service.test.ts` - failed because the root workspace forwarded a root-relative path into the web workspace; rerun with the workspace-relative path below.
- `npm --workspace apps/web run test -- --run src/lib/auth/auth-service.test.ts` - passed, 20 auth helper tests after preserving `type=email` as the primary callback type and adding paired `email`/`magiclink` fallback coverage.
- `npm --workspace apps/web run test -- --run src/lib/auth/auth-service.test.ts` - passed, 21 auth helper tests after email OTP normalization coverage.
- `npm --workspace apps/web run test -- --run src/lib/auth/auth-service.test.ts src/proxy.test.ts` - passed, 2 files and 23 tests after public-token header helper coverage.
- `npm run typecheck` - passed after email-code fallback and public-token header hardening.
- `npm run build` - passed; production build output included `Proxy (Middleware)`.
- Production `next start` public-token header check - passed for `/g/:guestToken` route shape with `Cache-Control: no-store, must-revalidate, max-age=0, private`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, and `X-Robots-Tag: noindex, nofollow`.
- Linked-dev disposable header-check cleanup - passed; token, guest, event, and project cleanup counts were all zero and the local temp token fixture was removed.
- `npm run format:check` - passed after email-code fallback, public-token headers, and documentation updates.
- `npm run lint` - passed after email-code fallback, public-token headers, and documentation updates.
- `npm run typecheck` - passed after email-code fallback, public-token headers, and documentation updates.
- `npm run test` - passed, 20 files and 210 tests.
- `npm run build` - passed after email-code fallback, public-token headers, and documentation updates; production build output included `Proxy (Middleware)`.
- `npm audit --omit=dev` - passed, 0 vulnerabilities.
- `npm run secrets:scan` - passed.
- `npm run db:lint` - passed, no schema errors.
- `npx supabase@latest db push --linked --dry-run` - passed, remote database up to date.
- `git diff --check` - passed with informational CRLF warnings on touched files only.
- `npm run format:check` - initially failed on the touched auth files, then passed after formatting.
- `npm run format` - passed after callback fallback hardening.
- `npm run lint` - passed after callback fallback hardening.
- `npm run typecheck` - passed after callback fallback hardening.
- `npm run test` - passed, 19 files and 207 tests after callback fallback hardening.
- `npm run build` - passed after callback fallback hardening.
- `npm audit --omit=dev` - passed, 0 vulnerabilities after callback fallback hardening.
- `npm run secrets:scan` - passed after callback fallback hardening.
- Targeted `rg` secret sweep - passed with expected placeholder, SQL grant, and test/documentation matches only.
- `git diff --check` - passed with informational CRLF warnings on touched files only after callback fallback hardening.
- Chrome/CDP authenticated AAL2 protected route matrix - passed 38/38 desktop routes and 38/38 mobile routes after adding the `/login/mfa` TOTP bridge and commercial form label fix.
- `npm --workspace apps/web run test -- --run src/lib/auth/auth-service.test.ts` - passed, 24 auth helper tests after MFA code, redirect, and TOTP factor-selection coverage.
- `npm run format:check` - initially failed on the commercial page after the label fix, then passed after formatting.
- `npm run format` - passed after MFA bridge and commercial label hardening.
- `npm run lint` - passed after MFA bridge and commercial label hardening.
- `npm run typecheck` - passed after MFA bridge and commercial label hardening.
- `npm run test` - passed, 20 files and 213 tests after MFA bridge and commercial label hardening.
- `npm run build` - passed after MFA bridge and commercial label hardening; production build output includes `/login/mfa`.
- `npm audit --omit=dev` - passed, 0 vulnerabilities after MFA bridge and commercial label hardening.
- `npm run secrets:scan` - passed after MFA bridge and commercial label hardening.
- `npm run db:lint` - passed, no schema errors after MFA bridge and commercial label hardening.
- `npx supabase@latest db push --linked --dry-run` - passed, remote database up to date after MFA bridge and commercial label hardening.
- `git diff --check` - passed with informational CRLF warnings on touched files only after MFA bridge and commercial label hardening.
- Guest-import admin review/apply Chrome/CDP QA - passed on linked dev with the AAL2 `diginoces@gmail.com` session; one row was approved/applied, one row was held, expected import audit actions were present, and disposable data cleanup verification returned zero remaining rows in import, guest, assignment, RSVP, token, invitation, message, check-in, seating, and file reference tables.
- Commercial Chrome/CDP QA - initially failed on unlabeled commercial gesture, approval confirmation, and addendum controls; passed after label fixes. The disposable flow created a package, add-on, event package selection, pricing snapshots, commercial gesture, generated/approved contract, confirmed manual payment, and active payment exception. Linked-dev verification found the expected commercial audit actions and cleanup returned zero disposable commercial rows while preserving the permanent fake-project payment exception.

## Security Review

- No real secrets were added.
- `SUPABASE_SECRET_KEY` is documented as server-only and must never use a `NEXT_PUBLIC_` prefix.
- No `.env` or `.env.local` files were changed.
- Auth callback checks sanitize and preserve only internal `next` paths.
- Implicit magic-link fallback clears URL fragments before posting tokens and validates the session with Supabase server-side before returning the protected redirect target.
- The MFA bridge upgrades already-enrolled Supabase TOTP sessions from AAL1 to AAL2 before exposing MFA-required internal roles; it does not add factor enrollment or weaken the database `requires_mfa` checks.
- Supabase access, refresh, callback, and public guest tokens were not printed or committed.
- Audit snapshots remain redacted where existing redaction helpers already removed storage paths, filenames, checksums, error messages, and internal moderation/review notes.
- Fixes preserve the same audit action names while moving table-specific field and enum handling into table-specific branches.

## Assumptions

- The linked Supabase project is the dev QA project.
- The existing audit trigger tables and grants remain correct; this pass only fixes trigger runtime safety.
- The invitation upload UI should now pass the database step; the earlier verification used a rollback insert against the linked DB, and the AAL2 route matrix now confirms the invitation upload route renders for the admin QA session.
- Protected UI route inspection used the linked-dev `diginoces@gmail.com` account after TOTP verification upgraded the browser session to AAL2.
- Positive public guest signed-file browser-route rerun depends on starting the app with server-only `SUPABASE_SECRET_KEY`; the current long-running local dev server on port `3000` was started without that variable. The same DB authorization and private Storage signing path passed in linked-dev service-level QA.

## Remaining Notes

- Invitation-message sending still correctly requires generated invitations and an active invitation file before preparation.
- Audit-log UI access still requires a global `diginoces_admin` role and AAL2; the QA account now has both for the protected route matrix.
- Supabase email sending temporarily rate-limited the QA account during local inspection; the app displays retry guidance, supports email-code fallback, bridges older implicit-flow magic links, and now has a TOTP MFA step for sensitive roles after first-factor sign-in.
