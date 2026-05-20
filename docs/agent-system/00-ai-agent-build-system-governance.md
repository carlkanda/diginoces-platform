# 00 — AI Agent Build System and Governance

## 1. Purpose

This document defines the governance system that AI agents and subagents must follow while building the Diginoces platform.

The goal is to prevent forgotten features, uncontrolled implementation, weak testing, and undocumented decisions.

---

## 2. Core build rule

No feature may be implemented unless it is linked to a documented requirement ID.

No requirement may be marked complete unless it has been:

1. implemented;
2. tested;
3. reviewed;
4. linked back to the requirements register.

---

## 3. Required sources

Agents must use these sources:

- product To-Be documents;
- Master Requirements Register;
- Initial Product Backlog;
- Technical Design Package;
- MVP Build Execution Plan;
- Sprint Plans;
- Agent Role Prompts.

Agents must not invent features outside the documented scope without creating a new requirement proposal.

---

## 4. Agent roles

Recommended agents:

- Orchestrator Agent;
- Product Analyst Agent;
- Backlog Agent;
- Architecture Agent;
- UX/UI Agent;
- Backend Agent;
- Frontend Agent;
- PDF/QR Agent;
- WhatsApp Agent;
- Check-in Agent;
- QA/Test Agent;
- Security Agent;
- Documentation Agent;
- Release Manager Agent.

---

## 5. Execution workflow

Every implementation unit must follow this workflow:

```text
Requirement ID → Backlog ticket → Design reference → Implementation → Tests → Review → Status update
```

---

## 6. Traceability matrix

Every ticket should map to:

- requirement ID;
- source document;
- module;
- user story;
- implementation files;
- test cases;
- QA status;
- security review status;
- release status.

---

## 7. Definition of Done

A task is done only when:

- it satisfies acceptance criteria;
- tests pass;
- permissions are enforced;
- audit logging is added where required;
- documentation is updated;
- no high-risk issues remain open;
- requirement status is updated.

---

## 8. Anti-forgetting rules

- Never work from memory only.
- Always check requirement IDs.
- Always update traceability.
- Always test critical flows.
- Always respect role permissions.
- Always record open questions instead of guessing.

---

## 9. Scope control

Agents must build by sprint and module.

They must not build future/post-MVP features inside MVP work unless explicitly approved.

---

## 10. Summary

This governance document is the operating system for the AI build team. It controls scope, traceability, review, testing, and quality across the full Diginoces implementation.
