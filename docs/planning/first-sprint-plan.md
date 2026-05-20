# First Sprint Plan — Diginoces

## 1. Sprint goal

Sprint 1 establishes the secure technical foundation of the Diginoces platform.

This sprint must not build guest management, invitations, WhatsApp, RSVP, check-in, contracts, or partner features yet.

---

## 2. Sprint scope

Sprint 1 includes:

- repository structure;
- web app scaffold;
- TypeScript setup;
- linting/formatting setup;
- test setup;
- authentication foundation;
- database connection foundation;
- role/permission foundation;
- audit-log foundation;
- file-storage abstraction;
- environment variable template;
- developer setup guide.

---

## 3. Requirements covered

Primary requirement groups:

- PV-001;
- PV-002;
- ROLE-001;
- ROLE-002;
- ROLE-003;
- ROLE-007;
- REP-006;
- FILE-001;
- TECH-001;
- TECH-003;
- TECH-004.

---

## 4. Agent responsibilities

| Agent | Responsibility |
|---|---|
| Orchestrator Agent | Coordinate sprint and maintain traceability |
| Architecture Agent | Validate stack and repo structure |
| Backend Agent | Create database and service foundation |
| Frontend Agent | Create app shell and protected layout foundation |
| Security Agent | Review auth, permissions, environment, and access control |
| QA/Test Agent | Create initial test setup and smoke tests |
| Documentation Agent | Create setup guide and developer notes |

---

## 5. Required deliverables

- Working repository scaffold.
- README updated with setup instructions.
- `.env.example` file.
- Database migration folder.
- Initial auth/role design implemented or stubbed.
- Audit-log model/migration foundation.
- Storage abstraction placeholder.
- Test runner configured.
- First CI workflow proposal or placeholder.
- Sprint completion report.

---

## 6. Acceptance criteria

Sprint 1 is complete only when:

- app can be installed and started locally;
- environment variables are documented;
- database connection approach is defined;
- role/permission foundation exists;
- audit-log foundation exists;
- no secrets are committed;
- at least one smoke test exists;
- setup guide is clear enough for a new developer/agent to follow.

---

## 7. Out of scope

Do not build yet:

- guest CRUD;
- RSVP;
- invitation generator;
- PDF generation;
- WhatsApp sending;
- check-in;
- contracts/pricing;
- dashboards beyond placeholder;
- partner project creation.

---

## 8. Sprint completion report template

At the end of Sprint 1, the Orchestrator Agent must report:

- requirements covered;
- backlog items completed;
- files created;
- tests added;
- security checks performed;
- open issues;
- blockers;
- recommended Sprint 2 scope.

---

## 9. Summary

Sprint 1 is a foundation sprint. Its success is measured by stability, traceability, clean setup, security foundations, and readiness for project/event implementation in Sprint 2.
