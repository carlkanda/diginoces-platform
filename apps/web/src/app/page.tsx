import Link from "next/link";
import { getSprint10CommercialStatus } from "@/lib/contracts/contract-service";
import { getPublicEnvironment } from "@/lib/env/public-env";
import { getSprint14FilesStatus } from "@/lib/files/file-service";
import { getSprint4ImportStatus } from "@/lib/guest-imports/guest-import-service";
import { getSprint12GuestWishesStatus } from "@/lib/guest-wishes/guest-wish-service";
import { getSprint3FoundationStatus } from "@/lib/guests/guest-service";
import { getSprint9CheckInStatus } from "@/lib/check-in/check-in-service";
import { getSprint6InvitationStatus } from "@/lib/invitations/invitation-service";
import { getSprint7CommunicationStatus } from "@/lib/messages/message-service";
import { getSprint13PartnerStatus } from "@/lib/partners/partner-service";
import { getPlatformFoundationStatus } from "@/lib/platform/foundation";
import { getSprint2FoundationStatus } from "@/lib/projects/project-foundation";
import { getSprint11ReportingStatus } from "@/lib/reports/report-service";
import { getSprint5RsvpStatus } from "@/lib/rsvp/rsvp-service";
import { getSprint8SeatingStatus } from "@/lib/seating/seating-service";

export const dynamic = "force-dynamic";

const projectRouteExamples = [
  {
    description: "Sprint 3 manual guest list, side/event filters, create/edit.",
    label: "Guest list",
    path: "/platform/projects/{projectId}/guests",
  },
  {
    description: "Sprint 3 manual guest creation foundation.",
    label: "Add guest",
    path: "/platform/projects/{projectId}/guests/new",
  },
  {
    description: "Sprint 4 CSV import sessions and review history.",
    label: "Import history",
    path: "/platform/projects/{projectId}/guest-imports",
  },
  {
    description: "Sprint 4 CSV upload and staged import start.",
    label: "Upload CSV",
    path: "/platform/projects/{projectId}/guest-imports/new",
  },
  {
    description: "Sprint 5 RSVP counts and manual review foundation.",
    label: "RSVP summary",
    path: "/platform/projects/{projectId}/rsvps",
  },
  {
    description:
      "Sprint 7 WhatsApp templates, guided manual queue, and communication history.",
    label: "Communications",
    path: "/platform/projects/{projectId}/communications",
  },
  {
    description: "Sprint 7 message template foundation.",
    label: "Message templates",
    path: "/platform/projects/{projectId}/communications/templates",
  },
  {
    description: "Sprint 7 guided manual WhatsApp preparation queue.",
    label: "Sending queue",
    path: "/platform/projects/{projectId}/communications/queue",
  },
  {
    description:
      "Sprint 10 packages, pricing, project contract approval, payments, addendums, exceptions, and gate status.",
    label: "Contracts & payments",
    path: "/platform/projects/{projectId}/commercial",
  },
  {
    description:
      "Sprint 12 guest wishes, couple review, guest-book export, and post-event feedback foundation.",
    label: "Guest book & feedback",
    path: "/platform/projects/{projectId}/guest-book",
  },
  {
    description:
      "Sprint 13 partner-visible project comment thread with internal-note separation.",
    label: "Project comments",
    path: "/platform/projects/{projectId}/comments",
  },
  {
    description:
      "Sprint 14 project file library, registration, retention review, download, and archive foundation.",
    label: "Files and archive",
    path: "/platform/projects/{projectId}/files",
  },
  {
    description: "Sprint 5 admin/staff preview for one guest page.",
    label: "Guest preview",
    path: "/platform/projects/{projectId}/guests/{guestId}/public-preview",
  },
];

