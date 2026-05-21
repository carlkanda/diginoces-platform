# Sprint 19 Plan — Post-Launch Operations & Continuous Improvement

## 1. Sprint goal

Sprint 19 is the **Post-Launch Operations & Continuous Improvement** sprint for the Diginoces platform.

The goal is to stabilize the platform after its first real-world use, capture production feedback, monitor reliability, improve support readiness, and decide the next roadmap priorities based on actual usage instead of assumptions.

Sprint 19 must establish:

- post-launch monitoring process;
- production support and bug triage workflow;
- incident response foundation;
- backup and restore validation;
- real-user feedback collection;
- staff training and operating procedures;
- post-launch documentation cleanup;
- performance review and optimization backlog;
- production issue classification;
- user adoption review;
- post-launch roadmap prioritization;
- decision framework for next major investments such as WhatsApp API, Canva integration, online payments, mobile app, or deeper SaaS scaling.

Sprint 19 must not become an uncontrolled feature sprint. New feature work should be documented, prioritized, and scheduled into future roadmap items unless it is required to fix a production-critical issue.

---

## 2. Source documents

Before coding or reviewing, the agent must read and follow:

- `AGENTS.md`
- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/planning/sprint-15-plan.md`
- `docs/planning/sprint-18-plan.md`
- `docs/planning/mvp-release-notes.md`, if present
- `docs/planning/mvp-known-limitations.md`, if present
- `docs/planning/mvp-launch-checklist.md`, if present
- `docs/planning/mvp-rollback-plan.md`, if present
- `docs/setup/deployment-readiness.md`, if present
- `docs/product/01-product-vision-business-model.md`
- `docs/product/13-dashboards-reports-audit-logs.md`
- `docs/product/14-files-storage-retention-security.md`
- `docs/product/16-technical-architecture.md`
- `docs/product/17-mvp-roadmap-development-phases.md`
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

Sprint 19 depends on Sprint 18 being merged into `main`, and ideally on the MVP having been deployed or tested in a realistic staging/production-like environment.

Sprint 19 must assume these foundations already exist:

- released or release-ready Diginoces MVP;
- deployment documentation;
- launch checklist;
- known limitations register;
- rollback plan;
- monitoring/logging foundations;
- supportable user roles;
- stable database and file storage foundations;
- audit logs;
- production or staging environment access.

If the platform has not yet launched, Sprint 19 should become a **launch rehearsal and operational readiness sprint** rather than a post-launch review sprint.

---

## 4. Backlog scope

Sprint 19 focuses on post-launch operations and continuous improvement.

Primary epic:

- `EPIC-OPS` — Post-Launch Operations & Continuous Improvement

Related epics:

- `EPIC-RELEASE` — Release, Monitoring & Documentation
- `EPIC-REP` — Dashboards, Reports & Audit Logs
- `EPIC-FILE` — Files, Storage, Retention & Security
- `EPIC-INT` — Integrations
- `EPIC-SCALE` — SaaS / Partner Scaling Enhancements

Primary features:

- `FEAT-OPS-001` — Post-launch monitoring checklist
- `FEAT-OPS-002` — Production support and triage workflow
- `FEAT-OPS-003` — Incident response and escalation process
- `FEAT-OPS-004` — Backup and restore validation
- `FEAT-OPS-005` — User feedback collection and review
- `FEAT-OPS-006` — Staff training and operating procedures
- `FEAT-OPS-007` — Performance review and optimization backlog
- `FEAT-OPS-008` — Production issue classification framework
- `FEAT-OPS-009` — Post-launch roadmap prioritization
- `FEAT-OPS-010` — Continuous improvement governance

If the exact feature IDs are not present in the CSV backlog, the agent must create a proposed backlog update or document the mapping in the Sprint 19 completion report.

---

## 5. Requirement groups covered

Sprint 19 is cross-cutting and should review the operational health of all MVP and post-MVP requirement groups:

- `PV-*` product vision and business goals
- `ROLE-*` roles and permissions
- `PROJ-*` projects and events
- `GM-*` guest management
- `RSVP-*` RSVP and public guest page
- `INV-*` invitation/PDF generation
- `MSG-*` WhatsApp communication
- `SEAT-*` tables, seating, and print materials
- `CHK-*` check-in operations
- `PAY-*` contracts, pricing, and payments
- `WISH-*` guest wishes and guest-book workflows
- `PART-*` partner model
- `REP-*` dashboards, reports, and audit logs
- `FILE-*` files, storage, retention, and archive
- `AI-*` AI assistance
- `TECH-*` technical architecture, security, and integrations
- `ROAD-*` roadmap and release governance

Sprint 19 should not mark requirements complete unless there is implementation, testing, and operational evidence.

---

## 6. In scope

Sprint 19 may implement or perform the following.

### 6.1 Post-launch monitoring checklist

Create or update a post-launch monitoring checklist.

Recommended file:

```text
docs/operations/post-launch-monitoring-checklist.md
```

The checklist should cover:

- application uptime;
- login/auth errors;
- Supabase database errors;
- storage/file access errors;
- public guest page errors;
- RSVP failures;
- invitation generation failures;
- WhatsApp/manual message workflow failures;
- seating/export issues;
- check-in performance and sync issues;
- payment gate and contract gate issues;
- audit-log availability;
- integration failures;
- background job failures;
- error volume and severity.

### 6.2 Production support workflow

Create or update the production support process.

Recommended file:

```text
docs/operations/support-triage-workflow.md
```

The workflow should define:

- how issues are reported;
- who receives issues;
- issue severity levels;
- response expectations;
- escalation path;
- bug vs feature request classification;
- how to link issues to affected projects/events;
- how to document resolution;
- how to identify recurring problems.

Recommended severity levels:

```text
P0 — Platform down / event operations blocked
P1 — Critical workflow blocked for active wedding
P2 — Important issue with workaround
P3 — Minor bug or usability issue
P4 — Enhancement request
```

### 6.3 Incident response foundation

Create an incident response procedure.

Recommended file:

```text
docs/operations/incident-response.md
```

It should cover:

- incident declaration criteria;
- roles during incident;
- communication channel;
- first 15-minute checklist;
- data/security incident handling;
- check-in event incident handling;
- rollback decision path;
- post-incident review;
- preventive action tracking.

Special incident categories:

- check-in failure during live event;
- file download failure;
- invitation generation failure;
- data visibility/security concern;
- payment gate incorrectly locked/unlocked;
- database or storage outage;
- public guest page outage;
- WhatsApp sending workflow failure.

### 6.4 Backup and restore validation

Validate or document backup and restore readiness.

Recommended file:

```text
docs/operations/backup-restore-validation.md
```

The validation should include:

- database backup status;
- storage backup/retention assumptions;
- audit-log retention;
- restore procedure outline;
- restore test result or blocker;
- recovery time expectations;
- manual fallback if restore cannot be completed quickly.

If a restore test cannot be run, the reason must be documented and classified as risk.

### 6.5 Real-user feedback collection

Create a structured process for collecting feedback from:

- Diginoces admin;
- Diginoces staff;
- bride/groom users;
- partners;
- check-in staff;
- guests if appropriate;
- printing/operational collaborators where relevant.

Recommended file:

```text
docs/operations/user-feedback-review.md
```

Feedback should be classified into:

```text
bug
usability issue
missing feature
performance issue
training/documentation issue
business-process change
post-MVP enhancement
```

### 6.6 Staff training and operating procedures

Create or update operational training materials.

Recommended file:

```text
docs/operations/staff-training-guide.md
```

Training should cover:

- project setup;
- event setup;
- guest management;
- guest import review;
- RSVP monitoring;
- invitation generation;
- guided WhatsApp sending;
- seating/table assignment;
- check-in operations;
- unexpected guest handling;
- contracts/payments gates;
- reports/audit logs;
- file/archive handling;
- partner workflows;
- support escalation.

### 6.7 Performance review

Review performance after real or simulated use.

Recommended file:

```text
docs/operations/performance-review.md
```

Focus areas:

- page load time;
- guest list size handling;
- invitation generation duration;
- PDF file size;
- WhatsApp guided sending speed;
- seating assignment speed;
- check-in speed target of 3 to 10 seconds per guest/unit;
- offline sync reliability;
- database query performance;
- storage download speed;
- export generation time.

Create a performance optimization backlog from findings.

### 6.8 Production issue classification

Create a production issue classification framework.

Recommended file:

```text
docs/operations/production-issue-classification.md
```

Each issue should include:

- issue ID;
- module;
- severity;
- affected user role;
- affected project/event;
- reproducibility;
- workaround;
- root cause if known;
- decision: fix now, next sprint, backlog, not planned;
- linked GitHub issue.

### 6.9 Continuous improvement backlog

Create or update a post-launch improvement backlog.

Recommended file:

```text
docs/planning/post-launch-improvement-backlog.md
```

The backlog should group improvements by:

- reliability;
- security;
- UX;
- performance;
- support/training;
- automation;
- integrations;
- partner scaling;
- business growth features.

### 6.10 Roadmap prioritization workshop

Sprint 19 should produce a recommendation for the next roadmap.

Recommended file:

```text
docs/planning/post-launch-roadmap-recommendation.md
```

The recommendation should evaluate:

- official WhatsApp API rollout;
- direct Canva integration;
- online payments;
- native mobile/check-in app;
- advanced analytics;
- stronger partner SaaS scaling;
- commission management only if business policy changes;
- performance hardening;
- UX redesign priorities;
- enterprise/security improvements.

Prioritization criteria:

- business value;
- operational pain relieved;
- user demand;
- risk reduction;
- technical complexity;
- cost;
- dependency readiness.

### 6.11 Post-launch documentation cleanup

Update documentation based on real use.

Possible updates:

- local development guide;
- deployment guide;
- staff training guide;
- known limitations;
- release notes;
- support workflow;
- module-specific operating procedures;
- Sprint completion reports, if evidence changed.

### 6.12 Production data hygiene review

Review production data hygiene.

Check:

- test data removed from production;
- demo users removed or clearly marked;
- fake events removed;
- no real guest data in development/staging unless intended;
- data retention policy applied;
- access to old projects reviewed.

### 6.13 Support tooling foundation

Sprint 19 may add or document simple support tooling.

Possible tooling:

- support dashboard view;
- issue export;
- admin notes;
- operational issue tags;
- system status page placeholder;
- production diagnostics page for admin only.

Do not build a full customer support platform unless approved.

### 6.14 Minor production bug fixes

Sprint 19 may fix production issues discovered after launch.

Allowed fixes:

- P0/P1 production bugs;
- data visibility issues;
- check-in operational blockers;
- public guest page blockers;
- file access blockers;
- payment/contract gate defects;
- backup/restore blockers;
- documentation errors that cause operational risk.

Not allowed:

- major new features;
- speculative redesigns;
- large integrations;
- partner commission features;
- major refactors unrelated to post-launch stability.

### 6.15 Post-launch audit review

Review audit logs after real use.

Confirm:

- sensitive actions are logged;
- logs are readable by authorized internal roles;
- guests/couples/partners cannot access logs;
- logs are not too noisy;
- critical actions are not missing;
- old/new values do not expose unnecessary secrets.

### 6.16 Operational fallback review

Review the fallback plan to existing manual workflows.

Fallbacks should exist for:

- WhatsApp sending;
- invitation generation;
- file sharing;
- check-in;
- RSVP collection;
- guest import;
- seating export;
- payment/contract tracking.

Document which fallback is available for each critical module.

---

## 7. Out of scope

Do not implement the following in Sprint 19:

- large new modules;
- full UI redesign;
- online payment provider integration;
- native mobile app;
- partner commission management;
- full white-label SaaS;
- direct Canva API replacement;
- speculative AI automation;
- major architecture rewrite;
- production data migration unrelated to launch stability;
- feature requests not prioritized through the post-launch backlog.

If a future dependency is discovered, document it as a follow-up. Do not build it silently.

---

## 8. Recommended documents and artifacts

Sprint 19 should create or update these artifacts:

```text
docs/operations/post-launch-monitoring-checklist.md
docs/operations/support-triage-workflow.md
docs/operations/incident-response.md
docs/operations/backup-restore-validation.md
docs/operations/user-feedback-review.md
docs/operations/staff-training-guide.md
docs/operations/performance-review.md
docs/operations/production-issue-classification.md
docs/planning/post-launch-improvement-backlog.md
docs/planning/post-launch-roadmap-recommendation.md
docs/planning/sprint-19-completion-report.md
```

Optional if useful:

```text
docs/operations/production-data-hygiene-review.md
docs/operations/operational-fallback-review.md
docs/operations/post-launch-audit-review.md
docs/operations/support-dashboard-notes.md
```

---

## 9. Recommended backend/API work

Sprint 19 is mostly operational review and stabilization.

Backend/API changes should be limited to:

- production-critical bug fixes;
- support diagnostics;
- missing logging needed for support;
- permission/security hotfixes;
- backup/restore support fixes;
- monitoring improvements;
- performance fixes backed by evidence.

All backend changes must be linked to a post-launch issue, incident, support need, or documented risk.

---

## 10. Permission and security rules

Sprint 19 must verify permission and security behavior under real use.

### 10.1 Admin

Verify admin can support operations without bypassing auditability.

### 10.2 Staff

Verify staff can do daily work without seeing unauthorized data.

### 10.3 Bride/groom

Verify couple users can use the platform without seeing internal data or other projects.

### 10.4 Partner

Verify partners remain restricted from revenue, payment details, internal notes, audit logs, and unrelated projects.

### 10.5 Check-in staff

Verify check-in users can operate at event entrance without access to unrelated modules.

### 10.6 Guest

Verify guests can access only their own public page and active guest-facing files.

---

## 11. Testing expectations

Sprint 19 must add or run post-launch stability tests and operational checks.

At minimum, evidence should cover:

- production/staging smoke tests pass;
- login works for key roles;
- public guest page works;
- RSVP works;
- invitation download/generation path works;
- guided WhatsApp sending path works;
- seating workflow works;
- check-in QR/manual flow works;
- unexpected guest flow works;
- contract/payment gates work;
- dashboards/reports load;
- audit logs capture sensitive actions;
- file downloads are secure;
- backup/restore plan is validated or risk-classified;
- support/triage workflow is documented;
- staff training materials are usable;
- known production issues are classified.

CI must continue to pass:

```text
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Recommended additional checks:

