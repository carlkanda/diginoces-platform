# Post-Launch Monitoring Plan - MVP

Traceability: GitHub issue `#31`; sprint plan `docs/planning/sprint-15-plan.md`; release backlog `EPIC-RELEASE`, especially `FEAT-REL-009` and `FEAT-REL-010`.

## Purpose

This plan defines the first operational monitoring loop after MVP launch or controlled pilot launch.

## Signals To Monitor

| Area | Trigger threshold | Owner | Approval and fallback |
| --- | --- | --- | --- |
| App availability | Hosted uptime monitor or scheduled health poll fails 2 consecutive 5-minute checks, or error rate exceeds 5% for 15 minutes based on 5-minute sampling | Operations | Engineering lead may roll back app deploy; use `docs/planning/mvp-rollback-plan.md#application-rollback` |
| Auth | Login failures exceed 5% of attempts, MFA/session errors affect sensitive roles, or unexpected anonymous access appears | Admin/engineering | Diginoces owner role approves sensitive-role pause; refer to internal operations documentation for the designated incident notification channel or on-call rota, not personal contacts in repo |
| Supabase database | API/RPC error rate exceeds 2%, any RLS denial affects an authorized flow, or repeated queries exceed 2 seconds | Engineering lead | Engineering lead classifies blocker/risk and opens corrective migration if needed |
| Public guest pages | Guest token resolution or RSVP submission failures exceed 3 events/hour | Operations | Operations lead activates manual RSVP fallback via `docs/planning/mvp-rollback-plan.md#manual-operational-fallback` |
| File access | Signed URL failures or guest file denials exceed 10 events/hour, or any wrong-audience file access is suspected | Operations/engineering | Engineering lead freezes affected file downloads and verifies registry/storage policies |
| File placeholders | Any zero-byte placeholder file metadata remains unreplaced or unremoved for more than 24 hours | Engineering/operations | Engineering lead follows `docs/architecture/file-management-policy.md#placeholder-lifecycle-verification` to replace or remove the placeholder before exposing guest-facing access |
| Invitations | Generation failures exceed 5% of requested guests or latest file version is missing for any active invitation | Operations | Operations lead uses Canva/manual regeneration fallback via `docs/planning/mvp-rollback-plan.md#manual-operational-fallback` |
| WhatsApp messages | Manual send failures or send/history mismatches exceed 5% of prepared messages | Operations | Operations lead switches to direct WhatsApp/manual tracking fallback |
| Seating/check-in | Check-in errors exceed 2% of attempts, offline sync fails for any event, or queue speed blocks venue entry | Event operations | Event lead uses paper/search check-in fallback via `docs/planning/mvp-rollback-plan.md#manual-operational-fallback` |
| Contracts/payments | Any payment gate mismatch, exception error, or guest-facing unlock disagreement appears | Admin/finance | Diginoces owner role approves guest-facing freeze until corrected |
| Reports/audit | Missing audit entries for sensitive actions or export failures exceed 1 event/hour | Admin/engineering | Engineering lead investigates before continuing sensitive operation |

## Staging Validation

Before production promotion, validate the numeric thresholds above against staging traffic. Record observed baseline traffic, any adjusted threshold, decision rationale, owner, timestamp, and evidence link in the QA artifact store. Promotion evidence must also include successful `npm ci`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, and Supabase/database connectivity checks from `docs/setup/deployment-readiness.md`.

## Daily MVP Review

Days 1-7 post-launch or controlled pilot:

1. Inspect Supabase Dashboard > Logs, hosting deployment logs, and app route errors daily.
2. Triage failed API/RPC calls by module and watch for `401`, `403`, `5xx`, `RLS`, and `permission denied` patterns.
3. Validate audit-log coverage for project, guest, import, RSVP, invitation, message, check-in, payment, report, partner, and file actions.
4. Monitor guest-facing support issues and compare them against public-token and RSVP logs.
5. Reconcile manual WhatsApp send/history discrepancies against message logs.
6. Investigate file download errors and signed URL denials.
7. Review zero-byte placeholder file metadata older than 24 hours by running the scheduled placeholder detection query as the default path; if the scheduled job fails or returns ambiguous results, retry the job once and then use a manual Supabase table/dashboard review as fallback. Store script logs, retry output, or dashboard screenshots in the QA artifact store.
8. Confirm check-in/offline event status immediately after each event.

