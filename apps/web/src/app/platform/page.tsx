import { redirect } from "next/navigation";
import Link from "next/link";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { getPlatformFoundationStatus } from "@/lib/platform/foundation";
import { getSprint2FoundationStatus } from "@/lib/projects/project-foundation";

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  const [authContext, foundation] = await Promise.all([
    getAuthContext(),
    Promise.resolve(getPlatformFoundationStatus()),
  ]);
  const sprint2Foundation = getSprint2FoundationStatus();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath("/platform"));
  }

  return (
    <>
      <h1 className="page-title">Platform shell</h1>
      <p className="page-summary">
        This protected placeholder exists to verify the Sprint 1 app shell,
        authentication boundary, permission model, audit foundation, and storage
        abstraction without implementing future business modules.
      </p>

      <section className="section">
        {authContext.status === "not_configured" ? (
          <div className="alert">
            Supabase environment variables are not configured. The shell remains
            buildable and secure-by-default until local credentials are
            supplied.
          </div>
        ) : (
          <div className="alert success">
            Authenticated session detected for {authContext.email}.
          </div>
        )}
      </section>

      <section className="section">
        <h2>Foundation coverage</h2>
        <div className="table-like">
          {foundation.modules.map((module) => (
            <div key={module.name}>
              <strong>{module.name}</strong>
              <span>{module.description}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>{sprint2Foundation.sprint}</h2>
          <Link className="button secondary" href="/platform/projects">
            Projects
          </Link>
        </div>
        <div className="table-like">
          {sprint2Foundation.modules.map((module) => (
            <div key={module.name}>
              <strong>{module.name}</strong>
              <span>{module.description}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
