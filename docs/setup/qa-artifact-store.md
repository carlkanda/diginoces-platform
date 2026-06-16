# QA Artifact Store Setup - MVP

Traceability: GitHub issue `#31`; sprint plan `docs/planning/sprint-15-plan.md`; release backlog `EPIC-RELEASE`, especially `FEAT-REL-001`, `FEAT-REL-005`, and `FEAT-REL-010`.

## Purpose

Manual QA evidence must be stored outside this repository in an encrypted, access-controlled artifact store. Do not commit screenshots, credentials, exports, logs, real guest data, or private client data to git.

## Selected MVP Store

The MVP QA evidence store is Google Drive under `kandacarl@gmail.com`.
The Diginoces owner approved this account as the evidence-store owner on
June 15, 2026 after connected Drive metadata confirmed it owns the runbook.

Repository docs must reference the external runbook with opaque ID
`RBR-GDRIVE-MVP-LAUNCH-001` only. Do not commit the Google Drive document URL,
folder URL, file URLs, screenshots, exported files, logs, deployment IDs, or
credential references.

Current status:

- Google Drive runbook initialized with opaque reference
  `RBR-GDRIVE-MVP-LAUNCH-001`.
- June 15, 2026 readback through the connected Google Drive tool confirmed the
  runbook is available and owned by `kandacarl@gmail.com`; Diginoces owner
  approval is recorded externally under `QAART-20260615-OWNER-001`.
- June 15, 2026 artifact-store access proof is recorded externally under
  `QAART-20260615-ARTIFACT-ACCESS-001`: Drive metadata reported
  `shared=false`, a single listed owner permission, and an unauthenticated
  export probe returned HTTP 401 with zero protected evidence-marker hits.
- Scenario-level evidence IDs, including `QAART-20260615-QA-006`,
  `QAART-20260615-QA-007`, `QAART-20260615-QA-008`, and
  `QAART-20260615-QA-009` through `QAART-20260615-QA-012`, are tracked in
  `docs/qa/mvp-qa-evidence-ledger.md` and
  `docs/planning/mvp-launch-checklist.md`; this setup document records only
  artifact-store rules and opaque runbook references.
- Scenario evidence folders, assigned-tester upload/read permissions,
  second-account folder denial checks, retention, encryption, audit logging, and
  access-ticketing verification remain required before production sign-off.

## Provisioning Requirements

Before manual QA begins, provision a company-managed encrypted object store or internal artifact system with:

- encryption at rest enabled;
- private access only;
- 180-day minimum retention for launch evidence;
- audit logging for uploads, downloads, permission changes, and deletions;
- folder convention `<environment>/<project-code>/<scenario-id>/`;
- filename convention `<YYYYMMDDTHHMMSSZ>__tester=<tester-id>__scenario=<scenario-id>.<ext>`; example: `20260603T123000Z__tester=jane_smith__scenario=QA-001.png`;
- the filename parser splits the filename on delimiter `__` into segments, then splits each key/value segment on the first `=`; keys are the text before the first `=`, and values are everything after it, so values may contain `=` or single underscores;
- double underscores are reserved as segment delimiters and must not appear inside `<tester-id>` or other values; parser-safe example with embedded underscores and equals: `20260603T123000Z__tester=qa_tester=west__scenario=QA-001.png`;
- read/write groups for Diginoces owner role, operations lead, engineering lead, and assigned QA testers;
- read-only access for reviewers who need launch sign-off evidence.

## Endpoint And Access

- Record the endpoint or bucket URL in the external secure release runbook coordinated from `docs/planning/mvp-launch-checklist.md`.
- Store the endpoint or bucket URL in the organization's approved encrypted vault or password manager.
- Do not record artifact-store endpoints or bucket URLs in this repository.
- QA testers request access from the Diginoces owner role or engineering lead through the internal QA access ticketing flow referenced by the release runbook.
- Approved upload/download methods may use a provider console, CLI, or internal artifact API, but they must require authenticated user identity and must not expose public links.
- File artifact handling must also follow `docs/architecture/file-management-policy.md`.

