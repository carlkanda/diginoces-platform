import Link from "next/link";
import { requireAnyGuestBookPagePermission } from "@/lib/guest-wishes/guest-wish-api";
import {
  listGuestBookExports,
  listGuestMessagesForPermissions,
} from "@/lib/guest-wishes/guest-wish-db";
import { resolveGuestWishProjectPageContext } from "@/lib/guest-wishes/guest-wish-page-context";
import { ConfirmSubmitButton } from "./confirm-submit-button";
import { exportGuestBookAction, moderateGuestMessageAction } from "./actions";

export const dynamic = "force-dynamic";

function guestBookActionNotice(
  status: string | undefined,
  exportedRowCount: number | null,
) {
  if (status === "exported") {
    return {
      className: "alert success",
      message:
        exportedRowCount !== null
          ? `Guest-book exported with ${exportedRowCount} exported rows.`
          : "Guest-book exported.",
    };
  }

  if (status === "moderated") {
    return {
      className: "alert success",
      message: "Guest-book moderation saved.",
    };
  }

  if (status === "error") {
    return {
      className: "alert",
      message: "Guest-book action could not be completed.",
    };
  }

  return null;
}

function parseExportedRowCount(value: string | undefined) {
  if (typeof value !== "string" || !/^(?:0|[1-9]\d*)$/.test(value)) {
    return null;
  }

  const rowCount = Number(value);

  return Number.isFinite(rowCount) ? rowCount : null;
}

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    rows?: string;
    status?: string;
  }>;
};

export default async function GuestBookPage({
  params,
  searchParams,
}: PageProps) {
  const { projectId } = await params;
  const query = await searchParams;
  const pageContext = await resolveGuestWishProjectPageContext({
    nextPath: `/platform/projects/${projectId}/guest-book`,
    notConfiguredMessage:
      "Supabase environment variables are not configured. Guest-book workflows will load after local credentials are supplied.",
    notConfiguredTitle: "Guest book",
    projectId,
    requirePermission: requireAnyGuestBookPagePermission,
  });

  if (pageContext.status === "not_configured") {
    return pageContext.element;
  }

  const { permissions, supabase } = pageContext;
  const canModerate = permissions.canModerateMessages;
  const canExport = permissions.canCreateExports;
  const canCoupleReview = permissions.canReviewAsCouple;
  const exportedRowCount = parseExportedRowCount(query.rows);
  const actionNotice = guestBookActionNotice(query.status, exportedRowCount);

  const [messages, exports] = await Promise.all([
    listGuestMessagesForPermissions(supabase, projectId, permissions),
    listGuestBookExports(supabase, projectId),
  ]);
  const exportAction = exportGuestBookAction.bind(null, projectId);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 12 foundation</p>
          <h1 className="page-title">Guest book</h1>
          <p className="page-summary">
            Review guest wishes, prepare approved text, track couple review, and
            register Canva CSV export metadata.
          </p>
        </div>
        <div className="button-group">
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}`}
          >
            Project
          </Link>
          {canCoupleReview ? (
            <Link
              className="button secondary"
              href={`/platform/projects/${projectId}/guest-book/couple-review`}
            >
              Couple review
            </Link>
          ) : null}
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/feedback`}
          >
            Feedback
          </Link>
        </div>
      </div>

      {actionNotice ? (
        <section className="section">
          <div className={actionNotice.className}>{actionNotice.message}</div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>Messages</h2>
          <span className="meta-list">{messages.length} records</span>
        </div>
        {messages.length === 0 ? (
          <div className="empty-state">No guest messages submitted yet.</div>
        ) : (
          <div className="record-list">
            {messages.map((message) => (
              <div className="record-row" key={message.id}>
                <span>
                  <strong>{message.guestDisplayName}</strong>
                  <small>
                    {message.currentText ??
                      message.approvedText ??
                      "Pending approved text"}
                  </small>
                </span>
                <span className="tag">
                  {message.status.replaceAll("_", " ")}
                </span>
                {canModerate ? (
                  <form
                    action={moderateGuestMessageAction.bind(null, projectId)}
                  >
                    <input name="messageId" type="hidden" value={message.id} />
                    <input
                      name="approvedText"
                      type="hidden"
                      value={message.approvedText ?? message.currentText ?? ""}
                    />
                    <div className="button-group">
                      <button
                        className="button secondary"
                        name="action"
                        type="submit"
                        value="approve"
                      >
                        Approve
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
                ) : (
                  <span className="meta-list">
                    {message.approvedText ?? "Pending moderation"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Export history</h2>
          {canExport ? (
            <form action={exportAction}>
              <button className="button" type="submit">
                Generate Canva CSV
              </button>
            </form>
          ) : null}
        </div>
        {exports.length === 0 ? (
          <div className="empty-state">
            No guest-book export metadata has been registered yet.
          </div>
        ) : (
          <div className="record-list">
            {exports.map((exportRow) => (
              <div className="record-row" key={exportRow.id}>
                <span>
                  <strong>{exportRow.filename}</strong>
                  <small>{exportRow.storagePath ?? "Metadata only"}</small>
                </span>
                <span className="tag">{exportRow.status}</span>
                <span className="meta-list">
                  v{exportRow.version} - {exportRow.rowCount} rows
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
