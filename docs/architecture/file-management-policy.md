# File Management Policy - MVP

Traceability: GitHub issue `#31`; sprint plan `docs/planning/sprint-15-plan.md`; requirements `FILE-001`, `FILE-002`, `FILE-003`, `FILE-004`, `FILE-005`, `FILE-006`, `FILE-007`, `FILE-008`, `FILE-009`, `TECH-006`, `TECH-010`, and release backlog `EPIC-RELEASE`, including `FEAT-REL-009`.

## Scope

This policy defines Sprint 15 MVP file handling rules for project files, invitations, guest-facing files, contracts, payment proofs, archive files, and report exports. It supports the storage readiness checklist in `docs/setup/deployment-readiness.md`.

## Storage Rules

- Storage buckets for project, invitation, guest-facing, archive, contract, payment, and report files must remain private.
- Browser clients must not receive direct public object access.
- Signed URLs may be created only by server routes or RPCs after auth, project/event/guest scope checks, and file visibility checks pass.

File metadata rules:

- Forbidden: service-role keys, database credentials, WhatsApp tokens, Google secrets, and private client data.
- Allowed for access control only: minimum identifiers required for access control and audit binding, such as `project_id`, `user_id`, `scope_id`, `scope_type`, `file_id`, `resource_id`, and provider references used by access rules.
- Restriction: allowed identifiers may be used only for access control and audit binding; secrets and private client data must never be included in metadata.

## Zero-Byte Placeholders

Zero-byte placeholder file metadata is allowed only for provider-backed registration flows that meet this eligibility criterion:

- The platform has a persistent external provider reference or reserved storage key before the final file is available.
- The final file is expected through a manual staff upload, webhook/callback, or authenticated provider completion flow within 24 hours.

MVP examples are Canva design/export registration by staff. Future OAuth-authenticated provider uploads, such as Google Drive or Dropbox async imports, are illustrative only and require an explicit policy update before implementation.

Any provider type not explicitly approved in this policy requires an explicit update before implementation.

Required constraints:

- Server-side creation only, after all minimum checks pass:
  - Authenticated user identity is present.
  - Target project, event, guest, or invitation scope exists and is active where that scope applies.
  - User has one of the following for the target project scope:
    - project ownership;
    - a documented project-scoped role such as `bride`, `groom`, `couple`, or `partner_project_operator`;
    - an authorized internal/global role such as `operations_manager` or `file_manager`.
  - User has `files.write` or a stricter category-specific file upload permission for the requested file category.
  - Provider reference, reserved storage key, source filename, and expected final file category are recorded without secrets in the access-controlled `public.files.metadata` JSON column for the MVP.
  - Alternate registry requirements are deferred to a post-MVP policy update or to the sprint that first proposes an alternate registry; current sprint work must stay within the active sprint scope in `AGENTS.md`.
- Scope and audit binding to the project/event/guest/invitation scope and the corresponding `files.registered` or file lifecycle audit entry.
- No guest public download exposure until a validated file replaces the placeholder.
- Lifecycle: temporary placeholders require replacement with a validated file or removal within 24 hours.
- Operations review of stale placeholders before launch and during post-launch monitoring.

## Replacement File Validation

The phrase "validated file replaces the placeholder" requires all minimum checks below before the file is exposed to authenticated users or guest-facing flows:

- MIME and extension allowlist: `application/pdf`/`.pdf`, `image/png`/`.png`, `image/jpeg`/`.jpg` or `.jpeg`, `image/webp`/`.webp`, and `text/csv`/`.csv` for approved export flows. Additional types require a policy update.
- Maximum file size: 25 MB unless a category-specific limit is lower or a documented exception is approved by the engineering lead.
- Antivirus or malware scan result: pass, or documented manual security review if automated scanning is unavailable in the target environment. Manual security reviews must be logged in the QA artifact store with reviewer identity, timestamp, file checksum, review outcome, findings, approval, and evidence link.
- Format and metadata checks:
  - PDF files must be readable and unencrypted for guest-facing files; password-protected PDFs are permitted only for internal/sensitive documents, are exempt from guest-readability checks, and must be flagged in file metadata with `password_protected: true`.
  - Image files must have expected dimensions for the target workflow.
  - CSV exports must be UTF-8 encoded and header-validated.
  - All files must include project/event/guest/invitation scope, provider reference where applicable, and access-control metadata such as `access_scope`, `access_restriction`, or `password_protected`.