Transition to steady-state monitoring after day 7 only when daily error rate stays below 5%, every `P0` incident during the 7-day period was mitigated within the 1-hour SLA and has a completed post-incident review, and no unresolved `P1` incident has remained open for 48 hours from the incident trigger timestamp.

## Incident Tracking Checklist

Use UTC timestamps and the incident system as the source of truth for counts. Store the completed checklist in the QA artifact store from `docs/setup/qa-artifact-store.md` before approving transition to steady-state monitoring.

| Field | Requirement |
| --- | --- |
| Incident ID | Record every `P0` incident from days 1-7, including incidents that were resolved quickly |
| Trigger timestamp | ISO8601 UTC timestamp from monitoring or the incident system |
| Acknowledgement timestamp | ISO8601 UTC timestamp; must be no more than 15 minutes after trigger |
| Mitigation timestamp | ISO8601 UTC timestamp; must be no more than 1 hour after trigger |
| Post-incident review | Link to completed review evidence or mark `not_complete` |
| Evidence package | Link to the evidence package defined in the Escalation And Evidence section |
| Verifier | Name/role and ISO8601 UTC verification timestamp |

The steady-state transition cannot be approved while any checklist row is missing acknowledgement, mitigation, review, evidence, or verifier data.

## Incident Classification

- Pilot-phase coverage: the acknowledgement and mitigation targets below apply during the staffed pilot support window documented in the external operations runbook. Outside that window, the incident must be acknowledged at the next staffed coverage opening unless the Diginoces owner role and engineering lead have explicitly approved 24/7 on-call coverage for the pilot.
- Production-phase coverage: before broad production launch, the external operations runbook must document the on-call rotation, coverage hours, automated alerting, and escalation channel that support the `P0`/`P1` targets. Moving from pilot to production SLAs requires successful 7-day monitoring evidence, named on-call owners, and alert escalation verification.
- Transition rule: until the day 7 conditions above and the `QA Infrastructure Readiness`/go-no-go approvals in `docs/planning/mvp-launch-checklist.md` are signed by the Diginoces owner role and engineering lead, pilot-phase coverage rules apply. After that approval record is complete, production-phase coverage rules take effect.
- `P0`: data exposure, unauthorized access, payment gate bypass, or guest public token leakage. Acknowledge within 15 minutes and mitigate within 1 hour during the applicable coverage window.
- `P1`: core workflow blocked for active wedding operations. Acknowledge within 30 minutes and mitigate or activate fallback within 2 hours during the applicable coverage window.
- `P2`: recoverable operational issue with manual fallback. Acknowledge within 1 business day and resolve or schedule fix within 3 business days.
- `P3`: cosmetic or documentation issue. Triage in the next planning cycle.

## Escalation And Evidence

For `P0` or `P1`, pause affected workflows, preserve a standardized logs/audit evidence package, notify the Diginoces owner role through the internal incident channel configured outside this repository, and use the rollback/fallback process in `docs/planning/mvp-rollback-plan.md`. Do not commit personal phone numbers, private email addresses, or client communication templates to the repository.

The evidence package must include ISO8601 timestamps, affected project/event/guest/import/invitation/message/file IDs where applicable, user IDs, error messages or stack traces, correlated request IDs, and relevant audit-log entries. Store it in the secure incident bucket or access-controlled incident folder outside the repository using filename format `YYYYMMDDTHHMMSSZ-P{severity}-{module}-{short-summary}.json`; retain for at least 180 days, with access limited to the Diginoces owner role, engineering lead, operations lead, release manager, and assigned incident responders.

Example evidence package:

```json
{
  "incident_id": "20260603T123000Z-P1-rsvp-token-errors",
  "severity": "P1",
  "environment": "staging",
  "timestamps": ["2026-06-03T12:30:00Z"],
  "affected_ids": {
    "project_id": "uuid",
    "guest_id": "uuid"
  },
  "request_ids": ["request-id"],
  "errors": ["redacted error message"],
  "audit_log_ids": ["uuid"],
  "rollback_reference": "docs/planning/mvp-rollback-plan.md"
}
```
