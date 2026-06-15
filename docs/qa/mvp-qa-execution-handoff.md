# MVP QA Execution Handoff

Traceability: GitHub issue `#58`; Sprint 15 issue `#31`; sprint plan
`docs/planning/sprint-15-plan.md`; release backlog `EPIC-RELEASE`, especially
`FEAT-REL-001`, `FEAT-REL-002`, `FEAT-REL-005`, and `FEAT-REL-010`; source
scenarios `docs/qa/mvp-manual-qa-scenarios.md`; evidence ledger
`docs/qa/mvp-qa-evidence-ledger.md`.

## Purpose

This handoff turns the remaining production sign-off gate into an execution
package for QA, Operations, and Engineering. It does not replace the detailed
scenario definitions in `docs/qa/mvp-manual-qa-scenarios.md`; it defines the
run order, artifact expectations, ledger update rules, and sign-off checkpoints
needed to move the MVP from `no_go` to a production decision.

Do not commit screenshots, credentials, raw exports, client data, guest data,
artifact-store URLs, or private runbook links. Store real evidence only in the
external encrypted QA artifact store from `docs/setup/qa-artifact-store.md` and
record opaque evidence IDs in git.

## Execution Inputs

Before starting, confirm these inputs exist outside the repository:

- target environment name and URL;
- target Supabase project reference;
- staging or production-candidate deployment ID;
- external QA artifact-store endpoint in the secure release runbook;
- fake QA project code and primary IDs;
- fake admin, operations, bride, groom, partner, check-in staff, and guest-token
  access credentials in the approved vault;
- MFA decision evidence for sensitive roles;
- release owner, QA lead, operations lead, and engineering lead names.

Current selected inputs from the Diginoces owner on 2026-06-15:

- QA artifact store: Google Drive under `diginoces@gmail.com`, tracked in git
  only as opaque runbook reference `RBR-GDRIVE-MVP-LAUNCH-001`.
- Staging target: Vercel deployment. Preview build evidence
  `VCL-STAGING-20260615-001` is recorded externally after a `READY` deployment.
- Production domain target: `diginoces.com`, with DNS currently managed through
  Bluehost.
- MFA decision: enforce MFA for all sensitive/admin roles before launch.
- Monitoring owner: Carl.
- Monitoring backup owner: Diginoces operations.
- Alert channels: email and dashboard.
- Rollback owner: Carl.
- Rollback approach: approved.

Still required before scenario execution:

- App-level Vercel staging smoke after Preview environment variables and
  staging access are configured.
- Target Supabase project reference for staging.
- Vercel Preview environment-variable configuration evidence without exposing
  values; `vercel env ls preview` returned no variables on 2026-06-15.
- Vercel-authenticated tester access, a protected-access bypass, or an approved
  staging custom domain because direct staging requests currently receive
  Vercel Authentication `401` before app code.
- Google Drive folder/access verification evidence.
- Opaque evidence IDs for each completed scenario.

If any input is missing, record the missing item in issue `#58` and keep the
ledger rows as `pending_external_artifact` or `blocked`.

## Required Preflight

Run these checks on the target branch and target environment before scenario
execution:

| Gate | Evidence to store externally | Git update |
| --- | --- | --- |
| CI green | CI run ID and status | Reference opaque CI evidence ID in issue `#58` or release runbook |
| Build and smoke | Build log, deployment ID, `/api/health` response | Do not commit raw logs |
| Database migrations | Migration list, dry-run output, `db:lint` output | Update launch checklist only with opaque evidence ID |
| RLS/RPC grants | `docs/qa/rls-review.md` query output | Record zero-row result evidence ID |
| Security checks | dependency audit, secret scan, advisor output | Record opaque evidence ID |
| Artifact store | upload/read/deny test evidence | Update `QA Infrastructure Readiness` in `docs/planning/mvp-launch-checklist.md` |
| MFA decision | enforcement or accepted-risk evidence | Update `Security & Access` in `docs/planning/mvp-launch-checklist.md` |

## Run Order

Use one fake project for the happy-path scenario chain unless a scenario needs a
separate negative fixture. Preserve primary IDs in the external artifact package.

Scenario anchors covered by this handoff: `QA-001`, `QA-002`, `QA-003`,
`QA-004`, `QA-005`, `QA-006`, `QA-007`, `QA-008`, `QA-009`, `QA-010`,
`QA-011`, `QA-012`, `QA-013`, `QA-014`, `QA-015`, `QA-016`, `QA-017`,
`QA-018`, `QA-019`, `QA-020`, `QA-021`, `QA-022`, `QA-023`, `QA-024`,
`QA-025`, `QA-026`, `QA-027`, `QA-028`, `QA-029`, `QA-030`, `QA-031`,
`QA-032`, `QA-033`, `QA-034`, `QA-035`, and `QA-036`.

