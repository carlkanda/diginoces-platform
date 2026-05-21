# Sprint 5 Plan — RSVP & Public Guest Page

## 1. Sprint goal

Sprint 5 builds the **RSVP & Public Guest Page** foundation for the Diginoces platform.

The goal is to give each invited guest a secure, personal, guest-facing page where they can view basic wedding/event information and submit RSVP responses for the events they are invited to.

Sprint 5 must establish:

- secure guest public-page token foundation;
- guest-facing page access rules;
- payment-gated public-page access;
- Diginoces/admin preview of guest public pages;
- event-specific RSVP model;
- RSVP answers: Yes, No, Maybe;
- RSVP deadline foundation;
- RSVP change rules;
- RSVP operational-effect foundation;
- guest preferred language support;
- basic elegant guest-page UI foundation;
- placeholder for invitation download only, not real PDF generation;
- placeholder for written guest messages only if low-risk, not full post-event book workflow.

Sprint 5 must not build invitation PDF generation, QR generation, WhatsApp sending, seating, check-in, contracts, pricing, payments, or full guest-book workflows.

---

## 2. Source documents

Before coding, the agent must read and follow:

- `AGENTS.md`
- `docs/agent-system/00-ai-agent-build-system-governance.md`
- `docs/agent-system/agent-role-prompts.md`
- `docs/agent-system/agent-execution-workflow.md`
- `docs/planning/mvp-build-execution-plan.md`
- `docs/planning/sprint-3-plan.md`
- `docs/planning/sprint-4-plan.md`
- `docs/product/05-rsvp-public-guest-page.md`
- `docs/product/04-guest-management-guest-lists.md`
- `docs/product/03-wedding-project-structure.md`
- `docs/product/02-user-roles-permissions-access-control.md`
- `docs/product/10-contracts-pricing-payment-controls.md`
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

Sprint 5 depends on Sprint 4 being merged into `main`.

Sprint 5 must assume these foundations already exist:

- secure platform foundation;
- project model;
- event model;
- project membership model;
- event membership model;
- guest model;
- guest event assignment model;
- bride/groom side model;
- guest import/review foundation;
- guest validation foundation;
- audit-log foundation;
- RBAC and permission foundations.

If any Sprint 4 dependency is missing, the agent must stop, report the blocker, and avoid creating workaround models that conflict with the planned architecture.

---

## 4. Backlog scope

Sprint 5 focuses on the **RSVP & Public Guest Page** epic.

Primary epic:

- `EPIC-RSVP` — RSVP & Public Guest Page

Primary features:

- `FEAT-RSVP-001` — Secure public guest page foundation
- `FEAT-RSVP-002` — Guest public-page token model
- `FEAT-RSVP-003` — Payment gate for guest-facing access
- `FEAT-RSVP-004` — RSVP Yes/No/Maybe model
- `FEAT-RSVP-005` — Event-specific RSVP responses
- `FEAT-RSVP-006` — RSVP deadlines and change rules
- `FEAT-RSVP-007` — RSVP dashboard/summary foundation
- `FEAT-RSVP-008` — Guest language support
- `FEAT-RSVP-009` — Admin preview of public guest pages

If the exact feature IDs differ in the CSV backlog, the agent must use the matching backlog rows and document the actual IDs in the Sprint 5 completion report.

---

## 5. Requirement IDs covered

Sprint 5 should primarily cover or begin coverage for:

