# Sprint 18 Plan — SaaS / Partner Scaling Enhancements

## 1. Sprint goal

Sprint 18 builds the **SaaS / Partner Scaling Enhancements** foundation for the Diginoces platform.

The goal is to strengthen the platform so Diginoces can scale beyond internal operations and support a larger controlled network of partners, planners, and external providers while keeping Diginoces in control of branding, pricing, contracts, payments, data access, and service quality.

Sprint 18 must establish:

- scalable partner operations model;
- stronger organization/account boundary foundation;
- partner onboarding improvements;
- partner invitation and activation workflow;
- partner operational roles and team management foundation;
- partner-specific project views and permissions hardening;
- partner dashboard improvements without revenue leakage;
- partner activity and performance summaries without commission management;
- partner usage limits or guardrails foundation;
- Diginoces-admin partner governance tools;
- SaaS-readiness architecture review;
- optional white-label roadmap/foundation only as a controlled future option;
- audit logging for partner scaling actions.

Sprint 18 must not build partner commission management, referral-fee calculation, partner payouts, partner-controlled pricing, partner-controlled contracts, or full white-label SaaS unless a new approved business requirement changes the roadmap.

---

## 2. Source documents

Before coding, the agent must read and follow:

- `AGENTS.md`
- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/planning/sprint-17-plan.md`
- `docs/product/01-product-vision-business-model.md`
- `docs/product/02-user-roles-permissions-access-control.md`
- `docs/product/03-wedding-project-structure.md`
- `docs/product/12-partner-external-provider-model.md`
- `docs/product/13-dashboards-reports-audit-logs.md`
- `docs/product/14-files-storage-retention-security.md`
- `docs/product/16-technical-architecture.md`
- `docs/product/17-mvp-roadmap-development-phases.md`
- `docs/technical-design/database-schema-core-entities.md`
- `docs/technical-design/api-backend-service-design.md`
- `docs/technical-design/security-permissions-access-control.md`
- `docs/backlog/master-requirements-register.csv`
- `docs/backlog/initial-product-backlog-epics.csv`
- `docs/backlog/initial-product-backlog-features.csv`
- `docs/backlog/initial-product-backlog-user-stories.csv`
- `docs/backlog/initial-product-backlog-tasks.csv`
- `docs/backlog/initial-product-backlog-test-cases.csv`

---

## 3. Sprint dependency

Sprint 18 depends on Sprint 17 being merged into `main`.

Sprint 18 must assume these foundations already exist:

- secure platform foundation;
- full MVP operational modules;
- partner profile and partner project submission foundation;
- dashboards and reports;
- partner visibility restrictions;
- integrations foundation;
- files/storage/retention foundation;
- AI assistance foundation;
- RBAC and permission foundations;
- audit-log foundation.

If any Sprint 17 dependency is missing, the agent must stop, report the blocker, and avoid creating scaling logic that bypasses the planned architecture.

---

## 4. Backlog scope

Sprint 18 focuses on post-MVP **SaaS / Partner Scaling Enhancements**.

Primary epic:

- `EPIC-SCALE` — SaaS / Partner Scaling Enhancements

Related epics:

- `EPIC-PART` — Partner / External Provider Model
- `EPIC-ROLE` — Users, Roles & Permissions
- `EPIC-REP` — Dashboards, Reports & Audit Logs
- `EPIC-FILE` — Files, Storage, Retention & Security
- `EPIC-INT` — Integrations

Primary features:

- `FEAT-SCALE-001` — Partner onboarding workflow improvements
- `FEAT-SCALE-002` — Partner team/user management foundation
- `FEAT-SCALE-003` — Organization/account boundary hardening
- `FEAT-SCALE-004` — Partner operational dashboard enhancements
- `FEAT-SCALE-005` — Partner activity/performance summary without revenue leakage
- `FEAT-SCALE-006` — Partner usage guardrails and limits foundation
- `FEAT-SCALE-007` — Diginoces-admin partner governance tools
- `FEAT-SCALE-008` — SaaS-readiness architecture review
- `FEAT-SCALE-009` — Optional white-label roadmap/foundation only

If the exact feature IDs differ in the CSV backlog, the agent must use the matching backlog rows and document the actual IDs in the Sprint 18 completion report.

---

## 5. Requirement IDs covered

Sprint 18 should primarily cover or extend coverage for:

- `PV-002` — Internal operating system first, SaaS-ready architecture from day one
- `PV-003` — Diginoces controls pricing, branding, contracts, packages, and client experience
- `PART-001` — Partners bring weddings under Diginoces brand/pricing
- `PART-002` — Partner account/profile foundation
- `PART-003` — Partners can create draft projects and submit for admin approval
- `PART-004` — Diginoces/admin approval required before couple access
- `PART-005` — Partners cannot manage pricing, revenue, payment exceptions, internal notes, or audit logs
- `PART-006` — Partners can communicate with couples through project comment thread
- `PART-007` — Projects brought by partner are tracked but commissions are not managed in version 1
- `ROLE-001` — Global/project/event/custom role model
- `ROLE-004` — Partner role restrictions
- `REP-004` — Partner dashboard without revenue/payment details
- `TECH-004` — Backend permission enforcement
- `REP-006` — Audit logs for sensitive actions

Sprint 18 may define future SaaS/white-label roadmap items, but it must not implement business-policy changes not approved by Diginoces.

---

## 6. In scope

Sprint 18 may implement the following.

### 6.1 Partner onboarding workflow improvements

Improve how Diginoces/admin creates and activates partners.

The workflow may support:

- partner invitation;
- partner profile completion;
- partner terms acknowledgment if needed;
- Diginoces/admin approval;
- activation/deactivation;
- onboarding status;
- onboarding checklist;
- welcome/setup instructions.

Partner onboarding should remain controlled by Diginoces/admin.

### 6.2 Partner team/user management foundation

Partners may need more than one user.

Support foundation for:

- partner admin;
- partner member;
- partner assistant/operator;
- user invitation/revocation;
- active/inactive status;
- project-scoped partner user assignment;
- audit logging.

Do not let partner admins grant themselves access outside Diginoces rules.

### 6.3 Organization/account boundary hardening

Strengthen separation between:

- Diginoces internal organization;
- partner profiles/organizations;
- partner users;
- projects brought by partners;
- projects assigned operationally to partners.

Partner access must remain project-scoped or partner-scoped, not global.

The implementation should prepare SaaS-readiness without creating uncontrolled multi-tenant behavior.

### 6.4 Partner dashboard enhancements

Improve the partner dashboard while preserving restrictions.

Partner dashboard may show:

- submitted projects;
- approved projects;
- active projects;
- upcoming events;
- operational milestones;
- pending partner actions;
- comments requiring response;
- project progress indicators;
- high-level guest/RSVP/invitation/seating/check-in progress only where allowed.

Partner dashboard must not show:

- revenue;
- payment amounts;
- discounts;
- payment exception details;
- internal notes;
- audit logs;
- global Diginoces performance;
- other partner data.

### 6.5 Partner activity/performance summary without commission management

Diginoces/admin may need partner activity visibility.

Allowed summaries:

- number of projects submitted;
- number approved/rejected;
- active projects;
- completed projects;
- average approval time;
- partner communication responsiveness if data exists;
- operational quality notes if internal only.

Forbidden in Sprint 18 unless explicitly approved:

- commission calculation;
- referral fee payable;
- payout status;
- partner revenue share;
- automated partner invoices.

### 6.6 Partner usage guardrails and limits foundation

Diginoces/admin may configure guardrails.

Examples:

- maximum draft projects before review;
- ability to suspend new submissions;
- project submission required fields;
- partner access expiration;
- partner role limits;
- notification/alert when partner submits a project.

Guardrails must be enforced server-side.

### 6.7 Diginoces-admin partner governance tools

Add or improve governance tools:

- partner list;
- partner health/status;
- partner project history;
- partner access review;
- partner suspension/reactivation;
- partner data access review;
- partner audit summary;
- partner operational notes visible only internally.

Governance tools are internal only.

### 6.8 SaaS-readiness architecture review

Create or update a document reviewing SaaS-readiness.

Recommended file:

```text
docs/planning/saas-readiness-review.md
```

The review should assess:

- data isolation;
- role/permission model;
- project scoping;
- partner scoping;
- file access isolation;
- audit logs;
- branding constraints;
- operational risks;
- what is needed before true SaaS/white-labeling.

### 6.9 Optional white-label roadmap/foundation

Sprint 18 may document a future white-label roadmap, but should not implement full white-labeling unless approved.

Allowed:

- document branding assumptions;
- define future configuration options;
- identify required permission/data isolation changes;
- create placeholder settings if low-risk and inactive.

Not allowed:

- partner-controlled branding in production;
- partner-controlled pricing;
- partner-controlled contracts;
- partner-owned customer billing.

### 6.10 Partner communication improvements

Improve partner project comments if already implemented.

Possible improvements:

- mentions;
- read/unread status;
- attachments if safe;
- visibility labels;
- admin moderation/removal;
- internal-only note separation.

Do not merge internal notes with partner-visible comments.

### 6.11 Partner reporting restrictions hardening

Review and harden partner report access.

Ensure partners cannot access:

- payment reports;
- revenue reports;
- contract pricing internals;
- audit logs;
- internal staff notes;
- other partner project reports.

### 6.12 Audit logging

Partner scaling actions that should be audited include:

- partner invited;
- partner activated/deactivated;
- partner suspended/reactivated;
- partner user added/removed;
- partner role changed;
- partner dashboard access denied if security-relevant;
- partner project submitted/approved/rejected;
- partner guardrail changed;
- partner communication visibility changed;
- partner governance note created/updated.

Audit logs remain internal.

---

## 7. Out of scope

Do not implement the following in Sprint 18:

- commission management;
- referral-fee calculation;
- partner payouts;
- partner billing;
- partner-controlled pricing;
- partner-controlled contracts;
- partner-controlled payment exceptions;
- full white-label SaaS;
- partner-specific public domains;
- partner-owned customer billing;
- public marketplace;
- native mobile app;
- online payment processing;
- unrelated advanced integrations;
- major UI redesigns unrelated to scaling.

If a future dependency is discovered, document it as a follow-up. Do not build it silently.

---

## 8. Recommended database objects

The agent may choose final names based on existing conventions, but the following objects are expected conceptually:

```text
partner_invitations
partner_team_members
partner_onboarding_checklists
partner_usage_limits
partner_governance_notes
partner_activity_summaries
partner_access_reviews
```

Optional, if useful and low-risk:

```text
partner_scaling_settings
partner_branding_placeholders
saas_readiness_findings
```

The implementation must integrate with existing partners, users, roles, projects, dashboards, files, permissions, and audit foundations.

Do not create commission, payout, white-label tenant, partner billing, or partner-owned pricing tables in Sprint 18.

---

## 9. Recommended backend/API foundations

The agent may implement API routes, server actions, or service modules according to the existing app architecture.

Expected service capabilities:

- invite partner user;
- activate/deactivate partner team member;
- assign partner team user to project;
- set partner usage limits;
- enforce partner submission guardrails;
- compute partner dashboard metrics;
- compute internal partner activity summary;
- list partner access review items;
- create partner governance note;
- harden partner report visibility;
- create SaaS-readiness review artifact;
- write audit logs.

All backend operations must enforce permissions server-side.

---

## 10. Permission rules

Sprint 18 must enforce or prepare these permission rules.

### 10.1 Diginoces/admin

Can:

- manage partners and partner users;
- configure partner guardrails;
- view partner activity summaries;
- view partner access reviews;
- suspend/reactivate partners;
- view internal partner governance notes;
- review SaaS-readiness findings.

### 10.2 Diginoces staff

Can act according to assigned permissions.

Possible staff permissions:

- view partner project assignments;
- communicate in project thread;
- review partner-submitted projects if granted;
- view limited partner operational context.

Staff should not manage partner business controls unless explicitly granted.

### 10.3 Partner admin

Can:

- manage limited users inside own partner organization if allowed;
- create/submit project drafts;
- view own/assigned partner project dashboard;
- respond in project comments;
- view non-sensitive operational progress.

Cannot:

- grant access outside own partner scope;
- view revenue/payment/internal/audit data;
- change pricing/contracts/payment exceptions;
- bypass Diginoces/admin approval.

### 10.4 Partner member

Can:

- access only assigned partner projects;
- perform operational actions granted by Diginoces rules.

Cannot:

- manage partner profile/status unless granted;
- create unrestricted projects;
- access sensitive commercial/internal data.

### 10.5 Couple and guests

Couple and guest access should not expand because of partner scaling.

Couples may communicate with partners only inside allowed project comments.

Guests do not access partner features.

---

## 11. Testing expectations

Sprint 18 must add tests for SaaS/partner scaling restrictions.

At minimum, tests should cover:

- admin can invite partner user;
- unauthorized user cannot invite partner user;
- partner admin can see own partner users if allowed;
- partner admin cannot access another partner organization;
- partner member can access only assigned projects;
- partner cannot bypass submission limits/guardrails;
- suspended partner cannot submit new projects;
- partner dashboard excludes revenue/payment/internal notes/audit logs;
- internal partner activity summary visible only to Diginoces/admin;
- partner usage limits are enforced server-side;
- partner project comment visibility is correct;
- internal notes remain hidden from partners;
- partner access review lists correct restricted access;
- partner scaling actions produce audit entries or call audit abstraction;
- commission/referral/payout tables or logic are not introduced.

CI must continue to pass:

```text
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

