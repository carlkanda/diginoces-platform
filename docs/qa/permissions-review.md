# Role And Permission Security Review - Sprint 15

## Scope

This Sprint 15 review covers role and permission boundaries implemented across Sprints 1-14: auth, projects/events, guests, imports, RSVP/public guest pages, invitations, messages, seating, check-in, contracts/payments, reports/audit, guest-book, partners, and files.

## Traceability

- GitHub issue: `#31` - Sprint 15 - Release Hardening, QA & MVP Launch.
- Sprint plan: `docs/planning/sprint-15-plan.md`.
- Requirements/backlog: `ROLE-001`, `ROLE-002`, `ROLE-003`, `ROLE-004`, `ROLE-005`, `ROLE-006`, `ROLE-007`, `ROLE-009`, `TECH-004`, `TECH-010`, `FILE-004`, `REP-006`, `EPIC-RELEASE`, and `FEAT-REL-002`.
- Database hardening artifact: `supabase/migrations/20260603113922_sprint_15_release_security_grants.sql`.

## Role Review

Launch classification vocabulary: use `launch_blocker`, `launch_risk`, `acceptable_mvp_risk`, and `post_launch_follow_up`. Older review shorthand maps as follows: `production_no_go` and `must_fix_before_launch` mean `launch_blocker`; `conditional_go` means `acceptable_mvp_risk`; `launch_risk` remains `launch_risk`.

Classification definitions: `launch_blocker` must be fixed before any production launch and requires engineering lead plus Diginoces owner sign-off; `launch_risk` is a significant risk acceptable only for limited staging or controlled pilot use with owner acceptance; `acceptable_mvp_risk` is a known MVP risk with mitigation, monitoring, and remediation ownership; `post_launch_follow_up` is non-blocking work tracked for post-launch planning by the responsible module owner.

| Role | Intended access | Sprint 15 review result | Launch classification |
| --- | --- | --- | --- |
| Diginoces admin | Full platform control, settings, users, pricing, payments, contracts, reports, audit logs | Permission registry and RLS/RPC helpers grant broad access; sensitive role is marked `requires_mfa` | `launch_risk` for controlled internal staging/pilot users; becomes `launch_blocker` for broad production if MFA is not enforced/configured |
| Diginoces staff/operations | Assignment-based project/event operations | Project/event membership and scoped permission helpers are used across server/API layers | `acceptable_mvp_risk` after staging role-boundary QA |
| Bride | Own project, own-side guest edits where allowed, safe public/project views | Side-aware helpers and hardening tests cover bride-side boundaries | `acceptable_mvp_risk` after staging role-boundary QA |
| Groom | Own project, own-side guest edits where allowed, safe public/project views | Side-aware helpers and hardening tests cover groom-side boundaries | `acceptable_mvp_risk` after staging role-boundary QA |
| Partner | Assigned partner/project surfaces only, no internal commercial/audit control | Partner foundation tests cover commercial/audit restrictions | `acceptable_mvp_risk` after staging role-boundary QA |
| Check-in staff | Assigned event check-in operations only | Check-in staff role, event scoping, and check-in tests cover the boundary | `launch_risk` until assigned-event checks and offline/manual fallback rehearsal pass |
| Guest | Own public page and guest-facing files only, no account required | Public token flows are separate from authenticated app access | `acceptable_mvp_risk` after public-token negative checks pass |

## Confirmed Controls

- Permission checks exist in TypeScript helpers and Supabase RLS/RPCs.
- Server-rendered pages and API routes were hardened in prior sprint reviews to avoid relying only on hidden UI controls.
- Public guest page access uses guest tokens and is separate from authenticated role assignments.
- Bride/groom side filters are explicit and fail closed for invalid values.
- Partner and check-in staff roles are limited to scoped operational surfaces.
- Audit-log and internal report access is not granted to guests, partners, bride, or groom by default.

Confirmed Controls traceability continues in the negative permission test scenarios in `docs/qa/mvp-manual-qa-scenarios.md` (`QA-026` through `QA-036`), where each role-boundary denial requires request, error, and audit/log evidence.

## Launch Findings

| Finding | Status | Classification | Action |
| --- | --- | --- | --- |
| Sensitive roles have MFA metadata but no end-to-end app-enforced MFA challenge in this repo | Open | `launch_risk` for controlled pilot; `launch_blocker` for broad production if MFA is not enforced/configured | For production, enable Supabase MFA policy/operational control and follow the MFA Decision Flow in `docs/planning/mvp-launch-checklist.md#mfa-decision-flow`; controlled internal staging/pilot users are acceptable only with owner acceptance and limited accounts. |
| Manual QA for role boundaries has not been recorded in staging in this branch | Open | `launch_risk` | Run `docs/qa/mvp-manual-qa-scenarios.md` before production go-live, including check-in staff assigned-event and offline/manual fallback rehearsal |
| Authenticated role/RPC boundaries depend on Supabase migration state | Mitigated by Sprint 15 migration | `launch_blocker` until the migration is applied | Apply `20260603113922_sprint_15_release_security_grants.sql` before launch |

## Recommendation

Proceed with controlled staging QA after the Sprint 15 grant migration is applied. Treat production launch as conditional until MFA and manual role-boundary QA evidence are recorded.
