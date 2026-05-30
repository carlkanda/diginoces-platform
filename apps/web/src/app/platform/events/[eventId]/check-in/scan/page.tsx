import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { getCheckInOverview } from "@/lib/check-in/check-in-db";
import {
  buildCheckInReadinessIssues,
  resolveAllowedCheckInMethods,
} from "@/lib/check-in/check-in-service";
import { searchParamText } from "@/lib/navigation/search-params";
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

  const guestId = searchParamText(resolvedSearchParams, "guestId");
  const tokenId = searchParamText(resolvedSearchParams, "tokenId");
  const invitationId = searchParamText(resolvedSearchParams, "invitationId");
  const scanStatus = searchParamText(resolvedSearchParams, "scanStatus");
  const scanError = searchParamText(resolvedSearchParams, "scanError");
  const overview = await getCheckInOverview(supabase, eventId);
  const allowedMethods = resolveAllowedCheckInMethods(
    overview.settings?.allowed_methods,
  );
  const isQrAllowed = allowedMethods.has("qr_scan");
  const guest = guestId
    ? (overview.guests.find((item) => item.guestId === guestId) ?? null)
    : null;
  const resolvedStatus = guest
    ? (scanStatus ?? "resolved")
    : guestId
      ? "not found"
      : "not scanned";
  const remainingCount = guest
    ? Math.max(guest.expectedCount - guest.arrivedCount, 0)
    : 0;

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

      {isQrAllowed ? (
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
              <input name="token" required />
            </label>
            <button className="button secondary" type="submit">
              Resolve
            </button>
          </form>
        </section>
      ) : (
        <section className="section">
          <div className="section-heading">
            <h2>QR scanning unavailable</h2>
            <span className="meta-list">Disabled in event settings</span>
          </div>
          <div className="empty-state">
            QR scanning is disabled for this event.
          </div>
        </section>
      )}

      {isQrAllowed && guest ? (
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
            <input name="guestId" type="hidden" value={guest.guestId} />
            <input
              name="invitationId"
              type="hidden"
              value={invitationId ?? ""}
            />
            <input name="tokenId" type="hidden" value={tokenId ?? ""} />
            <label>
              Arrival count
              <input
                defaultValue={1}
                disabled={remainingCount <= 0}
                max={remainingCount > 0 ? remainingCount : 1}
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
            <button
              className="button"
              disabled={remainingCount <= 0 || !tokenId}
              type="submit"
            >
              Confirm check-in
            </button>
            {!tokenId ? (
              <div className="alert">
                Token ID missing. Please re-scan the QR code.
              </div>
            ) : null}
          </form>
        </section>
      ) : guestId && isQrAllowed ? (
        <section className="section">
          <div className="empty-state">
            Token could not be resolved for this event.
          </div>
        </section>
      ) : null}
    </>
  );
}
