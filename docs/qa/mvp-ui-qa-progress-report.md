# MVP UI QA Progress Report

Traceability: GitHub issue `#31`; sprint plan `docs/planning/sprint-15-plan.md`; manual QA scenarios `docs/qa/mvp-manual-qa-scenarios.md`; release checklist `docs/planning/mvp-launch-checklist.md`.

## Scope

This report records the current linked-dev/local-browser MVP UI QA pass after the Sprint 15 release hardening work and follow-up hardening PRs. It is a progress report, not a production sign-off. Real launch evidence, screenshots, logs, and credential references must remain in the external QA artifact store described by `docs/setup/qa-artifact-store.md`.

## Environment

| Item                   | Result                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| Date                   | 2026-06-05                                                                                        |
| App target             | Local Next.js dev server at `http://localhost:3000`                                               |
| Browser target         | Chrome CDP session at `127.0.0.1:9222`                                                            |
| Supabase target        | Linked dev project                                                                                |
| Current signed-in user | `diginoces@gmail.com`                                                                             |
| Current role evidence  | Project-scoped `bride`; event-scoped `event_staff`; global `operations_manager` requires MFA/AAL2 |
| Sensitive-role state   | AAL1 session cannot prove admin/operations readiness                                              |

## Fake QA Fixture IDs

| Fixture          | ID / value                             |
| ---------------- | -------------------------------------- |
| Project          | `de3378cd-ea21-4982-b507-a178eb88a34c` |
| Project code     | `QADEMO-2026-001`                      |
| Civil event      | `8dc5c8d7-1f75-454a-b902-0c4f09439413` |
| Reception event  | `088aebc4-05d9-45c2-b73a-803f73706163` |
| Bride guest      | `cc7972e5-f3a7-4c69-9174-b8a53665acf0` |
| Groom guest      | `3fcd8c4d-37a4-4a41-823e-c268e61f6d6f` |
| Both-side guest  | `4271cbfd-c672-4dde-86d0-aad2406124b9` |
| Import session   | `5823f935-b589-4417-a66b-125b743bc136` |
| Check-in setting | `b992163d-fc09-4157-a4c5-07bffaf4c4e1` |

## Browser QA Completed

| Area                           | Evidence                                                                                                                                                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Health and app shell           | `/api/health` returned `status: ok` and `supabaseConfigured: true`; home page rendered Sprint 1-14 progress.                                                                                                            |
| Authenticated route matrix     | 42 local routes were opened in Chrome with the current session; every route rendered non-empty content with no Next.js error overlay and no horizontal overflow.                                                        |
| Expected permission boundaries | Admin/MFA, import-review, guest-detail, invitation, communications, event-files, dashboard, reports, audit, and partner-review routes returned expected 404/permission-gated behavior for the current AAL1 role set.    |
| Guest import workflow          | CSV import upload, mapping, preview, and submit-for-review succeeded in earlier QA; the current import detail page renders `ready for review`; submit/apply controls are disabled for the current non-reviewer session. |
| Check-in manual flow           | Manual check-in recorded attendance and redirected with `checkInStatus=guest_checked_in`; no overlay or overflow.                                                                                                       |
| Unexpected guest flow          | Browser form created pending request `01ac3204-6fc2-4164-922e-24793ecaa4c3`; audit logged `unexpected_guest_requests.created`.                                                                                          |
| Check-in fallback flow         | Browser created preload snapshot `75a9ca51-463b-4bb0-9faa-c2e900258a97` with `guest_count = 2`.                                                                                                                         |
| Offline sync sample            | Browser submitted sync batch `384be2c0-9a65-454e-9469-b25280b7eb83`; DB status is `partial_conflict` with one open `arrival_count_conflict`, expected because the fake guest was already checked in.                    |
| Anonymous API denial           | Protected app API routes returned `401` generic JSON with no fixture data leakage.                                                                                                                                      |
| Anonymous RPC denial           | Authenticated-only RPCs such as `apply_guest_import_approved_rows` and `current_user_has_permission` returned permission denied to anon.                                                                                |
| Invalid public token           | `/g/invalid-token-mvp-negative-qa` and `resolve_guest_public_page` with an invalid token returned no protected project/guest data.                                                                                      |
| RLS grant verification         | Updated `docs/qa/rls-review.md` query returned zero non-allowlisted `PUBLIC`/`anon` execute grants on linked dev.                                                                                                       |

## 2026-06-05 Follow-Up Browser QA

