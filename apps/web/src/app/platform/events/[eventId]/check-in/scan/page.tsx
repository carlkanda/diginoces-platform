import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  getCheckInOverview,
  resolveCheckInToken,
} from "@/lib/check-in/check-in-db";
import { buildCheckInReadinessIssues } from "@/lib/check-in/check-in-service";
import {
  ProjectAccessError,
  requireEventPermission,
} from "@/lib/projects/project-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkInByTokenAction, resolveTokenForScanAction } from "../actions";

export const dynamic = "force-dynamic";

type ScanPageProps = {
  params: Promise<{
    eventId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function searchParamText(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return typeof value === "string" ? value : undefined;
}

export default async function CheckInScanPage({
  params,
  searchParams,
}: ScanPageProps) {
  const authContext = await getAuthContext();
  const { eventId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(`/platform/events/${eventId}/check-in/scan`),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">QR check-in</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = {
    supabase,
    user: authContext.user,
  };

  try {
    await requireEventPermission(context, eventId, "check_in.perform");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const token = searchParamText(resolvedSearchParams, "token");
  const scanError = searchParamText(resolvedSearchParams, "scanError");
  const [resolved, overview] = await Promise.all([
    token ? resolveCheckInToken(supabase, eventId, token) : null,
    getCheckInOverview(supabase, eventId),
  ]);
  const guest =
    resolved?.status === "ok" && typeof resolved.guestId === "string"
      ? (overview.guests.find((item) => item.guestId === resolved.guestId) ??
        null)
      : null;
  const resolvedStatus =
    typeof resolved?.status === "string" ? resolved.status : "not scanned";

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 9 QR scan</p>
          <h1 className="page-title">QR check-in confirmation</h1>
          <p className="page-summary">
            Check-in tokens identify one guest for one event. The staff session
            remains the authority for recording attendance.
          </p>
        </div>
        <div className="button-group">
          <Link
            className="button secondary"
            href={`/platform/events/${eventId}/check-in`}
          >
            Check-in
          </Link>
          <Link
            className="button secondary"
            href={`/platform/events/${eventId}`}
          >
            Event
          </Link>
        </div>
      </div>

      {scanError ? <div className="alert section">{scanError}</div> : null}

      <section className="section">
        <div className="section-heading">
          <h2>Scanned token</h2>
          <span className="meta-list">{resolvedStatus}</span>
        </div>
        <form
          action={resolveTokenForScanAction.bind(null, eventId)}
          className="form-panel form-grid"
        >
          <label>
            Token
            <input defaultValue={token ?? ""} name="token" required />
          </label>
          <button className="button secondary" type="submit">
            Resolve
          </button>
        </form>
      </section>

      {guest ? (
        <section className="section">
          <div className="section-heading">
            <h2>{guest.displayName}</h2>
            <span className={guest.isVipProtocol ? "tag warning-tag" : "tag"}>
              {guest.arrivedCount}/{guest.expectedCount}
            </span>
          </div>
          <div className="detail-grid">
            <div>
              <span>Side</span>
              <strong>{guest.guestSide}</strong>
            </div>
            <div>
              <span>RSVP</span>
              <strong>{guest.rsvpStatus}</strong>
            </div>
            <div>
              <span>Table</span>
              <strong>{guest.tableName ?? "Unassigned"}</strong>
            </div>
            <div>
              <span>Format</span>
              <strong>
                {guest.isPrintedOnly ? "Printed-only" : "Digital"}
              </strong>
            </div>
          </div>
          <div className="requirement-list">
            {buildCheckInReadinessIssues(guest).map((issue) => (
              <span key={issue.code}>{issue.message}</span>
            ))}
          </div>
          <form
            action={checkInByTokenAction.bind(null, eventId)}
            className="form-panel form-grid"
          >
            <input name="token" type="hidden" value={token ?? ""} />
            <label>
              Arrival count
              <input
                defaultValue="1"
                max={guest.expectedCount}
                min="1"
                name="arrivalCount"
                type="number"
              />
            </label>
            <label>
              Device/station
              <select name="deviceId">
                <option value="">Unassigned device</option>
                {overview.devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.station_name}
                  </option>
                ))}
              </select>
            </label>
            <button className="button" type="submit">
              Confirm check-in
            </button>
          </form>
        </section>
      ) : token ? (
        <section className="section">
          <div className="empty-state">
            Token could not be resolved for this event.
          </div>
        </section>
      ) : null}
    </>
  );
}