If database linting requires Supabase authentication, keep it documented as a local/manual check unless CI secrets are explicitly configured.

---

## 12. Acceptance criteria

Sprint 18 is complete only when:

- partner onboarding improvements exist;
- partner team/user management foundation exists;
- organization/account boundary hardening exists;
- partner dashboard enhancements exist without revenue leakage;
- partner activity/performance summaries exist for Diginoces/admin only;
- partner usage guardrails exist or are structurally prepared;
- Diginoces-admin partner governance tools exist;
- SaaS-readiness review document exists;
- optional white-label roadmap/foundation is documented only, not uncontrolled production behavior;
- permission checks prevent partner cross-access and sensitive data leakage;
- audit logging exists for partner scaling actions;
- tests are added and pass;
- CI passes;
- documentation is updated;
- Sprint 18 completion report is created.

---

## 13. Required deliverables

The Sprint 18 PR must include:

- database migration(s) for partner invitations, team members, guardrails, governance notes, access reviews, or scaling settings if needed;
- TypeScript types updated/generated as needed;
- partner onboarding workflow improvements;
- partner user/team management logic;
- partner guardrail enforcement logic;
- partner dashboard enhancement logic;
- internal partner activity summary logic;
- partner access review logic;
- SaaS-readiness review document;
- optional white-label roadmap document/foundation;
- permission checks for partner scaling operations;
- audit integration for partner scaling actions;
- minimal UI for partner onboarding/team/governance/dashboard enhancements;
- tests for partner scaling boundaries;
- documentation updates;
- `docs/planning/sprint-18-completion-report.md`.

