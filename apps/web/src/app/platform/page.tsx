import { redirect } from "next/navigation";
import Link from "next/link";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { serverLogger } from "@/lib/logging";
import {
  getPlatformEntryActionVisibility,
  getPlatformFoundationStatus,
} from "@/lib/platform/foundation";
import { listPartners } from "@/lib/partners/partner-db";
import { getSprint2FoundationStatus } from "@/lib/projects/project-foundation";
import { getReportingPermissionSet } from "@/lib/reports/report-api";
import { getDashboardVisibility } from "@/lib/reports/report-service";
import type { PermissionSlug } from "@/lib/security/permissions";

export const dynamic = "force-dynamic";

function partnerRowId(partner: { id?: unknown }) {
  if (typeof partner.id !== "string" || partner.id.length === 0) {
    throw new Error("Partner row is missing a valid id.");
  }

  return partner.id;
}

type AuthenticatedAuthContext = Extract<
  Awaited<ReturnType<typeof getAuthContext>>,
  { status: "authenticated" }
>;

type PlatformPageProps = {
  searchParams?: Promise<{
    signOut?: string;
  }>;
};

const emptyPlatformSearchParams: Promise<{ signOut?: string }> =
  Promise.resolve({});

async function getAuthenticatedPlatformActionVisibility(
  authContext: AuthenticatedAuthContext,
) {
  const supabase = authContext.supabase;
  const context = { supabase, user: authContext.user };

  const permissions = await getReportingPermissionSet(context).catch(
    (error: unknown) => {
      serverLogger.error("Platform reporting permission check failed.", {
        error,
      });

      return new Set<PermissionSlug>();
    },
  );
  const dashboardVisibility = getDashboardVisibility(permissions);

  if (dashboardVisibility.canReadPartnerDashboard) {
    return getPlatformEntryActionVisibility({
      canOpenPartnerDashboard: true,
      canReadGlobalDashboard: dashboardVisibility.canReadGlobalDashboard,
      canReadReports: dashboardVisibility.canReadReports,
    });
  }

  const partners = await listPartners(supabase).catch((error: unknown) => {
    serverLogger.error("Platform partner list check failed.", { error });

    return [];
  });
  const partnerDashboardAccess = await Promise.all(
    partners.map(async (partner) => {
      try {
        const partnerId = partnerRowId(partner);
        const partnerPermissions = await getReportingPermissionSet(context, {
          customScopeId: partnerId,
          includeCustom: true,
        });

        return partnerPermissions.has("dashboards.partner.read");
      } catch (error) {
        serverLogger.error("Platform partner dashboard check failed.", {
          error,
        });

        return false;
      }
    }),
  );

  return getPlatformEntryActionVisibility({
    canOpenPartnerDashboard:
      dashboardVisibility.canReadPartnerDashboard ||
      partnerDashboardAccess.some(Boolean),
    canReadGlobalDashboard: dashboardVisibility.canReadGlobalDashboard,
    canReadReports: dashboardVisibility.canReadReports,
  });
}

export default async function PlatformPage({
  searchParams,
}: PlatformPageProps) {
  const [authContext, foundation, params] = await Promise.all([
    getAuthContext(),
    Promise.resolve(getPlatformFoundationStatus()),
    searchParams ?? emptyPlatformSearchParams,
  ]);
  const sprint2Foundation = getSprint2FoundationStatus();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath("/platform"));
  }

  const actionVisibility =
    authContext.status === "not_configured"
      ? getPlatformEntryActionVisibility({
          canOpenPartnerDashboard: true,
          canReadGlobalDashboard: true,
          canReadReports: true,
        })
      : await getAuthenticatedPlatformActionVisibility(authContext);

  return (
    <>
      <h1 className="page-title">MVP workspace</h1>
      <p className="page-summary">
        Use the areas available to this account to manage wedding projects,
        partners, reports, and operational workflows. Access is filtered by
        server-side roles and permissions.
      </p>

      <section className="section">
        {params.signOut === "failed" ? (
          <div className="alert error">
            We could not complete sign-out. Try again before leaving this
            device.
          </div>
        ) : null}
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
          <div className="button-group">
            {actionVisibility.showGlobalDashboard ? (
              <Link className="button secondary" href="/platform/dashboard">
                Dashboard
              </Link>
            ) : null}
            {actionVisibility.showReports ? (
              <Link className="button secondary" href="/platform/reports">
                Reports
              </Link>
            ) : null}
            {actionVisibility.showProjects ? (
              <Link className="button secondary" href="/platform/projects">
                Projects
              </Link>
            ) : null}
            {actionVisibility.showPartners ? (
              <Link className="button secondary" href="/platform/partners">
                Partners
              </Link>
            ) : null}
            {actionVisibility.showPartnerDashboard ? (
              <Link
                className="button secondary"
                href="/platform/partner-dashboard"
              >
                Partner dashboard
              </Link>
            ) : null}
          </div>
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