Missed 24-hour deadline handling:

- Guest-facing placeholders are automatically rejected from download exposure after 24 hours until a validated replacement passes manual security and quality review.
- Late arrivals may be accepted only after review by the operations lead or engineering lead, with a documented reason, scan result, final file checksum, and audit-log ID.
- A documented extended grace period must include owner approval, expiry timestamp, affected scope IDs, and monitoring evidence in the QA artifact store.

<a id="artifact-handling"></a>

## Artifact Handling

Generated file QA artifacts, screenshots, signed URL evidence, export outputs, and cleanup logs must be stored in the external secure QA artifact store described in `docs/setup/qa-artifact-store.md`, not in git and not as permanent evidence in Supabase buckets. Artifact records must include project/event/guest/file IDs where applicable, tester or operator identity, ISO8601 timestamp, environment, classification, and persistent evidence link. The private-bucket, signed-URL, no-secrets, and audit-binding rules in this policy apply to any temporary Supabase staging/debug files; those temporary files may exist for less than 24 hours only when private, audit-bound, and linked to the external QA artifact store record.

## Review Evidence

For release QA, record the target bucket policies, signed URL route/RPC checks, placeholder count, stale placeholder cleanup result, tester initials, timestamp, and environment in the QA artifact store described in `docs/setup/qa-artifact-store.md` and referenced by `docs/qa/mvp-manual-qa-scenarios.md`.

<a id="placeholder-lifecycle-verification"></a>

## Placeholder Lifecycle Verification

Detect stale placeholders before launch and during monitoring with this lifecycle procedure:

1. Query source: use the current `public.files` registry.
2. Baseline lifecycle filters: require `is_active = true` and `created_at < now() - interval '24 hours'`.
3. Scope constraints: use `scope_type` and `scope_id` to constrain the project, event, guest, invitation, or platform monitoring scope.
4. Required placeholder filters: identify placeholders with explicit signals such as `file_size_bytes = 0` or a documented placeholder marker in `metadata`, and require `is_active = true`. Use `status = 'active'` only as a secondary constraint with an explicit placeholder signal; do not treat ordinary active files older than 24 hours as placeholders by status alone.
5. Required recorded columns: `id` as `file_id`, `scope_type`, `scope_id`, `category`, `created_at`, `created_by` as owner, `is_active`, columns introduced in Sprint 14 migration `20260601114646_sprint_14_files_storage_retention_archive.sql` (`project_id`, `file_size_bytes`, and `status`), plus cleanup action taken.
6. Fallback for environments before the Sprint 14 migration: if the target environment lacks `project_id`, `file_size_bytes`, or `status`, operators must allow null/defaults for those columns, treat missing `project_id` or `status` as `unknown`, and run the documented file-registry migration or replacement migration to backfill equivalent values before launch sign-off.
7. Future migration note: if a file migration replaces `public.files` as the registry introduced by `20260601114646_sprint_14_files_storage_retention_archive.sql`, that migration must update this policy, backfill the fallback fields above, and expose equivalent lifecycle query capabilities before launch.

Operational rule:

Owner: Platform Ops/on-call engineer, meaning the release-duty engineer or operations assignee named in the external platform operations runbook/on-call rotation. Escalation path: engineering lead.

Cadence:

- daily automated or scheduled query during the first 7 launch days;
- weekly manual review during steady-state monitoring;
- manual check before production promotion, before the Storage Readiness and Deployment Gates in `docs/setup/deployment-readiness.md` are signed off.

