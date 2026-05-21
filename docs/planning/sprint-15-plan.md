# Sprint 15 Plan — Release Hardening, QA & MVP Launch

## 1. Sprint goal

Sprint 15 is the **Release Hardening, QA & MVP Launch** sprint for the Diginoces platform.

The goal is not to build major new product features. The goal is to stabilize, verify, secure, document, and prepare the MVP for controlled launch.

Sprint 15 must establish:

- full MVP QA pass;
- end-to-end workflow testing;
- role and permission review;
- security and RLS review;
- Supabase advisor review;
- environment and secrets review;
- deployment readiness;
- staging/production launch checklist;
- database migration review;
- seed/demo data cleanup;
- file/storage/security validation;
- release documentation;
- known limitations register;
- MVP launch decision checklist;
- post-launch monitoring and rollback plan.

Sprint 15 must not introduce new large features unless they are required to fix blockers discovered during launch readiness review.

---

## 2. Source documents

Before coding or reviewing, the agent must read and follow:

- `AGENTS.md`
- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/planning/sprint-14-plan.md`
- `docs/planning/technical-debt.md`
- `docs/product/01-product-vision-business-model.md`
- `docs/product/02-user-roles-permissions-access-control.md`
- `docs/product/03-wedding-project-structure.md`
- `docs/product/04-guest-management-guest-lists.md`
- `docs/product/05-rsvp-public-guest-page.md`
- `docs/product/06-invitation-template-pdf-generation.md`
- `docs/product/07-whatsapp-communication-message-workflows.md`
- `docs/product/08-check-in-wedding-day-operations.md`
- `docs/product/09-tables-seating-print-materials.md`
- `docs/product/10-contracts-pricing-payment-controls.md`
- `docs/product/11-post-event-messages.md`
- `docs/product/12-partner-external-provider-model.md`
- `docs/product/13-dashboards-reports-audit-logs.md`
- `docs/product/14-files-storage-retention-security.md`
- `docs/product/16-technical-architecture.md`
- `docs/product/17-mvp-roadmap-development-phases.md`
- `docs/technical-design/database-schema-core-entities.md`
- `docs/technical-design/api-backend-service-design.md`
- `docs/technical-design/security-permissions-access-control.md`
- `docs/technical-design/background-jobs-pdf-qr-whatsapp-offline-checkin.md`
- `docs/backlog/master-requirements-register.csv`
- `docs/backlog/traceability-matrix.csv`
- `docs/backlog/module-coverage.csv`
- `docs/backlog/initial-product-backlog-epics.csv`
- `docs/backlog/initial-product-backlog-features.csv`
- `docs/backlog/initial-product-backlog-user-stories.csv`
- `docs/backlog/initial-product-backlog-tasks.csv`
- `docs/backlog/initial-product-backlog-test-cases.csv`

---

## 3. Sprint dependency

Sprint 15 depends on Sprint 14 being merged into `main`.

Sprint 15 must assume the MVP product modules already exist:

- secure platform foundation;
- projects and events;
- guest management;
- guest import and approval;
- RSVP and public guest page;
- invitation template and PDF generation;
- WhatsApp communication workflows;
- tables, seating, and print materials;
- check-in and wedding-day operations;
- contracts, pricing, and payment controls;
- dashboards, reports, and audit logs;
- guest wishes, guest-book, and feedback;
- partner/external provider model;
- files, storage, retention, and archive.

If any critical module is incomplete, the agent must classify it as:

```text
launch_blocker
launch_risk
post_launch_follow_up
not_required_for_mvp
```

The agent must not silently ignore missing requirements.

---

## 4. Backlog scope

Sprint 15 focuses on release hardening, QA, and launch readiness.

Primary epic:

- `EPIC-RELEASE` — Release, Monitoring & Documentation

Related epics:

- all MVP epics from Sprint 1 to Sprint 14

Primary features:

- `FEAT-REL-001` — MVP end-to-end QA pass
- `FEAT-REL-002` — Role/permission security review
- `FEAT-REL-003` — RLS and database security review
- `FEAT-REL-004` — Environment and secrets review
- `FEAT-REL-005` — Deployment readiness checklist
- `FEAT-REL-006` — Staging/production smoke test plan
- `FEAT-REL-007` — Known limitations register
- `FEAT-REL-008` — Release notes and launch documentation
- `FEAT-REL-009` — Monitoring and rollback plan
- `FEAT-REL-010` — MVP launch decision checklist

If the exact feature IDs differ in the CSV backlog, the agent must use the matching backlog rows and document the actual IDs in the Sprint 15 completion report.

---

## 5. Requirement IDs covered

Sprint 15 should verify coverage of all MVP requirement groups, especially:

- `PV-*` product vision and business rules
- `ROLE-*` roles and permissions
- `PROJ-*` project/event structure
- `GM-*` guest management
- `RSVP-*` RSVP/public guest page
- `INV-*` invitation/PDF generation
- `MSG-*` WhatsApp communication
- `SEAT-*` tables/seating/print materials
- `CHK-*` check-in operations
- `PAY-*` contracts/pricing/payments
- `WISH-*` guest wishes/guest-book/feedback
- `PART-*` partner model
- `REP-*` dashboards/reports/audit logs
- `FILE-*` files/storage/retention/security
- `TECH-*` architecture/security/integrations
- `ROAD-*` roadmap/release governance

Sprint 15 should not merely claim coverage. It must identify what is:

```text
implemented
tested
partially implemented
deferred
blocked
post-MVP
```

---

## 6. In scope

Sprint 15 may implement or perform the following.

### 6.1 Requirements coverage review

Review the Master Requirements Register and backlog CSVs against the implemented code.

Produce a coverage summary:

- requirement ID;
- module;
- status;
- implementation evidence;
- test evidence;
- issue/PR reference;
- launch status.

This may be documented in:

```text
docs/planning/mvp-requirements-coverage.md
```

or inside the Sprint 15 completion report.

### 6.2 End-to-end workflow testing

Create and run MVP end-to-end workflow tests or documented manual QA scenarios.

Core workflow scenarios should include:

1. Diginoces/admin creates project and events.
2. Contract/pricing/payment gates are configured.
3. Guest list is created manually.
4. Guest list is imported and approved.
5. Guests are assigned to events.
6. Public guest page is generated/unlocked according to gate rules.
7. Guests RSVP per event.
8. Invitation template is configured.
9. Invitations are generated.
10. Guided WhatsApp sending is prepared/tracked.
11. Guests are assigned to tables.
12. Table-card CSV is exported.
13. Check-in is configured.
14. Guests are checked in by QR and manual search.
15. Unexpected guest request is reviewed.
16. Guest messages/wishes are submitted and reviewed.
17. Guest-book CSV is exported.
18. Couple submits post-event feedback.
19. Reports and audit logs are reviewed.
20. Files are archived/retention reviewed.

Automated tests are preferred for critical logic. Manual QA scripts are acceptable for flows that require UI/human validation.

### 6.3 Role and permission security review

Review all major roles:

- Diginoces/admin;
- Diginoces staff;
- bride;
- groom;
- partner;
- check-in staff;
- check-in supervisor;
- guest;
- printing/export-related roles if implemented.

Verify each role can access only what it should.

Special attention:

- guests cannot access admin routes;
- guests see only own public page/files;
- bride/groom cannot access internal notes/audit/revenue;
- partners cannot see revenue/payment/audit/internal notes;
- check-in staff cannot access contracts/payments/global reports;
- staff access is assignment-based;
- admin access is sensitive and protected.

### 6.4 RLS and database security review

Review database security and RLS.

Required checks:

- RLS enabled on public business tables;
- no unsafe public select policies;
- anon access limited to public guest-token flows only where intended;
- service-role usage restricted to backend/server contexts;
- audit logs append-only;
- file access enforced by backend/storage policy;
- partner/couple/guest restrictions are enforced server-side;
- Supabase security advisors reviewed.

If possible, run Supabase security and performance advisors.

Document all warnings and classify them as:

```text
must_fix_before_launch
acceptable_mvp_risk
post_launch_follow_up
false_positive
```

### 6.5 Environment and secrets review

Review environment configuration.

Ensure:

- `.env` and `.env.local` are ignored;
- `.env.example` contains placeholders only;
- no real service-role key is committed;
- no database password is committed;
- no WhatsApp token is committed;
- no Google secret is committed;
- no production credentials appear in tests/docs;
- deployment environment variables are documented;
- required variables are validated at runtime.

### 6.6 Dependency and technical debt review

Review dependencies and technical debt.

Required checks:

- `npm audit --omit=dev`;
- outdated dependency review;
- Next.js canary dependency from `TD-001` reviewed;
- production-readiness status for canary dependency decided;
- known dependency risks documented;
- major framework/runtime versions documented.

If the stable Next.js release now fixes the PostCSS audit issue, Sprint 15 may migrate back to stable.

If not, keep `TD-001` open and mark it as a launch risk or acceptable MVP risk only after review.

### 6.7 CI/CD hardening

Review GitHub Actions workflows.

CI should run:

```text
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Additional checks may include:

