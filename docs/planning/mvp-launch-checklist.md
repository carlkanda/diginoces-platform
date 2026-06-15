# MVP Launch Checklist - Sprint 15

## Launch Recommendation

Current recommendation: `conditional_go`.

The MVP can proceed to controlled staging QA after Sprint 15 changes for issue `#31` and sprint plan `docs/planning/sprint-15-plan.md` were merged. Production launch should wait until all required launch gates below are checked for the target environment, every gate remains mapped to requirement IDs/backlog items per `AGENTS.md`, and any failed item is classified.

## Checklist

| Area | Gate | Current status | Required before production |
| --- | --- | --- | --- |
| Product scope | Sprints 1-15 MVP foundations present | Ready for staging QA | Confirm no Sprint 16+ scope is required |
| Requirements coverage | MVP coverage review exists | Added in Sprint 15 | Review `docs/planning/mvp-requirements-coverage.md` with Diginoces owner |
| CI | `npm ci`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run env:check-public`, `npm run build`; Supabase/database checks where linked access exists | Green on PR `#48` after MVP role-boundary hardening; later linked-dev QA evidence PRs `#76`, `#77`, and `#78` passed Verify and CodeRabbit | Green CI on target release branch |
| Dependencies | `npm audit --omit=dev` | Passed on PR `#48` with 0 vulnerabilities | 0 vulnerabilities or documented exception |
| TD-001 | Next.js canary reviewed | Accepted MVP risk / still open | Recheck stable Next.js before production readiness; see `docs/planning/mvp-known-limitations.md` and `docs/planning/mvp-requirements-coverage.md` |
| Supabase migrations | Sprint 15 grant migration added | Applied to linked dev on June 4, 2026; dry-run on June 6, 2026 reported remote database is up to date | Apply and verify every target project that differs from linked dev |
| RLS/security | Advisors reviewed | Linked dev June 6, 2026 security advisor refresh returned 34 authenticated security-definer warnings, 3 token-scoped anon security-definer warnings, and 1 leaked-password warning; RPC grant verification returned zero non-allowlisted `PUBLIC`/`anon` execute grants | Re-run advisors and `docs/qa/rls-review.md` verification in the target environment |
| Secrets | No committed real secrets/private data | Maintained scan passed before merge | Clean targeted scan |
| Permissions | Role boundary review exists | Exact linked-dev role QA passed on PR `#48` for bride, groom, partner, and check-in staff boundaries; PRs `#76` through `#78` added AAL2 admin/operations UI and API evidence plus operations-manager-only denial evidence; full external QA evidence package still required | Run full QA-026 through QA-036 evidence capture in the target QA artifact store |
| MFA | Sensitive roles require MFA metadata | Diginoces owner decision recorded on June 15, 2026: enforce MFA for all sensitive/admin roles before launch; AAL2 browser QA passed through `/login/mfa`, including the June 15, 2026 linked-dev admin/operations refresh | Configure and verify MFA enforcement in the target Vercel/Supabase environment, then store evidence externally under `RBR-GDRIVE-MVP-LAUNCH-001` |
| Storage | Private buckets and signed URLs documented | Ready for verification | Confirm bucket policies in target project |
| Public guest access | Token-scoped flows documented | Ready for verification | Manual token isolation QA |
| Manual workflows | WhatsApp/payments/Canva fallbacks documented | Ready | Operations accepts manual workflow |
| Staging smoke | Scenario checklist and evidence ledger exist | Google Drive QA runbook `RBR-GDRIVE-MVP-LAUNCH-001` initialized; staging target selected as Vercel; local/linked-dev Chrome/CDP QA has covered the major MVP flows and exact low-privilege boundaries, with June 15, 2026 AAL2 UI/API and operations-manager-only evidence recorded in `docs/qa/mvp-ui-qa-progress-report.md`; `docs/qa/mvp-qa-evidence-ledger.md` tracks QA-001 through QA-036, all still pending external artifact evidence for production sign-off | Create/verify the Vercel staging deployment, run the handoff in `docs/qa/mvp-qa-execution-handoff.md`, execute all scenarios in `docs/qa/mvp-manual-qa-scenarios.md`, store artifacts in Google Drive under `RBR-GDRIVE-MVP-LAUNCH-001`, and update `docs/qa/mvp-qa-evidence-ledger.md` with opaque evidence IDs |
| Rollback | Rollback plan exists | Rollback owner recorded as Carl on June 15, 2026; rollback approach approved | Execute non-destructive rollback rehearsal and store evidence externally before production |
| Monitoring | Post-launch plan exists | Monitoring owner recorded as Carl; backup owner Diginoces operations; alert channels email and dashboard | Configure and test monitoring in staging/production target; store alert-rule and test-alert evidence externally |

