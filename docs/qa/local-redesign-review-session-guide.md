# Local Redesign Review Session Guide

Date: 2026-06-21

Branch: `codex/redesign-platform-shell`
Status: Local review guide for the current redesign branch. Hosted deployment preparation is approved.

## Purpose

Use this guide when opening local pages for the redesign review. It pairs the route templates from `docs/qa/local-redesign-route-review-pack.md` with safe linked-dev record IDs so review can continue without repeating setup work.

Base local URL:

```text
http://127.0.0.1:3000
```

## Dev Review Account

Use `carlkanda@gmail.com` for local review. The linked dev database currently grants this account:

- global `diginoces_admin`;
- global `operations_manager`;
- project-scoped `operations_manager` for project `de3378cd-ea21-4982-b507-a178eb88a34c`.

These are dev-only review roles. They are MFA-sensitive roles, so sign out and sign back in if the browser still shows an older access state or asks for a step-up check.

## Safe Dev Record IDs

These IDs are fake linked-dev QA records and are safe to use in local route URLs:

| Record | ID |
| --- | --- |
| Project | `de3378cd-ea21-4982-b507-a178eb88a34c` |
| Event | `088aebc4-05d9-45c2-b73a-803f73706163` |
| Guest | `4271cbfd-c672-4dde-86d0-aad2406124b9` |
| Guest import | `489eaf2e-d8c0-4816-9eb6-9ab867506347` |
| Invitation template | `61993173-1efb-4d18-b7d2-672907320ea8` |
| File | `fad37564-d42c-40a8-8a46-334a12fbd2c8` |

Do not record public guest token values in this repository. For `/g/[guestToken]`, use the staff preview route below or generate and use the token transiently in the browser only.

Message detail and partner detail pages depend on whichever QA records are visible in the local app. Open them from the communications queue/overview and partner directory instead of hardcoding a private message or partner identifier here.

## Public And Auth Surfaces

| Route | Local review URL |
| --- | --- |
| `/` | `http://127.0.0.1:3000/` |
| `/login` | `http://127.0.0.1:3000/login` |
| `/login/mfa` | `http://127.0.0.1:3000/login/mfa?next=%2Fplatform` |
| `/g/[guestToken]` | Use a transient guest token in the browser only; do not paste the token into docs. |

## Workspace And Project Orientation

| Route | Local review URL |
| --- | --- |
| `/platform` | `http://127.0.0.1:3000/platform` |
| `/platform/projects` | `http://127.0.0.1:3000/platform/projects` |
| `/platform/projects/[projectId]` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c` |
| `/platform/projects/[projectId]/dashboard` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/dashboard` |
| `/platform/projects/[projectId]/couple-dashboard` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/couple-dashboard` |
| `/platform/dashboard` | `http://127.0.0.1:3000/platform/dashboard` |

## Guest, RSVP, Import, And Collaboration Work

| Route | Local review URL |
| --- | --- |
| `/platform/projects/[projectId]/guests` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests` |
| `/platform/projects/[projectId]/guests/new` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests/new` |
| `/platform/projects/[projectId]/guests/[guestId]` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests/4271cbfd-c672-4dde-86d0-aad2406124b9` |
| `/platform/projects/[projectId]/guests/[guestId]/public-preview` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guests/4271cbfd-c672-4dde-86d0-aad2406124b9/public-preview` |
| `/platform/projects/[projectId]/rsvps` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/rsvps` |
| `/platform/projects/[projectId]/guest-imports` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-imports` |
| `/platform/projects/[projectId]/guest-imports/new` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-imports/new` |
| `/platform/projects/[projectId]/guest-imports/[importId]` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-imports/489eaf2e-d8c0-4816-9eb6-9ab867506347` |
| `/platform/projects/[projectId]/guest-imports/[importId]/mapping` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-imports/489eaf2e-d8c0-4816-9eb6-9ab867506347/mapping` |
| `/platform/projects/[projectId]/guest-imports/[importId]/review` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-imports/489eaf2e-d8c0-4816-9eb6-9ab867506347/review` |
| `/platform/projects/[projectId]/guest-book` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-book` |
| `/platform/projects/[projectId]/guest-book/couple-review` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/guest-book/couple-review` |
| `/platform/projects/[projectId]/feedback` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/feedback` |
| `/platform/projects/[projectId]/comments` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/comments` |

## Invitation, Messaging, And File Workflows

| Route | Local review URL |
| --- | --- |
| `/platform/events/[eventId]/invitations` | `http://127.0.0.1:3000/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/invitations` |
| `/platform/events/[eventId]/invitations/new` | `http://127.0.0.1:3000/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/invitations/new` |
| `/platform/events/[eventId]/invitations/[templateId]` | `http://127.0.0.1:3000/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/invitations/61993173-1efb-4d18-b7d2-672907320ea8` |
| `/platform/projects/[projectId]/communications` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/communications` |
| `/platform/projects/[projectId]/communications/templates` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/communications/templates` |
| `/platform/projects/[projectId]/communications/queue` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/communications/queue` |
| `/platform/projects/[projectId]/communications/[messageLogId]` | Open a visible message from `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/communications` or the queue. |
| `/platform/projects/[projectId]/files` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/files` |
| `/platform/projects/[projectId]/files/[fileId]` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/files/fad37564-d42c-40a8-8a46-334a12fbd2c8` |
| `/platform/events/[eventId]/files` | `http://127.0.0.1:3000/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/files` |

## Event-Day Operations

| Route | Local review URL |
| --- | --- |
| `/platform/events/[eventId]` | `http://127.0.0.1:3000/platform/events/088aebc4-05d9-45c2-b73a-803f73706163` |
| `/platform/events/[eventId]/dashboard` | `http://127.0.0.1:3000/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/dashboard` |
| `/platform/events/[eventId]/seating` | `http://127.0.0.1:3000/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/seating` |
| `/platform/events/[eventId]/seating/map` | `http://127.0.0.1:3000/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/seating/map` |
| `/platform/events/[eventId]/check-in` | `http://127.0.0.1:3000/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/check-in` |
| `/platform/events/[eventId]/check-in/scan` | `http://127.0.0.1:3000/platform/events/088aebc4-05d9-45c2-b73a-803f73706163/check-in/scan` |

## Management, Evidence, And Partner Work

| Route | Local review URL |
| --- | --- |
| `/platform/reports` | `http://127.0.0.1:3000/platform/reports` |
| `/platform/audit-logs` | `http://127.0.0.1:3000/platform/audit-logs` |
| `/platform/projects/[projectId]/commercial` | `http://127.0.0.1:3000/platform/projects/de3378cd-ea21-4982-b507-a178eb88a34c/commercial` |
| `/platform/partners` | `http://127.0.0.1:3000/platform/partners` |
| `/platform/partners/review` | `http://127.0.0.1:3000/platform/partners/review` |
| `/platform/partner-dashboard` | `http://127.0.0.1:3000/platform/partner-dashboard` |
| `/platform/partners/[partnerId]` | Open a visible partner profile from `http://127.0.0.1:3000/platform/partners`. |

## Review Rules

- Review only the local app at `http://127.0.0.1:3000`.
- Keep production unchanged until the hosted build is verified and ready to promote.
- Do not paste secrets, public guest tokens, MFA secrets, phone numbers, client data, or real guest data into QA docs.
- Record acceptance or requested changes in `docs/qa/local-redesign-user-acceptance-checklist.md`.
- Record any source-changing route finding in `docs/qa/redesign-rebuild-checklist.md` before editing implementation files.
