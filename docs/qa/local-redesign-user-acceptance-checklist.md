# Local Redesign User Acceptance Checklist

Date: 2026-06-21

Branch: `codex/bilingual-ux-simplification-homepage`
Status: Local redesign direction accepted. Hosted deployment preparation has been requested and approved.

## How To Use This Checklist

Use this file during local review so feedback stays route-family based and does not restart already verified implementation work.

Use `docs/qa/local-redesign-route-review-pack.md` for the full page list grouped by workflow. The route pack mirrors the verified route table and should be used as the review path.

Use `docs/qa/local-redesign-review-session-guide.md` for concrete local URLs and safe linked-dev record IDs while reviewing. Do not record public guest token values in this file.

For each area, choose one:

- `[ ] Accepted`
- `[ ] Changes requested`

If changes are requested, add the route and note in the findings table before source changes are made.

## Review Areas

| Area | Suggested routes | Acceptance |
| --- | --- | --- |
| Public and auth surfaces | `/`, `/login`, `/login/mfa`, `/g/[guestToken]` | [x] Accepted / [ ] Changes requested |
| Workspace orientation | `/platform`, `/platform/projects`, `/platform/projects/[projectId]`, `/platform/projects/[projectId]/dashboard` | [x] Accepted / [ ] Changes requested |
| Guest and RSVP work | guest list, guest create/edit, staff public preview, RSVP summary, guest imports, guest book, couple review | [x] Accepted / [ ] Changes requested |
| Invitation, messaging, and files | event invitations, communications templates, queue, message detail, project files, event files | [x] Accepted / [ ] Changes requested |
| Event-day operations | seating, seating map, check-in desk, QR scan flow | [x] Accepted / [ ] Changes requested |
| Management and evidence | reports, audit logs, partner directory, partner review, partner detail, commercial workspace | [x] Accepted / [ ] Changes requested |

## Acceptance Criteria

Use these criteria for every reviewed area:

- [x] The page purpose is clear without internal delivery language.
- [x] Navigation makes it obvious where the user is and where to go next.
- [x] Primary actions match the page purpose and do not feel generic.
- [x] Forms, tables, empty states, and alerts use the Diginoces event-operations vocabulary.
- [x] The design feels cohesive with the Wedding Operations Atelier direction.
- [x] Mobile layout is readable with no clipped or overlapping content.
- [x] Permission-limited states explain what the user can safely do next.
- [x] Existing behavior, form actions, and route protection appear preserved.

## Findings To Address

| Status | Route or area | Finding | Desired change |
| --- | --- | --- | --- |
| None | All reviewed route families | No additional local redesign changes requested in the approval message. | Prepare hosted deployment through the post-approval checks and hosted verification path. |

## Final Local Approval

- [x] I accept the local redesign direction.
- [x] I approve preparing the redesign for hosted deployment in a separate deployment step.

Final approval note:

```text
User approved in chat on 2026-06-21: "i accept the local redesign direction and approve preparing it for hosted deployment in a separate step".
```
