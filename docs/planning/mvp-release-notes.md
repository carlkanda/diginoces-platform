# MVP Release Notes - Sprint 15

Traceability: GitHub issue `#31`; sprint plan `docs/planning/sprint-15-plan.md`; release backlog `EPIC-RELEASE`, especially `FEAT-REL-008`. All release content maps back to documented requirement groups and backlog items per `AGENTS.md`.

## Release Summary

The Diginoces MVP provides a secure operational foundation for managing wedding projects, events, guests, guest imports, RSVP/public guest pages, invitation template and PDF generation foundations, guided WhatsApp communication workflows, seating, check-in, contracts/pricing/payment controls, reports/audit logs, guest wishes/guest-book/feedback, partner foundations, and app-owned file/storage governance.

## Included

- Secure Next.js/Supabase web platform foundation.
- Role and permission registry with server-side checks and RLS/RPC backstops.
- Wedding project, event, and membership foundations.
- Guest management with sides, tags, event assignment, validation, and duplicate detection.
- CSV guest import, staging, review, and approval workflow.
- Public guest page token flow and event-specific RSVP.
- Invitation template/field configuration, preview approval, generation job/file foundations.
- Guided manual WhatsApp message preparation and history tracking.
- Seating/table assignment and CSV print export foundations.
- Check-in token/manual check-in and unexpected guest request foundations.
- Contract, pricing, manual payment, and gate controls.
- Reports, exports, dashboard snapshot, and audit-log foundations.
- Guest wishes, guest-book, post-event feedback foundations.
- Partner/provider model foundations.
- File registry, signed downloads, retention, archive, and guest file access foundations.

## Excluded

- AI assistance.
- Direct Canva API integration.
- Official WhatsApp API production integration with real credentials.
- Online payment processing.
- Native mobile apps.
- White-label SaaS.
- Partner commission management.
- Advanced BI analytics.
- Production-grade direct file upload UX beyond provider-backed foundation flows.

## Required Configuration

- Supabase URL and publishable key configured per environment.
- Supabase migrations applied to the target project.
- Private storage buckets configured.
- Manual WhatsApp mode selected unless an approved provider is configured.
- Sensitive role MFA handled operationally or through Supabase before production launch.

## Launch Links

- Sprint 15 release hardening documents, launch checklist, rollback plan, and security-grants migration are operational launch artifacts, not end-user feature scope.
- Launch checklist: `docs/planning/mvp-launch-checklist.md`
- Requirements coverage: `docs/planning/mvp-requirements-coverage.md`
- Known limitations: `docs/planning/mvp-known-limitations.md`
- Rollback plan: `docs/planning/mvp-rollback-plan.md`
- Deployment readiness: `docs/setup/deployment-readiness.md`
- Manual QA scenarios: `docs/qa/mvp-manual-qa-scenarios.md`
- Post-launch monitoring: `docs/qa/post-launch-monitoring.md`