### Prerequisites & Fallbacks

Required external systems:

- external secure release runbook coordinated from `docs/planning/mvp-launch-checklist.md`;
- internal QA access ticketing flow;
- approved encrypted vault or password manager for endpoint storage.

These systems are assumed organizational infrastructure when available. If the runbook or ticketing flow is not available during an emergency QA window, the engineering lead and Diginoces owner role may approve a temporary access flow, store the endpoint only in an approved encrypted vault, record the temporary approval in the `QA Infrastructure Readiness` section of `docs/planning/mvp-launch-checklist.md`, and keep file handling aligned with `docs/architecture/file-management-policy.md`.

If no approved encrypted vault is available, QA evidence collection must be postponed until the vault or an equivalent secure storage option is provisioned. Manual QA evidence must not be stored in plaintext files, email, chat logs, or any unencrypted medium.

## Verification Steps

1. Verify the artifact store endpoint is available in the external secure release runbook.
2. Ensure assigned QA testers can upload and read files only inside the approved QA evidence path.
3. Confirm that unauthorized users cannot read or write evidence.
4. Upload one fake smoke artifact using the required folder and filename convention.
5. Exercise filename parsing with valid examples containing single underscores and `=` in values, and malformed examples containing reserved `__` inside values. Verify parser tooling extracts expected fields and rejects or flags malformed names.
6. Confirm retention, encryption, and audit logging settings are enabled.
7. Record the verification result, including filename parser results, in the `QA Infrastructure Readiness` section of `docs/planning/mvp-launch-checklist.md`.

## Evidence Link Format

Manual QA rows should reference only access-controlled evidence locations.

Allowed:

- persistent authenticated artifact URLs;
- ticket attachments with redacted links.
- short-lived Supabase signed URLs issued by the platform after user authentication, only for transient QA staging/debug artifacts actually hosted in private Supabase buckets for less than 24 hours. Permanent launch evidence must live in the external encrypted artifact store. See `docs/setup/local-development.md` and `docs/architecture/file-management-policy.md` for private, short-lived URL conditions.

Forbidden:

- public links;
- credential-bearing signed URLs;
- pasted screenshots, exports, credentials, logs, real guest data, or private client data in repository files.

Definitions:

- Persistent authenticated artifact URL: a stable access-controlled link, such as a ticket attachment, storage-console object link requiring identity verification, or long-lived redirect that enforces authentication.
- Public link: an unauthenticated broadly accessible URL.
- Credential-bearing signed URL: a temporary URL that embeds access credentials and is not tied to authenticated artifact-store identity. These remain forbidden except for the allowed short-lived Supabase signed URLs described above; unauthenticated artifact-store links remain forbidden.

Filename validation for upload tooling:

- `validateArtifactFilename(filename)` must split on `__`, then split each key/value segment on the first `=`.
- The timestamp segment must be ISO-like `YYYYMMDDTHHMMSSZ`.
- Required keys are `tester` and `scenario`.
- Values may contain single underscores or `=`, but must not contain `__`; reject unsafe filenames with a clear validation error.
- `sanitizeTesterId(testerId)` should normalize spaces and reserved `__` before forming filenames.
- Local parser reference: `apps/web/src/lib/platform/qa-artifact-filenames.ts`.
- Local parser regression coverage: `npm --workspace apps/web run test -- --run src/lib/platform/release-readiness.test.ts`.

Reference parser pseudocode:

```text
validateArtifactFilename(filename):
  segments = filename.split("__")
  if length(segments) < 3: return { valid: false, error: "missing segments", parsed: {} }
  parsed = { timestamp: segments[0] }
  for segment in segments[1:]:
    if "=" not in segment: return { valid: false, error: "missing key/value", parsed }
    key, value = split segment on first "="
    if value contains "__": return { valid: false, error: "reserved delimiter in value", parsed }
    parsed[key] = value
  if "tester" not in parsed or "scenario" not in parsed:
    return { valid: false, error: "missing required keys", parsed }
  return { valid: true, error: null, parsed }
```

Values may contain `=` and single `_` characters and must not be split further.
