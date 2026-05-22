import Link from "next/link";
import { getPublicEnvironment } from "@/lib/env/public-env";
import { getSprint4ImportStatus } from "@/lib/guest-imports/guest-import-service";
import { getSprint3FoundationStatus } from "@/lib/guests/guest-service";
import { getPlatformFoundationStatus } from "@/lib/platform/foundation";
import { getSprint2FoundationStatus } from "@/lib/projects/project-foundation";
import { getSprint5RsvpStatus } from "@/lib/rsvp/rsvp-service";

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
    description: "Sprint 5 admin/staff preview for one guest page.",
    label: "Guest preview",
    path: "/platform/projects/{projectId}/guests/{guestId}/public-preview",
  },
];

const deferredScope = [
  "invitation PDF generation",
  "invitation template upload",
  "PDF and QR generation",
  "WhatsApp sending",
  "seating and check-in",
  "contracts, pricing, and full payments",
  "full guest-book workflow",
];

export default function HomePage() {
  const foundation = getPlatformFoundationStatus();
  const sprint2Foundation = getSprint2FoundationStatus();
  const sprint3Foundation = getSprint3FoundationStatus();
  const sprint4Foundation = getSprint4ImportStatus();
  const sprint5Foundation = getSprint5RsvpStatus();
  const env = getPublicEnvironment();
  const coveredRequirementIds = Array.from(
    new Set([
      ...foundation.requirementIds,
      ...sprint2Foundation.modules.flatMap((module) => module.requirementIds),
      ...sprint3Foundation.modules.flatMap((module) => module.requirementIds),
      ...sprint4Foundation.requirementIds,
      ...sprint5Foundation.requirementIds,
    ]),
  )
    .sort()
    .slice(0, 18);

  const sprintSummaries = [
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
  ];

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Sprint 1-5 implementation status</p>
          <h1>Diginoces platform progress</h1>
          <p>
            The home page surfaces the foundations already delivered across the
            first five sprints, while keeping future wedding operations out of
            scope until their documented sprint begins.
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
          <span className="meta-list">5 sprint foundations</span>
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
                    {"description" in module && module.description ? (
                      <span>{module.description}</span>
                    ) : null}
                    <small>{module.requirementIds.join(", ")}</small>
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
