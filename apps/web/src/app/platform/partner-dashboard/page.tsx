import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  createPartnerProjectDraftAction,
  submitPartnerDashboardProjectAction,
} from "@/app/platform/partners/actions";
import { serverLogger } from "@/lib/logging";
import { hasPartnerPermission } from "@/lib/partners/partner-api";
import {
  getPartnerDashboardOverview,
  getPartnerDetails,
  listPartners,
} from "@/lib/partners/partner-db";
import { ProjectAccessError } from "@/lib/projects/project-api";
import { requirePartnerDashboardPermission } from "@/lib/reports/report-api";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    partnerId?: string | string[];
  }>;
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function partnerRowId(partner: { id?: unknown }) {
  if (typeof partner.id !== "string" || partner.id.length === 0) {
    throw new Error("Partner row is missing a valid id.");
  }

  return partner.id;
}

export default async function PartnerDashboardPage({
  searchParams,
}: PageProps) {
  const authContext = await getAuthContext();
  const requestedPartnerId = firstSearchParam((await searchParams)?.partnerId);

  if (authContext.status === "anonymous") {
    const dashboardPath = requestedPartnerId
      ? `/platform/partner-dashboard?${new URLSearchParams({
          partnerId: requestedPartnerId,
        }).toString()}`
      : "/platform/partner-dashboard";

    redirect(buildLoginRedirectPath(dashboardPath));
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

  const supabase = authContext.supabase;
  const context = { supabase, user: authContext.user };
  const partners = await listPartners(supabase);
  const [onlyPartner] = partners;
  const selectedPartner = requestedPartnerId
    ? (partners.find(
        (partner) => partnerRowId(partner) === requestedPartnerId,
      ) ?? null)
    : partners.length === 1
      ? onlyPartner
      : null;

  if (requestedPartnerId && !selectedPartner) {
    notFound();
  }

  if (partners.length > 1 && !selectedPartner) {
    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">Restricted partner view</p>
            <h1 className="page-title">Partner dashboard</h1>
            <p className="page-summary">
              Select a partner profile before loading dashboard data or creating
              project submissions.
            </p>
          </div>
          <Link className="button secondary" href="/platform/partners">
            Partners
          </Link>
        </div>
        <section className="section">
          <div className="section-heading">
            <h2>Choose partner</h2>
            <span className="meta-list">{partners.length} profiles</span>
          </div>
          <div className="record-list">
            {partners.map((partner) => (
              <Link
                className="record-row"
                href={`/platform/partner-dashboard?${new URLSearchParams({
                  partnerId: partnerRowId(partner),
                }).toString()}`}
                key={partnerRowId(partner)}
              >
                <span>
                  <strong>{String(partner.organization_name)}</strong>
                  <small>{String(partner.contact_email)}</small>
                </span>
                <span className="tag">{String(partner.status)}</span>
              </Link>
            ))}
          </div>
        </section>
      </>
    );
  }

  if (!selectedPartner) {
    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">Sprint 13 foundation</p>
            <h1 className="page-title">Partner dashboard</h1>
            <p className="page-summary">
              No partner profile is visible for this account yet.
            </p>
          </div>
          <Link className="button secondary" href="/platform/partners">
            Partners
          </Link>
        </div>
        <section className="section">
          <div className="empty-state">
            Link this account to a partner profile before project submissions
            can be created.
          </div>
        </section>
      </>
    );
  }

  const partnerId = partnerRowId(selectedPartner);

  try {
    await requirePartnerDashboardPermission(context, partnerId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      serverLogger.error("Permission denied for partner dashboard.", {
        error,
        partnerId,
        userId: context.user.id,
      });
      notFound();
    }

    throw error;
  }

  const [details, overview] = await Promise.all([
    getPartnerDetails(supabase, partnerId),
    getPartnerDashboardOverview(supabase, partnerId),
  ]);
  const [canCreatePartnerProject, canSubmitPartnerProject] = await Promise.all([
    hasPartnerPermission(context, partnerId, "partner_projects.create"),
    hasPartnerPermission(context, partnerId, "partner_projects.submit"),
  ]);
  const createDraftAction = createPartnerProjectDraftAction.bind(
    null,
    partnerId,
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Restricted partner view</p>
          <h1 className="page-title">Partner dashboard</h1>
          <p className="page-summary">
            Partner operational workspace for originated and assigned projects.
            It excludes revenue amounts, payment details, payment exceptions,
            internal notes, audit logs, commissions, and billing.
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/platform/partners/${partnerId}`}
        >
          Partner profile
        </Link>
      </div>

      <section className="section">
        <div className="detail-grid compact">
          <div>
            <span>Partner</span>
            <strong>{String(selectedPartner.organization_name)}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{String(selectedPartner.status)}</strong>
          </div>
          <div>
            <span>Projects</span>
            <strong>{overview.projects.length}</strong>
          </div>
          <div>
            <span>Submissions</span>
            <strong>{details?.submissions.length ?? 0}</strong>
          </div>
        </div>
      </section>

      {canCreatePartnerProject ? (
        <section className="section">
          <div className="section-heading">
            <h2>Create project draft</h2>
            <span className="meta-list">Details are fixed after creation</span>
          </div>
          <div className="alert">
            If draft details change, create a replacement draft or contact
            Diginoces before submitting for review.
          </div>
          <form action={createDraftAction} className="form-panel form-grid">
            <label>
              Bride name
              <input name="brideName" required />
            </label>
            <label>
              Groom name
              <input name="groomName" required />
            </label>
            <label>
              Primary contact email
              <input name="primaryContactEmail" type="email" />
            </label>
            <label>
              Primary contact phone
              <input name="primaryContactPhone" />
            </label>
            <label>
              Planned guest count
              <input min="0" name="plannedGuestCount" type="number" />
            </label>
            <label>
              Project year
              <input min="2020" max="2100" name="projectYear" type="number" />
            </label>
            <label>
              Event notes
              <textarea name="eventNotes" rows={3} />
            </label>
            <label>
              Partner notes
              <textarea name="partnerNotes" rows={3} />
            </label>
            <div className="button-group">
              <button className="button" type="submit">
                Create draft
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>Operational projects</h2>
          <span className="meta-list">{overview.projects.length} records</span>
        </div>
        {overview.projects.length === 0 ? (
          <div className="empty-state">
            No originated or assigned projects yet.
          </div>
        ) : (
          <div className="record-list">
            {overview.projects.map((project) => (
              <Link
                className="record-row"
                href={`/platform/projects/${project.projectId}`}
                key={project.projectId}
              >
                <span>
                  <strong>{project.coupleNames}</strong>
                  <small>{project.projectCode}</small>
                </span>
                <span className="tag">{project.approvalStatus}</span>
                <span className="meta-list">{project.commercialStatus}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Drafts and submissions</h2>
          <span className="meta-list">{details?.submissions.length ?? 0}</span>
        </div>
        {!details || details.submissions.length === 0 ? (
          <div className="empty-state">No partner submissions yet.</div>
        ) : (
          <div className="record-list">
            {details.submissions.map((submission) => {
              const status = String(submission.status);
              const canSubmit =
                status === "draft" || status === "changes_requested";
              const submitAction = submitPartnerDashboardProjectAction.bind(
                null,
                partnerId,
                String(submission.id),
              );

              return (
                <div className="record-row" key={String(submission.id)}>
                  <span>
                    <strong>
                      {String(submission.bride_name)} &{" "}
                      {String(submission.groom_name)}
                    </strong>
                    <small>{String(submission.project_id)}</small>
                  </span>
                  <span className="tag">{status}</span>
                  <span>
                    {canSubmit && canSubmitPartnerProject ? (
                      <form action={submitAction}>
                        <button className="button secondary" type="submit">
                          Submit
                        </button>
                      </form>
                    ) : (
                      <span className="meta-list">Waiting on Diginoces</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