```text
npm audit --omit=dev
npm run db:lint
Supabase security advisor
Supabase performance advisor
manual production/staging smoke test
backup/restore validation
```

If a check cannot be run, explain why and classify the risk.

---

## 12. Acceptance criteria

Sprint 19 is complete only when:

- post-launch monitoring checklist exists;
- support triage workflow exists;
- incident response procedure exists;
- backup/restore validation exists or risk is documented;
- user feedback review process exists;
- staff training guide exists or is updated;
- performance review exists;
- production issue classification framework exists;
- continuous improvement backlog exists;
- post-launch roadmap recommendation exists;
- production data hygiene review exists or is documented as follow-up;
- operational fallback review exists or is documented as follow-up;
- critical post-launch bugs are fixed or classified;
- permission/security behavior is reviewed after launch;
- tests/checks are run and documented;
- Sprint 19 completion report is created.

---

## 13. Required deliverables

The Sprint 19 PR must include:

- post-launch operations documents;
- support and triage workflow;
- incident response procedure;
- backup/restore validation documentation;
- feedback review documentation;
- staff training guide updates;
- performance review;
- production issue classification framework;
- post-launch improvement backlog;
- post-launch roadmap recommendation;
- any production-critical fixes;
- tests or QA evidence updates;
- documentation updates;
- `docs/planning/sprint-19-completion-report.md`.

