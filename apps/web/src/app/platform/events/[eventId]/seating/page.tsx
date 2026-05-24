import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  hasProjectPermission,
  ProjectAccessError,
  requireEventPermission,
} from "@/lib/projects/project-api";
import { getEventSeatingOverview } from "@/lib/seating/seating-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  assignGuestToEventTableAction,
  bulkCreateEventTablesAction,
  createEventTableAction,
  generateTableCardCsvExportAction,
  removeGuestFromEventTableAction,
  updateEventTableAction,
} from "./actions";

export const dynamic = "force-dynamic";

type SeatingPageProps = {
  params: Promise<{
    eventId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function searchParamText(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return typeof value === "string" ? value : undefined;
}

function statusMessage(status: string | undefined) {
  switch (status) {
    case "export_generated":
      return "Table-card CSV export generated.";
    case "guest_assigned":
      return "Guest assigned to table.";
    case "guest_removed":
      return "Guest removed from table.";
    case "table_created":
      return "Event table created.";
    case "table_updated":
      return "Event table updated.";
    case "tables_created":
      return "Event tables created.";
    default:
      return null;
  }
}

export default async function EventSeatingPage({
  params,
  searchParams,
}: SeatingPageProps) {
  const authContext = await getAuthContext();
  const { eventId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/events/${eventId}/seating`));
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Event seating</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Seating workflows
            will load after local credentials are supplied.
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
    await requireEventPermission(context, eventId, "seating.read");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const overview = await getEventSeatingOverview(supabase, eventId);
  const [canManageTables, canAssign, canExport] = await Promise.all([
    hasProjectPermission(context, overview.project.id, "seating.tables.manage"),
    hasProjectPermission(context, overview.project.id, "seating.assign"),
    hasProjectPermission(context, overview.project.id, "seating.export"),
  ]);
  const seatingError = searchParamText(resolvedSearchParams, "seatingError");
  const seatingStatus = statusMessage(
    searchParamText(resolvedSearchParams, "seatingStatus"),
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 8 foundation</p>
          <h1 className="page-title">Tables and seating</h1>
          <p className="page-summary">
            Event-specific seating for {overview.event.name} on{" "}
            {formatDate(overview.event.event_date)}. RSVP No guests are kept in
            history but excluded from active occupancy.
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
            href={`/platform/events/${eventId}/seating/map`}
          >
            Seating map
          </Link>
          <Link
            className="button secondary"
            href={`/platform/projects/${overview.project.id}`}
          >
            Project
          </Link>
        </div>
      </div>

      {seatingError ? (
        <div className="alert section">{seatingError}</div>
      ) : null}
      {seatingStatus ? (
        <div className="alert success section">{seatingStatus}</div>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>Seating overview</h2>
          <span className="meta-list">
            {overview.summary.tableSummaries.length} tables -{" "}
            {overview.summary.unassignedGuests.length} unassigned
          </span>
        </div>
        <div className="detail-grid">
          <div>
            <span>Total capacity</span>
            <strong>{overview.summary.capacity}</strong>
          </div>
          <div>
            <span>Active occupancy</span>
            <strong>{overview.summary.totalActiveOccupancy}</strong>
          </div>
          <div>
            <span>Over-capacity tables</span>
            <strong>{overview.summary.overCapacityTables}</strong>
          </div>
          <div>
            <span>Export versions</span>
            <strong>{overview.exports.length}</strong>
          </div>
        </div>
      </section>

      {canManageTables ? (
        <section className="section">
          <div className="section-heading">
            <h2>Create tables</h2>
            <span className="meta-list">Individual and bulk foundation</span>
          </div>
          <div className="progress-overview">
            <form
              action={createEventTableAction.bind(null, eventId)}
              className="form-panel stacked-form"
            >
              <label>
                Table code
                <input name="tableCode" placeholder="T1" required />
              </label>
              <label>
                Table name
                <input name="tableName" placeholder="Table 1" required />
              </label>
              <label>
                Capacity
                <input min="1" name="capacity" required type="number" />
              </label>
              <label>
                Assignment mode
                <select name="assignmentMode">
                  <option value="table_level">Table level</option>
                  <option value="seat_level">Seat level foundation</option>
                  <option value="mixed">Mixed foundation</option>
                </select>
              </label>
              <label>
                Notes
                <textarea name="notes" rows={3} />
              </label>
              <button className="button" type="submit">
                Create table
              </button>
            </form>

            <form
              action={bulkCreateEventTablesAction.bind(null, eventId)}
              className="form-panel stacked-form"
            >
              <label>
                Number of tables
                <input min="1" name="tableCount" required type="number" />
              </label>
              <label>
                Capacity per table
                <input min="1" name="bulkCapacity" required type="number" />
              </label>
              <label>
                Start number
                <input
                  defaultValue="1"
                  min="1"
                  name="startNumber"
                  type="number"
                />
              </label>
              <label>
                Code prefix
                <input defaultValue="T" name="tableCodePrefix" />
              </label>
              <label>
                Name prefix
                <input defaultValue="Table" name="tableNamePrefix" />
              </label>
              <button className="button" type="submit">
                Bulk create tables
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {canAssign ? (
        <section className="section">
          <div className="section-heading">
            <h2>Assign unassigned guest</h2>
            <span className="meta-list">
              {overview.summary.unassignedGuests.length} active guests
            </span>
          </div>
          {overview.summary.unassignedGuests.length === 0 ||
          overview.tables.length === 0 ? (
            <div className="empty-state">
              Add active tables and invited guests before assigning seats.
            </div>
          ) : (
            <form
              action={assignGuestToEventTableAction.bind(null, eventId)}
              className="form-panel form-grid"
            >
              <label>
                Guest
                <select name="guestId" required>
                  {overview.summary.unassignedGuests.map((guest) => (
                    <option key={guest.id} value={guest.id}>
                      {guest.displayName} - {guest.guestSide} - RSVP{" "}
                      {guest.rsvpStatus}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Table
                <select name="tableId" required>
                  {overview.tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.tableCode} - {table.tableName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Seating notes
                <textarea name="seatingNotes" rows={3} />
              </label>
              <label>
                VIP/protocol notes
                <textarea name="vipProtocolNotes" rows={3} />
              </label>
              <button className="button" type="submit">
                Assign guest
              </button>
            </form>
          )}
        </section>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>Tables</h2>
          <span className="meta-list">Capacity and occupancy</span>
        </div>
        {overview.summary.tableSummaries.length === 0 ? (
          <div className="empty-state">No tables have been created yet.</div>
        ) : (
          <div className="record-list">
            {overview.summary.tableSummaries.map((summary) => (
              <div className="panel" key={summary.table.id}>
                <div className="panel-body">
                  <div className="section-heading">
                    <div>
                      <h2>
                        {summary.table.tableCode} - {summary.table.tableName}
                      </h2>
                      <p className="page-summary">
                        Active occupancy {summary.activeGuestCount}/
                        {summary.capacity}
                        {summary.overCapacityBy > 0
                          ? ` - over by ${summary.overCapacityBy}`
                          : ""}
                      </p>
                    </div>
                    <span
                      className={
                        summary.overCapacityBy > 0 ? "tag warning-tag" : "tag"
                      }
                    >
                      {summary.overCapacityBy > 0
                        ? "Over capacity"
                        : summary.remainingCapacity === 0
                          ? "Full"
                          : `${summary.remainingCapacity} open`}
                    </span>
                  </div>

                  {canManageTables ? (
                    <form
                      action={updateEventTableAction.bind(
                        null,
                        eventId,
                        summary.table.id,
                      )}
                      className="form-grid compact"
                    >
                      <label>
                        Code
                        <input
                          defaultValue={summary.table.tableCode}
                          name="tableCode"
                          required
                        />
                      </label>
                      <label>
                        Name
                        <input
                          defaultValue={summary.table.tableName}
                          name="tableName"
                          required
                        />
                      </label>
                      <label>
                        Capacity
                        <input
                          defaultValue={summary.capacity}
                          min="1"
                          name="capacity"
                          required
                          type="number"
                        />
                      </label>
                      <label>
                        Status
                        <select
                          defaultValue={summary.table.status}
                          name="status"
                        >
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                          <option value="locked">Locked</option>
                          <option value="archived">Archived</option>
                        </select>
                      </label>
                      <label>
                        Mode
                        <select
                          defaultValue={summary.table.assignmentMode}
                          name="assignmentMode"
                        >
                          <option value="table_level">Table level</option>
                          <option value="seat_level">Seat level</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      </label>
                      <label>
                        Order
                        <input
                          defaultValue={summary.table.displayOrder}
                          min="0"
                          name="displayOrder"
                          type="number"
                        />
                      </label>
                      <input
                        name="description"
                        type="hidden"
                        value={summary.table.description ?? ""}
                      />
                      <input
                        name="notes"
                        type="hidden"
                        value={summary.table.notes ?? ""}
                      />
                      <button className="button secondary" type="submit">
                        Save table
                      </button>
                    </form>
                  ) : null}

                  {summary.assignedGuests.length === 0 ? (
                    <div className="empty-state">
                      No guests assigned to this table yet.
                    </div>
                  ) : (
                    <div className="record-list">
                      {summary.assignedGuests.map((guest) => (
                        <div className="task-row" key={guest.id}>
                          <span>
                            <strong>{guest.displayName}</strong>
                            <small>
                              {guest.guestSide} - RSVP {guest.rsvpStatus} -{" "}
                              {guest.guestCount ?? 1} seat unit
                              {guest.isVipProtocol ? " - VIP/protocol" : ""}
                            </small>
                          </span>
                          {canAssign ? (
                            <form
                              action={removeGuestFromEventTableAction.bind(
                                null,
                                eventId,
                                guest.id,
                              )}
                            >
                              <input
                                name="reason"
                                type="hidden"
                                value="removed_from_seating_page"
                              />
                              <button
                                className="button secondary"
                                type="submit"
                              >
                                Remove
                              </button>
                            </form>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Unassigned active guests</h2>
          <span className="meta-list">
            RSVP No excluded from active seating count
          </span>
        </div>
        {overview.summary.unassignedGuests.length === 0 ? (
          <div className="empty-state">No active unassigned guests.</div>
        ) : (
          <div className="record-list">
            {overview.summary.unassignedGuests.map((guest) => (
              <div className="task-row" key={guest.id}>
                <span>
                  <strong>{guest.displayName}</strong>
                  <small>
                    {guest.guestSide} - RSVP {guest.rsvpStatus} -{" "}
                    {guest.isPrintedOnly ? "printed-only" : "digital"}
                    {guest.isVipProtocol ? " - VIP/protocol" : ""}
                  </small>
                </span>
                <span className="tag">{guest.guestCount ?? 1} place(s)</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Table-card CSV exports</h2>
          <span className="meta-list">Canva Bulk Create foundation</span>
        </div>
        {canExport ? (
          <form action={generateTableCardCsvExportAction.bind(null, eventId)}>
            <button className="button" type="submit">
              Generate table-card CSV
            </button>
          </form>
        ) : null}
        {overview.exports.length === 0 ? (
          <div className="empty-state">
            No table-card CSV exports have been generated yet.
          </div>
        ) : (
          <div className="record-list">
            {overview.exports.map((exportFile) => (
              <div className="record-row" key={exportFile.id}>
                <span>
                  <strong>{exportFile.filename}</strong>
                  <small>{exportFile.storage_path}</small>
                </span>
                <span className="tag">v{exportFile.version}</span>
                <span className="meta-list">{exportFile.row_count} rows</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
