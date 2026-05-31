import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import { requirePartnerDashboardPermission } from "@/lib/reports/report-api";
import { getPartnerDashboardPlaceholder } from "@/lib/reports/report-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PartnerDashboardPage() {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath("/platform/partner-dashboard"));
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Partner dashboard</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Partner dashboard
            controls will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const context = {
    supabase: await createSupabaseServerClient(),
    user: authContext.user,
  };

  try {
    await requirePartnerDashboardPermission(context);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const overview = getPartnerDashboardPlaceholder();

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Restricted placeholder</p>
          <h1 className="page-title">Partner dashboard</h1>
          <p className="page-summary">
            Partner dashboard foundation for Sprint 11. It intentionally avoids
            partner SaaS scaling, partner commissions, project creation, guest
            personal data, payment details, and audit logs.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="status-grid">
          {overview.metrics.map((metric) => (
            <div key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Boundaries</h2>
        <div className="table-like">
          {overview.boundaries.map((boundary) => (
            <div key={boundary}>
              <strong>Guardrail</strong>
              <span>{boundary}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
