import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { redirectToMfaIfStepUpRequired } from "@/lib/auth/mfa-route-guard";
import { reviewPartnerProjectAction } from "@/app/platform/partners/actions";
import { listPartnerReviewQueue } from "@/lib/partners/partner-db";
import {
  ProjectAccessError,
  requireGlobalPermission,
} from "@/lib/projects/project-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function partnerName(row: Record<string, unknown>) {
  const partner = row.partners;

  if (
    partner &&
    typeof partner === "object" &&
    "organization_name" in partner
  ) {
    return String(partner.organization_name);
  }

  return "Partner";
}

export default async function PartnerReviewPage() {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath("/platform/partners/review"));
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Partner review queue</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. The review queue
            will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireGlobalPermission(context, "partner_projects.review");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      await redirectToMfaIfStepUpRequired(
        context,
        "/platform/partners/review",
        {
          permission: "partner_projects.review",
          scope: "global",
        },
      );
      notFound();
    }

    throw error;
  }

  const queue = await listPartnerReviewQueue(supabase);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Diginoces review</p>
          <h1 className="page-title">Partner project review</h1>
          <p className="page-summary">
            Approve, reject, or request changes on partner-created project
            drafts before they proceed under Diginoces contract and payment
            controls.
          </p>
        </div>
        <Link className="button secondary" href="/platform/partners">
          Partners
        </Link>
      </div>

      <section className="section">
        <div className="section-heading">
          <h2>Pending review</h2>
          <span className="meta-list">{queue.length} records</span>
        </div>
        {queue.length === 0 ? (
          <div className="empty-state">No partner submissions need review.</div>
        ) : (
          <div className="record-list">
            {queue.map((submission) => {
              const reviewAction = reviewPartnerProjectAction.bind(
                null,
                String(submission.id),
              );

              return (
                <article className="form-card" key={String(submission.id)}>
                  <div className="section-heading">
                    <div>
                      <strong>
                        {String(submission.bride_name)} &{" "}
                        {String(submission.groom_name)}
                      </strong>
                      <p className="meta-list">
                        {partnerName(submission)} - {String(submission.status)}
                      </p>
                    </div>
                    <span className="tag">{String(submission.status)}</span>
                  </div>
                  <p className="meta-list">
                    Planned guests:{" "}
                    {String(submission.planned_guest_count ?? "not set")}
                  </p>
                  <form action={reviewAction} className="form-grid compact">
                    <label>
                      Decision
                      <select defaultValue="approve" name="action">
                        <option value="approve">Approve</option>
                        <option value="request_changes">Request changes</option>
                        <option value="reject">Reject</option>
                        <option value="archive">Archive</option>
                      </select>
                    </label>
                    <label>
                      Reason
                      <input name="reason" required />
                    </label>
                    <div className="button-group">
                      <button className="button" type="submit">
                        Save review
                      </button>
                    </div>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