## Security & Access

Record post-apply RLS/RPC grant verification sign-off here before production promotion:

| Signer name | Role | Date | Evidence ID / Reference |
| --- | --- | --- | --- |
| Linked dev RPC grant verification | Engineering lead | 2026-06-04 | Query result: zero non-allowlisted `PUBLIC`/`anon` execute grants; opaque runbook reference to be stored externally |
| Linked dev PR #48 role-boundary and advisor refresh | Engineering lead | 2026-06-06 | PR `#48`; Verify and CodeRabbit passed; RPC grant verification returned zero rows; external evidence package still pending |
| Linked dev AAL2 admin/operations and operations-only QA refresh | Engineering lead | 2026-06-15 | PRs `#76`, `#77`, and `#78`; authenticated UI/API and operations-manager-only evidence recorded in `docs/qa/mvp-ui-qa-progress-report.md`; external evidence package still pending |
| MFA enforcement decision | Diginoces owner role | 2026-06-15 | Enforce MFA for all sensitive/admin roles before launch; target-environment enforcement evidence pending in `RBR-GDRIVE-MVP-LAUNCH-001` |
| Monitoring and rollback ownership | Diginoces owner role | 2026-06-15 | Monitoring owner Carl; backup Diginoces operations; email/dashboard alerts; rollback owner Carl; rollback approach approved; rehearsal/test evidence pending in `RBR-GDRIVE-MVP-LAUNCH-001` |

## QA Infrastructure Readiness

Record QA artifact-store verification here before manual staging QA begins:

| Item | Owner | Status | Evidence ID / Reference |
| --- | --- | --- | --- |
| Artifact store endpoint available in external secure release runbook | Operations lead | Initialized | Google Drive under `diginoces@gmail.com`; opaque runbook ref `RBR-GDRIVE-MVP-LAUNCH-001`; private URL stored externally only |
| QA access ticketing flow or approved temporary fallback documented | Engineering lead | Pending | Ticket ID: QA-pending - URL stored in secured runbook or vault |
| Upload/read authorization and unauthorized denial verified | QA lead | Pending | Artifact ID: QAART-pending - URL stored in secured runbook |
| Retention, encryption, and audit logging verified | Engineering lead | Pending | Artifact ID: QAART-pending - URL stored in secured runbook |
| Local filename parser and regression coverage | Engineering lead | 2026-06-06 | `validateArtifactFilename` / `sanitizeTesterId`; `npm --workspace apps/web run test -- --run src/lib/platform/release-readiness.test.ts`; external endpoint verification still pending |

Store real evidence endpoints only in the external runbook, ticket system, or vault described by `docs/setup/qa-artifact-store.md`; this checklist records opaque references only.

## MFA Decision Flow

Each MFA decision must include requirement/backlog traceability (`ROLE-009`, `FEAT-REL-002`), active sprint plan `docs/planning/sprint-15-plan.md`, GitHub issue `#31`, owner, date, environment, affected roles, and an opaque evidence ID/reference. Store real evidence URLs only in the external runbook or vault.

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

Sprint 15 found one database security launch blocker: authenticated app RPCs inherited PUBLIC execute privileges. The fix is `20260603113922_sprint_15_release_security_grants.sql`. That migration was applied to the linked dev project on June 4, 2026, linked dry-run now reports the remote database is up to date, `db:lint` reports no schema errors, and the corrected grant verification query returned zero non-allowlisted `PUBLIC`/`anon` execute grants.

Production remains target-environment gated: if production or staging uses a different Supabase project than linked dev, repeat migration apply, linked dry-run, `db:lint`, advisors, and RPC grant verification there before changing this checklist to `go`.

`LIM-010` remains a post-launch performance-advisor follow-up only while `docs/qa/rls-review.md` confirms no RLS misconfiguration, wrong-scope access, or unauthorized data exposure. Any confirmed security/access defect under that limitation immediately escalates to `launch_blocker`.
