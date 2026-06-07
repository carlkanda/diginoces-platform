# MVP UI QA Setup Runbook

Traceability: GitHub issue `#31`; sprint plan `docs/planning/sprint-15-plan.md`; release backlog `EPIC-RELEASE`, especially `FEAT-REL-001`, `FEAT-REL-002`, `FEAT-REL-003`, and `FEAT-REL-004`.

## Purpose

This runbook prepares the linked dev or staging environment for the browser-based MVP UI QA pass in `docs/qa/mvp-manual-qa-scenarios.md`.

Use only fake QA data. Do not use real couple, guest, phone, WhatsApp, email, payment, Google, Canva, partner, or client data.

## Current Gate

Full MVP UI QA requires both:

- an authenticated QA user with the correct role boundary for the scenario;
- fake project, event, guest, invitation, message, seating, check-in, file, partner, report, and audit data.

If either is missing, UI testing is limited to public pages, login, protected-route redirects, empty states, and permission-denial checks.

## Environment Inventory

Run these read-only checks before creating or testing QA fixtures:

```bash
npx supabase@latest db push --linked --dry-run
npm run db:lint
npm run env:check-public
npm run secrets:scan
```

Check whether the target QA user has active roles:

```sql
select
  u.id,
  u.email,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'role', r.slug,
        'scope', ra.scope,
        'scope_id', ra.scope_id,
        'expires_at', ra.expires_at
      )
      order by r.slug
    ) filter (where ra.id is not null),
    '[]'::jsonb
  ) as role_assignments
from auth.users u
left join public.role_assignments ra
  on ra.user_id = u.id
  and (ra.expires_at is null or ra.expires_at > now())
left join public.roles r on r.id = ra.role_id
where u.email = '<qa-user-email>'
group by u.id, u.email;
```

Check whether fake fixture data exists:

```sql
select
  (select count(*) from public.wedding_projects) as project_count,
  (select count(*) from public.events) as event_count,
  (select count(*) from public.guests) as guest_count,
  (select count(*) from public.partners) as partner_count,
  (select count(*) from public.guest_import_sessions) as import_count,
  (select count(*) from public.rsvp_records) as rsvp_count,
  (select count(*) from public.invitation_templates) as template_count,
  (select count(*) from public.message_templates) as message_template_count,
  (select count(*) from public.event_tables) as table_count,
  (select count(*) from public.check_in_records) as check_in_count,
  (select count(*) from public.audit_logs) as audit_count;
```

## Role Setup Options

### Option A - Full Admin/Operations QA

Use this when an MFA-capable internal QA account exists.

Required:

- QA user signs in with a Supabase session that satisfies sensitive-role MFA (`aal2`);
- QA user has one of the sensitive global roles required by the scenario, such as `diginoces_admin` or `operations_manager`;
- fake fixture data exists.

This option is required for true admin/operations coverage, including global dashboard, reports, audit logs, admin import review/apply, payment gates, partner review, internal file/archive operations, and sensitive permission checks.

### Option B - Scoped Non-MFA Partial QA

Use this only for linked dev or controlled staging after explicit approval.

Required:

- QA user signs in normally;
- QA user receives fake project/event-scoped non-sensitive roles, such as `bride`, `groom`, or `event_staff`;
- fake fixture data exists.

This option supports partial UI QA for project detail, couple dashboard, guest lists, side-boundary behavior, guest import submit/preview, RSVP summary, seating, event check-in staff paths, public guest page checks, and negative permission checks.

This option does not prove admin/operations readiness because `diginoces_admin`, `operations_manager`, `partner_admin`, `partner_project_operator`, and `check_in_supervisor` are MFA-sensitive roles.

## Fake Data Rules

- Use obvious fake names such as `QA Demo Bride` and `QA Demo Groom`.
- Use reserved example domains such as `example.test` or `example.invalid`.
- Use fake phone-like values that cannot be real WhatsApp recipients.
- Mark internal notes with `QA_FIXTURE`.
- Keep generated files as placeholders or local test artifacts only.
- Store screenshots and logs outside the repository in the QA artifact store described by `docs/setup/qa-artifact-store.md`.

## Minimum Fixture Shape

The MVP UI QA fixture should include:

- one fake wedding project with guest page and guest list gates in known states;
- at least two events;
- project-level bride and groom role coverage;
- event-level check-in staff coverage;
- at least one bride-side guest, one groom-side guest, and one both-side guest;
- event assignments for each guest;
- guest title types and tags;
- one CSV import session with staged rows;
- one RSVP state per supported value where practical;
- one invitation template and one generation job/result placeholder;
- one message template, one queue/log item, and one guided manual send state;
- one seating table and one assignment;
- one check-in settings record, one device, and one record or expected empty state;
- one partner profile/submission if partner QA is in scope;
- one file metadata record where file/archive UI is in scope;
- audit-log entries generated by the tested workflows.

## Cleanup

After QA, remove or archive fake fixtures from dev/staging unless the environment is intentionally kept as a reusable demo QA database.

At minimum:

- revoke or expire public guest tokens used during testing;
- delete or archive fake projects and dependent records;
- remove temporary scoped role assignments;
- disable temporary test users if they are not needed for future QA;
- preserve only external QA evidence links, IDs, and logs in the artifact store.

## Evidence Required Before Launch

Production launch remains unproven until:

- QA-001 through QA-036 in `docs/qa/mvp-manual-qa-scenarios.md` have pass/fail evidence;
- the execution handoff in `docs/qa/mvp-qa-execution-handoff.md` has been followed for run order, artifact capture, ledger updates, and sign-off routing;
- any failure is classified as `launch_blocker`, `launch_risk`, `acceptable_mvp_risk`, or `post_launch_follow_up`;
- sensitive-role MFA is enforced, configured, or formally accepted through the decision flow in `docs/planning/mvp-launch-checklist.md`;
- no real data or secrets appear in the repository or committed QA artifacts.
