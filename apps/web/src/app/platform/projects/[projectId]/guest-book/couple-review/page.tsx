import Link from "next/link";
import { requireGuestMessageCoupleReviewPermission } from "@/lib/guest-wishes/guest-wish-api";
import { listCoupleGuestMessages } from "@/lib/guest-wishes/guest-wish-db";
import { resolveGuestWishProjectPageContext } from "@/lib/guest-wishes/guest-wish-page-context";
import { ConfirmSubmitButton } from "../confirm-submit-button";
import { coupleReviewGuestMessageAction } from "../actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function CoupleGuestBookReviewPage({
  params,
  searchParams,
}: PageProps) {
  const { projectId } = await params;
  const query = await searchParams;
  const pageContext = await resolveGuestWishProjectPageContext({
    nextPath: `/platform/projects/${projectId}/guest-book/couple-review`,
    notConfiguredMessage:
      "Supabase environment variables are not configured. Couple review will load after local credentials are supplied.",
    notConfiguredTitle: "Couple guest-book review",
    projectId,
    requirePermission: requireGuestMessageCoupleReviewPermission,
  });

  if (pageContext.status === "not_configured") {
    return pageContext.element;
  }

  const messages = await listCoupleGuestMessages(
    pageContext.supabase,
    projectId,
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 12 foundation</p>
          <h1 className="page-title">Couple guest-book review</h1>
          <p className="page-summary">
            Couple-facing review for approved guest messages without internal
            moderation notes or audit data.
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/platform/projects/${projectId}/guest-book`}
        >
          Guest book
        </Link>
      </div>

      {query.status === "reviewed" ? (
        <section className="section">
          <div className="alert success">Couple review action saved.</div>
        </section>
      ) : null}

      {query.status === "error" ? (
        <section className="section">
          <div className="alert">Couple review action could not be saved.</div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>Prepared messages</h2>
          <span className="meta-list">{messages.length} records</span>
        </div>
        {messages.length === 0 ? (
          <div className="empty-state">
            No moderated guest messages are ready for couple review.
          </div>
        ) : (
          <div className="record-list">
            {messages.map((message) => (
              <div className="record-row" key={message.id}>
                <span>
                  <strong>{message.guestDisplayName}</strong>
                  <small>{message.approvedText ?? "No approved text"}</small>
                </span>
                <span className="tag">
                  {message.status.replaceAll("_", " ")}
                </span>
                <form
                  action={coupleReviewGuestMessageAction.bind(null, projectId)}
                >
                  <input name="messageId" type="hidden" value={message.id} />
                  <div className="button-group">
                    <button
                      className="button secondary"
                      name="action"
                      type="submit"
                      value="approve"
                    >
                      Approve
                    </button>
                    <button
                      className="button secondary"
                      name="action"
                      type="submit"
                      value="request_correction"
                    >
                      Correction
                    </button>
                    <ConfirmSubmitButton
                      className="button secondary"
                      message="Exclude this message from the guest-book export?"
                      name="action"
                      type="submit"
                      value="exclude"
                    >
                      Exclude
                    </ConfirmSubmitButton>
                  </div>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
