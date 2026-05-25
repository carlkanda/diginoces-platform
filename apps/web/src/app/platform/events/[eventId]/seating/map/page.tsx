import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { CSSProperties } from "react";
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
import { buildVisualSeatingMapPlaceholder } from "@/lib/seating/seating-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SeatingMapPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function SeatingMapPage({ params }: SeatingMapPageProps) {
  const authContext = await getAuthContext();
  const { eventId } = await params;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/events/${eventId}/seating/map`));
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Seating map</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Seating map data
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
  const mapTables = buildVisualSeatingMapPlaceholder(overview.tables);
  const canManageTables: boolean | null =
    mapTables.length === 0
      ? await hasProjectPermission(
          context,
          overview.project.id,
          "seating.tables.manage",
        )
      : null;
  const summaryByTableId = new Map(
    overview.summary.tableSummaries.map((summary) => [
      summary.table.id,
      summary,
    ]),
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 8 placeholder</p>
          <h1 className="page-title">Visual seating map</h1>
          <p className="page-summary">
            Foundation map for {overview.event.name}. Advanced drag-and-drop
            behavior is intentionally deferred while table/list seating remains
            the operational source of truth.
          </p>
        </div>
        <div className="button-group">
          <Link
            className="button secondary"
            href={`/platform/events/${eventId}/seating`}
          >
            Seating list
          </Link>
          <Link
            className="button secondary"
            href={`/platform/events/${eventId}`}
          >
            Event
          </Link>
        </div>
      </div>

      <section className="section">
        {mapTables.length === 0 ? (
          <div className="empty-state">
            {canManageTables === true
              ? "Create event tables before using the map foundation."
              : "No tables have been configured for this event yet."}
          </div>
        ) : (
          <div className="seating-map">
            {mapTables.map((table) => {
              const summary = summaryByTableId.get(table.id);

              return (
                <div
                  className="seating-map-table"
                  key={table.id}
                  style={
                    {
                      "--table-x": `${table.positionX}px`,
                      "--table-y": `${table.positionY}px`,
                    } as CSSProperties
                  }
                >
                  <strong>{table.label}</strong>
                  <span>
                    {summary?.activeGuestCount ?? 0}/{summary?.capacity ?? 0}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