- `RSVP-001` — Secure personal public guest page without account creation
- `RSVP-002` — Guest public page locked until full payment or payment exception override
- `RSVP-003` — Diginoces/admin preview before payment unlock; couple cannot preview
- `RSVP-004` — Elegant wedding-style guest page with couple photo and event information
- `RSVP-005` — French/English language support with guest preferred language
- `RSVP-006` — RSVP options: Yes, No, Maybe
- `RSVP-007` — Multi-event RSVP flow with answers stored per event
- `RSVP-008` — Event-specific RSVP deadline
- `RSVP-009` — RSVP change rules: only Maybe can be changed by guest
- `RSVP-010` — Operational effects: No excluded, Maybe included
- `RSVP-012` — Pending/Maybe after deadline enter manual review foundation
- `RSVP-013` — Guest invitation download placeholder from public page
- `RSVP-014` — Printed-only RSVP handled manually by Diginoces/couple
- `ROLE-009` — Guests access only their own secure public page
- `PAY-014` — Full payment unlocks guest public page and invitation sending
- `PAY-015` — Payment exception override foundation, if not already implemented
- `REP-006` — Audit logs for sensitive actions
- `TECH-010` — Secure public guest tokens and check-in tokens are separate and revocable

Sprint 5 may reference future requirements, but it must not implement future modules unless explicitly in scope.

---

## 6. In scope

Sprint 5 may implement the following.

### 6.1 Guest public-page token foundation

Add a secure public token model for guest-facing access.

The token model should support:

- guest ID;
- project ID;
- optional event ID or multi-event access behavior;
- token value or hashed token value;
- token type such as `guest_public_page`;
- active/revoked status;
- created_at timestamp;
- expires_at if needed;
- last_used_at if implemented;
- audit trail for regeneration or revocation.

The public guest page token must be separate from future check-in tokens.

Token rules:

- token must be hard to guess;
- token must not expose database IDs directly;
- token should be revocable or regeneratable;
- guest can access only their own public page;
- token should not grant admin app access.

### 6.2 Public guest page route

Add a guest-facing route such as:

```text
/g/[guestToken]
```

The exact route can follow existing conventions, but it must be public-token based and must not require a full guest account.

The page should show only safe guest-facing data:

- guest display name;
- couple names;
- couple photo placeholder or stored URL if already available;
- invited event list;
- event date/time/location where available;
- RSVP controls for eligible events;
- preferred language selector or language-aware labels;
- invitation download placeholder only;
- contact/help placeholder if useful.

The page must not show:

- full guest list;
- other guests;
- internal notes;
- audit logs;
- pricing;
- payments;
- contracts;
- staff-only data;
- check-in history.

### 6.3 Payment gate for guest-facing access

Guest public pages should remain locked until:

- full payment is confirmed; or
- Diginoces/admin grants a payment exception override.

If full payment/payment exception foundations do not exist yet, Sprint 5 should implement a minimal project-level gate field or access-check abstraction, not the full payment module.

The public guest page should show a safe locked state when access is blocked.

The locked state must not leak sensitive guest/event data.

Diginoces/admin preview must be possible before public unlock, but couple users should not preview public guest pages before unlock unless future requirements change.

### 6.4 Admin preview foundation

Diginoces/admin should be able to preview the guest public page before the payment gate is unlocked.

Preview should:

- require authenticated internal permission;
- use project/guest context;
- clearly mark the page as preview mode;
- avoid generating guest access logs as if the guest opened it;
- not bypass public access rules for real guests.

### 6.5 RSVP response model

Add database support for RSVP records.

RSVP records should be event-specific and should link:

- guest ID;
- project ID;
- event ID;
- response status;
- response source;
- submitted_at timestamp;
- updated_at timestamp;
- submitted_by context, if applicable;
- deadline state if useful;
- audit trail references where appropriate.

Allowed guest-facing response values:

```text
yes
no
maybe
```

Internal values may also include:

```text
pending
manual_review
locked
```

If internal values are used, they must not confuse the guest-facing UI.

### 6.6 Multi-event RSVP

Guests invited to multiple events should use one public guest page where each invited event can have a separate RSVP answer.

Rules:

- guest sees only events they are invited to;
- response is stored per event;
- a guest can answer Yes for one event and No for another;
- RSVP deadline is evaluated per event;
- No excludes the guest only for that event;
- Maybe remains included for that event until changed or reviewed.

### 6.7 RSVP deadline foundation

Each event must support its own RSVP deadline.

