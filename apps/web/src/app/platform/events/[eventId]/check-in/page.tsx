import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { getCheckInOverview } from "@/lib/check-in/check-in-db";
import {
  buildCheckInReadinessIssues,
  searchCheckInGuests,
  type CheckInGuest,
} from "@/lib/check-in/check-in-service";
import {
  hasEventPermission,
  ProjectAccessError,
  requireEventPermission,
} from "@/lib/projects/project-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createCheckInTokenAction,
  createPreloadSnapshotAction,
  createUnexpectedGuestRequestAction,
  performManualCheckInAction,
  resolveTokenForScanAction,
  reviewUnexpectedGuestRequestAction,
  submitOfflineSyncBatchAction,
  updateCheckInSettingsAction,
  upsertCheckInDeviceAction,
} from "./actions";

export const dynamic = "force-dynamic";

type CheckInPageProps = {
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

function statusMessage(status: string | undefined) {
  switch (status) {
    case "device_saved":
      return "Check-in device saved.";
    case "guest_checked_in":
      return "Guest check-in recorded.";
    case "offline_sync_submitted":
      return "Offline sync batch submitted.";
    case "preload_created":
      return "Offline preload snapshot created.";
    case "settings_updated":
      return "Check-in settings updated.";
    case "token_created":
      return "Check-in token created.";
    case "unexpected_request_created":
      return "Unexpected guest request created.";
    case "unexpected_reviewed":
      return "Unexpected guest request reviewed.";
    default:
      return null;
  }
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function guestSubtitle(guest: CheckInGuest) {
  return [
    guest.guestSide,
    guest.isPrintedOnly ? "printed-only" : "digital",
    `RSVP ${guest.rsvpStatus}`,
    guest.tableName ? `${guest.tableName}` : "no table",
  ].join(" - ");
}

export default async function EventCheckInPage({
  params,
  searchParams,
}: CheckInPageProps) {
  const authContext = await getAuthContext();
  const { eventId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/events/${eventId}/check-in`));
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Event check-in</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Check-in
            workflows will load after local credentials are supplied.
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
    await requireEventPermission(context, eventId, "check_in.read");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const overview = await getCheckInOverview(supabase, eventId);
  const [
    canConfigure,
    canManageDevices,
    canManageTokens,
    canPerform,
    canReviewUnexpected,
    canSyncOffline,
    canViewDashboard,
  ] = await Promise.all([
    hasEventPermission(context, eventId, "check_in.settings.manage"),
    hasEventPermission(context, eventId, "check_in.devices.manage"),
    hasEventPermission(context, eventId, "check_in.tokens.manage"),
    hasEventPermission(context, eventId, "check_in.perform"),
    hasEventPermission(context, eventId, "check_in.unexpected_guests.review"),
    hasEventPermission(context, eventId, "check_in.offline_sync"),
    hasEventPermission(context, eventId, "check_in.dashboard"),
  ]);
  const query = searchParamText(resolvedSearchParams, "q") ?? "";
  const side = searchParamText(resolvedSearchParams, "side") ?? "all";
  const tableId = searchParamText(resolvedSearchParams, "tableId");
  const searchResults = searchCheckInGuests(overview.guests, {
    query,
    side:
      side === "bride" || side === "groom" || side === "both" ? side : "all",
    tableId,
  }).slice(0, 30);
  const checkInError = searchParamText(resolvedSearchParams, "checkInError");
  const checkInStatus = statusMessage(
    searchParamText(resolvedSearchParams, "checkInStatus"),
  );
  const tokenPreview = searchParamText(resolvedSearchParams, "tokenPreview");

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 9 foundation</p>
          <h1 className="page-title">Wedding-day check-in</h1>
          <p className="page-summary">
            Staff-only event check-in for {overview.event.name}. Check-in is
            event-specific and does not use public guest page tokens as
            authority.
          </p>
        </div>
        <div className="button-group">
          <Link
            className="button secondary"
            href={`/platform/events/${eventId}`}
          >
            Event
          </Link>
          <Link
            className="button secondary"
            href={`/platform/events/${eventId}/seating`}
          >
            Seating
          </Link>
          <Link
            className="button secondary"
            href={`/platform/projects/${overview.project.id}`}
          >
            Project
          </Link>
        </div>
      </div>

      {checkInError ? (
        <div className="alert section">{checkInError}</div>
      ) : null}
      {checkInStatus ? (
        <div className="alert success section">
          {checkInStatus}
          {tokenPreview ? ` Token preview: ${tokenPreview}` : ""}
        </div>
      ) : null}

      {canViewDashboard ? (
        <section className="section">
          <div className="section-heading">
            <h2>Arrival dashboard</h2>
            <span className="meta-list">
              {formatDateTime(overview.event.starts_at)}
            </span>
          </div>
          <div className="detail-grid">
            <div>
              <span>Expected units</span>
              <strong>{overview.metrics.expectedUnits}</strong>
            </div>
            <div>
              <span>Arrived units</span>
              <strong>{overview.metrics.arrivedUnits}</strong>
            </div>
            <div>
              <span>Remaining</span>
              <strong>{overview.metrics.remainingUnits}</strong>
            </div>
            <div>
              <span>Partial arrivals</span>
              <strong>{overview.metrics.partialArrivalCount}</strong>
            </div>
            <div>
              <span>Duplicate scans</span>
              <strong>{overview.metrics.duplicateScanCount}</strong>
            </div>
            <div>
              <span>Offline pending</span>
              <strong>{overview.metrics.offlinePendingCount}</strong>
            </div>
            <div>
              <span>Sync conflicts</span>
              <strong>{overview.metrics.syncConflictCount}</strong>
            </div>
            <div>
              <span>Unexpected pending</span>
              <strong>{overview.metrics.unexpectedPendingCount}</strong>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>QR scan</h2>
          <span className="meta-list">Event-specific check-in token</span>
        </div>
        <form
          action={resolveTokenForScanAction.bind(null, eventId)}
          className="form-panel form-grid"
        >
          <label>
            Token
            <input name="token" placeholder="Paste scanned token" required />
          </label>
          <button className="button" type="submit">
            Resolve token
          </button>
        </form>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Manual search</h2>
          <span className="meta-list">
            Name, phone, invitation ID, side, or table
          </span>
        </div>
        <form className="form-panel form-grid">
          <label>
            Search
            <input
              defaultValue={query}
              name="q"
              placeholder="Name, phone, invitation ID, table"
            />
          </label>
          <label>
            Side
            <select defaultValue={side} name="side">
              <option value="all">All sides</option>
              <option value="bride">Bride + both</option>
              <option value="groom">Groom + both</option>
              <option value="both">Both only</option>
            </select>
          </label>
          <label>
            Table
            <select defaultValue={tableId ?? ""} name="tableId">
              <option value="">All tables</option>
              {overview.metrics.byTable.map((table) => (
                <option key={table.tableId} value={table.tableId}>
                  {table.tableName}
                </option>
              ))}
            </select>
          </label>
          <button className="button secondary" type="submit">
            Search
          </button>
        </form>

        <div className="record-list">
          {searchResults.length === 0 ? (
            <div className="empty-state">
              No matching invited guests for this event.
            </div>
          ) : (
            searchResults.map((guest) => {
              const readinessIssues = buildCheckInReadinessIssues(guest);

              return (
                <div
                  className={
                    guest.isVipProtocol ? "panel highlighted-panel" : "panel"
                  }
                  key={guest.guestId}
                >
                  <div className="panel-body">
                    <div className="section-heading">
                      <div>
                        <h2>{guest.displayName}</h2>
                        <p className="page-summary">{guestSubtitle(guest)}</p>
                      </div>
                      <span
                        className={
                          guest.isVipProtocol ? "tag warning-tag" : "tag"
                        }
                      >
                        {guest.arrivedCount}/{guest.expectedCount}
                      </span>
                    </div>
                    {readinessIssues.length > 0 ? (
                      <div className="requirement-list">
                        {readinessIssues.map((issue) => (
                          <span key={issue.code}>{issue.message}</span>
                        ))}
                      </div>
                    ) : null}
                    {canPerform ? (
                      <form
                        action={performManualCheckInAction.bind(
                          null,
                          eventId,
                          guest.guestId,
                        )}
                        className="form-grid compact"
                      >
                        <input
                          name="invitationId"
                          type="hidden"
                          value={guest.invitationId ?? ""}
                        />
                        <label>
                          Method
                          <select name="method">
                            <option value="manual_name_search">
                              Name search
                            </option>
                            <option value="manual_invitation_id">
                              Invitation ID
                            </option>
                            <option value="manual_phone_search">
                              Phone search
                            </option>
                            <option value="manual_table_search">
                              Table search
                            </option>
                          </select>
                        </label>
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
                        <label>
                          Notes
                          <input name="notes" />
                        </label>
                        <label className="checkbox-label">
                          <input name="supervisorOverride" type="checkbox" />
                          Supervisor override
                        </label>
                        <button className="button" type="submit">
                          Check in
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {canConfigure ? (
        <section className="section">
          <div className="section-heading">
            <h2>Event check-in settings</h2>
            <span className="meta-list">
              {overview.settings?.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <form
            action={updateCheckInSettingsAction.bind(null, eventId)}
            className="form-panel form-grid"
          >
            <label className="checkbox-label">
              <input
                defaultChecked={overview.settings?.enabled ?? false}
                name="enabled"
                type="checkbox"
              />
              Enabled
            </label>
            <label>
              Starts at
              <input
                defaultValue={overview.settings?.starts_at ?? ""}
                name="startsAt"
                type="datetime-local"
              />
            </label>
            <label>
              Ends at
              <input
                defaultValue={overview.settings?.ends_at ?? ""}
                name="endsAt"
                type="datetime-local"
              />
            </label>
            <label>
              Timezone
              <input
                defaultValue={overview.settings?.timezone ?? "UTC"}
                name="timezone"
              />
            </label>
            <label>
              Unexpected guests
              <select
                defaultValue={
                  overview.settings?.unexpected_guest_mode ??
                  "supervisor_approval_required"
                }
                name="unexpectedGuestMode"
              >
                <option value="supervisor_approval_required">
                  Supervisor approval required
                </option>
                <option value="manual_recording_only">Manual recording</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
            <label className="checkbox-label">
              <input
                defaultChecked={
                  overview.settings?.offline_preload_enabled ?? false
                }
                name="offlinePreloadEnabled"
                type="checkbox"
              />
              Offline preload
            </label>
            <label className="checkbox-label">
              <input
                defaultChecked={
                  overview.settings?.supervisor_approval_required ?? true
                }
                name="supervisorApprovalRequired"
                type="checkbox"
              />
              Supervisor approval
            </label>
            {[
              "qr_scan",
              "manual_name_search",
              "manual_invitation_id",
              "manual_phone_search",
              "manual_table_search",
            ].map((method) => (
              <label className="checkbox-label" key={method}>
                <input
                  defaultChecked={
                    overview.settings?.allowed_methods.includes(method) ?? true
                  }
                  name="allowedMethods"
                  type="checkbox"
                  value={method}
                />
                {method}
              </label>
            ))}
            <button className="button" type="submit">
              Save settings
            </button>
          </form>
        </section>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>Unexpected guests</h2>
          <span className="meta-list">
            {overview.unexpectedRequests.length} requests
          </span>
        </div>
        <form
          action={createUnexpectedGuestRequestAction.bind(null, eventId)}
          className="form-panel form-grid"
        >
          <label>
            Name
            <input name="requestedName" required />
          </label>
          <label>
            Side
            <select name="guestSide">
              <option value="">Unknown</option>
              <option value="bride">Bride</option>
              <option value="groom">Groom</option>
              <option value="both">Both</option>
            </select>
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
          <label>
            Reason
            <input name="reason" />
          </label>
          <button className="button secondary" type="submit">
            Create request
          </button>
        </form>
        <div className="record-list">
          {overview.unexpectedRequests.map((request) => (
            <div className="task-row" key={request.id}>
              <span>
                <strong>{request.requested_name}</strong>
                <small>
                  {request.status} - {request.guest_side ?? "unknown side"}
                  {request.reason ? ` - ${request.reason}` : ""}
                </small>
              </span>
              {canReviewUnexpected && request.status === "pending" ? (
                <div className="button-group">
                  <form
                    action={reviewUnexpectedGuestRequestAction.bind(
                      null,
                      eventId,
                      request.id,
                      "approved",
                    )}
                  >
                    <input
                      name="approvedArrivalCount"
                      type="hidden"
                      value="1"
                    />
                    <button className="button secondary" type="submit">
                      Approve
                    </button>
                  </form>
                  <form
                    action={reviewUnexpectedGuestRequestAction.bind(
                      null,
                      eventId,
                      request.id,
                      "manual_approved",
                    )}
                  >
                    <input
                      name="approvalMode"
                      type="hidden"
                      value="manual_external"
                    />
                    <input
                      name="approvedArrivalCount"
                      type="hidden"
                      value="1"
                    />
                    <button className="button secondary" type="submit">
                      Manual approval
                    </button>
                  </form>
                  <form
                    action={reviewUnexpectedGuestRequestAction.bind(
                      null,
                      eventId,
                      request.id,
                      "rejected",
                    )}
                  >
                    <button className="button secondary" type="submit">
                      Reject
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {canManageDevices || canSyncOffline || canManageTokens ? (
        <section className="section">
          <div className="section-heading">
            <h2>Operations foundation</h2>
            <span className="meta-list">Tokens, devices, offline sync</span>
          </div>
          <div className="progress-overview">
            {canManageDevices ? (
              <form
                action={upsertCheckInDeviceAction.bind(null, eventId)}
                className="form-panel stacked-form"
              >
                <label>
                  Station name
                  <input name="stationName" placeholder="Entrance A" required />
                </label>
                <label>
                  Device label
                  <input name="deviceLabel" placeholder="Tablet 1" />
                </label>
                <label>
                  Assigned staff user ID
                  <input name="assignedStaffUserId" />
                </label>
                <button className="button" type="submit">
                  Save device
                </button>
              </form>
            ) : null}

            {canManageTokens ? (
              <form
                action={createCheckInTokenAction.bind(null, eventId)}
                className="form-panel stacked-form"
              >
                <label>
                  Guest
                  <select name="guestId" required>
                    {overview.guests.map((guest) => (
                      <option key={guest.guestId} value={guest.guestId}>
                        {guest.displayName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Invitation ID
                  <input name="invitationId" />
                </label>
                <button className="button" type="submit">
                  Generate check-in token
                </button>
              </form>
            ) : null}

            {canSyncOffline ? (
              <div className="form-panel stacked-form">
                <form action={createPreloadSnapshotAction.bind(null, eventId)}>
                  <label>
                    Device/station
                    <select name="deviceId">
                      <option value="">Any assigned device</option>
                      {overview.devices.map((device) => (
                        <option key={device.id} value={device.id}>
                          {device.station_name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="button" type="submit">
                    Create preload snapshot
                  </button>
                </form>
                <form
                  action={submitOfflineSyncBatchAction.bind(null, eventId)}
                  className="stacked-form"
                >
                  <label>
                    Offline guest
                    <select name="guestId" required>
                      {overview.guests.map((guest) => (
                        <option key={guest.guestId} value={guest.guestId}>
                          {guest.displayName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Arrival count
                    <input
                      defaultValue="1"
                      min="1"
                      name="arrivalCount"
                      type="number"
                    />
                  </label>
                  <button className="button secondary" type="submit">
                    Submit offline sync sample
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>Devices and stations</h2>
          <span className="meta-list">
            {overview.devices.length} configured
          </span>
        </div>
        {overview.devices.length === 0 ? (
          <div className="empty-state">No check-in stations assigned yet.</div>
        ) : (
          <div className="record-list">
            {overview.devices.map((device) => (
              <div className="task-row" key={device.id}>
                <span>
                  <strong>{device.station_name}</strong>
                  <small>
                    {device.device_label ?? "unlabeled"} - {device.status} -{" "}
                    {device.preload_status} - {device.activity_count} actions
                  </small>
                </span>
                <span className="tag">{device.sync_status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