| Area                                  | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public responsive matrix              | Chrome rendered `/`, `/login?next=%2Fplatform%2Faudit-logs`, `/login` with the magic-link rate-limit message, and `/g/invalid-token-for-ui-qa` at mobile, tablet, and desktop viewports with no horizontal overflow, no offscreen controls, and no visible token leakage.                                                                                                                                                                                                                                                         |
| Auth callback regression              | Chrome opened `/auth/callback?next=%2Fplatform%2Faudit-logs#access_token=<fake>&refresh_token=<fake>` and redirected to `/login` with the retryable expired-link message, preserved `next=/platform/audit-logs`, and no fake token visible in page text or final URL after sanitization.                                                                                                                                                                                                                                          |
| Auth callback compatibility hardening | After a reported callback failure, the app callback was hardened to accept Supabase's `token=` query alias in addition to `token_hash=`, recover safe return paths from same-origin `redirect_to` values, and align local Supabase Auth config with `http://localhost:3000`. A fake `token=` callback returned the expected expired-link redirect while preserving `/platform/audit-logs`.                                                                                                                                        |
| Configured production smoke           | A temporary `next start` server launched through `scripts/run-web-script-with-root-env.mjs` on port `3002`; `/`, `/login`, `/g/invalid-token-for-ui-qa`, and the implicit callback failure path rendered with no browser console exceptions, no overflow, and no visible token leakage.                                                                                                                                                                                                                                           |
| Production protected redirects        | Configured production smoke on port `3002` checked `/platform`, `/platform/audit-logs`, and a representative project guest-edit URL. All returned `307` to `/login?next=...` with no local filesystem paths, fixture labels, QA emails, service-role strings, or WhatsApp secret markers in the response body.                                                                                                                                                                                                                    |
| Source-derived protected UI sweep     | Local dev unauthenticated sweep derived 43 `/platform/**/page.tsx` routes from source and confirmed every route returned a login redirect. Development redirect bodies include Next.js dev tooling metadata and the requested URL in the `NEXT_REDIRECT` payload; configured production redirects do not expose local paths or fixture data.                                                                                                                                                                                      |
| Source-derived API sweep              | Local unauthenticated sweep derived 67 exported API methods from `apps/web/src/app/api/**/route.ts`; 66 returned generic `401` responses and the invalid public guest-file route returned the expected `404`, with no fixture, QA email, service-role, database URL, or WhatsApp secret markers in response bodies.                                                                                                                                                                                                               |
| Public accessibility/focus basics     | Chrome mobile checks for `/`, `/login`, `/login` with callback error, and `/g/invalid-token-for-ui-qa` found exactly one `h1` per page, no unlabeled visible controls, no duplicate IDs, no images missing `alt`, no undersized visible link/button targets in the checked set, and no horizontal overflow.                                                                                                                                                                                                                       |
| Supabase security advisors            | `npx supabase@latest db advisors --linked --type security --level info --fail-on none --output-format json` returned 34 `authenticated_security_definer_function_executable` warnings, 3 `anon_security_definer_function_executable` warnings, and 1 `auth_leaked_password_protection` warning. The executable-function warnings align with the documented permission-gated authenticated RPCs and token-scoped public guest RPCs; leaked-password protection remains a Supabase Auth configuration item for production sign-off. |
| Supabase performance advisors         | `npx supabase@latest db advisors --linked --type performance --level info --fail-on none --output-format json` returned 246 `unindexed_foreign_keys` info items, 38 `multiple_permissive_policies` warnings, and 29 `unused_index` info items. These are performance-hardening backlog candidates, not current UI launch blockers.                                                                                                                                                                                                |
| Development-mode note                 | The invalid public guest page on the local dev server produced a Next/React development instrumentation exception: `Failed to execute 'measure' on 'Performance': 'PublicGuestPage' cannot have a negative time stamp.` The configured production smoke did not reproduce it, so this is currently classified as a dev-mode canary/tooling issue, not an application runtime blocker.                                                                                                                                             |
| PR checks                             | PR `#48` CodeRabbit and Verify checks passed after auth callback hardening.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## Current Fixture Coverage

| Data area                    | Current linked-dev state                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| Projects                     | Present: 1 fake project                                                            |
| Events                       | Present: 2 fake events                                                             |
| Guests                       | Present: 3 fake guests                                                             |
| Guest import                 | Present: 1 staged/submitted import                                                 |
| Check-in                     | Present: settings, manual records, preload snapshot, sync batch, conflict evidence |
| RSVP records                 | Missing dedicated RSVP response rows                                               |
| Invitation templates/jobs    | Missing                                                                            |
| Message templates/logs       | Missing                                                                            |
| Seating tables/assignments   | Missing                                                                            |
| Partner profiles/submissions | Missing                                                                            |
| Project files/file versions  | Missing                                                                            |

## Remaining Launch QA Gates

The MVP is not yet fully proven for production. The following gates still need evidence:

- MFA/AAL2 admin or operations login for sensitive global workflows.
- Fresh authenticated `diginoces@gmail.com` local session after Supabase magic-link rate limiting clears, so protected browser QA can continue.
- Admin/operations review/apply of the guest import session.
- Contract/payment gate configuration and approval flow.
- Valid public guest token resolution, multi-event RSVP submit/change rules, and token isolation with a real generated fake token.
- Invitation template upload/field config/preview/generation result flow.
- Message template, guided manual WhatsApp send, queue/history status flow.
- Seating table creation, guest assignment, capacity checks, and table-card export.
- File registration, version, archive/retention, signed-download denial/allow checks.
- Partner profile, submission, review, and project draft flow.
- Bride-only and groom-only role sessions for side-boundary UI mutation checks.
- Partner and check-in-staff negative permission checks with those exact roles.
- External QA artifact-store setup verification and QA-001 through QA-036 evidence package.
- MFA decision record in `docs/planning/mvp-launch-checklist.md`.
- Supabase Auth leaked-password protection decision for production. The current linked-dev advisor reports it disabled; this is lower impact while the app exposes magic-link sign-in only, but it should be enabled or explicitly accepted before any password-based auth surface is exposed.
- Target staging/production migration, RLS, secret, monitoring, and rollback evidence if the launch target differs from linked dev.

## Classification

Current recommendation remains `conditional_go` for linked-dev or controlled staging QA only. Production launch remains blocked until QA-001 through QA-036 have pass/fail evidence, failures are classified, sensitive-role MFA is enforced or formally accepted, and external evidence storage is verified.
