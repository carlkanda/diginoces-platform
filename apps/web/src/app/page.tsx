import Link from "next/link";
import { getPlatformFoundationStatus } from "@/lib/platform/foundation";
import { getSprint2FoundationStatus } from "@/lib/projects/project-foundation";

export default function HomePage() {
  const foundation = getPlatformFoundationStatus();
  const sprint2Foundation = getSprint2FoundationStatus();

  return (
    <>
      <section className="hero">
        <div>
          <h1>Diginoces secure platform foundation</h1>
          <p>
            Sprint 1 establishes the secure app shell. Sprint 2 adds the
            project, event, membership, code, and workflow foundations for
            wedding operations.
          </p>
          <div className="requirement-list" aria-label="Requirements covered">
            {foundation.requirementIds.map((requirementId) => (
              <span key={requirementId}>{requirementId}</span>
            ))}
          </div>
        </div>
        <aside className="panel" aria-label="Sprint status">
          <div className="panel-body">
            <strong>{foundation.sprint}</strong>
            <p className="meta-list">
              Foundation modules are present and intentionally limited to the
              documented Sprint 1 scope.
            </p>
            <Link className="button" href="/platform">
              Open platform shell
            </Link>
          </div>
        </aside>
      </section>

      <section className="status-grid" aria-label="Foundation modules">
        {foundation.modules.map((module) => (
          <article className="status-item" key={module.name}>
            <strong>{module.name}</strong>
            <span>{module.description}</span>
          </article>
        ))}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>{sprint2Foundation.sprint}</h2>
          <Link className="button secondary" href="/platform/projects">
            View projects
          </Link>
        </div>
        <div className="status-grid">
          {sprint2Foundation.modules.map((module) => (
            <article className="status-item" key={module.name}>
              <strong>{module.name}</strong>
              <span>{module.description}</span>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
