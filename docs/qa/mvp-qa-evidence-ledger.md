# MVP QA Evidence Ledger

Traceability: GitHub issue `#31`; sprint plan `docs/planning/sprint-15-plan.md`; release backlog `EPIC-RELEASE`, especially `FEAT-REL-001`, `FEAT-REL-002`, `FEAT-REL-005`, and `FEAT-REL-010`; source scenarios `docs/qa/mvp-manual-qa-scenarios.md`; artifact-store rules `docs/setup/qa-artifact-store.md`.

## Purpose

This ledger is the production sign-off tracker for QA-001 through QA-036. It records only opaque evidence references, statuses, owners, and classifications. Real screenshots, exports, logs, credential references, guest data, client data, and artifact-store URLs must remain outside git in the encrypted QA artifact store or secure release runbook.

Production launch remains `no_go` until every scenario row is either:

- `pass` with an external evidence ID/reference;
- `fail` with a linked blocker issue and accepted classification;
- `waived` with owner approval, remediation date, and external approval reference.

Local and linked-dev Chrome/CDP progress in `docs/qa/mvp-ui-qa-progress-report.md` is useful readiness evidence, but it is not a substitute for the external QA artifact package required before production.

## Current External Evidence Target

Recorded 2026-06-15:

- External QA artifact store: Google Drive under `kandacarl@gmail.com`,
  approved by the Diginoces owner on June 15, 2026 under
  `QAART-20260615-OWNER-001`.
- Opaque runbook reference for git/docs: `RBR-GDRIVE-MVP-LAUNCH-001`.
- Staging deployment target: Vercel. Preview build evidence
  `VCL-STAGING-20260615-001` is stored externally after a `READY` deployment.
  Preview environment configuration and a fresh env-backed `READY` deployment
  are stored externally under `VCL-STAGING-20260615-002`. Protected-access
  bypass setup, server-side Supabase secret-key configuration, and app-level
  smoke are stored externally under `VCL-STAGING-20260615-003`; full scenario
  evidence remains pending.
- Production domain target: `diginoces.com`, with DNS currently managed through
  Bluehost.
- MFA decision: enforce MFA for all sensitive/admin roles before launch.
- Monitoring owner: Carl; backup owner: Diginoces operations; alert channels:
  email and dashboard.
- Rollback owner: Carl; rollback approach approved.

These decisions unblock QA execution planning. Only rows with explicit opaque
evidence IDs below are marked `pass`; each remaining scenario still needs
external artifacts and an opaque evidence ID before production sign-off.

## Status Values

| Status | Meaning |
| --- | --- |
| `pending_external_artifact` | Scenario is defined, but the required external pass/fail evidence package is not recorded here. This blocks production sign-off. |
| `pass` | Scenario passed in the target environment and has an opaque external evidence ID. |
| `fail` | Scenario failed and has a classification, owner, and linked issue/PR. |
| `blocked` | Scenario could not be executed because required access, environment, data, or external artifact infrastructure is missing. |
| `waived` | Scenario is intentionally accepted by the Diginoces owner role and engineering lead with documented remediation. |

## Ledger

