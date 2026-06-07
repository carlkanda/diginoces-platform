# MVP Manual QA Scenarios - Sprint 15

Traceability: GitHub issue `#31`; sprint plan `docs/planning/sprint-15-plan.md`; release backlog `EPIC-RELEASE`, especially `FEAT-REL-001`, with scenario rows mapped to MVP requirement groups. See also `docs/planning/mvp-requirements-coverage.md`, `docs/planning/mvp-known-limitations.md`, and `docs/planning/mvp-launch-checklist.md`.

## Purpose

This checklist defines the end-to-end manual QA pass for staging and launch. Automated unit/foundation tests cover critical logic; these scenarios verify the integrated app behavior with real browser interaction and the linked Supabase dev or staging project.

## Preconditions

- Sprint 15 branch is deployed to staging or running locally.
- Deployment readiness procedures from `docs/setup/deployment-readiness.md` have been completed for the target environment.
- Supabase migrations are applied to the target QA project; verify with `supabase migration list` and confirm `20260603113922_sprint_15_release_security_grants.sql` is present after merge/apply.
- `.env.local` exists locally or deployment environment variables exist in the host, using non-production secrets for staging.
- Test users exist for admin, operations/staff, bride, groom, partner, check-in staff, and guest-token access. Test credentials must be stored securely outside the repository in the approved encrypted vault or secure password manager, must never be checked into git, and must be requested from the Diginoces owner role or engineering lead through the internal QA access process.
- Test project data is fake and clearly marked as demo data.
- Environment setup follows `docs/qa/mvp-ui-qa-setup.md`, including the MFA-sensitive role gate and fake-data rules.

## Pre-QA Setup

1. Apply or verify all migrations on the QA database.
2. Confirm `npm run db:lint`, Supabase dry-run, and release checks are green for the target branch.
3. Create or verify fake test users for admin, operations/staff, bride, groom, partner, and check-in staff roles.
4. Create one fake wedding project with at least two events, fake guests, one partner submission, one file, and one guest public token.
5. Confirm no real client, couple, guest, phone, payment, WhatsApp, or Google data is used.

## Scenario Dependencies

- Run QA-001 and QA-002 before any protected workflow.
- Run QA-003 before QA-004 through QA-021 because most scenarios need a project/event.
- Run QA-005 before QA-006 through QA-018 because imports, RSVP, seating, invitations, messages, and check-in need guest data.
- Run QA-004 before public guest access, invitation sending, and messaging gates.
- Run QA-020 through QA-025 after core workflows create audit/report evidence.

## Core Scenarios

Evidence for every scenario must include primary DB IDs or identifiers, tester initials, environment, timestamp, pass/fail, classification, and optional screenshot or log excerpt links.

Store QA artifacts in the company-managed encrypted QA artifact store described in `docs/setup/qa-artifact-store.md`, outside this repository. Use folder format `<environment>/<project-code>/<scenario-id>/` and filename format `<YYYYMMDDTHHMMSSZ>__tester=<tester-id>__scenario=<scenario-id>.<ext>`. Only the Diginoces owner role, operations lead, engineering lead, and assigned QA testers may write or read artifacts. Retain launch QA evidence for at least 180 days, and reference evidence through persistent artifact URLs or ticket attachments rather than committing screenshots, credentials, exports, or logs to git. File artifact handling must follow `docs/architecture/file-management-policy.md#artifact-handling`.