Mode: automated detection where available; manual review and remediation until a dedicated cleanup job exists. No dedicated placeholder cleanup job exists in Sprint 15; track implementation under `FILE-008`/`FEAT-REL-009` with engineering lead ownership before broad production scale.

### Pre-Launch Validation

Before production promotion, Platform Ops/on-call engineer runs a 7-14 day staging or pilot simulation for placeholder lifecycle monitoring. Collect `stale_placeholders_last_24h`, `placeholder_creations_last_24h`, and `manual_cleanup_minutes_today`, compare observed daily values and high-percentile days against the escalation thresholds below, and store the result in the QA artifact store. Acceptance criteria: thresholds must not create repeated non-actionable alerts, must catch any stale guest-facing placeholder within 24 hours, and must leave daily manual cleanup within the documented operator capacity. If observed rates would cause alert fatigue or missed escalation, the engineering lead and operations lead must update thresholds or alerting rules before launch sign-off.

Interim manual mitigation while no cleanup job exists:

- Escalate to the engineering lead and operations lead through the incident channel if manual review discovers more than 10 stale placeholders in a 24-hour window.
- Require engineering lead assessment when placeholder creation exceeds 50 per day to decide whether to continue manual cleanup or expedite the automated job.
- Log daily manual cleanup time during the first 7 launch days, and escalate if it exceeds 30 minutes per day.
- During the first 7 launch days, capture daily metric values for stale placeholder count, placeholder creation rate, and manual cleanup time even when they remain below threshold.
- Record these metrics in the QA artifact store and audit logs alongside affected file IDs, cleanup actions, operator identity, timestamp, and the tracking references `FILE-008` and `FEAT-REL-009`.
Runnable decision rule for each daily metric entry:

- If `stale_placeholders_last_24h > 10`, escalate to the engineering lead and operations lead.
- If `placeholder_creations_last_24h > 50`, escalate to the engineering lead and operations lead.
- If `manual_cleanup_minutes_today > 30`, escalate to the engineering lead and operations lead.
- The escalation ticket must decide whether to adjust thresholds, keep interim manual cleanup, or prioritize the automated cleanup job.

Threshold rationale: the initial thresholds assume MVP-scale pilot activity across 3-5 active projects, modest daily staff-managed file creation, and one release-duty operator with about 30 minutes per day available for manual placeholder cleanup. Revisit `stale_placeholders_last_24h`, `placeholder_creations_last_24h`, and `manual_cleanup_minutes_today` thresholds during the first post-launch review for `FILE-008`/`FEAT-REL-009`.

1. Platform Ops/on-call engineer queries for placeholders older than 24 hours.
2. The scheduled detection query or named operator identifies stale placeholders, then the named operator replaces each stale placeholder with a validated file or removes the placeholder metadata.
3. Record the actor, cleanup action, affected file ID, and audit-log ID for every replacement or removal.
4. Store the result in the QA artifact store.
5. Escalate unresolved stale placeholders to the engineering lead and operations lead through the incident channel with this classification. Evaluate with any-matching-condition logic; if any `P1` condition matches, classify as `P1` even if a `P2` condition also matches:
   - `P1` when `scope_type` is `guest` or `invitation` and `category` allows guest download.
   - `P1` when `is_active = true` and the placeholder was referenced in sent invitations or guest-accessible reports.
   - `P1` when the placeholder exists in a public-facing export/archive accessible through a guest token.
   - `P2` if `scope_type` is `project` or `event` with no guest exposure path.
   - `P2` for internal-only categories, such as contracts, payment proofs, or backoffice reports.
   - `P2` when the placeholder was never referenced in guest-facing workflows.

`docs/qa/post-launch-monitoring.md` includes the monitoring signal, and `docs/qa/mvp-manual-qa-scenarios.md` includes the QA scenarios that touch file artifacts.
