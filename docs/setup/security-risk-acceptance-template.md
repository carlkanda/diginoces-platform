# Security Risk Acceptance Template - Sprint 15

Traceability: GitHub issue `#31`; sprint plan `docs/planning/sprint-15-plan.md`; requirements `ROLE-009`, `TECH-004`, `TECH-010`; release backlog `EPIC-RELEASE`, `FEAT-REL-002`, `FEAT-REL-010`.

Use this template only for controlled MVP pilot exceptions. Store completed approvals in the secure QA artifact store or access-controlled ticket/Confluence space outside the repository. Do not commit signed approvals, user credentials, personal contact data, or client data.

## Pilot User Identity Restrictions

The `Pilot user list` field may reference internal numeric user IDs, role names, anonymized test account labels, or secure IDs only. Full names, emails, passwords, personal usernames, phone numbers, and other PII must be stored only in the external secure artifact store when pilot operations require them, and repository files may reference those people only by secure ID. No PII or credentials may be stored in this repository.

## Required Fields

| Field | Required value |
| --- | --- |
| Risk ID | Unique ticket or approval ID |
| Decision date | ISO8601 date/time |
| Environment | Local, dev, staging, controlled pilot, or production |
| Affected workflow | MFA, permission, RLS, file, payment gate, public token, or other security-sensitive area |
| Pilot user list | See Pilot User Identity Restrictions for allowed identifiers |
| Risk statement | Clear description of what remains incomplete or manually controlled |
| Compensating controls | Restricted accounts, monitoring owner, manual review, rollback/fallback path |
| Approver identity | Diginoces owner role and engineering lead; both must sign or explicitly consent |
| Signed approval | External link or ticket ID only; do not embed signed documents or attachments |
| Remediation deadline | Date/time and acceptance criteria |
| Remediation owner | Named role or owner ID |
| Monitoring owner | Named role or owner ID |
| Evidence link | External link or ticket ID only; do not embed evidence documents, screenshots, or attachments |
| Review cadence | Daily during pilot or a stricter documented cadence |
| Exit condition | Condition that closes the exception or blocks launch |

## Required Decision

Mark one:

- `accepted_for_controlled_pilot`
- `requires_remediation_before_pilot`
- `launch_blocker`

Any risk marked `accepted_for_controlled_pilot` must have these fields documented before the overall MVP launch go/no-go decision:

- remediation deadline;
- remediation owner;
- monitoring owner;
- rollback/fallback reference.

These fields are required at the time the risk is accepted.

Change management requirements:

- Any change must be recorded within one business day.
- Deadline extensions or compensating-control changes require renewed consent from both the Diginoces owner role and engineering lead.
- Owner substitutions require the Diginoces owner role or delegated risk manager plus the engineering lead to confirm equivalent responsibility:
  - matching role scope or organizational level;
  - relevant domain expertise;
  - documented availability and time commitment;
  - delegated authority to enact or remediate the control;
  - substitution recorded in the risk record with timestamp, approver identities, and rationale.