---

## 14. Sprint 18 completion report template

The agent must create:

```text
docs/planning/sprint-18-completion-report.md
```

The report must include:

- sprint status;
- requirement IDs covered;
- backlog items covered;
- files created or changed;
- database migrations added;
- tests added;
- commands run;
- checks passed or failed;
- security checks performed;
- partner onboarding behavior implemented;
- partner team/user behavior implemented;
- partner dashboard/access behavior implemented;
- partner guardrail behavior implemented;
- SaaS-readiness findings;
- white-label roadmap/foundation status;
- audit-log behavior implemented;
- assumptions made;
- open issues or blockers;
- out-of-scope items intentionally deferred;
- recommended next roadmap scope.

---

## 15. Recommended next roadmap scope

After Sprint 18, future work should be chosen from validated business priorities, such as:

- official WhatsApp API production rollout;
- direct Canva integration;
- online payments;
- native mobile check-in app;
- advanced analytics;
- partner commission management only if business policy changes;
- full white-label SaaS only after data isolation and branding governance are approved;
- stronger enterprise security controls;
- performance optimization for large-scale events.

These should be planned as separate future roadmap items and not bundled into Sprint 18.

---

## 16. Codex prompt for Sprint 18

Use this prompt when assigning Codex to Sprint 18:

```text
You are the Orchestrator Agent for the Diginoces platform.

Repository: carlkanda/diginoces-platform

Work only on Sprint 18: SaaS / Partner Scaling Enhancements.

Before coding, read AGENTS.md and the relevant documents:
- docs/planning/sprint-18-plan.md
- docs/planning/sprint-17-plan.md
- docs/planning/mvp-build-execution-plan.md
- docs/product/01-product-vision-business-model.md
- docs/product/02-user-roles-permissions-access-control.md
- docs/product/03-wedding-project-structure.md
- docs/product/12-partner-external-provider-model.md
- docs/product/13-dashboards-reports-audit-logs.md
- docs/product/14-files-storage-retention-security.md
- docs/product/16-technical-architecture.md
- docs/product/17-mvp-roadmap-development-phases.md
- docs/technical-design/database-schema-core-entities.md
- docs/technical-design/api-backend-service-design.md
- docs/technical-design/security-permissions-access-control.md
- docs/backlog/master-requirements-register.csv
- docs/backlog/initial-product-backlog-epics.csv
- docs/backlog/initial-product-backlog-features.csv
- docs/backlog/initial-product-backlog-user-stories.csv
- docs/backlog/initial-product-backlog-tasks.csv
- docs/backlog/initial-product-backlog-test-cases.csv

Create a new branch:

codex/sprint-18-saas-partner-scaling

Implement Sprint 18 only.

Required scope:
1. Add partner onboarding workflow improvements.
2. Add partner team/user management foundation.
3. Harden organization/account boundaries.
4. Enhance partner dashboard without revenue leakage.
5. Add internal partner activity/performance summary without commission management.
6. Add partner usage guardrails/limits foundation.
7. Add Diginoces-admin partner governance tools.
8. Add partner access review foundation.
9. Create SaaS-readiness review documentation.
10. Add optional white-label roadmap/foundation only as inactive/future-facing.
11. Harden partner reporting restrictions.
12. Add permission checks for partner scaling operations.
13. Add audit logging for partner scaling actions.
14. Add basic UI for partner onboarding/team/governance/dashboard enhancements.
15. Add tests.
16. Update documentation.
17. Create docs/planning/sprint-18-completion-report.md.
18. Open a draft PR titled: Sprint 18 — SaaS / Partner Scaling Enhancements.

Out of scope:
- commission management;
- referral-fee calculation;
- partner payouts;
- partner billing;
- partner-controlled pricing;
- partner-controlled contracts;
- partner-controlled payment exceptions;
- full white-label SaaS;
- partner-specific public domains;
- online payment processing;
- native mobile app.

The PR must reference the Sprint 18 issue.

Do not mark Sprint 18 complete unless tests/checks are documented.
```

---

## 17. Summary

Sprint 18 strengthens Diginoces for controlled partner scaling after the MVP foundation is complete.

It should improve partner onboarding, partner team management, dashboards, governance, access boundaries, and SaaS-readiness without giving partners control over pricing, contracts, payments, commissions, or sensitive internal data.

The expected result is a safer scaling foundation and a clear roadmap for future SaaS/white-label possibilities.
