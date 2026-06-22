# Redesign UI Deep Test Checklist

Date started: 2026-06-22

Date completed: 2026-06-22

Branch: `codex/bilingual-ux-simplification-homepage`

Scope: PR `#132` redesigned, French-first bilingual user experience.

## Purpose

This checklist records the completed page-by-page QA pass for the redesigned
local app. It is intentionally evidence-based so future QA does not repeat the
same browser sweeps unless a page changes again.

## Test Environment

| Item                | Value                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Local app           | `http://127.0.0.1:3000`                                                                                              |
| Browser             | In-app Browser plus Playwright-driven route sweeps                                                                   |
| Dev data            | Dev-only QA accounts for internal operations, bride, groom, event staff, and partner roles                           |
| Evidence location   | Temporary JSON and screenshots under `output/`; these files are not committed                                        |
| Sensitive artifacts | Auth callback URLs, MFA setup data, and transient public guest tokens were not documented and were deleted after use |

## Completion Summary

| Area                     | Status | Evidence                                                                                                                                    |
| ------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Public pages             | Passed | Home, login, MFA redirect, valid public guest page, and invalid public guest page rendered without runtime overlays or horizontal overflow. |
| Protected page inventory | Passed | 47 Next.js `page.tsx` routes were covered through internal AAL2, public-token, and role-specific browser sweeps.                            |
| Role-specific access     | Passed | Internal operations, bride, groom, event staff, and partner sessions were tested with permissions appropriate to each role.                 |
| Mobile basics            | Passed | Home, login, and invalid public guest routes were checked at mobile viewport width with no horizontal overflow.                             |
| Form controls            | Passed | Login email fields, email-code field, and MFA code field were exercised in browser sessions.                                                |
| Redirect behavior        | Passed | Anonymous protected routes redirect to login with encoded `next` parameters.                                                                |
| Design terminology       | Passed | Route sweeps did not find old internal planning terms in visible page content.                                                              |
| Color contrast           | Passed | Bilingual rendered sweep found no unresolved contrast failures after CTA variant fixes.                                                      |
| Bilingual UI copy        | Passed | French and English rendered sweeps covered public pages, protected pages, option labels, and route headings.                                |
| MFA OTP verification     | Passed | Dev MFA QA user reached the OTP page, clamped input to six digits, submitted a fresh TOTP, and landed on `/platform`.                       |
| Home-page launch review  | Passed | Final home-page audit covered colors, public copy, marketing tone, French/English rendering, and desktop/tablet/mobile screenshots.         |
| Current all-page sweep   | Passed | Fresh 2026-06-22 run generated dev-only QA users, checked all 47 page routes in French and English, and reported zero failures.             |
| Security hygiene         | Passed | Transient auth URLs and public guest tokens were removed from local temp files before final checks.                                         |

## Page Inventory Coverage

The app currently has 47 concrete page files under `apps/web/src/app`. The
following route families were covered with generated dev QA users and safe dev
records:

| Route family            | Pages covered                                                                                         | QA role used                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Public and auth         | `/`, `/login`, `/login/mfa`, `/g/[guestToken]`                                                        | Anonymous, internal AAL1, internal AAL2, transient public guest token |
| Workspace shell         | `/platform`, `/platform/dashboard`, `/platform/projects`, `/platform/reports`, `/platform/audit-logs` | Internal operations                                                   |
| Project core            | `/platform/projects/[projectId]`, `/dashboard`, `/couple-dashboard`, `/comments`, `/commercial`       | Internal operations, bride, groom, partner                            |
| Guests and RSVP         | `/guests`, `/guests/new`, `/guests/[guestId]`, `/guests/[guestId]/public-preview`, `/rsvps`           | Internal operations, bride, groom                                     |
| Guest imports           | `/guest-imports`, `/guest-imports/new`, `/guest-imports/[importId]`, `/mapping`, `/review`            | Internal operations, bride, groom                                     |
| Guest book and feedback | `/guest-book`, `/guest-book/couple-review`, `/feedback`                                               | Internal operations                                                   |
| Invitations             | `/events/[eventId]/invitations`, `/new`, `/[templateId]`                                              | Internal operations                                                   |
| Communications          | `/communications`, `/templates`, `/queue`, `/communications/[messageLogId]`                           | Internal operations                                                   |
| Files                   | `/projects/[projectId]/files`, `/files/[fileId]`, `/events/[eventId]/files`                           | Internal operations                                                   |
| Events                  | `/events/[eventId]`, `/dashboard`, `/seating`, `/seating/map`, `/check-in`, `/check-in/scan`          | Internal operations, event staff                                      |
| Partners                | `/partner-dashboard`, `/partners`, `/partners/review`, `/partners/[partnerId]`                        | Internal operations, partner                                          |

Permission-limited role sweeps intentionally produced controlled locked or
not-found states for routes outside the assigned role's capability. Those states
were treated as access-control coverage, not visual regressions.

