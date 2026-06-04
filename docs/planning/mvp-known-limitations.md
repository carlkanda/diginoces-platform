# MVP Known Limitations - Sprint 15

Traceability: GitHub issue `#31`; sprint plan `docs/planning/sprint-15-plan.md`; release backlog `EPIC-RELEASE`, especially `FEAT-REL-007`, `FEAT-REL-008`, and `FEAT-REL-010`.

## Summary

The MVP is ready for controlled staging QA and conditional launch review, not a fully automated production platform. The following limitations are intentional or accepted for the current release boundary.

| ID | Requirement ID / Backlog | Limitation | Classification | Operational impact | Follow-up |
| --- | --- | --- | --- | --- | --- |
| LIM-001 | `ROLE-009`; `FEAT-REL-002`; issue `#31` | Sensitive roles are marked as requiring MFA, but full app-enforced MFA challenge flow is not implemented in this repo | launch_risk | Production launch must rely on Supabase/operational MFA controls or restricted pilot access | Enforce MFA before broad production use |
| LIM-002 | `TECH-010`; `TD-001`; `FEAT-REL-007`; issue `#31` | `TD-001` keeps Next.js on `16.3.0-canary.25` because the stable Next.js line remains under active dependency-audit review | acceptable_mvp_risk | Canary framework risk remains | Recheck stable Next.js and `npm audit --omit=dev` before production readiness |
| LIM-003 | `MSG-*`; `FEAT-REL-007`; issue `#31` | WhatsApp is adapter-ready; no official production API credentials or sending are included | acceptable_mvp_risk | Staff must manually complete sends and track status | Add official API integration when approved |
| LIM-004 | `PAY-*`; `FEAT-REL-007`; issue `#31` | Online payment processing is not implemented | acceptable_mvp_risk | Payments are recorded manually and gates are controlled in-app | Add payment processor in a future sprint |
| LIM-005 | `INV-*`; `PDF-*`; `FEAT-REL-007`; issue `#31` | Canva remains an external/manual workflow for MVP | acceptable_mvp_risk | Staff use Canva exports with app template/file foundations rather than full platform-native editing | Keep external Canva workflow until direct integration is approved |
| LIM-006 | `GM-*`; `FEAT-REL-007`; issue `#31` | Full list lock/change-request workflow is not complete beyond foundation controls | launch_risk | Operations must control late guest edits manually | Implement full locked-list change requests |
| LIM-007 | `INV-*`; `PDF-*`; `QR-*`; `FEAT-REL-007`; issue `#31` | Production-grade PDF/QR worker execution remains foundation-level | launch_risk | Generation may require operational/manual fallback for high-volume use | Harden worker queue and rendering pipeline |
| LIM-008 | `CHK-*`; `FEAT-REL-007`; issue `#31` | Offline check-in has sync metadata/foundation but not a full PWA-grade offline UX | launch_risk | Venue operations need network fallback/manual paper process | Build and rehearse production offline flow |
| LIM-009 | `FILE-*`; `FEAT-REL-007`; issue `#31` | File upload UX is provider-backed/foundation-only | acceptable_mvp_risk | Operations may register/store files through controlled flows rather than a polished DAM | Harden direct upload UX later |
| LIM-010 | `TECH-004`; `TECH-010`; `FEAT-REL-003`; issue `#31` | Supabase performance advisors report cleanup items such as unindexed foreign keys and multiple permissive policies; see `docs/qa/rls-review.md` | post_launch_follow_up (see Security Escalation) | Performance findings are informational unless staging shows repeated queries over 2 seconds or more than 5% endpoint latency regression | Address performance items before higher-volume production; treat security/access violations as immediate blockers |
| LIM-011 | `INV-*`; `PDF-*`; `FEAT-REL-007`; issue `#31` | Direct Canva API integration is not implemented | post_launch_follow_up | Canva remains external for MVP pilot | Add direct Canva integration only if approved |
| LIM-012 | `REP-*`; `FILE-*`; `FEAT-REL-007`; issue `#31` | CSV-first exports remain the MVP export boundary | acceptable_mvp_risk | Some Excel/PDF exports remain placeholders or manual conversion workflows | Harden export formats after MVP pilot |
| LIM-014 | `PAY-*`; `FEAT-REL-007`; issue `#31` | Online payment processing is deferred beyond MVP | post_launch_follow_up | Payments remain manually recorded and operationally verified | Add payment processor when business process requires it |
| LIM-015 | `ROAD-*`; `FEAT-REL-010`; issue `#31` | Native mobile apps are not included | post_launch_follow_up | MVP remains responsive web only | Evaluate native apps after MVP usage evidence |
| LIM-016 | `REP-*`; `FEAT-REL-010`; issue `#31` | Advanced BI analytics are not included | post_launch_follow_up | Reports remain operational/foundation level | Expand BI after data model and usage mature |
| LIM-017 | `PART-*`; `FEAT-REL-010`; issue `#31` | Partner commission management is not included | post_launch_follow_up | Partner model remains profile/submission/project-draft foundation | Add commission workflows only when commercial process is approved |
| LIM-018 | `ROAD-*`; `FEAT-REL-010`; issue `#31` | AI assistance is not included | post_launch_follow_up | AI support starts only in a later sprint | Begin Sprint 16 only after MVP readiness gates are accepted |

## Security Escalation - LIM-010

Any confirmed RLS misconfiguration, policy overlap creating wrong-scope access, or unauthorized data access related to `LIM-010` is a `launch_blocker` and must be resolved before launch using `docs/qa/rls-review.md`.

The table classifies `LIM-010` performance-advisor cleanup as `post_launch_follow_up`; the standalone security escalation overrides that classification because confirmed RLS misconfiguration, policy overlap, or unauthorized access is an immediate operational/security blocker.

Verification checklist for the security override:

- reproduce the suspected RLS bypass with request steps, actor role, scope IDs, and expected/actual row visibility;
- attach evidence of policy overlap granting broader row access than intended;
- attach logs or query evidence showing unauthorized user access, wrong-scope reads, or data exfiltration indicators;
- attach supporting artifacts per `docs/qa/rls-review.md`, including query output, request IDs, and audit-log IDs where available.

Meeting any checklist item for a reproducible bypass, verified unauthorized access, or policy overlap that creates wrong-scope access upgrades `LIM-010` to `launch_blocker` and requires remediation before launch.

Change note: the previous duplicate WhatsApp follow-up row `LIM-013` was consolidated into canonical `LIM-003`; `LIM-003` now carries both the guided/manual MVP risk and the future official API integration action.

## Launch Position

These limitations support a `conditional_go` recommendation only after the Sprint 15 database migration is applied, CI/checks pass, and staging manual QA is recorded.