If Sprint 2 did not add an RSVP deadline field to events, Sprint 5 may add it.

Deadline behavior:

- before deadline, guest can answer if public page is unlocked;
- after deadline, new/changed answers may be blocked or marked for review according to design;
- Pending/Maybe after deadline should enter manual review foundation.

Do not build full reminder workflows in Sprint 5. Maybe reminders belong to WhatsApp/reminder workflows later.

### 6.8 RSVP change rules

Guest-facing RSVP change rules:

| Previous answer | Guest can change later? |
|---|---:|
| Yes | No |
| No | No |
| Maybe | Yes |
| Pending | Yes |

Diginoces/admin can manually override RSVP records if a backend/admin pathway is implemented or prepared.

All changes must be auditable.

### 6.9 RSVP operational effect foundation

Sprint 5 should encode or document the operational effect of RSVP responses:

| RSVP | Operational treatment |
|---|---|
| Yes | Included in expected attendance, later seating, reminders, and check-in |
| Maybe | Included until final decision/manual review |
| No | Excluded from expected attendance, later seating, reminders, and check-in |
| Pending | Included or reviewable depending on deadline stage |

Sprint 5 should not build seating or check-in, but it should expose helpers or computed values future modules can reuse.

### 6.10 Printed-only RSVP foundation

Printed-only guests should not be forced into the digital public page flow.

Sprint 5 should support a manual RSVP source or status foundation so Diginoces/couple can later record RSVP for printed-only guests.

Do not build the full manual printed RSVP operations dashboard unless low-risk and clearly within RSVP foundation.

### 6.11 Language support

The public guest page should support French and English at foundation level.

The guest preferred language should affect:

- guest-facing labels;
- RSVP labels;
- locked-page message;
- success/error messages.

If a guest preferred language is missing, default to French or project default language according to existing project settings.

### 6.12 Invitation download placeholder

Guests should eventually download their latest active invitation from the public page.

Sprint 5 may implement only a placeholder if invitation generation and file versioning are not ready.

The placeholder must not create fake invitation-generation behavior.

Do not build PDF generation, invitation files, QR generation, or invitation sending in Sprint 5.

### 6.13 Basic RSVP dashboard/summary foundation

Sprint 5 may add a simple internal RSVP summary for project/event users:

- invited count;
- yes count;
- no count;
- maybe count;
- pending count;
- deadline passed count;
- manual review count.

Keep it simple. Full dashboards and reports belong to later dashboard/report sprints.

### 6.14 Audit logging

RSVP/public-page actions that should be audited include:

- public token created;
- public token revoked/regenerated;
- guest public page accessed, if safe and useful;
- RSVP submitted;
- RSVP changed;
- RSVP blocked due to deadline;
- admin preview used;
- admin/manual RSVP override, if implemented;
- payment gate override use, if applicable.

Do not expose audit logs to guests or couples.

### 6.15 Basic UI

Add basic UI for:

- public guest page;
- locked guest page state;
- admin preview mode;
- RSVP controls per event;
- RSVP submitted/success state;
- Maybe-change flow;
- language-aware labels;
- internal RSVP summary foundation.

Keep the UI elegant but simple. Sprint 5 is not final guest-page polish.

---

## 7. Out of scope

Do not implement the following in Sprint 5:

- invitation PDF generation;
- invitation template upload;
- QR image generation;
- check-in token generation;
- WhatsApp sending;
- Maybe WhatsApp reminders;
- seating/table assignment;
- check-in;
- contracts;
- pricing;
- full payment recording module;
- full payment exception approval workflow unless minimal gate support is needed;
- full guest-book workflow;
- full public wedding website;
- full dashboard/report module;
- partner project creation;
- automatic guest import;
- guest account creation.

If a future dependency is discovered, document it as a follow-up. Do not build it silently.

---

## 8. Recommended database objects

The agent may choose final names based on existing conventions, but the following objects are expected conceptually:

```text
guest_public_tokens
rsvp_records
```

