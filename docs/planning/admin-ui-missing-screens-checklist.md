# Admin UI Missing Screens Checklist

Requirement anchor: `UX-REDESIGN-001`, `ROLE-002`, `ROLE-004`, `PROJ-001`, `PROJ-002`, `PROJ-003`.

This checklist tracks implemented backend capabilities that were not yet reachable through a clear admin-facing UI.

## Confirmed Missing Screens

- [x] Project setup screen for editing wedding identity, contact details, preferred language, year, and lifecycle status.
- [x] Event creation controls from inside a wedding project.
- [x] Project access screen for assigning project-scoped roles such as bride, groom, couple, and partner project operator.
- [x] Event setup screen for editing event identity, date/time, venue, and lifecycle status.
- [x] Event access screen for assigning event-scoped roles such as event staff and check-in supervisor.
- [x] Global access-control screen for assigning and revoking existing users' platform-scoped roles.
- [x] Navigation links from the wedding workspace and event workspace to the new setup/access surfaces.
- [x] Navigation links from the main workspace/sidebar to platform access control.

## 2026-06-24 Re-check

- [x] Re-ran a route inventory across `apps/web/src/app/platform` after adding the setup/access screens.
- [x] Confirmed the current backend-backed setup and access capabilities now have reachable routes: global access control, project setup, event creation, project access, event setup, and event access.
- [x] Confirmed the remaining items below are broader product/admin capabilities, not missing screens for the current UX-REDESIGN-001 access/setup pass.
- [x] Added French static-copy coverage for the new access/setup screens, filters, empty states, role guidance, and sensitive-action helper copy.
- [x] Added UX safeguards for the design-health pass: in-page section jumps, role explanations, assignment filtering, clear-filter escape, localized dates, and confirmation prompts before sensitive revoke/status-change submissions.

## Not Implemented In This Pass

- Auth user invitation provisioning and email delivery.
- Custom role authoring.
- Full user lifecycle administration such as disabling users, deleting users, or resetting MFA.
- Future Sprint 16 AI assistance screens.
- Sprint 17+ integration screens.

## Notes

- Couple-side users must already exist in Supabase Auth before they can be assigned to a project or event.
- Assignment should use email lookup through permission-gated backend functions rather than exposing broad `auth.users` access.
- Project, event, and global access changes must remain server-authorized and audit-visible.