- dependency audit;
- secret scanning helper;
- database migration lint where credentials are available;
- Playwright/e2e tests if implemented.

CI should not expose secrets unnecessarily.

### 6.8 Database migration review

Review all migrations.

Ensure:

- migrations are ordered;
- migrations are idempotent only where appropriate;
- destructive changes are controlled;
- production data assumptions are safe;
- seed/demo data is separated from production data;
- migration rollback notes exist where practical;
- Supabase linked project is aligned with local migration history.

### 6.9 Seed/demo data cleanup

Review seed/demo data.

Ensure:

- no real client data exists in repo;
- no real guest data exists in repo;
- no real phone numbers/emails are used unless clearly fake;
- demo data is clearly marked;
- seed data supports development/testing without exposing private information.

### 6.10 Deployment readiness

Prepare deployment readiness documentation.

Required documentation may include:

- deployment environment variables;
- Supabase project setup;
- storage bucket setup;
- migration deployment process;
- Vercel or hosting setup;
- domain setup placeholder;
- environment separation: local, staging, production;
- launch smoke tests.

Create or update:

```text
docs/setup/deployment-readiness.md
```

### 6.11 Staging/production smoke test plan

Create a smoke test checklist for staging and launch.

Smoke tests should include:

- app loads;
- login works;
- admin can access dashboard;
- project creation works;
- event creation works;
- guest creation/import works;
- public guest token resolves;
- RSVP works;
- invitation preview/generation works;
- guided WhatsApp message preparation works;
- seating assignment works;
- check-in QR/manual search works;
- contract approval works;
- payment gate works;
- report export works;
- audit log entries appear;
- guest-book export works;
- file download access is secure.

