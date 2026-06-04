# MVP Launch Checklist - Sprint 15

## Launch Recommendation

Current recommendation: `conditional_go`.

The MVP can proceed to controlled staging QA after Sprint 15 changes for issue `#31` and sprint plan `docs/planning/sprint-15-plan.md` are merged. Production launch should wait until all required launch gates below are checked, every gate remains mapped to requirement IDs/backlog items per `AGENTS.md`, and any failed item is classified.

## Checklist

| Area | Gate | Status before merge | Required before production |
| --- | --- | --- | --- |
| Product scope | Sprints 1-14 MVP foundations present | Ready for verification | Confirm no Sprint 16+ scope is required |
| Requirements coverage | MVP coverage review exists | Added in Sprint 15 | Review `docs/planning/mvp-requirements-coverage.md` with Diginoces owner |
| CI | `npm ci`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run env:check-public`, `npm run build`; Supabase/database checks where linked access exists | Pending final PR checks | Green CI |
| Dependencies | `npm audit --omit=dev` | Pending final run | 0 vulnerabilities or documented exception |
| TD-001 | Next.js canary reviewed | Accepted MVP risk / still open | Recheck stable Next.js before production readiness; see `docs/planning/mvp-known-limitations.md` and `docs/planning/mvp-requirements-coverage.md` |
| Supabase migrations | Sprint 15 grant migration added | Pending apply | Apply and verify linked project |
| RLS/security | Advisors reviewed | Findings documented | Re-run advisors after migration and complete `docs/qa/rls-review.md` post-apply verification |
| Secrets | No committed real secrets/private data | Pending final scan | Clean targeted scan |
| Permissions | Role boundary review exists | Added in Sprint 15 | Run manual role QA |
| MFA | Sensitive roles require MFA metadata | Risk remains | Follow MFA decision flow below; enforce/configure MFA or restrict launch with accepted risk |
| Storage | Private buckets and signed URLs documented | Ready for verification | Confirm bucket policies in target project |
| Public guest access | Token-scoped flows documented | Ready for verification | Manual token isolation QA |
| Manual workflows | WhatsApp/payments/Canva fallbacks documented | Ready | Operations accepts manual workflow |
| Staging smoke | Scenario checklist exists | Added in Sprint 15 | Run all scenarios in `docs/qa/mvp-manual-qa-scenarios.md` and record results in the secure QA artifact store from `docs/setup/qa-artifact-store.md` |
| Rollback | Rollback plan exists | Added in Sprint 15 | Owner acknowledges fallback process in `docs/planning/mvp-rollback-plan.md` |
| Monitoring | Post-launch plan exists | Added in Sprint 15 | Assign owners and response paths in `docs/qa/post-launch-monitoring.md` |

## Security & Access

Record post-apply RLS/RPC grant verification sign-off here before production promotion:

| Signer name | Role | Date | Evidence link |
| --- | --- | --- | --- |
| Pending | Engineering lead | Pending | Link to post-apply `docs/qa/rls-review.md` query result in the QA artifact store |
| Pending | Operations lead | Pending | Link to post-apply `docs/qa/rls-review.md` query result in the QA artifact store |

## QA Infrastructure Readiness

Record QA artifact-store verification here before manual staging QA begins:

| Item | Owner | Status | Evidence link |
| --- | --- | --- | --- |
| Artifact store endpoint available in external secure release runbook | Operations lead | Pending | Link to access-controlled runbook entry |
| QA access ticketing flow or approved temporary fallback documented | Engineering lead | Pending | Link to ticket or approved encrypted-vault note |
| Upload/read authorization and unauthorized denial verified | QA lead | Pending | Link to fake smoke artifact and access-test evidence |
| Retention, encryption, and audit logging verified | Engineering lead | Pending | Link to provider configuration evidence |

## MFA Decision Flow

Each MFA decision must include requirement/backlog traceability (`ROLE-009`, `FEAT-REL-002`), active sprint plan `docs/planning/sprint-15-plan.md`, GitHub issue `#31`, owner, date, environment, affected roles, and evidence link.

Evaluate outcomes in order: use `Enforce MFA` when complete production controls are ready, use `Configure MFA` only for an accepted controlled-pilot exception with a dated remediation plan, and use `Restrict launch` when neither condition is satisfied or the exception evidence is missing/expired.

| Outcome | Trigger conditions | Required evidence | Owner next steps |
| --- | --- | --- | --- |
| Enforce MFA | Production-ready MFA controls exist for every sensitive role that can access admin, finance, audit, payment, report, file archive, or security-critical workflows | Supabase MFA policy/config evidence, test user result, affected role list, rollback/fallback note | Engineering lead enables/enforces MFA and records QA pass evidence before production |
| Configure MFA | Production-ready MFA controls are not complete, but controlled-pilot access is explicitly accepted with restricted accounts and a dated remediation plan | See `docs/setup/security-risk-acceptance-template.md` for required items: pilot user list, approval artifact, approver identity, remediation deadline/owners, monitoring owner, and evidence storage | Diginoces owner and engineering lead complete the template, restrict accounts, archive the approval link in release evidence, set the remediation deadline, and schedule enforcement |
| Restrict launch | Neither production-ready MFA controls nor an accepted controlled-pilot exception exists, or the remediation owner/deadline is missing or expired | Open blocker ID, failed QA evidence, affected workflows, no-go decision record | Release manager keeps production `no_go` until MFA evidence is complete |

## Go/No-Go Rule

- `go`: all launch gates pass, no open launch blockers, risks accepted by owner.
- `conditional_go`: non-production staging or controlled pilot use is allowed with documented risks, manual fallback, and owner acceptance.
- `no_go`: production deployment is blocked when any `launch_blocker` remains unresolved or unaccepted.

## Current Blocker Handling

Sprint 15 found one database security launch blocker: authenticated app RPCs inherited PUBLIC execute privileges. The fix is `20260603113922_sprint_15_release_security_grants.sql`. This checklist is `conditional_go` only for non-production staging or controlled pilot review until that migration is applied and advisors/checks are rerun on the target project. Production remains `no_go` while the migration is unapplied or the rerun checks are unresolved.

`LIM-010` remains a post-launch performance-advisor follow-up only while `docs/qa/rls-review.md` confirms no RLS misconfiguration, wrong-scope access, or unauthorized data exposure. Any confirmed security/access defect under that limitation immediately escalates to `launch_blocker`.
