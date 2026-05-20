import Link from "next/link";
import { getPlatformFoundationStatus } from "@/lib/platform/foundation";

export default function HomePage() {
  const foundation = getPlatformFoundationStatus();

  return (
    <>
      <section className="hero">
        <div>
          <h1>Diginoces secure platform foundation</h1>
          <p>
            Sprint 1 establishes the authenticated app shell, backend permission
            foundations, audit logging, storage abstraction, and developer
            workflow needed before wedding operations modules are built.
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
    </>
  );
}