### 6.12 Known limitations register

Create a known limitations document.

Recommended file:

```text
docs/planning/mvp-known-limitations.md
```

Examples of limitations:

- WhatsApp API may remain manual/guided in MVP;
- direct Canva API not included;
- online payments not included;
- advanced AI assistance not included;
- native mobile app not included;
- partner commissions not included;
- some exports may be CSV-first;
- offline check-in may have limited sync conflict automation if not fully hardened.

### 6.13 Release notes

Create MVP release notes.

Recommended file:

```text
docs/planning/mvp-release-notes.md
```

Release notes should include:

- what is included;
- what is excluded;
- known limitations;
- required configuration;
- supported roles;
- operational assumptions;
- launch checklist link.

### 6.14 Rollback plan

Create a rollback plan.

Recommended file:

```text
docs/planning/mvp-rollback-plan.md
```

Rollback plan should cover:

- application rollback;
- database migration concerns;
- file/storage concerns;
- environment variables;
- user communication if launch is paused;
- manual fallback to current Google/Canva/WhatsApp workflow if needed.

### 6.15 Monitoring and operational readiness

Prepare monitoring plan.

At minimum, document:

- app errors;
- Supabase logs;
- auth errors;
- storage errors;
- check-in event errors;
- failed exports/generation jobs;
- failed messaging operations;
- audit-log review;
- post-launch issue triage.

### 6.16 MVP launch decision checklist

Create a final checklist.

Recommended file:

```text
docs/planning/mvp-launch-checklist.md
```

Checklist categories:

- product scope;
- security;
- permissions;
- database;
- storage;
- deployment;
- tests;
- documentation;
- known limitations;
- operational fallback;
- go/no-go decision.

### 6.17 Minor launch-blocker fixes

Sprint 15 may fix defects discovered during review.

Allowed fixes:

- security gaps;
- permission bugs;
- broken tests;
- broken builds;
- missing environment validation;
- broken migrations;
- launch-blocking UX bugs;
- severe data-integrity issues.

Not allowed:

- new major features;
- redesigns;
- advanced integrations;
- post-MVP modules;
- speculative refactors not needed for launch.

---

## 7. Out of scope

Do not implement the following in Sprint 15:

