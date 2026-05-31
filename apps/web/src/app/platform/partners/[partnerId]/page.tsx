import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  linkPartnerUserAction,
  submitPartnerProjectAction,
  updatePartnerStatusAction,
} from "@/app/platform/partners/actions";
import { requirePartnerPermission } from "@/lib/partners/partner-api";
import { getPartnerDetails } from "@/lib/partners/partner-db";
import { ProjectAccessError } from "@/lib/projects/project-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    partnerId: string;
  }>;
};

async function hasGlobalPermission(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  permission: string,
) {
  const { data, error } = await supabase.rpc("current_user_has_permission", {
    p_permission: permission,
    p_scope: "global",
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
}

function formatValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : "Not set";
}

export default async function PartnerDetailPage({ params }: PageProps) {
  const { partnerId } = await params;
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/partners/${partnerId}`));
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Partner detail</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Partner details
            will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requirePartnerPermission(context, partnerId, "partners.read");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const [details, canManagePartners, canReviewProjects] = await Promise.all([
    getPartnerDetails(supabase, partnerId),
    hasGlobalPermission(supabase, "partners.manage"),
    hasGlobalPermission(supabase, "partner_projects.review"),
  ]);

  if (!details) {
    notFound();
  }

  const partner = details.partner;
  const updateStatusAction = updatePartnerStatusAction.bind(null, partnerId);
  const linkUserAction = linkPartnerUserAction.bind(null, partnerId);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Partner profile</p>
          <h1 className="page-title">{String(partner.organization_name)}</h1>
          <p className="page-summary">
            Partner access remains scoped to this profile, originated or
            assigned projects, and partner-visible comments. Financial data,
            internal notes, and audit logs remain internal.
          </p>
        </div>
        <Link className="button secondary" href="/platform/partners">
          Partners
        </Link>
      </div>

      <section className="section">
        <div className="detail-grid">
          <div>
            <span>Status</span>
            <strong>{String(partner.status)}</strong>
          </div>
          <div>
            <span>Type</span>
            <strong>{String(partner.partner_type)}</strong>
          </div>
          <div>
            <span>Contact email</span>
            <strong>{formatValue(partner.contact_email)}</strong>
          </div>
          <div>
            <span>WhatsApp</span>
            <strong>{formatValue(partner.whatsapp_phone)}</strong>
          </div>
        </div>
      </section>

      {canManagePartners ? (
        <section className="section">
          <div className="section-heading">
            <h2>Status and user linkage</h2>
            <span className="meta-list">Admin-controlled</span>
          </div>
          <div className="route-grid">
            <form action={updateStatusAction} className="form-card">
              <strong>Update lifecycle status</strong>
              <label>
                Status
                <select defaultValue={String(partner.status)} name="status">
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <button className="button" type="submit">
                Save status
              </button>
            </form>

            <form action={linkUserAction} className="form-card">
              <strong>Link partner user</strong>
              <label>
                User ID
                <input name="userId" required />
              </label>
              <label>
                Role
                <select defaultValue="admin" name="role">
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
              </label>
              <button className="button" type="submit">
                Link user
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>Linked users</h2>
          <span className="meta-list">{details.users.length} records</span>
        </div>
        {details.users.length === 0 ? (
          <div className="empty-state">No linked users yet.</div>
        ) : (
          <div className="table-like">
            {details.users.map((user) => (
              <div key={String(user.id)}>
                <strong>{String(user.role)}</strong>
                <span>
                  {String(user.user_id)} - {String(user.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Project submissions</h2>
          <span className="meta-list">
            {details.submissions.length} records
          </span>
        </div>
        {details.submissions.length === 0 ? (
          <div className="empty-state">No partner-created projects yet.</div>
        ) : (
          <div className="record-list">
            {details.submissions.map((submission) => {
              const status = String(submission.status);
              const canSubmit =
                status === "draft" || status === "changes_requested";
              const submitAction = submitPartnerProjectAction.bind(
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
                  <span className="button-group">
                    {canSubmit ? (
                      <form action={submitAction}>
                        <button className="button secondary" type="submit">
                          Submit
                        </button>
                      </form>
                    ) : null}
                    {canReviewProjects && status === "submitted" ? (
                      <Link
                        className="button secondary"
                        href="/platform/partners/review"
                      >
                        Review
                      </Link>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Source tracking</h2>
          <span className="meta-list">{details.sources.length} records</span>
        </div>
        {details.sources.length === 0 ? (
          <div className="empty-state">No project source records yet.</div>
        ) : (
          <div className="table-like">
            {details.sources.map((source) => (
              <div key={String(source.id)}>
                <strong>{String(source.approval_status)}</strong>
                <span>
                  {String(source.project_id)} - {String(source.source_type)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
