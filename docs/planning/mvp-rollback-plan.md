# MVP Rollback Plan

Traceability: GitHub issue `#31`; sprint plan `docs/planning/sprint-15-plan.md`; release backlog `EPIC-RELEASE`, especially `FEAT-REL-009` and `FEAT-REL-010`.

## Purpose

This plan defines how to pause, roll back, or fall back from an MVP deployment if launch QA or post-launch monitoring finds a blocking issue.

## MVP Owner Decision

Recorded 2026-06-15:

- Rollback owner: Carl.
- Rollback approach: approved.
- Evidence runbook: `RBR-GDRIVE-MVP-LAUNCH-001`.

Before production promotion, execute the non-destructive rollback rehearsal in
staging, store the evidence externally, and record only opaque evidence IDs in
git.

## Rollback Triggers

- Unauthorized access, data exposure, or public-token leakage.
- Payment gate bypass.
- RSVP/invitation/check-in workflow corrupts or loses data.
- Database migration causes blocking runtime errors.
- File access grants guest/internal files to the wrong audience.
- CI or staging smoke checks fail after deployment.

## Application Rollback

### Rollback Authority And Preconditions

1. Decision authority: release manager, engineering lead, or on-call operations manager.
2. Normal rollback approval: two-party sign-off from one technical owner and one Diginoces owner/operations approver.
3. `P0` immediate initiation: engineering lead or on-call operations manager may start immediately, with retrospective owner approval recorded within the incident evidence package.
4. Rollback triggers: severity thresholds in `docs/qa/post-launch-monitoring.md`, verified outage, failed post-deploy smoke checks, data integrity failure, or the rollback triggers above.
5. Required recording fields: approver, ISO8601 timestamp, communication channel, trigger, and affected deployment.

### Rollback Steps

1. Pause new operational use if the issue affects active projects.
2. Revert the hosting deployment to the last known-good build.
3. Preserve logs, audit entries, failing request IDs, and screenshots.
4. Communicate affected scope to Diginoces operations.
5. Re-run smoke checks after rollback.

## Incident Evidence Package

Store P0 and P1 rollback evidence in the centralized access-controlled incident repository or encrypted secure drive outside this repository. Evidence access requires RBAC limited to the Diginoces owner role, engineering lead, operations lead, release manager, and assigned incident responders. Apply the same encryption and at-least-180-day retention policy used by `docs/qa/post-launch-monitoring.md#escalation-and-evidence`.

Use this required evidence template when recording P0 emergency approval or retrospective owner approval:

```json
{
  "incident_id": "20260603T123000Z-P0-data-exposure",
  "severity": "P0",
  "approver_identity": "role-or-user-id",
  "approval_timestamp": "2026-06-03T12:30:00Z",
  "communication_channel": "incident-system-channel-or-ticket",
  "trigger": "threshold-or-observed-condition-from-docs/qa/post-launch-monitoring.md",
  "affected_deployment": "hosting-deployment-id-or-commit-sha",
  "affected_scope": ["project-id", "route-or-rpc-name"],
  "attached_artifacts": ["log-id", "screenshot-id", "audit-log-id", "diff-or-commit-id"],
  "rollback_action": "application-rollback-or-forward-migration-or-manual-fallback",
  "rollback_verification_result": {
    "status": "success",
    "checks_run": ["home-page-smoke", "health-endpoint", "affected-workflow-smoke"],
    "verification_timestamp": "2026-06-03T12:45:00Z",
    "verifier_identity": "role-or-user-id",
    "verifier_notes": "short redacted validation summary"
  },
  "owner_follow_up": "ticket-id"
}
```

Reference the evidence package ID in the incident ticket, release checklist, or PR comment instead of committing logs, screenshots, credentials, client data, or private guest data.

## Evidence Template Relationship

Use separate monitoring and rollback evidence packages while an incident is still under observation or when rollback has not been selected. Use the combined redacted object only after rollback execution begins or completes and the responder needs one object tying monitoring signals to rollback authority, action, and verification. If separate packages are kept, the incident record must include both package IDs and a short cross-reference note; if a combined object is used, include any separate package IDs in `evidence_package_ids`.

| Rollback template field | Monitoring template field | Relationship |
| --- | --- | --- |
| `affected_deployment` | `environment`, `affected_ids` | Rollback records the deployment or commit; monitoring records environment plus affected project/event/guest IDs |
| `attached_artifacts` | `request_ids`, `errors`, `audit_log_ids` | Rollback artifacts should include or link to monitoring request IDs, errors, and audit-log IDs |
| `rollback_action` | `rollback_reference` | Rollback action records the selected rollback path; monitoring reference links to the plan |
| `rollback_verification_result` | `audit_log_ids`, `request_ids` | Rollback verification captures post-rollback checks and may reference monitoring evidence |