| ID | Requirement Group | Scenario | Primary roles | Expected result | Evidence |
| --- | --- | --- | --- | --- | --- |
| QA-001 | `PV-*`; `TECH-*` | App loads and health endpoint responds | Any | Home page renders and `/api/health` returns platform status | screenshot or tester initials |
| QA-002 | `ROLE-*` | Admin signs in and reaches platform routes | Diginoces admin | Admin can access protected project surfaces | screenshot or tester initials |
| QA-003 | `PROJ-*` | Admin creates a wedding project and events | Admin/operations | Project and event codes are generated and detail pages load | created IDs |
| QA-004 | `PAY-*`; `RSVP-*`; `MSG-*` | Contract, pricing, and payment gates are configured | Admin/finance | Guest-facing/invitation gates reflect payment or exception state | project ID |
| QA-005 | `GM-*`; `ROLE-*` | Manual guest creation and update | Bride/groom/staff | Guests are created on the correct side with validation and audit events | guest IDs |
| QA-006 | `GM-*` | CSV guest import mapping and preview | Bride/groom/staff | CSV rows stage, map, validate, and show duplicate warnings | import session ID |
| QA-007 | `GM-*`; `ROLE-*` | Import review and apply | Admin/operations | Approved rows create guests; rejected/held rows do not | import session ID |
| QA-008 | `PROJ-*`; `GM-*` | Event-specific guest assignment | Staff | Guest appears in assigned event and not unrelated events | guest/event IDs |
| QA-009 | `RSVP-*`; `ROLE-*` | Public guest page access gate | Guest/admin preview | Guest token resolves only when gate permits or admin preview is used | token test result |
| QA-010 | `RSVP-*` | Multi-event RSVP | Guest | Yes/No/Maybe answers save per event and change rules hold | RSVP row IDs |
| QA-011 | `INV-*`; `PDF-*`; `QR-*` | Invitation template registration and field config | Staff | Template, fields, and preview approval flow save | template ID |
| QA-012 | `INV-*`; `FILE-*` | Invitation generation job foundation | Staff | Generation validates required guest data and records results/files; see `docs/architecture/file-management-policy.md#artifact-handling` for artifact handling | job ID |
| QA-013 | `MSG-*` | Guided manual WhatsApp send | Staff | Message readiness validates and manual send/history state updates | message log ID |
| QA-014 | `SEAT-*`; `RSVP-*` | Seating assignment and capacity checks | Staff | Seating assignments obey capacity and RSVP operational effects | table plan ID |
| QA-015 | `SEAT-*`; `FILE-*` | Table-card CSV export | Staff | Export is generated/registered as a project file; see `docs/architecture/file-management-policy.md#artifact-handling` for artifact handling | file ID |
| QA-016 | `CHK-*`; `QR-*` | Check-in QR token flow | Check-in staff | Token resolves to the intended event/guest and records attendance | check-in ID |
| QA-017 | `CHK-*` | Check-in manual search flow | Check-in staff | Authorized staff can record manual check-in for assigned event | check-in ID |
| QA-018 | `CHK-*`; `ROLE-*` | Unexpected guest request review | Check-in staff/admin | Request can be submitted and reviewed without bypassing permissions | request ID |
| QA-019 | `WISH-*`; `REP-*` | Public guest wish/message and couple review | Guest/couple/admin | Guest message submits, review status updates, export includes approved rows | message ID |
| QA-020 | `REP-*`; `FILE-*` | Reports, exports, audit logs, retention/archive | Admin/staff | Reports load, audit restrictions hold, files archive/retention actions log, and zero-byte placeholders older than 24 hours are replaced or removed per `docs/architecture/file-management-policy.md#placeholder-lifecycle-verification` | report/file IDs and placeholder cleanup evidence |
| QA-021 | `PART-*` | Partner profile, submission, and project draft flows | Partner/admin | Partner profiles and submissions create project drafts, and role boundaries are enforced | partner ID / draft ID / role audit entries |
| QA-022 | `ROLE-*`; `TECH-*` | RLS policy enforcement review | Admin/engineering | RLS checks in `docs/qa/rls-review.md` are exercised or verified with policy names and query results | policy names / query results |
| QA-023 | `TECH-*`; `FILE-*`; `REP-*` | Security review checklist | Admin/engineering | `docs/qa/security-review.md` is complete with dependency scan, secret scan, permission evidence, and file artifact handling per `docs/architecture/file-management-policy.md#artifact-handling` | scan output IDs / check logs |
| QA-024 | `REP-*`; `TECH-*` | Monitoring signal validation | Operations/engineering | Signals in `docs/qa/post-launch-monitoring.md` are mapped to dashboard/log evidence and owners | dashboard/log IDs |
| QA-025 | `ROAD-*`; `TECH-*` | Rollback dry-run | Operations/engineering | Non-destructive staging rehearsal of rollback steps in `docs/planning/mvp-rollback-plan.md` completes without production changes, repository mutations, index changes, or build-artifact checksum drift | timestamps and operator IDs for Sheets/CSV export/import, Canva asset screenshot or version restore log, WhatsApp notification log/screenshot, RSVP fallback export/confirmation, manual check-in timestamp/screenshot, pre/post git logs, and pre/post SHA256 checksum files |

## QA-025 Rollback Rehearsal Evidence

QA-025 must reference `docs/planning/mvp-rollback-plan.md` and capture a non-destructive staging dry-run only. Required evidence:

- Sheets/CSV fallback: exported CSV or sheet snapshot, import/reopen confirmation, operator ID, and timestamp.
- Canva fallback: asset screenshot or version-restore log, operator ID, and timestamp.
- WhatsApp fallback: notification log or screenshot using fake recipients, operator ID, and timestamp.
- RSVP fallback: export/confirmation of manual RSVP handling, operator ID, and timestamp.
- Manual check-in fallback: check-in list timestamp or screenshot using fake data, operator ID, and timestamp.
- Repository state: capture `git rev-parse HEAD`, `git status --short --branch`, and `git diff --cached --stat` before and after the rehearsal. The pre/post commit hash must match, the index must remain empty, and any expected local documentation notes must be explicitly listed.
- Build artifacts: identify the build artifacts used for the rehearsal, including `.next/` build output, server bundles, static JS/CSS assets, and any deployment package or manifest used for staging. Compute SHA256 checksums for each listed artifact before and after the rollback rehearsal, compare the checksum files, and store both checksum files plus the comparison output.
- Evidence storage: archive all QA-025 rollback evidence in the QA artifact store from `docs/setup/qa-artifact-store.md` alongside the rollback-plan evidence required by `docs/planning/mvp-rollback-plan.md`.
- Traceability: assumptions, blockers discovered, related issue/PR if any, and confirmation that the repository and build artifacts remained unchanged and reviewable after the rehearsal.

### QA-025 Build Artifact Checksum Runbook

Run these commands from the repository root in the staging rehearsal workspace after a production build has produced the artifacts used for the rollback dry-run. Replace `<environment>` and `<project-code>` with the QA artifact-store folder values from `docs/setup/qa-artifact-store.md`.

```bash
if [ ! -d apps/web/.next ]; then
  echo "apps/web/.next is missing. Run npm run build before QA-025 checksum capture."
  exit 1
fi
mkdir -p qa-025-checksums
{
  find apps/web/.next -type f -print0
  find . -maxdepth 3 -type f \( -name '*build*.zip' -o -name '*deploy*.zip' -o -name 'BUILD_MANIFEST*' \) -print0
} | sort -zu > qa-025-checksums/artifacts.null
if [ ! -s qa-025-checksums/artifacts.null ]; then
  echo "ERROR: No build artifacts matched QA-025 patterns."
  echo "Expected apps/web/.next files and/or *build*.zip, *deploy*.zip, or BUILD_MANIFEST* within repository root depth 3."
  echo "Action: run npm run build first, verify the build succeeded, list apps/web/.next, or update artifact patterns to match the deployment package."
  exit 1
fi
xargs -0 sha256sum < qa-025-checksums/artifacts.null > qa-025-checksums/pre-rollback.sha256
git rev-parse HEAD > qa-025-checksums/pre-git-head.txt
git status --short --branch > qa-025-checksums/pre-git-status.txt
```

After the rollback rehearsal completes, recompute and compare:

```bash
xargs -0 sha256sum < qa-025-checksums/artifacts.null > qa-025-checksums/post-rollback.sha256
git rev-parse HEAD > qa-025-checksums/post-git-head.txt
git status --short --branch > qa-025-checksums/post-git-status.txt
diff -u qa-025-checksums/pre-rollback.sha256 qa-025-checksums/post-rollback.sha256 > qa-025-checksums/checksum-comparison.diff
diff -u qa-025-checksums/pre-git-head.txt qa-025-checksums/post-git-head.txt > qa-025-checksums/git-head-comparison.diff
diff -u qa-025-checksums/pre-git-status.txt qa-025-checksums/post-git-status.txt > qa-025-checksums/git-status-comparison.diff
```

Archive `artifacts.null`, both checksum files, all comparison outputs, and the pre/post git outputs under `<environment>/<project-code>/QA-025/` in the QA artifact store. Required metadata: operator ID, UTC timestamp, staging deployment ID, rollback-plan evidence package ID, and confirmation that any non-empty diff is either expected and documented or classified as a launch blocker.

## Negative Permission Checks