const eventRouteExamples = [
  {
    description:
      "Sprint 6 event-level invitation templates, field editor, preview approval, and generation jobs.",
    label: "Invitation templates",
    path: "/platform/events/{eventId}/invitations",
  },
  {
    description: "Sprint 6 Canva PDF registration foundation.",
    label: "Register template",
    path: "/platform/events/{eventId}/invitations/new",
  },
  {
    description:
      "Sprint 8 event tables, RSVP-aware occupancy, assignments, unassigned guests, and table-card CSV exports.",
    label: "Tables and seating",
    path: "/platform/events/{eventId}/seating",
  },
  {
    description: "Sprint 8 visual seating-map placeholder foundation.",
    label: "Seating map",
    path: "/platform/events/{eventId}/seating/map",
  },
  {
    description:
      "Sprint 9 staff-only QR/manual check-in, unexpected guests, offline sync, and dashboard foundation.",
    label: "Wedding-day check-in",
    path: "/platform/events/{eventId}/check-in",
  },
  {
    description: "Sprint 9 event-specific check-in QR confirmation flow.",
    label: "QR check-in scan",
    path: "/platform/events/{eventId}/check-in/scan",
  },
  {
    description:
      "Sprint 14 event-scoped file library and secure download foundation.",
    label: "Event files",
    path: "/platform/events/{eventId}/files",
  },
];

const deferredScope = [
  "production WhatsApp API sending",
  "online payment processing",
  "partner commission management",
  "partner billing",
  "white-label SaaS",
  "advanced digital asset management",
];

type HomeSprintModule = {
  description?: string;
  name: string;
  requirementIds?: string[];
};

type HomeSprintSummary = {
  description: string;
  features?: string[];
  issue: number;
  modules: HomeSprintModule[];
  sprint: string;
  stories?: string[];
};