Example workflow: monitoring opens a `P1` package with request IDs and audit-log IDs; engineering decides rollback is required; the rollback owner records approval and rollback action; after post-rollback smoke checks pass, the responder either creates the combined object below or updates the incident record with both monitoring and rollback package IDs.

Hybrid incidents may attach a combined redacted JSON object with `environment`, `affected_ids`, `request_ids`, `errors`, `audit_log_ids`, `affected_deployment`, `attached_artifacts`, `rollback_action`, and `rollback_verification_result`, stored only in the secure incident repository. The combined object is optional and used only after rollback execution begins or completes.

Combined redacted object schema:

```json
{
  "incident_id": "string, required",
  "environment": "string, required",
  "affected_ids": "object, required, redact personal data",
  "request_ids": "array<string>, required when request IDs exist",
  "errors": "array<object>, required, redact secrets and personal data",
  "audit_log_ids": "array<string>, optional",
  "affected_deployment": "string, required for deployment rollback",
  "attached_artifacts": "array<string>, required, secure artifact IDs or links",
  "rollback_action": "string, required when rollback is selected",
  "rollback_verification_result": {
    "status": "string, required after rollback",
    "checks_run": "array<string>, required after rollback",
    "verification_timestamp": "string, ISO8601 required after rollback",
    "verifier_identity": "string, required after rollback",
    "verifier_notes": "string, required redacted summary"
  },
  "evidence_package_ids": "array<string>, optional cross-references when separate packages are used"
}
```

QA-025 drill checklist for this schema:

- populate every top-level field using fake staging identifiers;
- confirm `request_ids` is present when request IDs exist;
- confirm `affected_deployment` is present for deployment rollback;
- confirm `rollback_action` and `rollback_verification_result` are present after rollback;
- confirm nested `rollback_verification_result.status`, `checks_run`, `verification_timestamp`, `verifier_identity`, and `verifier_notes` are recordable under drill timing;
- store the drill result in the QA artifact store and update the schema if conditional fields are not practical during rehearsal.

Example combined object:

> **Note:** This is a reference schema example with redacted placeholder values. Actual incident evidence, secrets, and PII must be stored in the secure incident repository described above and must never be committed to git or stored in this file.

```json
{
  "incident_id": "20260603T123000Z-P1-rsvp-token-errors",
  "environment": "staging",
  "affected_ids": {
    "project_id": "uuid-redacted",
    "guest_id": "uuid-redacted"
  },
  "request_ids": ["request-id-redacted"],
  "errors": [{ "code": "403", "message": "redacted permission denial" }],
  "audit_log_ids": ["audit-id-redacted"],
  "affected_deployment": "git-sha-redacted",
  "attached_artifacts": ["artifact-store-link-redacted"],
  "rollback_action": "revert hosting deployment to previous approved build",
  "rollback_verification_result": {
    "status": "success",
    "checks_run": ["home-page-smoke", "health-endpoint", "affected-workflow-smoke"],
    "verification_timestamp": "2026-06-03T12:45:00Z",
    "verifier_identity": "role-or-user-id",
    "verifier_notes": "post-rollback smoke checks passed"
  },
  "evidence_package_ids": ["monitoring-package-id", "rollback-package-id"]
}
```

## Database Rollback

- Prefer forward corrective migrations over destructive rollbacks.
- Before production launch, review every pending migration with a dry-run and `db:lint`.
- If a migration has already applied and must be corrected, create a new migration that restores safe behavior.
- Avoid data deletion unless explicitly approved and backed up.

## File And Storage Rollback

- Keep storage buckets private.
- Revoke or expire signed links if file access is suspected to be wrong.
- Archive or disable affected file metadata rather than deleting physical objects immediately.
- Preserve audit and access logs for investigation.

## Manual Operational Fallback

If app workflows must pause, use the current manual Diginoces process:

- Google Sheets or controlled CSV files for guest tracking.
- Canva for invitation design/export.
- WhatsApp sending and tracking handled manually.
- RSVP and printed-only guest handling done manually.
- Check-in list or paper backup at venue entrance.

Before production launch and periodically after launch, rehearse the manual rollback flow in `docs/qa/mvp-manual-qa-scenarios.md` scenario `QA-025`, including Sheets/CSV, Canva, WhatsApp, RSVP, and check-in fallback evidence.

## User Communication

For a launch pause:

1. Notify Diginoces owner and operations first.
2. Identify affected clients/projects and scope.
3. Communicate only confirmed facts.
4. Provide manual fallback timing and owner.
5. Record the incident and resolution in the project audit/ops notes.