| ID | Scenario | Procedure | Expected rejection | Evidence | Control reference |
| --- | --- | --- | --- | --- | --- |
| QA-026 | Guest token cannot open authenticated app routes | Use request ID `QA-026-<timestamp>` and a valid guest public token to request `/platform` plus one project/admin route | Exact `401` or `403`; response body contains only a generic auth/permission error and no project, user, role, guest, payment, audit, or internal-note fields | request ID, response payload, route, and assertions from the negative-case table below | Public-token resolver and authenticated route middleware |
| QA-027 | Bride cannot edit groom-only guests or internal/commercial data | Use request ID `QA-027-<timestamp>`; sign in as bride and attempt groom-only guest edit plus revenue, payment, audit-log, and internal-note access | Exact `403`; response omits groom-only mutable data, revenue/payment fields, audit entries, and internal notes | request ID, guest/project IDs, response payload, and assertions from the negative-case table below | `guests.*` side helpers, payment/report permissions, RLS |
| QA-028 | Groom cannot edit bride-only guests or internal/commercial data | Use request ID `QA-028-<timestamp>`; sign in as groom and attempt bride-only guest edit plus revenue, payment, audit-log, and internal-note access | Exact `403`; response omits bride-only mutable data, revenue/payment fields, audit entries, and internal notes | request ID, guest/project IDs, response payload, and assertions from the negative-case table below | `guests.*` side helpers, payment/report permissions, RLS |
| QA-029 | Partner cannot access internal/admin project surfaces | Use request ID `QA-029-<timestamp>`; sign in as partner and request internal reports, payment exception approval, audit logs, and another partner project | Exact `403`; response omits unrelated project, admin, payment, audit, and internal-report fields | request ID, partner/project IDs, response payload, and assertions from the negative-case table below | Partner scope helpers and partner/project RLS |
| QA-030 | Check-in staff cannot access unrelated event or admin workflows | Use request ID `QA-030-<timestamp>`; sign in as check-in staff and request contracts, payments, global reports, unrelated seating admin, and unrelated event check-in | Exact `403`; response omits unrelated event/project/admin data while assigned event access remains limited | request ID, event/project IDs, response payload, and assertions from the negative-case table below | Check-in event membership helpers and event RLS |
| QA-031 | Operations staff cannot perform admin-only functions without grant | Use request ID `QA-031-<timestamp>`; sign in as operations/staff without admin grant and attempt admin-only settings, user, pricing, or permission changes | Exact `403`; response omits privileged settings/user/pricing data and no privileged mutation occurs | request ID, attempted action, response payload, and assertions from the negative-case table below | Permission registry and `admin`/commercial helpers |
| QA-032 | Assigned roles cannot access unassigned projects | Use request IDs `QA-032-<role>-<timestamp>`; sign in as staff, bride, groom, and partner users and request a project where each has no assignment | Exact `403` or `404`; response omits project, guest, event, file, payment, and audit payloads | request IDs, project IDs, response payloads, and assertions from the negative-case table below | Project membership helpers and project RLS |
| QA-033 | Users cannot self-escalate roles or permissions | Use request ID `QA-033-<timestamp>` and attempt role assignment or permission mutation for the current user through user-facing API/page flows | Exact `403`; response omits role assignment internals and role assignments remain unchanged | request ID, user ID, response payload, and assertions from the negative-case table below | Role-assignment RPCs, permission helpers, audit triggers |
| QA-034 | Invalid guest tokens are rejected | Use request IDs `QA-034-<token-state>-<timestamp>` and request public guest pages with expired, revoked, malformed, and unrelated tokens | Exact `401`, `403`, or `404`; response omits guest, project, event, RSVP, invitation, and file data | request ID, token state, response payload, and assertions from the negative-case table below | Guest public token resolver and token RLS/RPC checks |
| QA-035 | Anonymous callers cannot execute authenticated app RPCs | Use request ID `QA-035-<rpc-name>-<timestamp>` and attempt unauthenticated public-schema RPC execution for authenticated-only functions; exclude the five documented guest-token RPCs | Exact `401`, `403`, or permission denied; response omits protected data and no RPC side effect occurs | request ID, RPC name, response payload, and assertions from the negative-case table below | Sprint 15 RPC grant migration and `docs/qa/rls-review.md` |
| QA-036 | Anonymous users cannot execute authenticated API workflows | Use request ID `QA-036-<route>-<timestamp>` and request authenticated API routes without a session | Exact `401`; response body is empty or contains only a generic auth error, with no workflow data | request ID, route, response payload, and assertions from the negative-case table below | Auth middleware, server action guards, API permission helpers |

### Required Negative-Case Assertions

For QA-026 through QA-036, attach the exact request ID to the request where the app supports request IDs. If a route does not support request IDs, capture the server or proxy-generated correlation ID from response headers or server logs. If neither exists, generate a canonical local ID in the format `QA-<scenario>-<ISO8601-timestamp>-<tester-initials>`, record it in the QA ticket, and pair it with the route, timestamp, tester, and response evidence. Use read-only `select` queries in staging after each rejected request and archive the query output plus the chosen request/correlation ID in the QA artifact store.