## Browser Evidence Files

| Evidence file                                                          | Result                                                         |
| ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| `output/ui-deep-qa-internal-aal2-batch-1-public-workspace.json`        | Passed, 10 route checks                                        |
| `output/ui-deep-qa-internal-aal2-batch-2-guests-imports.json`          | Passed, 11 route checks                                        |
| `output/ui-deep-qa-internal-aal2-batch-3-collab-invites-messages.json` | Passed, 11 route checks                                        |
| `output/ui-deep-qa-internal-aal2-batch-4-files-events.json`            | Passed after targeted recheck for two soft navigation timeouts |
| `output/ui-deep-qa-internal-aal2-batch-5-management-partners.json`     | Passed after targeted recheck for two soft navigation timeouts |
| `output/ui-deep-qa-check-in-targeted-recheck.json`                     | Passed, check-in routes rendered cleanly                       |
| `output/ui-deep-qa-soft-timeout-targeted-recheck.json`                 | Passed, commercial and partners routes rendered cleanly        |
| `output/ui-deep-qa-role-bride.json`                                    | Passed, bride role boundaries rendered safely                  |
| `output/ui-deep-qa-role-groom.json`                                    | Passed, groom role boundaries rendered safely                  |
| `output/ui-deep-qa-role-event-staff.json`                              | Passed, event staff pages rendered safely                      |
| `output/ui-deep-qa-role-partner.json`                                  | Passed, partner pages rendered safely                          |
| `output/ui-deep-qa-email-code-input-interaction.json`                  | Passed, six-digit email-code input clamps typed values         |
| `output/ui-deep-qa-mfa-input-interaction.json`                         | Passed, MFA code input clamps typed values                     |
| `output/redesign-color-translation-mfa-report.json`                     | Full bilingual rendered sweep covered 47 page routes; one soft EN route timeout was rechecked directly |
| `output/redesign-targeted-communications-templates-recheck.json`        | Passed, targeted EN communications-template route recheck after the soft timeout |
| `output/homepage-ux-review-report.json`                                 | Passed, home page rendered in French/English at desktop, tablet, and mobile with zero copy, overflow, image, or non-hero contrast failures |
| `output/homepage-final-*.png`                                            | Passed, final home-page screenshots for French/English desktop, tablet, and mobile visual review |
| `output/redesign-all-pages-current-goal-report.json`                     | Passed, 47 app page routes, 43 protected routes, 5 public/auth routes, French and English, generated QA users, MFA checks clean, 0 failures |

The soft navigation timeouts were not reproducible defects: direct targeted
rechecks loaded the same pages, found expected headings, and reported no
framework overlay or horizontal overflow.

## Findings Log

| Status     | Route or flow             | Finding                                                                                                                                                                                 | Action                                                                                                                                                     |
| ---------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fixed      | `/login` email-code form  | The six-digit code field accepted nine typed digits, which made the field invalid after normal typing.                                                                                  | Fixed the shared `Input` component to clamp typed values to `maxLength`; browser retest passed.                                                            |
| Fixed      | `/login/mfa` code form    | The same shared input behavior could affect MFA verification code entry.                                                                                                                | The shared `Input` fix covers MFA code entry; authenticated AAL1 browser retest clamped the value to six digits.                                           |
| Fixed      | Shared input component    | During the final post-test CodeRabbit loop, local review noted that typed truncation should not interrupt active IME composition and that controlled values should remain parent-owned. | The shared `Input` component now clamps typed values only after composition is inactive, while leaving controlled/default values to the owning form state. |
| Fixed      | `/login` email-code form  | The email-code submit button combined default and outline button variants, producing white text on a pale background.                                                                  | `LoginSubmitButton` now accepts a real `variant` prop, and the login page passes variants without precomputed class collisions.                            |
| Fixed      | `/platform` launchpad CTA | A CTA inside the primary launchpad card could inherit white text over a pale secondary background.                                                                                       | The CTA now uses an explicit inverse primary-foreground background with primary text.                                                                       |
| Fixed      | Bilingual route copy      | Several redesigned page headings, route descriptions, and select options still rendered English text on French pages.                                                                   | Added page-level phrase translations, localized language-switcher aria labels, translated option text, and scheduled post-hydration localization passes.   |
| Fixed      | `/` home page             | The inactive language option could inherit white text inside the image hero, and hero outline buttons were below AA contrast over bright image areas.                                  | The shared language switcher now sets foreground text explicitly, and hero outline buttons use a darker translucent surface.                               |
| Fixed      | `/` home page             | The public body copy described the page itself and used the technical term `MFA`, which was not appropriate for first-time visitors.                                                   | Rewrote the copy around wedding operations value, secure workspace access, and extra verification for sensitive controls.                                  |
| Verified   | MFA OTP flow              | The MFA page needed validation with a real dev TOTP factor, not only a typed mock value.                                                                                                | Generated a dev-only MFA QA user, verified a fresh TOTP code, confirmed six-digit clamping, and reached `/platform`.                                      |
| Documented | Internal QA route batches | Four routes reported initial soft navigation timeouts while still rendering correctly on direct recheck.                                                                                | Targeted rechecks passed; no source change needed.                                                                                                         |
| Documented | Bilingual full sweep      | The final bilingual sweep had one soft timeout on the EN communications-template route while all contrast, copy, and MFA checks passed.                                                | Targeted recheck of the same route passed with zero failures.                                                                                              |