| Phase | Scenario IDs | Owner | Goal |
| --- | --- | --- | --- |
| Access and setup | `QA-001` through `QA-004` | QA lead and operations lead | Prove app health, admin sign-in, fake project/events, and commercial gates |
| Guest foundation | `QA-005` through `QA-008` | QA lead | Prove manual guests, import preview/review/apply, and event assignment |
| Guest-facing flow | `QA-009` through `QA-013` | QA lead and operations lead | Prove public token, RSVP, invitation foundation, generation, and manual WhatsApp readiness |
| Operations flow | `QA-014` through `QA-018` | Operations lead | Prove seating, table-card export, QR check-in, manual check-in, and unexpected guest review |
| Reporting and partner flow | `QA-019` through `QA-021` | QA lead and operations lead | Prove guest wishes, reports/audit/files, and partner project boundaries |
| Security review | `QA-022` through `QA-024` | Engineering lead | Prove RLS/security review and monitoring ownership |
| Rollback rehearsal | `QA-025` | Engineering lead and operations lead | Prove non-destructive fallback and checksum process |
| Negative access checks | `QA-026` through `QA-036` | QA lead and engineering lead | Prove public-token, role, scope, RPC, and anonymous API boundaries |

## Artifact Checklist Per Scenario

Each `QA-001` through `QA-036` folder in the artifact store must include:

- scenario ID;
- tester ID;
- UTC timestamp;
- target environment;
- app deployment ID or commit SHA;
- fake project/event/guest/import/message/file IDs used by the scenario;
- browser, viewport, and device mode where relevant;
- pass/fail status;
- classification when not `pass`;
- screenshots or logs needed to prove the expected result;
- request/response evidence for API or negative permission checks;
- database or audit query output where the scenario requires it;
- cleanup notes for disposable fake data.

Use the filename convention from `docs/setup/qa-artifact-store.md`, for example:

```text
20260607T120000Z__tester=qa_lead__scenario=QA-001.png
20260607T120500Z__tester=qa_lead__scenario=QA-036__artifact=response.json
```

## Ledger Update Rules

After each scenario is executed:

1. Store real artifacts externally.
2. Replace `QAART-pending` in `docs/qa/mvp-qa-evidence-ledger.md` with an
   opaque evidence ID only.
3. Set `Current status` to `pass`, `fail`, `blocked`, or `waived`.
4. Set `Classification` to `not_classified` only for `pass`; otherwise use
   `launch_blocker`, `launch_risk`, `acceptable_mvp_risk`, or
   `post_launch_follow_up`.
5. Add a linked issue or PR reference for every `fail`, `blocked`, or `waived`
   row, using an opaque external evidence ID if the link itself is sensitive.
6. Recalculate the aggregated status counts.
7. Keep `Production decision from this ledger` as `no_go` until every row has
   evidence and every non-pass row has owner approval.

## Negative Permission Evidence

For `QA-026` through `QA-036`, capture the exact request route, method, status,
response body, and no-mutation database assertion required by
`docs/qa/mvp-manual-qa-scenarios.md`.

The evidence package must prove:

- protected payload fields are absent;
- generic `401`, `403`, `404`, or permission-denied responses are returned;
- no unauthorized mutation audit rows exist;
- denial audit entries, if present, do not include protected snapshots;
- public guest tokens do not authenticate app routes;
- authenticated-only RPCs are not callable by anonymous users.

## Sign-Off Sequence

Move toward launch in this order:

1. QA lead confirms all scenario folders exist and ledger counts match 36 rows.
2. Engineering lead confirms security, RLS, RPC, migration, and secret-scan
   evidence.
3. Operations lead confirms monitoring, rollback, manual WhatsApp, manual
   payment, and check-in fallback evidence.
4. Diginoces owner role reviews all non-pass classifications and accepts or
   rejects each risk.
5. Release manager updates `docs/planning/mvp-launch-checklist.md`.
6. Issue `#58` is closed only after production decision evidence is complete.

## Go Criteria

Production can move from `no_go` only when:

- all 36 QA scenarios have external evidence IDs;
- no `pending_external_artifact` rows remain;
- every failed, blocked, or waived scenario has an owner, classification,
  remediation path, and approval evidence;
- MFA handling is enforced or formally accepted for the launch mode;
- target-environment migrations, advisors, `db:lint`, and RPC grant checks pass;
- monitoring and rollback owners have signed off;
- no real secrets or private client/guest data are committed.

If these conditions are not all met, keep issue `#58` open and leave the launch
decision as `no_go` or `conditional_go` for controlled staging only.