Optional, if useful and low-risk:

```text
rsvp_audit_events
public_page_access_logs
manual_rsvp_reviews
```

If project/event payment gate fields are not yet available, the agent may add a minimal project-level public-access gate field or a clearly documented access-check abstraction.

Do not create invitation, WhatsApp, seating, check-in, contract, or payment domain tables in Sprint 5.

---

## 9. Recommended backend/API foundations

The agent may implement API routes, server actions, or service modules according to the existing app architecture.

Expected service capabilities:

- create/regenerate guest public token;
- resolve guest public token;
- verify public-page access gate;
- list guest invited events for public page;
- get RSVP state for guest/event;
- submit RSVP response;
- enforce RSVP change rules;
- enforce RSVP deadline rules;
- compute RSVP operational effect;
- support admin preview;
- support internal RSVP summary;
- write audit logs.

All backend operations must enforce permission and token checks server-side.

---

## 10. Permission and access rules

Sprint 5 must enforce or prepare these access rules.

### 10.1 Guest public token access

A valid guest token can:

- view that guest’s own public page;
- view that guest’s invited events;
- submit RSVP for that guest’s invited events if allowed;
- select or use preferred language;
- view invitation download placeholder if unlocked.

A valid guest token cannot:

- access admin app routes;
- see other guests;
- see full guest list;
- see internal notes;
- see audit logs;
- see pricing/payment/contract data;
- edit event assignments;
- edit table assignments.

### 10.2 Diginoces/admin

Can:

- preview guest public pages;
- regenerate/revoke guest public tokens;
- view RSVP summary;
- manually adjust RSVP if implemented;
- see manual review list if implemented.

### 10.3 Diginoces staff

Can act according to assigned permissions.

Possible staff permissions:

- preview public guest page;
- view RSVP dashboard/summary;
- handle manual RSVP review;
- regenerate token only if explicitly granted.

### 10.4 Bride/groom

Can:

- view RSVP progress/summary for their project, if implemented;
- participate in post-deadline review foundation if included.

Cannot:

- preview guest public page before payment unlock;
- access internal audit logs;
- bypass payment gate;
- edit partner-side guest data through public page flows.

---

## 11. Testing expectations

Sprint 5 must add tests for the RSVP and public guest page foundation.

At minimum, tests should cover:

- public token resolves only its own guest;
- invalid token cannot access guest page;
- revoked token cannot access guest page;
- locked payment gate blocks public guest access;
- Diginoces/admin preview can bypass public gate in preview mode only;
- couple cannot preview before unlock;
- guest sees only invited events;
- RSVP is stored per event;
- RSVP allows Yes/No/Maybe;
- guest can change Maybe later;
- guest cannot change Yes later from public flow;
- guest cannot change No later from public flow;
- RSVP deadline blocks or routes late responses according to design;
- RSVP No operationally excludes guest for that event;
- RSVP Maybe remains included for that event;
- preferred language affects guest-facing labels/messages;
- printed-only guest can be handled through manual RSVP foundation;
- RSVP changes produce audit entries or call audit abstraction;
- out-of-scope modules are not introduced.

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

Sprint 5 is complete only when:

- secure guest public token foundation exists;
- public guest page route exists;
- public page access is token-scoped;
- public page access respects payment gate or access-check abstraction;
- Diginoces/admin preview exists or is structurally prepared;
- guest sees only own data and invited events;
- RSVP response model exists;
- RSVP is event-specific;
- RSVP Yes/No/Maybe works;
- RSVP change rules are enforced;
- RSVP deadline foundation exists;
- RSVP operational-effect helpers exist or are documented in code;
- language foundation exists for the guest page;
- invitation download placeholder exists without fake PDF generation;
- printed-only RSVP foundation exists or is documented as a controlled manual path;
- permission/token checks prevent unauthorized access;
- audit logging exists for RSVP/public-page actions;
- tests are added and pass;
- CI passes;
- documentation is updated;
- Sprint 5 completion report is created.