## Commands And Checks

| Command                                                                                       | Result                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run format:check`                                                                        | Passed after final checklist update.                                                                                                                                                                                                                                           |
| `npm run lint`                                                                                | Passed.                                                                                                                                                                                                                                                                        |
| `npm run typecheck`                                                                           | Passed after correcting the input event type.                                                                                                                                                                                                                                  |
| `npm run test -- --run src\lib\auth\auth-service.test.ts src\app\login\submit-button.test.ts` | Passed, 31 focused tests.                                                                                                                                                                                                                                                      |
| `npm run test`                                                                                | Passed, 299 tests.                                                                                                                                                                                                                                                             |
| `npm run redesign:check`                                                                      | Passed, 47 browser-verified route rows, 0 blocked.                                                                                                                                                                                                                             |
| `npm run redesign:design-system-check`                                                        | Passed.                                                                                                                                                                                                                                                                        |
| `npm run redesign:check:approval`                                                             | Passed.                                                                                                                                                                                                                                                                        |
| `npm run build`                                                                               | Passed.                                                                                                                                                                                                                                                                        |
| `npm run env:check-public`                                                                    | Passed.                                                                                                                                                                                                                                                                        |
| `npm run secrets:scan`                                                                        | Passed.                                                                                                                                                                                                                                                                        |
| `git diff --check`                                                                            | Passed after final checklist update.                                                                                                                                                                                                                                           |
| `npm run format`                                                                              | Passed after the contrast/localization fixes and checklist update.                                                                                                                                                                                                             |
| `npm audit --omit=dev`                                                                        | Passed with 0 vulnerabilities.                                                                                                                                                                                                                                                 |
| Final standard check set                                                                      | Passed `format:check`, `lint`, `typecheck`, full `test`, `redesign:check:approval`, `redesign:design-system-check`, `build`, `env:check-public`, `secrets:scan`, and `git diff --check`.                                                                                      |
| `npm run test -- --run src/lib/i18n/static-translations.test.ts src/app/login/submit-button.test.ts` | Passed, 20 focused tests after translation and login-button fixes. npm emitted a known argument warning from workspace forwarding.                                                                                              |
| `node output/redesign-color-translation-mfa-qa.mjs`                                           | Completed full FR/EN browser sweep of 47 page routes, color checks, translation checks, public token route, generated QA users, and real MFA OTP. Final full run had one soft EN route timeout.                                                                 |
| `QA_SCOPE=route QA_LANGUAGE=en QA_ROUTE_PATH=/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/communications/templates node output/redesign-color-translation-mfa-qa.mjs` | Passed targeted recheck for the only soft timeout from the final full run.                                                                                                                                        |
| Local Impeccable detector run against `apps/web/src/app/page.tsx`, `apps/web/src/app/globals.css`, `apps/web/src/lib/i18n/home-copy.ts`, and `apps/web/src/components/language-switcher.tsx` | Passed with no detector findings after the home-page contrast and copy fixes. The detector was run from the locally installed Impeccable skill, which is not committed to this repository. |
| Home-page rendered audit                                                                          | Passed 6 renders: French/English at desktop, tablet, and mobile; zero forbidden public terms, mojibake, horizontal overflow, missing expected copy, missing hero image, or non-hero contrast failures.                                                        |
| Hero control contrast check                                                                       | Passed; language options and hero CTA/sign-in controls meet AA contrast after the language switcher and hero surface fixes.                                                                                                                             |
| Local CodeRabbit review                                                                       | Docs-scoped review corrected stale rows that still said final checks were pending. Source-scoped review corrected the shared `Input` component to use Base UI-derived event handler types, leave controlled/default values parent-owned, and apply IME-aware typed truncation. |
| `QA_EVIDENCE_FILE=redesign-all-pages-current-goal-report.json node output/redesign-color-translation-mfa-qa.mjs` | Passed on 2026-06-22; generated fresh dev-only internal and MFA QA users, verified all current page routes in French and English, and reported 0 failures. |

## Remaining Notes

- The local dev server emitted a Turbopack cache-persistence warning caused by a
  Windows filesystem permission issue. It did not block page rendering or build
  output.
- No API, database schema, or production configuration change is made by this
  checklist. Source changes are limited to UI contrast, localization timing,
  static bilingual copy, option-label translation, language-switcher labels,
  home-page public copy, hero contrast, and the login submit-button variant API.