| ID | Requirement group | Scenario summary | Current status | Classification | Evidence ID / reference | Owner | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| QA-001 | `PV-*`; `TECH-*` | App loads and health endpoint responds | `pass` | `not_classified` | `QAART-20260615-QA-001` | QA lead | Protected Vercel staging smoke passed for home, health, login, auth redirect, invalid guest token, and unauthenticated protected API denial. |
| QA-002 | `ROLE-*` | Admin signs in and reaches platform routes | `pending_external_artifact` | `not_classified` | `QAART-pending` | QA lead | PR `#76` recorded linked-dev AAL2 internal UI evidence and PR `#77` recorded authenticated read-positive API evidence; external evidence still required. |
| QA-003 | `PROJ-*` | Admin creates a wedding project and events | `pending_external_artifact` | `not_classified` | `QAART-pending` | Operations lead | Use fake project and event data only. |
| QA-004 | `PAY-*`; `RSVP-*`; `MSG-*` | Contract, pricing, and payment gates are configured | `pending_external_artifact` | `not_classified` | `QAART-pending` | Operations lead | Manual payment and gate workflow remains MVP scope. |
| QA-005 | `GM-*`; `ROLE-*` | Manual guest creation and update | `pending_external_artifact` | `not_classified` | `QAART-pending` | QA lead | Must include side-boundary evidence. |
| QA-006 | `GM-*` | CSV guest import mapping and preview | `pending_external_artifact` | `not_classified` | `QAART-pending` | QA lead | CSV-only import scope. |
| QA-007 | `GM-*`; `ROLE-*` | Import review and apply | `pending_external_artifact` | `not_classified` | `QAART-pending` | QA lead | Partial approval and held/rejected rows required. |
| QA-008 | `PROJ-*`; `GM-*` | Event-specific guest assignment | `pending_external_artifact` | `not_classified` | `QAART-pending` | QA lead | Include assigned and unrelated event behavior. |
| QA-009 | `RSVP-*`; `ROLE-*` | Public guest page access gate | `pending_external_artifact` | `not_classified` | `QAART-pending` | QA lead | Token isolation and gate state required. |
| QA-010 | `RSVP-*` | Multi-event RSVP | `pending_external_artifact` | `not_classified` | `QAART-pending` | QA lead | Include Yes/No/Maybe and change-rule behavior. |
| QA-011 | `INV-*`; `PDF-*`; `QR-*` | Invitation template registration and field config | `pending_external_artifact` | `not_classified` | `QAART-pending` | Operations lead | Canva-exported PDF registration foundation only. |
| QA-012 | `INV-*`; `FILE-*` | Invitation generation job foundation | `pending_external_artifact` | `not_classified` | `QAART-pending` | Engineering lead | Include job, record, file/version evidence. |
| QA-013 | `MSG-*` | Guided manual WhatsApp send | `pending_external_artifact` | `not_classified` | `QAART-pending` | Operations lead | No unofficial automation or production API credentials. |
| QA-014 | `SEAT-*`; `RSVP-*` | Seating assignment and capacity checks | `pending_external_artifact` | `not_classified` | `QAART-pending` | QA lead | Include over-capacity state evidence. |
| QA-015 | `SEAT-*`; `FILE-*` | Table-card CSV export | `pending_external_artifact` | `not_classified` | `QAART-pending` | QA lead | Store exported artifact only in approved evidence store. |
| QA-016 | `CHK-*`; `QR-*` | Check-in QR token flow | `pending_external_artifact` | `not_classified` | `QAART-pending` | QA lead | Future check-in token remains separate from guest public token. |
| QA-017 | `CHK-*` | Check-in manual search flow | `pending_external_artifact` | `not_classified` | `QAART-pending` | QA lead | Assigned event staff path required. |
| QA-018 | `CHK-*`; `ROLE-*` | Unexpected guest request review | `pending_external_artifact` | `not_classified` | `QAART-pending` | Operations lead | Include submit and review permission evidence. |
| QA-019 | `WISH-*`; `REP-*` | Public guest wish/message and couple review | `pending_external_artifact` | `not_classified` | `QAART-pending` | QA lead | Include approved export behavior. |
| QA-020 | `REP-*`; `FILE-*` | Reports, exports, audit logs, retention/archive | `pending_external_artifact` | `not_classified` | `QAART-pending` | Engineering lead | PR `#77` redacted audit API snapshot fields and reran a 25/25 authenticated read-positive API matrix; external audit, export, and file lifecycle evidence still required. |
| QA-021 | `PART-*` | Partner profile, submission, and project draft flows | `pending_external_artifact` | `not_classified` | `QAART-pending` | Operations lead | Include partner negative boundaries. |
| QA-022 | `ROLE-*`; `TECH-*` | RLS policy enforcement review | `pass` | `not_classified` | `QAART-20260615-QA-022` | Engineering lead | Linked database lint, dry-run, migration list, advisors, and RPC grant verification were recorded externally; non-allowlisted `PUBLIC`/`anon` execute grant query returned zero rows. |
| QA-023 | `TECH-*`; `FILE-*`; `REP-*` | Security review checklist | `pass` | `not_classified` | `QAART-20260615-QA-023` | Engineering lead | Install, format, lint, typecheck, tests, build, audit, public-env check, and targeted secret scan passed; performance-advisor items remain post-launch follow-up unless staging load evidence escalates them. |
| QA-024 | `REP-*`; `TECH-*` | Monitoring signal validation | `pending_external_artifact` | `not_classified` | `QAART-pending` | Operations lead | Owners and alert response paths required. |
| QA-025 | `ROAD-*`; `TECH-*` | Rollback dry-run | `pending_external_artifact` | `not_classified` | `QAART-pending` | Engineering lead | Include checksum and repository-state evidence. |
| QA-026 | `ROLE-*`; `TECH-*` | Guest token cannot open authenticated app routes | `pending_external_artifact` | `not_classified` | `QAART-pending` | QA lead | Response, DB, and audit assertions required. |
| QA-027 | `ROLE-*`; `GM-*`; `PAY-*`; `REP-*` | Bride cannot edit groom-only guests or internal/commercial data | `pending_external_artifact` | `not_classified` | `QAART-pending` | QA lead | Linked-dev Chrome/CDP found and fixed API internal-field overexposure for the bride-role path; exact external role-boundary evidence is still required. |
| QA-028 | `ROLE-*`; `GM-*`; `PAY-*`; `REP-*` | Groom cannot edit bride-only guests or internal/commercial data | `pending_external_artifact` | `not_classified` | `QAART-pending` | QA lead | Shared API redaction helpers cover guest/project payload internals; exact external groom role-boundary evidence is still required. |
| QA-029 | `ROLE-*`; `PART-*`; `PAY-*`; `REP-*` | Partner cannot access internal/admin project surfaces | `pending_external_artifact` | `not_classified` | `QAART-pending` | QA lead | Include unrelated project denial. |
| QA-030 | `ROLE-*`; `CHK-*`; `SEAT-*`; `PAY-*`; `REP-*` | Check-in staff cannot access unrelated event or admin workflows | `pending_external_artifact` | `not_classified` | `QAART-pending` | QA lead | Include assigned-event control case. |
| QA-031 | `ROLE-*`; `PAY-*`; `TECH-*` | Operations staff cannot perform admin-only functions without grant | `pending_external_artifact` | `not_classified` | `QAART-pending` | Engineering lead | PR `#78` recorded operations-manager-only UI/API access and audit-log denial evidence in linked dev; external no-mutation DB assertions still required. |
| QA-032 | `ROLE-*`; `PROJ-*` | Assigned roles cannot access unassigned projects | `pending_external_artifact` | `not_classified` | `QAART-pending` | QA lead | Linked-dev no-role cleanup sweep passed for the current user after temporary role removal; exact external staff/bride/groom/partner evidence is still required. |
| QA-033 | `ROLE-*`; `TECH-*` | Users cannot self-escalate roles or permissions | `pending_external_artifact` | `not_classified` | `QAART-pending` | Engineering lead | Include role-assignment before/after evidence. |
| QA-034 | `RSVP-*`; `ROLE-*` | Invalid guest tokens are rejected | `pass` | `not_classified` | `QAART-20260615-QA-034` | QA lead | Protected Vercel staging public-page sweep covered expired, revoked, unrelated check-in, and malformed token states; all 4 returned `404`, no protected markers were found, mutation audit rows after the run timestamp were 0, and temporary fake token rows were cleaned up. |
| QA-035 | `TECH-*`; `ROLE-*` | Anonymous callers cannot execute authenticated app RPCs | `pass` | `not_classified` | `QAART-20260615-QA-035` | Engineering lead | Linked target grant verification found 55 authenticated-only RPC signatures and 0 anon/PUBLIC execute violations; anonymous REST sweep returned 404 for all 55 with no protected record fields, and audit rows after the run timestamp were 0. |
| QA-036 | `TECH-*`; `ROLE-*` | Anonymous users cannot execute authenticated API workflows | `pass` | `not_classified` | `QAART-20260615-QA-036` | Engineering lead | Protected Vercel staging sweep covered 66 source-derived authenticated API route/method combinations; all returned generic `401`, and timestamp-bounded audit query returned zero rows. |

## Aggregated Status

| Status | Count |
| --- | ---: |
| `pending_external_artifact` | 30 |
| `pass` | 6 |
| `fail` | 0 |
| `blocked` | 0 |
| `waived` | 0 |

Production decision from this ledger: `no_go` until external evidence is recorded for all 36 scenarios or formally classified with owner approval.

## Update Procedure

1. Run the scenario in the target staging or production-candidate environment using fake data only.
2. Store screenshots, logs, exports, query output, and request/response artifacts in the external encrypted artifact store.
3. Replace `QAART-pending` with an opaque evidence ID or runbook reference, not a direct URL.
4. Set `Current status` to `pass`, `fail`, `blocked`, or `waived`.
5. If status is not `pass`, set a launch classification and link the issue/PR through an opaque reference.
6. Update the aggregated status counts and `docs/planning/mvp-launch-checklist.md`.