---

## 14. Sprint 19 completion report template

The agent must create:

```text
docs/planning/sprint-19-completion-report.md
```

The report must include:

- sprint status;
- launch/post-launch context;
- production issues found;
- issues fixed;
- issues deferred;
- support process status;
- monitoring status;
- backup/restore validation status;
- feedback summary;
- staff training status;
- performance findings;
- security/permission findings;
- audit-log findings;
- operational fallback status;
- continuous improvement backlog summary;
- recommended next roadmap priorities;
- commands/checks run;
- open risks;
- next decision required from Diginoces.

---

## 15. Recommended next roadmap scope

After Sprint 19, future work should be driven by post-launch evidence.

Possible next priorities:

- official WhatsApp API production rollout;
- direct Canva integration;
- online payments;
- native mobile/check-in app;
- advanced analytics;
- stronger partner SaaS scaling;
- commission management only if business policy changes;
- performance optimization;
- enterprise security hardening;
- user experience redesign based on feedback.

The next roadmap should be chosen from measured operational pain, user demand, business value, and risk reduction.

---

## 16. Codex prompt for Sprint 19

Use this prompt when assigning Codex to Sprint 19:

```text
You are the Orchestrator Agent for the Diginoces platform.

Repository: carlkanda/diginoces-platform

Work only on Sprint 19: Post-Launch Operations & Continuous Improvement.

Before coding or reviewing, read AGENTS.md and the relevant documents:
- docs/planning/sprint-19-plan.md
- docs/planning/sprint-18-plan.md
- docs/planning/sprint-15-plan.md
- docs/planning/mvp-build-execution-plan.md
- docs/planning/mvp-release-notes.md, if present
- docs/planning/mvp-known-limitations.md, if present
- docs/planning/mvp-launch-checklist.md, if present
- docs/planning/mvp-rollback-plan.md, if present
- docs/setup/deployment-readiness.md, if present
- docs/product/01-product-vision-business-model.md
- docs/product/13-dashboards-reports-audit-logs.md
- docs/product/14-files-storage-retention-security.md
- docs/product/16-technical-architecture.md
- docs/product/17-mvp-roadmap-development-phases.md
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

codex/sprint-19-post-launch-operations

Implement Sprint 19 only.

Required scope:
1. Create post-launch monitoring checklist.
2. Create production support and triage workflow.
3. Create incident response procedure.
4. Create backup/restore validation documentation.
5. Create user feedback review process.
6. Create or update staff training guide.
7. Create performance review document.
8. Create production issue classification framework.
9. Create post-launch improvement backlog.
10. Create post-launch roadmap recommendation.
11. Review production data hygiene and operational fallback readiness.
12. Fix only production-critical bugs or launch-stability issues if discovered and documented.
13. Add or update tests/QA evidence where needed.
14. Update documentation.
15. Create docs/planning/sprint-19-completion-report.md.
16. Open a draft PR titled: Sprint 19 — Post-Launch Operations & Continuous Improvement.

Out of scope:
- large new modules;
- full UI redesign;
- online payment provider integration;
- native mobile app;
- partner commission management;
- full white-label SaaS;
- direct Canva API replacement;
- speculative AI automation;
- major architecture rewrite;
- feature requests not prioritized through the post-launch backlog.

The PR must reference the Sprint 19 issue.

Do not mark Sprint 19 complete unless support workflow, monitoring, backup/restore status, feedback process, known issues, and roadmap recommendations are documented.
```

---

## 17. Summary

Sprint 19 closes the loop after launch.

It should help Diginoces move from build mode to operating mode: monitoring, support, incident response, training, real-user feedback, performance review, and evidence-based roadmap decisions.

The expected result is a stable operational foundation and a prioritized plan for the next phase of Diginoces growth.