- new major product modules;
- AI assistance;
- direct Canva API integration;
- official WhatsApp API production integration unless already approved and necessary;
- online payment processing;
- native mobile apps;
- white-label SaaS;
- partner commission management;
- advanced analytics/BI;
- major UI redesigns;
- unrelated refactoring;
- post-MVP enhancements unless needed to fix a launch blocker.

If a future dependency is discovered, document it as a follow-up. Do not build it silently.

---

## 8. Recommended documents and artifacts

Sprint 15 should create or update these artifacts:

```text
docs/planning/mvp-requirements-coverage.md
docs/setup/deployment-readiness.md
docs/planning/mvp-known-limitations.md
docs/planning/mvp-release-notes.md
docs/planning/mvp-rollback-plan.md
docs/planning/mvp-launch-checklist.md
docs/planning/sprint-15-completion-report.md
```

Optional if useful:

```text
docs/qa/mvp-manual-qa-scenarios.md
docs/qa/security-review.md
docs/qa/permissions-review.md
docs/qa/rls-review.md
docs/qa/post-launch-monitoring.md
```

---

## 9. Recommended backend/API work

Sprint 15 is mainly QA and hardening.

Backend/API changes should be limited to:

- launch-blocking bug fixes;
- missing permission checks;
- missing validation;
- missing audit calls;
- unsafe access patterns;
- broken export behavior;
- broken environment validation;
- migration/security fixes.

All backend changes must be traceable to a launch-readiness finding.

---

## 10. Permission/security rules

Sprint 15 must verify all major permission boundaries.

### 10.1 Admin

Verify admin can access full platform areas and sensitive reports only where intended.

### 10.2 Staff

Verify staff access is assignment and permission based.

### 10.3 Bride/groom

Verify couple users can access only their own project and safe dashboard/report data.

### 10.4 Partner

Verify partner users cannot access revenue, payment details, internal notes, audit logs, global dashboards, or other partner projects.

### 10.5 Check-in staff

Verify check-in staff can access only assigned event check-in flows and cannot access contracts/payments/revenue/global reports.

### 10.6 Guest

Verify guests can access only their own public page and guest-facing files through secure tokens.

---

## 11. Testing expectations

Sprint 15 must add or run release-readiness tests.

At minimum, tests or QA evidence should cover:

- CI passes;
- smoke tests pass;
- core app build passes;
- major role permissions verified;
- public guest token isolation verified;
- file access restrictions verified;
- payment gate verified;
- contract gate verified;
- RSVP event-specific behavior verified;
- invitation generation path verified;
- WhatsApp guided manual path verified;
- seating capacity/assignment path verified;
- check-in QR/manual flow verified;
- unexpected guest approval path verified;
- report export path verified;
- audit-log viewer restrictions verified;
- partner restrictions verified;
- retention/archive controls verified.

CI must continue to pass:

```text
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Additional recommended checks:

```text
npm audit --omit=dev
npm run db:lint
Supabase security advisor
Supabase performance advisor
manual staging smoke test
```

If any check cannot be run, explain why and classify the risk.

---

## 12. Acceptance criteria

Sprint 15 is complete only when:

- MVP requirements coverage review exists;
- end-to-end QA evidence exists;
- role/permission security review exists;
- RLS/database security review exists or is documented with blockers;
- environment/secrets review exists;
- dependency/technical debt review exists;
- CI passes;
- database migration review exists;
- seed/demo data cleanup review exists;
- deployment readiness documentation exists;
- staging/production smoke test plan exists;
- known limitations register exists;
- MVP release notes exist;
- rollback plan exists;
- launch checklist exists;
- launch blockers are fixed or clearly documented;
- unresolved risks are classified;
- Sprint 15 completion report is created.

---

## 13. Required deliverables

The Sprint 15 PR must include:

- release-readiness documents;
- QA/scenario documents;
- security/permission review documents;
- launch checklist;
- known limitations register;
- release notes;
- rollback plan;
- deployment readiness document;
- any launch-blocking fixes;
- test updates where needed;
- documentation updates;
- `docs/planning/sprint-15-completion-report.md`.

---

## 14. Sprint 15 completion report template

The agent must create:

```text
docs/planning/sprint-15-completion-report.md
```

The report must include:

- sprint status;
- MVP launch recommendation: go, conditional go, or no-go;
- requirement coverage summary;
- backlog coverage summary;
- files created or changed;
- tests added or run;
- commands run;
- checks passed or failed;
- security checks performed;
- RLS/database review summary;
- secrets/environment review summary;
- deployment readiness summary;
- known limitations;
- launch blockers;
- launch risks;
- post-launch follow-ups;
- rollback plan summary;
- recommended next post-MVP sprint scope.

---

## 15. Recommended post-MVP scope

After MVP launch, the next sprints may include:

- Sprint 16 — AI Assistance;
- Sprint 17 — Advanced Integrations;
- Sprint 18 — SaaS / Partner Scaling Enhancements;
- official WhatsApp API integration if available;
- direct Canva integration;
- native mobile app if needed;
- online payment processing;
- partner commission management if business policy changes.

These should not be implemented inside Sprint 15 unless explicitly needed to fix an MVP launch blocker.

---

## 16. Codex prompt for Sprint 15

Use this prompt when assigning Codex to Sprint 15:

```text
You are the Orchestrator Agent for the Diginoces platform.

