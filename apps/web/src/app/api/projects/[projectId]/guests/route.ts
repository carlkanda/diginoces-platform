import { NextResponse, type NextRequest } from "next/server";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import {
  handleGuestApiError,
  requireGuestSidePermission,
} from "@/lib/guests/guest-api";
import {
  createGuest,
  GuestValidationError,
  listProjectGuests,
  parseCreateGuestPayload,
  type GuestListFilters,
} from "@/lib/guests/guest-service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    throw new GuestValidationError("Request body must be valid JSON.");
  }
}

function parseGuestFilters(request: NextRequest): GuestListFilters {
  const side = request.nextUrl.searchParams.get("side");
  const eventId = request.nextUrl.searchParams.get("eventId") ?? undefined;
  let sideFilter: GuestListFilters["side"];

  if (side === "bride" || side === "groom" || side === "both") {
    sideFilter = side;
  } else if (side === "all") {
    sideFilter = "all";
  } else if (side !== null) {
    throw new GuestValidationError(
      "side must be one of: bride, groom, both, all.",
    );
  }

  return {
    eventId,
    side: sideFilter,
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { projectId } = await context.params;
    await requireProjectPermission(apiContext, projectId, "guests.read");

    const guests = await listProjectGuests(
      apiContext.supabase,
      projectId,
      parseGuestFilters(request),
    );

    return NextResponse.json(
      { guests },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    try {
      return handleGuestApiError(error);
    } catch (projectError) {
      return handleProjectApiError(projectError);
    }
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { projectId } = await context.params;
    const input = parseCreateGuestPayload(await readJson(request));

    await requireGuestSidePermission(apiContext, projectId, input.guestSide);

    const guest = await createGuest(
      apiContext.supabase,
      projectId,
      input,
      apiContext.user.id,
    );

    return NextResponse.json({ guest }, { status: 201 });
  } catch (error) {
    try {
      return handleGuestApiError(error);
    } catch (projectError) {
      return handleProjectApiError(projectError);
    }
  }
}
