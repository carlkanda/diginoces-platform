import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import {
  getGuestImportDetails,
  getImportRowDisplayName,
  isReviewableStoredRow,
  summarizeStoredImportRows,
} from "@/lib/guest-imports/guest-import-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  applyGuestImportRowsAction,
  submitGuestImportAction,
} from "../actions";

export const dynamic = "force-dynamic";

type GuestImportDetailPageProps = {
  params: Promise<{
    importId: string;
    projectId: string;
  }>;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function jsonArrayCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

export default async function GuestImportDetailPage({
  params,
}: GuestImportDetailPageProps) {
  const authContext = await getAuthContext();
  const { importId, projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      `/login?next=/platform/projects/${projectId}/guest-imports/${importId}`,
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Import detail</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Guest import
            details will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const details = await getGuestImportDetails(
    await createSupabaseServerClient(),
    projectId,
    importId,
  );

  if (!details) {
    notFound();
  }

  const summary = summarizeStoredImportRows(details.rows);
  const canSubmit =
    (details.session.status === "previewed" ||
      details.session.status === "validation_failed") &&
    details.rows.some(isReviewableStoredRow);
  const canApply =
    (details.session.status === "approved" ||
      details.session.status === "partially_approved") &&
    details.rows.some((row) => row.approval_status === "approved");
  const submitAction = submitGuestImportAction.bind(null, projectId, importId);
  const applyAction = applyGuestImportRowsAction.bind(
    null,
    projectId,
    importId,
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{details.session.source_filename}</p>
          <h1 className="page-title">Import detail</h1>
          <p className="page-summary">
            Status: {formatStatus(details.session.status)}
          </p>
        </div>
        <div className="button-group">
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/guest-imports`}
          >
            History
          </Link>
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/guest-imports/${importId}/mapping`}
          >
            Mapping
          </Link>
          <Link
            className="button"
            href={`/platform/projects/${projectId}/guest-imports/${importId}/review`}
          >
            Review
          </Link>
        </div>
      </div>

      <section className="section">
        <div className="detail-grid">
          <div>
            <span>Rows</span>
            <strong>{details.session.row_count}</strong>
          </div>
          <div>
            <span>Valid</span>
            <strong>{details.session.valid_row_count}</strong>
          </div>
          <div>
            <span>Blocked</span>
            <strong>{details.session.invalid_row_count}</strong>
          </div>
          <div>
            <span>Duplicate warnings</span>
            <strong>{details.session.duplicate_warning_count}</strong>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="button-group">
          <form action={submitAction}>
            <button className="button" disabled={!canSubmit} type="submit">
              Submit for review
            </button>
          </form>
          <form action={applyAction}>
            <button className="button" disabled={!canApply} type="submit">
              Apply approved rows
            </button>
          </form>
        </div>
        <p className="form-note">
          Approval summary: {summary.approvedRows} approved,{" "}
          {summary.rejectedRows} rejected, {summary.heldRows} held,{" "}
          {summary.blockedRows} blocked, {summary.warningRows} warnings.
        </p>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Preview rows</h2>
          <span className="meta-list">{details.rows.length} staged rows</span>
        </div>

        {details.rows.length === 0 ? (
          <div className="empty-state">No staged rows are available.</div>
        ) : (
          <div className="record-list">
            {details.rows.map((row) => (
              <div className="record-row" key={row.id}>
                <span>
                  <strong>{getImportRowDisplayName(row)}</strong>
                  <small>
                    Row {row.row_number} - {formatStatus(row.validation_status)}{" "}
                    - {formatStatus(row.approval_status)}
                  </small>
                </span>
                <span className="tag">
                  {formatStatus(row.duplicate_severity)}
                </span>
                <span className="meta-list">
                  {jsonArrayCount(row.validation_errors)} errors /{" "}
                  {jsonArrayCount(row.duplicate_warnings)} warnings
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
