import { NextResponse, type NextRequest } from "next/server";
import { requireGuestListContractGateOpen } from "@/lib/contracts/contract-gates";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import {
  handleGuestApiError,
  redactGuestForApi,
  requireGuestCreatePermission,
  resolveReadableGuestFilters,
} from "@/lib/guests/guest-api";
import {
  createGuest,
  GuestValidationError,
  listProjectGuests,
  parseGuestListSideFilter,
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
  return {
    eventId: request.nextUrl.searchParams.get("eventId") ?? undefined,
    side: parseGuestListSideFilter(request.nextUrl.searchParams.get("side")),
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
    const filters = await resolveReadableGuestFilters(
      apiContext,
      projectId,
      parseGuestFilters(request),
    );

    const guests = (
      await listProjectGuests(apiContext.supabase, projectId, filters)
    ).map(redactGuestForApi);

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

    await requireGuestCreatePermission(apiContext, projectId, input.guestSide);
    await requireGuestListContractGateOpen(apiContext, projectId);

    const guest = await createGuest(
      apiContext.supabase,
      projectId,
      input,
      apiContext.user.id,
    );

    return NextResponse.json(
      { guest: redactGuestForApi(guest) },
      { status: 201 },
    );
  } catch (error) {
    try {
      return handleGuestApiError(error);
    } catch (projectError) {
      return handleProjectApiError(projectError);
    }
  }
}