export default function HomePage() {
  const foundation = getPlatformFoundationStatus();
  const sprint2Foundation = getSprint2FoundationStatus();
  const sprint3Foundation = getSprint3FoundationStatus();
  const sprint4Foundation = getSprint4ImportStatus();
  const sprint5Foundation = getSprint5RsvpStatus();
  const sprint6Foundation = getSprint6InvitationStatus();
  const sprint7Foundation = getSprint7CommunicationStatus();
  const sprint8Foundation = getSprint8SeatingStatus();
  const sprint9Foundation = getSprint9CheckInStatus();
  const sprint10Foundation = getSprint10CommercialStatus();
  const sprint11Foundation = getSprint11ReportingStatus();
  const sprint12Foundation = getSprint12GuestWishesStatus();
  const sprint13Foundation = getSprint13PartnerStatus();
  const sprint14Foundation = getSprint14FilesStatus();
  const env = getPublicEnvironment();
  const coveredRequirementIds = Array.from(
    new Set([
      ...foundation.requirementIds,
      ...sprint2Foundation.modules.flatMap((module) => module.requirementIds),
      ...sprint3Foundation.modules.flatMap((module) => module.requirementIds),
      ...sprint4Foundation.requirementIds,
      ...sprint5Foundation.requirementIds,
      ...sprint6Foundation.requirementIds,
      ...sprint7Foundation.requirementIds,
      ...sprint8Foundation.requirementIds,
      ...sprint9Foundation.requirementIds,
      ...sprint10Foundation.requirementIds,
      ...sprint11Foundation.requirementIds,
      ...sprint12Foundation.requirementIds,
      ...sprint13Foundation.requirementIds,
      ...sprint14Foundation.requirementIds,
    ]),
  ).sort();

  const sprintSummaries: HomeSprintSummary[] = [
    {
      description:
        "Secure Next.js app shell with Supabase auth, permissions, audit logging, and fail-closed storage foundations.",
      issue: foundation.issue,
      modules: foundation.modules,
      sprint: foundation.sprint,
    },
    {
      description:
        "Wedding project, event, membership, lifecycle, code generation, and setup checklist foundations.",
      features: sprint2Foundation.features,
      issue: sprint2Foundation.issue,
      modules: sprint2Foundation.modules,
      sprint: sprint2Foundation.sprint,
    },
    {
      description:
        "Project-level guests with title/type, tags, side ownership, event assignment, validation, duplicate detection, and audit coverage.",
      features: sprint3Foundation.features,
      issue: sprint3Foundation.issue,
      modules: sprint3Foundation.modules,
      sprint: "Sprint 3 - Guest Management & Guest Lists Foundation",
    },
    {
      description:
        "CSV-only import sessions, row staging, mapping, preview validation, approval states, apply workflow, history, and audit coverage.",
      features: sprint4Foundation.features,
      issue: sprint4Foundation.issue,
      modules: sprint4Foundation.modules,
      sprint: sprint4Foundation.sprint,
      stories: sprint4Foundation.stories,
    },
    {
      description:
        "Secure guest public tokens, payment-gated public access, admin preview, event-specific RSVP, deadlines, change rules, language labels, and invitation placeholder.",
      features: sprint5Foundation.features,
      issue: sprint5Foundation.issue,
      modules: sprint5Foundation.modules,
      sprint: sprint5Foundation.sprint,
      stories: sprint5Foundation.stories,
    },
    {
      description:
        "Event invitation template registration, coordinate field configuration, technical preview approval, invitation record/file versions, public guest page QR/link fields, batch generation jobs, and tested PDF worker abstraction.",
      features: sprint6Foundation.features,
      issue: sprint6Foundation.issue,
      modules: sprint6Foundation.modules,
      sprint: sprint6Foundation.sprint,
      stories: sprint6Foundation.stories,
    },
    {
      description:
        "WhatsApp-first message templates, French/English rendering, readiness checks, guided manual sending, API-ready adapter, status logs, reminders, modification notices, communication history, permissions, and audit coverage.",
      features: sprint7Foundation.features,
      issue: sprint7Foundation.issue,
      modules: sprint7Foundation.modules,
      sprint: sprint7Foundation.sprint,
      stories: sprint7Foundation.stories,
    },
    {
      description:
        "Event-specific tables, table/seat structure, RSVP-aware occupancy, unassigned guest tracking, VIP/protocol notes, visual map placeholder, table-card CSV exports, print tracking, regeneration awareness, permissions, and audit coverage.",
      features: sprint8Foundation.features,
      issue: sprint8Foundation.issue,
      modules: sprint8Foundation.modules,
      sprint: sprint8Foundation.sprint,
      stories: sprint8Foundation.stories,
    },
    {
      description:
        "Event-specific check-in settings, staff-only QR/manual search, secure separate check-in tokens, partial Couple arrivals, unexpected guest approvals, devices, offline preload/sync, VIP highlights, dashboard metrics, and audit coverage.",
      features: sprint9Foundation.features,
      issue: sprint9Foundation.issue,
      modules: sprint9Foundation.modules,
      sprint: sprint9Foundation.sprint,
      stories: sprint9Foundation.stories,
    },
    {
      description:
        "Service packages and add-ons, event package selection, planned-guest-count pricing, one project contract, in-app approval, addendums, manual payments, payment gates, exceptions, revenue restrictions, permissions, and audit coverage.",
      features: sprint10Foundation.features,
      issue: sprint10Foundation.issue,
      modules: sprint10Foundation.modules,
      sprint: sprint10Foundation.sprint,
      stories: sprint10Foundation.stories,
    },
    {
      description:
        "Role-aware global, project, event, couple, and restricted partner dashboards, report catalog/CSV export, audit-log viewer/export, and internal visibility controls.",
      features: sprint11Foundation.features,
      issue: sprint11Foundation.issue,
      modules: sprint11Foundation.modules,
      sprint: sprint11Foundation.sprint,
    },
    {
      description:
        "Text-only guest wishes on public guest pages, moderation, couple review, Canva guest-book CSV export metadata, private post-event feedback, and testimonial review controls.",
      features: sprint12Foundation.features,
      issue: sprint12Foundation.issue,
      modules: sprint12Foundation.modules,
      sprint: sprint12Foundation.sprint,
    },
    {
      description:
        "Partner profiles, partner user linkage, lifecycle controls, partner-created project drafts, Diginoces review, source tracking, restricted partner dashboard, project comments, commercial restrictions, permissions, and audit coverage.",
      features: sprint13Foundation.features,
      issue: sprint13Foundation.issue,
      modules: sprint13Foundation.modules,
      sprint: sprint13Foundation.sprint,
    },
    {
      description:
        "Project, event, guest, invitation, report/export, contract, and partner file library with secure signed-download routing, version/latest tracking, retention review, archive lifecycle, storage buckets, permissions, and audit coverage.",
      features: sprint14Foundation.features,
      issue: sprint14Foundation.issue,
      modules: sprint14Foundation.modules,
      sprint: sprint14Foundation.sprint,
      stories: sprint14Foundation.stories,
    },
  ];

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Sprint 1-14 implementation status</p>
          <h1>Diginoces platform progress</h1>
          <p>
            The home page surfaces the foundations already delivered across the
            first fourteen sprints, while keeping future wedding operations out
            of scope until their documented sprint begins.
          </p>
          <div className="requirement-list" aria-label="Requirements covered">
            {coveredRequirementIds.map((requirementId) => (
              <span key={requirementId}>{requirementId}</span>
            ))}
          </div>
        </div>
        <aside className="panel" aria-label="Sprint status">
          <div className="panel-body">
            <strong>Current local status</strong>
            <p className="meta-list">
              Supabase is{" "}
              {env.supabaseConfigured ? "configured" : "not configured"} for
              this dev server. Project-specific guest and import pages require a
              configured Supabase session before real records can load.
            </p>
            <div className="button-group">
              <Link className="button" href="/platform">
                Platform shell
              </Link>
              <Link className="button secondary" href="/api/health">
                Health
              </Link>
            </div>
          </div>
        </aside>
      </section>

      <section className="section" aria-label="Sprint progress">
        <div className="section-heading">
          <h2>What has been built so far</h2>
          <span className="meta-list">14 sprint foundations</span>
        </div>
        <div className="progress-overview">
          {sprintSummaries.map((sprint) => (
            <article className="progress-card" key={sprint.sprint}>
              <div className="progress-card-header">
                <div>
                  <p className="eyebrow">Issue #{sprint.issue}</p>
                  <h3>{sprint.sprint}</h3>
                </div>
                <span className="tag">Foundation</span>
              </div>
              <p>{sprint.description}</p>
              {"features" in sprint && sprint.features ? (
                <div className="requirement-list" aria-label="Features">
                  {sprint.features.map((feature) => (
                    <span key={feature}>{feature}</span>
                  ))}
                </div>
              ) : null}
              {"stories" in sprint && sprint.stories ? (
                <div className="requirement-list" aria-label="Stories">
                  {sprint.stories.map((story) => (
                    <span key={story}>{story}</span>
                  ))}
                </div>
              ) : null}
              <ul className="module-list">
                {sprint.modules.map((module) => (
                  <li key={module.name}>
                    <strong>{module.name}</strong>
                    {module.description ? (
                      <span>{module.description}</span>
                    ) : null}
                    {module.requirementIds ? (
                      <small>{module.requirementIds.join(", ")}</small>
                    ) : null}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section route-section">
        <div className="section-heading">
          <h2>Where to look in the app</h2>
          <Link className="button secondary" href="/platform/projects">
            Project list
          </Link>
        </div>
        <div className="route-grid">
          <article className="route-card">
            <strong>Available directly</strong>
            <p className="meta-list">
              These pages render without needing a specific project id.
            </p>
            <div className="button-group">
              <Link className="button secondary" href="/platform">
                Platform shell
              </Link>
              <Link className="button secondary" href="/platform/projects">
                Projects
              </Link>
              <Link className="button secondary" href="/platform/dashboard">
                Dashboards
              </Link>
              <Link className="button secondary" href="/platform/reports">
                Reports
              </Link>
              <Link className="button secondary" href="/platform/audit-logs">
                Audit logs
              </Link>
              <Link className="button secondary" href="/platform/partners">
                Partners
              </Link>
              <Link
                className="button secondary"
                href="/platform/partner-dashboard"
              >
                Partner dashboard
              </Link>
              <Link className="button secondary" href="/api/health">
                Health JSON
              </Link>
            </div>
          </article>
          <article className="route-card">
            <strong>Project-specific foundations</strong>
            <p className="meta-list">
              Replace <code>{"{projectId}"}</code> with a real project from the
              project list after Supabase auth is configured.
            </p>
            <div className="code-list">
              {projectRouteExamples.map((route) => (
                <div key={route.path}>
                  <strong>{route.label}</strong>
                  <code>{route.path}</code>
                  <span>{route.description}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="route-card">
            <strong>Event-specific foundations</strong>
            <p className="meta-list">
              Replace <code>{"{eventId}"}</code> with a real event from a
              project after Supabase auth is configured.
            </p>
            <div className="code-list">
              {eventRouteExamples.map((route) => (
                <div key={route.path}>
                  <strong>{route.label}</strong>
                  <code>{route.path}</code>
                  <span>{route.description}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="scope-note">
          <strong>Still intentionally out of scope</strong>
          <p>
            The following areas are not implemented on the home page or in the
            completed foundations yet because they belong to later sprint scope.
          </p>
          <div className="requirement-list" aria-label="Deferred scope">
            {deferredScope.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
