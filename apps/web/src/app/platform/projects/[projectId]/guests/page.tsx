import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { requireAnyGuestCreatePermission } from "@/lib/guests/guest-api";
import { guestListGateAllowsAccess } from "@/lib/contracts/contract-gates";
import { hasAnyCommercialReadPermission } from "@/lib/contracts/contract-api";
import {
  getProjectDetails,
  listProjectEvents,
} from "@/lib/projects/project-service";
import {
  listProjectGuests,
  parseGuestListSideFilter,
  type GuestSide,
} from "@/lib/guests/guest-service";
import {
  hasProjectPermission,
  ProjectAccessError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type GuestListPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    eventId?: string;
    side?: string;
  }>;
};

function formatSide(side: GuestSide) {
  return side === "both" ? "Both sides" : `${side} side`;
}

export default async function ProjectGuestsPage({
  params,
  searchParams,
}: GuestListPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;
  const filters = await searchParams;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/projects/${projectId}/guests`));
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Guest list</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Guest management
            will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const permissionContext = {
    supabase,
    user: authContext.user,
  };

  try {
    await requireProjectPermission(permissionContext, projectId, "guests.read");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  let canCreateGuest = false;
  try {
    await requireAnyGuestCreatePermission(permissionContext, projectId);
    canCreateGuest = true;
  } catch (error) {
    if (!(error instanceof ProjectAccessError)) {
      throw error;
    }
  }

  const [
    canReadGuestImports,
    canReadRsvps,
    canReadCommercial,
    canGenerateContracts,
  ] = await Promise.all([
    hasProjectPermission(permissionContext, projectId, "guest_imports.read"),
    hasProjectPermission(permissionContext, projectId, "rsvps.read"),
    hasAnyCommercialReadPermission(permissionContext, projectId),
    hasProjectPermission(permissionContext, projectId, "contracts.generate"),
  ]);
  const projectDetails = await getProjectDetails(supabase, projectId);

  if (!projectDetails) {
    notFound();
  }

  const guestListAccessStatus = (
    projectDetails.project as typeof projectDetails.project & {
      guest_list_access_status?: string;
    }
  ).guest_list_access_status;

  if (
    !guestListGateAllowsAccess(guestListAccessStatus) &&
    !canGenerateContracts
  ) {
    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">{projectDetails.project.project_code}</p>
            <h1 className="page-title">Guest list locked</h1>
            <p className="page-summary">
              Guest-list access opens after the project contract is approved
              in-app.
            </p>
          </div>
          <div className="button-group">
            <Link
              className="button secondary"
              href={`/platform/projects/${projectId}`}
            >
              Project
            </Link>
            {canReadCommercial ? (
              <Link
                className="button"
                href={`/platform/projects/${projectId}/commercial`}
              >
                View contract
              </Link>
            ) : null}
          </div>
        </div>
        <section className="section">
          <div className="alert">
            The contract gate is still locked. Bride/groom guest work remains
            unavailable until an authorized couple member approves the latest
            generated contract.
          </div>
        </section>
      </>
    );
  }

  let side: GuestSide | "all";

  try {
    side = parseGuestListSideFilter(filters.side);
  } catch {
    notFound();
  }

  const eventId = filters.eventId;
  const [events, guests] = await Promise.all([
    listProjectEvents(supabase, projectId),
    listProjectGuests(supabase, projectId, {
      eventId,
      side,
    }),
  ]);

  const sideHref = (
    value: GuestSide | "all",
    nextEventId: string | undefined,
  ) => {
    const params = new URLSearchParams();
    if (value !== "all") {
      params.set("side", value);
    }
    if (nextEventId) {
      params.set("eventId", nextEventId);
    }

    return `/platform/projects/${projectId}/guests${params.size > 0 ? `?${params.toString()}` : ""}`;
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{projectDetails.project.project_code}</p>
          <h1 className="page-title">Guest list foundation</h1>
          <p className="page-summary">
            {projectDetails.project.bride_name} &{" "}
            {projectDetails.project.groom_name}
          </p>
        </div>
        <div className="button-group">
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}`}
          >
            Project
          </Link>
          {canReadGuestImports ? (
            <Link
              className="button secondary"
              href={`/platform/projects/${projectId}/guest-imports`}
            >
              Imports
            </Link>
          ) : null}
          {canReadRsvps ? (
            <Link
              className="button secondary"
              href={`/platform/projects/${projectId}/rsvps`}
            >
              RSVP summary
            </Link>
          ) : null}
          {canCreateGuest ? (
            <Link
              className="button"
              href={`/platform/projects/${projectId}/guests/new`}
            >
              Add guest
            </Link>
          ) : null}
        </div>
      </div>

      <section className="section">
        <div className="section-heading">
          <h2>Filters</h2>
          <span className="meta-list">{guests.length} visible guests</span>
        </div>
        <div className="filter-bar">
          {(["all", "bride", "groom", "both"] as const).map((value) => (
            <Link
              aria-current={side === value ? "page" : undefined}
              className="button secondary"
              href={sideHref(value, eventId)}
              key={value}
            >
              {value === "all" ? "All" : formatSide(value)}
            </Link>
          ))}
        </div>
        {events.length > 0 ? (
          <div className="filter-bar">
            <Link className="button secondary" href={sideHref(side, undefined)}>
              All events
            </Link>
            {events.map((event) => {
              return (
                <Link
                  aria-current={eventId === event.id ? "page" : undefined}
                  className="button secondary"
                  href={sideHref(side, event.id)}
                  key={event.id}
                >
                  {event.name}
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Guests</h2>
          <span className="meta-list">Master project guest records</span>
        </div>

        {guests.length === 0 ? (
          <div className="empty-state">No guests match this view yet.</div>
        ) : (
          <div className="record-list">
            {guests.map((guest) => (
              <Link
                className="record-row"
                href={`/platform/projects/${projectId}/guests/${guest.id}`}
                key={guest.id}
              >
                <span>
                  <strong>{guest.display_name}</strong>
                  <small>
                    {guest.whatsapp_number ?? "No WhatsApp"} -{" "}
                    {guest.is_printed_only ? "Printed only" : "Digital ready"}
                  </small>
                </span>
                <span className="tag">{formatSide(guest.guest_side)}</span>
                <span className="meta-list">
                  {guest.is_active ? "Active" : "Inactive"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