| ID | Database assertion | Audit assertion | Response assertion |
| --- | --- | --- | --- |
| QA-026 | Project, user, role, guest, RSVP, invitation, file, payment, and audit rows for the targeted project remain unchanged when queried by project ID and guest token ID | `select * from audit_logs where request_id = '<request-id>' and action not like '%denied%';` returns zero mutation rows | Status is exactly `401` or `403`; JSON has no protected model fields and no signed URLs |
| QA-027 | `guests`, guest event assignments, tags, payments, reports, and audit rows for the groom-side guest/project keep their pre-test values by guest ID and project ID | No create/update/delete audit rows exist for the request ID; a denial audit entry is allowed only if its action is explicitly permission-denied | Status is exactly `403`; body includes no groom mutable fields, payment data, revenue data, audit snapshots, or internal notes |
| QA-028 | `guests`, guest event assignments, tags, payments, reports, and audit rows for the bride-side guest/project keep their pre-test values by guest ID and project ID | No create/update/delete audit rows exist for the request ID; a denial audit entry is allowed only if its action is explicitly permission-denied | Status is exactly `403`; body includes no bride mutable fields, payment data, revenue data, audit snapshots, or internal notes |
| QA-029 | Partner-owned project rows, unrelated project rows, payment exceptions, internal reports, and audit rows remain unchanged by partner ID and project ID | No privileged approval, report-read, or audit-read action is recorded for the request ID | Status is exactly `403`; body includes no unrelated project/admin payload and no payment or report details |
| QA-030 | Event check-in rows, seating rows, contract rows, payment rows, and report rows remain unchanged by event ID/project ID | No contract/payment/report/seating/check-in mutation audit row is recorded for the request ID | Status is exactly `403`; body includes no unrelated event, seating, contract, payment, report, or admin data |
| QA-031 | Role assignments, permission grants, pricing rules, settings, and user rows remain unchanged by user ID and attempted object ID | No role, permission, pricing, or settings mutation audit row is recorded for the request ID | Status is exactly `403`; body includes no privileged settings, user, pricing, role, or permission payload |
| QA-032 | Project, membership, event, guest, file, payment, report, and audit rows for each unassigned project remain unchanged by role-specific request ID | No read-success or mutation audit row is recorded for the request ID; denial audit entries must not include snapshots | Status is exactly `403` or `404`; body includes no project, event, guest, file, payment, report, or audit fields |
| QA-033 | User role assignments and permission grants for the current user keep their pre-test values by user ID | No role-assignment or permission-grant mutation audit row is recorded for the request ID | Status is exactly `403`; body includes no role assignment internals or permission grant payload |
| QA-034 | Guest token, guest, RSVP, invitation, and file rows remain unchanged by token state and guest ID | No RSVP, invitation, file download, or guest-message mutation audit row is recorded for the request ID | Status is exactly `401`, `403`, or `404`; body includes no guest, project, event, RSVP, invitation, or file payload |
| QA-035 | Tables touched by the targeted RPC remain unchanged by primary key/project ID; for unknown RPC side effects, compare pre/post row counts and capture checksums or representative column values such as `updated_at`, `status`, and simple aggregates for documented module tables | No successful RPC action or mutation audit row is recorded for the request ID | Status is exactly `401`, `403`, or permission denied; body includes no protected records or signed URLs |
| QA-036 | Tables for the targeted API workflow remain unchanged by primary key/project ID/guest ID | No workflow success or mutation audit row is recorded for the request ID | Status is exactly `401`; body is empty or a generic auth error and includes no workflow payload |

## Post-QA Cleanup

- Delete or archive fake projects, guests, files, messages, and partner submissions if the QA environment is reused.
- Revoke guest public tokens used during testing.
- Remove temporary test users or disable them if they are not needed for future staging checks.
- Preserve logs and audit IDs for failed or launch-risk scenarios.

## Escalation Procedures

- Mark any failed scenario as `launch_blocker`, `launch_risk`, `acceptable_mvp_risk`, or `post_launch_follow_up`.
- Open a GitHub issue or PR comment with the scenario ID, requirement group, environment, data IDs, and reproduction steps.
- Escalate `launch_blocker` and unresolved `launch_risk` items to the Diginoces owner role through the internal operations channel configured outside this repository.

## Sign-Off Requirements

- Required approvers: Diginoces owner role, operations lead, and engineering lead.
- All QA-001 through QA-036 scenarios must have pass/fail evidence.
- Any QA-001 through QA-036 failure must have a classification, owner, and linked issue/PR before production launch.
- Launch decision must be updated in `docs/planning/mvp-launch-checklist.md` only after all QA-001 through QA-036 scenarios are executed and documented.

## Result Recording

For MVP launch, record each scenario with: tester initials, environment, date, data IDs, screenshot/log links, pass/fail, classification, and related requirement/backlog/issue/PR link. Store real artifact URLs outside git and update `docs/qa/mvp-qa-evidence-ledger.md` with opaque evidence IDs only. The Sprint 15 completion report must include an aggregated summary table with counts by classification and an explicit launch-decision flag.
