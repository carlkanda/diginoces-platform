# Agent Execution Workflow — Diginoces

## 1. Purpose

This document defines how AI agents and subagents should execute work for the Diginoces platform.

The purpose is to keep development controlled, traceable, testable, and aligned with the documentation.

---

## 2. Standard execution chain

Every work item must follow this chain:

```text
Requirement ID → Epic → Feature → User Story → Task → Implementation → Test → Review → Release note
```

Agents must not skip steps.

---

## 3. Work intake

The Orchestrator Agent receives the sprint objective and identifies the approved backlog items.

For each item, it must confirm:

- requirement ID;
- source document;
- module;
- acceptance criteria;
- responsible agent;
- expected output;
- tests required.

---

## 4. Planning step

Before implementation, the assigned agent must produce a short implementation plan.

The plan should include:

- files/modules to create or modify;
- database/API impact;
- UI impact;
- permission impact;
- audit-log impact;
- tests to write;
- open assumptions.

---

## 5. Implementation step

Implementation must remain inside the ticket scope.

Agents must not add unrelated features, even if they seem useful.

If a missing dependency is discovered, the agent must raise a blocker or create a follow-up proposal.

---

## 6. Testing step

Every completed task must include tests appropriate to the module.

Examples:

- unit tests;
- integration tests;
- API tests;
- permission tests;
- UI tests;
- offline sync tests;
- PDF generation tests;
- check-in flow tests.

---

## 7. Security review

Security review is required for:

- authentication;
- authorization;
- public guest pages;
- check-in tokens;
- file downloads;
- payment gates;
- contract approval;
- partner restrictions;
- audit logs.

---

## 8. Review and completion

A task is complete only when:

- acceptance criteria pass;
- tests pass;
- code is reviewed;
- security concerns are resolved;
- documentation is updated;
- traceability is updated.

---

## 9. Sprint report

At the end of each sprint, the Orchestrator Agent must produce a sprint report with:

- completed requirements;
- completed backlog items;
- code/files created;
- tests added;
- open issues;
- known risks;
- recommended next sprint.

---

## 10. Change control

If a new requirement appears during implementation, the agent must not silently implement it.

It must be recorded as:

- new requirement proposal;
- backlog candidate;
- dependency;
- blocker;
- out-of-scope item.

---

## 11. Summary

This workflow ensures that Diginoces is built by agents in a disciplined way: requirement-first, test-backed, permission-aware, and review-controlled.
