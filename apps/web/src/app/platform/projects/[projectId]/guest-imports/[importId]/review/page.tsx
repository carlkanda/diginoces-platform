import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import {
  getGuestImportDetails,
  getImportRowDisplayName,
  isReviewableStoredRow,
} from "@/lib/guest-imports/guest-import-db";
import { requireGuestImportReviewPermission } from "@/lib/guest-imports/guest-import-api";
import { ProjectAccessError } from "@/lib/projects/project-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reviewGuestImportRowsAction } from "../../actions";

export const dynamic = "force-dynamic";

type GuestImportReviewPageProps = {
  params: Promise<{
    importId: string;
    projectId: string;
  }>;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function defaultReviewStatus(status: string) {
  if (status === "approved" || status === "rejected" || status === "held") {
    return status;
  }

  return "held";
}

export default async function GuestImportReviewPage({
  params,
}: GuestImportReviewPageProps) {
  const authContext = await getAuthContext();
  const { importId, projectId } = await params;

  if (authContext.status === "anonymous") {
    const nextPath = `/platform/projects/${projectId}/guest-imports/${importId}/review`;
    redirect(`/login?${new URLSearchParams({ next: nextPath }).toString()}`);
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Review import</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Guest import
            review will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireGuestImportReviewPermission(context, projectId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const details = await getGuestImportDetails(supabase, projectId, importId);

  if (!details) {
    notFound();
  }

  const action = reviewGuestImportRowsAction.bind(null, projectId, importId);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{details.session.source_filename}</p>
          <h1 className="page-title">Review import</h1>
          <p className="page-summary">
            Approve, reject, or hold staged rows before applying them to the
            guest list.
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/platform/projects/${projectId}/guest-imports/${importId}`}
        >
          Import detail
        </Link>
      </div>

      <section className="section">
        <form action={action} className="form">
          <div className="record-list">
            {details.rows.map((row) => {
              const reviewable = isReviewableStoredRow(row);
              const currentStatus = defaultReviewStatus(row.approval_status);

              return (
                <div className="record-row" key={row.id}>
                  <span>
                    <strong>{getImportRowDisplayName(row)}</strong>
                    <small>
                      Row {row.row_number} -{" "}
                      {formatStatus(row.validation_status)}
                    </small>
                  </span>
                  <span className="tag">
                    {formatStatus(row.duplicate_severity)}
                  </span>
                  <span className="filter-bar">
                    {reviewable ? (
                      <input name="rowIds" type="hidden" value={row.id} />
                    ) : null}
                    {(["approved", "rejected", "held"] as const).map(
                      (status) => (
                        <label className="check-field" key={status}>
                          <input
                            defaultChecked={currentStatus === status}
                            disabled={!reviewable}
                            name={`rowStatus:${row.id}`}
                            type="radio"
                            value={status}
                          />
                          {status}
                        </label>
                      ),
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="field">
            <label htmlFor="reviewNotes">Review notes</label>
            <textarea id="reviewNotes" name="reviewNotes" rows={4} />
          </div>

          <button className="button" type="submit">
            Save review
          </button>
        </form>
      </section>
    </>
  );
}
