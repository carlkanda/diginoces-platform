import Link from "next/link";
import { requireAnyFeedbackPagePermission } from "@/lib/guest-wishes/guest-wish-api";
import { listPostEventFeedback } from "@/lib/guest-wishes/guest-wish-db";
import { resolveGuestWishProjectPageContext } from "@/lib/guest-wishes/guest-wish-page-context";
import {
  reviewPostEventFeedbackAction,
  submitPostEventFeedbackAction,
} from "./actions";

export const dynamic = "force-dynamic";

const feedbackSuccessStatuses = new Set(["reviewed", "submitted"]);

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function PostEventFeedbackPage({
  params,
  searchParams,
}: PageProps) {
  const { projectId } = await params;
  const query = await searchParams;
  const pageContext = await resolveGuestWishProjectPageContext({
    nextPath: `/platform/projects/${projectId}/feedback`,
    notConfiguredMessage:
      "Supabase environment variables are not configured. Feedback workflows will load after local credentials are supplied.",
    notConfiguredTitle: "Post-event feedback",
    projectId,
    requirePermission: requireAnyFeedbackPagePermission,
  });

  if (pageContext.status === "not_configured") {
    return pageContext.element;
  }

  const { permissions, supabase } = pageContext;
  const canSubmit = permissions.canSubmitFeedback;
  const canReview = permissions.canReviewFeedback;
  const feedbackRows =
    permissions.canReadFeedback || permissions.canReviewFeedback
      ? await listPostEventFeedback(supabase, projectId)
      : [];

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 12 foundation</p>
          <h1 className="page-title">Post-event feedback</h1>
          <p className="page-summary">
            Couple satisfaction feedback and testimonial permission are private
            by default until reviewed by Diginoces.
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/platform/projects/${projectId}/guest-book`}
        >
          Guest book
        </Link>
      </div>

      {feedbackSuccessStatuses.has(query.status ?? "") ? (
        <section className="section">
          <div className="alert success">Feedback action saved.</div>
        </section>
      ) : null}

      {query.status === "error" ? (
        <section className="section">
          <div className="alert">Feedback action could not be saved.</div>
        </section>
      ) : null}

      {canSubmit ? (
        <section className="section">
          <h2>Couple feedback form</h2>
          <form
            action={submitPostEventFeedbackAction.bind(null, projectId)}
            className="stacked-form"
          >
            <label>
              Overall rating
              <select name="overallRating" required defaultValue="5">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Service quality rating
              <select name="serviceQualityRating" defaultValue="">
                <option value="">Not rated</option>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Invitation and communication rating
              <select name="invitationCommunicationRating" defaultValue="">
                <option value="">Not rated</option>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Feedback
              <textarea name="feedbackText" required rows={4} />
            </label>
            <label>
              Improvement suggestions
              <textarea name="improvementSuggestions" rows={3} />
            </label>
            <label>
              Testimonial text
              <textarea name="testimonialText" rows={3} />
            </label>
            <label>
              Public display name
              <input name="publicDisplayName" placeholder="Ada & Ben" />
            </label>
            <label className="check-field">
              <input name="testimonialPermissionGranted" type="checkbox" />
              Allow Diginoces to review this testimonial for public use
            </label>
            <button className="button" type="submit">
              Submit feedback
            </button>
          </form>
        </section>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>Feedback records</h2>
          <span className="meta-list">{feedbackRows.length} records</span>
        </div>
        {feedbackRows.length === 0 ? (
          <div className="empty-state">
            No post-event feedback submitted yet.
          </div>
        ) : (
          <div className="record-list">
            {feedbackRows.map((feedback) => (
              <div className="record-row" key={feedback.id}>
                <span>
                  <strong>Overall rating {feedback.overallRating}/5</strong>
                  <small>{feedback.feedbackText}</small>
                </span>
                <span className="tag">
                  {feedback.reviewStatus.replaceAll("_", " ")}
                </span>
                {canReview ? (
                  <form
                    action={reviewPostEventFeedbackAction.bind(null, projectId)}
                  >
                    <input
                      name="feedbackId"
                      type="hidden"
                      value={feedback.id}
                    />
                    <label>
                      Internal review note
                      <textarea
                        name="internalReviewNote"
                        placeholder="Optional internal note"
                        rows={2}
                      />
                    </label>
                    <div className="button-group">
                      <button
                        className="button secondary"
                        name="reviewStatus"
                        type="submit"
                        value="reviewed"
                      >
                        Mark reviewed
                      </button>
                      <button
                        className="button secondary"
                        disabled={!feedback.testimonialPermissionGranted}
                        name="reviewStatus"
                        type="submit"
                        value="approved_for_public_use"
                      >
                        Approve testimonial
                      </button>
                      <button
                        className="button secondary"
                        name="reviewStatus"
                        type="submit"
                        value="rejected"
                      >
                        Reject testimonial
                      </button>
                    </div>
                  </form>
                ) : (
                  <span className="meta-list">
                    Testimonial permission:{" "}
                    {feedback.testimonialPermissionGranted ? "yes" : "no"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
