# Sprint 6 Post-Merge Hardening Report

## Scope

Post-merge hardening follow-up for Sprint 6 issue #12 and PR #19 after local visual QA of the invitation template and PDF generation foundation.

## Findings

- The linked dev database denied authenticated reads on Sprint 6 invitation pages because RLS policies call `app_private.user_has_permission`, `app_private.user_can_access_project`, and `app_private.user_can_access_event` directly, but authenticated users did not have `EXECUTE` on those private helper functions.
- Project creation could fail while seeding Sprint 3 guest title defaults because `app_private.audit_guest_management_change()` referenced `old.is_active` inside a broad `CASE` expression that is also used by guest title/tag/assignment triggers.

## Fixes Applied

- Added `supabase/migrations/20260523154933_sprint_6_post_merge_hardening.sql`.
- Granted authenticated execution on the private access helpers used by RLS policies while keeping the helpers in the unexposed `app_private` schema.
- Replaced `app_private.audit_guest_management_change()` with branch-specific action selection so `old.is_active` is only read for `guests` update triggers.
- Added a migration evidence test to `apps/web/src/lib/invitations/invitation-foundation.test.ts`.

## Verification Notes

- Temporary Sprint 6 visual QA seed data was removed from the linked dev database after inspection.
- The local dev server was stopped, and temporary local visual-check files were removed.
- `npm run format:check` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run test` passed: 7 files, 71 tests.
- `npm run build` passed.
- `npm audit --omit=dev` passed with 0 vulnerabilities.
- `npm run db:lint` passed with no schema errors.
- `npx supabase@latest db push --linked --dry-run` passed and reported one pending migration: `20260523154933_sprint_6_post_merge_hardening.sql`.
- `git diff --check` passed.
- Targeted secret scan found only the placeholder `DATABASE_URL` in `.env.example`.

## Remaining Risk

- The migration should be applied to the linked dev project after PR merge so the helper grants and audit trigger replacement are represented in versioned schema history.