Repository: carlkanda/diginoces-platform

Work only on Sprint 15: Release Hardening, QA & MVP Launch.

Before coding or reviewing, read AGENTS.md and the relevant documents:
- docs/planning/sprint-15-plan.md
- docs/planning/sprint-14-plan.md
- docs/planning/mvp-build-execution-plan.md
- docs/planning/technical-debt.md
- docs/product/01-product-vision-business-model.md
- docs/product/02-user-roles-permissions-access-control.md
- docs/product/03-wedding-project-structure.md
- docs/product/04-guest-management-guest-lists.md
- docs/product/05-rsvp-public-guest-page.md
- docs/product/06-invitation-template-pdf-generation.md
- docs/product/07-whatsapp-communication-message-workflows.md
- docs/product/08-check-in-wedding-day-operations.md
- docs/product/09-tables-seating-print-materials.md
- docs/product/10-contracts-pricing-payment-controls.md
- docs/product/11-post-event-messages.md
- docs/product/12-partner-external-provider-model.md
- docs/product/13-dashboards-reports-audit-logs.md
- docs/product/14-files-storage-retention-security.md
- docs/product/16-technical-architecture.md
- docs/product/17-mvp-roadmap-development-phases.md
- docs/technical-design/database-schema-core-entities.md
- docs/technical-design/api-backend-service-design.md
- docs/technical-design/security-permissions-access-control.md
- docs/technical-design/background-jobs-pdf-qr-whatsapp-offline-checkin.md
- docs/backlog/master-requirements-register.csv
- docs/backlog/traceability-matrix.csv
- docs/backlog/module-coverage.csv
- docs/backlog/initial-product-backlog-epics.csv
- docs/backlog/initial-product-backlog-features.csv
- docs/backlog/initial-product-backlog-user-stories.csv
- docs/backlog/initial-product-backlog-tasks.csv
- docs/backlog/initial-product-backlog-test-cases.csv

Create a new branch:

codex/sprint-15-release-hardening-mvp-launch

Implement Sprint 15 only.

Required scope:
1. Create MVP requirements coverage review.
2. Create end-to-end MVP QA scenarios.
3. Review role/permission security boundaries.
4. Review RLS/database security posture.
5. Review environment variables and secrets handling.
6. Review dependencies and technical debt, including TD-001.
7. Review CI/CD readiness.
8. Review database migrations.
9. Review seed/demo data safety.
10. Create deployment readiness documentation.
11. Create staging/production smoke test plan.
12. Create known limitations register.
13. Create MVP release notes.
14. Create rollback plan.
15. Create MVP launch checklist.
16. Fix only launch-blocking bugs or security issues discovered during review.
17. Add or update tests where needed.
18. Update documentation.
19. Create docs/planning/sprint-15-completion-report.md.
20. Open a draft PR titled: Sprint 15 — Release Hardening, QA & MVP Launch.

Out of scope:
- new major product features;
- AI assistance;
- direct Canva API integration;
- official WhatsApp API production integration unless already approved and required;
- online payment processing;
- native mobile apps;
- white-label SaaS;
- partner commission management;
- advanced BI analytics;
- unrelated refactoring.

The PR must reference the Sprint 15 issue.

Do not mark Sprint 15 complete unless checks, QA evidence, known limitations, launch blockers, and launch risks are documented.
```

---

## 17. Summary

Sprint 15 is the MVP readiness sprint.

It should prove that the platform is safe, tested, documented, deployable, and operationally ready for a controlled launch.

The expected result is not a new feature set, but a clear go/no-go basis for launching the Diginoces MVP with known risks, rollback options, and post-launch priorities documented.