---

## 13. Required deliverables

The Sprint 5 PR must include:

- database migration(s) for public guest tokens and RSVP records;
- TypeScript types updated/generated as needed;
- public guest page route/page;
- token resolution and access-gate logic;
- RSVP service logic;
- deadline/change-rule logic;
- admin preview foundation;
- language labels/translations foundation;
- internal RSVP summary foundation if implemented;
- permission and token checks;
- audit integration for RSVP/public page actions;
- tests for RSVP and public guest page foundation;
- documentation updates;
- `docs/planning/sprint-5-completion-report.md`.

---

## 14. Sprint 5 completion report template

The agent must create:

```text
docs/planning/sprint-5-completion-report.md
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
- public-token behavior implemented;
- payment-gate/access-check behavior implemented;
- RSVP behavior implemented;
- deadline/change-rule behavior implemented;
- audit-log behavior implemented;
- assumptions made;
- open issues or blockers;
- out-of-scope items intentionally deferred;
- recommended Sprint 6 scope.

---

## 15. Recommended Sprint 6 scope

Sprint 6 should handle:

- Canva-exported PDF template upload;
- invitation template configuration foundation;
- dynamic field placement foundation;
- public guest page QR vs check-in QR separation design;
- guest invitation file/version foundation;
- preview/staging generation;
- batch invitation generation job foundation;
- invitation-generation validation using guest data.

Sprint 6 should still not build WhatsApp sending, seating, or check-in unless the approved roadmap changes.

---

## 16. Codex prompt for Sprint 5

Use this prompt when assigning Codex to Sprint 5:

```text
You are the Orchestrator Agent for the Diginoces platform.

Repository: carlkanda/diginoces-platform

Work only on Sprint 5: RSVP & Public Guest Page.

Before coding, read AGENTS.md and the relevant documents:
- docs/planning/sprint-5-plan.md
- docs/planning/sprint-4-plan.md
- docs/planning/mvp-build-execution-plan.md
- docs/product/05-rsvp-public-guest-page.md
- docs/product/04-guest-management-guest-lists.md
- docs/product/03-wedding-project-structure.md
- docs/product/02-user-roles-permissions-access-control.md
- docs/product/10-contracts-pricing-payment-controls.md
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

codex/sprint-5-rsvp-public-guest-page

Implement Sprint 5 only.

Required scope:
1. Add secure guest public token foundation.
2. Add public guest page route and page.
3. Add token resolution and guest-scoped access checks.
4. Add payment-gate or guest-page access-check foundation.
5. Add Diginoces/admin preview foundation.
6. Add event-specific RSVP record model.
7. Add RSVP Yes/No/Maybe submission.
8. Add multi-event RSVP support.
9. Add RSVP deadline foundation.
10. Add RSVP change rules.
11. Add RSVP operational-effect helper foundation.
12. Add guest preferred language/labels foundation.
13. Add invitation download placeholder only.
14. Add printed-only RSVP/manual foundation if low-risk.
15. Add audit logging for RSVP/public page actions.
16. Add basic UI for guest page and RSVP controls.
17. Add tests.
18. Update documentation.
19. Create docs/planning/sprint-5-completion-report.md.
20. Open a draft PR titled: Sprint 5 — RSVP & Public Guest Page.

Out of scope:
- invitation PDF generation;
- invitation template upload;
- QR image generation;
- WhatsApp sending;
- seating;
- check-in;
- contracts;
- pricing;
- payments;
- partner project creation;
- full guest-book workflow.

The PR must reference the Sprint 5 issue.

Do not mark Sprint 5 complete unless tests/checks are documented.
```

---

## 17. Summary

Sprint 5 creates the first guest-facing experience in the Diginoces platform.

It should let guests securely access their own public page and submit RSVP responses per event, while respecting payment gates, deadlines, language preferences, and strict data isolation.

The expected result is a secure RSVP/public-page foundation that prepares the platform for invitation generation in Sprint 6.
