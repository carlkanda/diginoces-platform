import { NextResponse, type NextRequest } from "next/server";
import { requireGuestListContractGateOpen } from "@/lib/contracts/contract-gates";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
  jsonError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import {
  handleGuestApiError,
  requireGuestDeactivationPermission,
  requireGuestSidePermission,
} from "@/lib/guests/guest-api";
import {
  getGuestDetails,
  guestUpdateRequiresDeactivationPermission,
  GuestValidationError,
  parseUpdateGuestPayload,
  updateGuest,
} from "@/lib/guests/guest-service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    guestId: string;
  }>;
};

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    throw new GuestValidationError("Request body must be valid JSON.");
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { guestId } = await context.params;
    const details = await getGuestDetails(apiContext.supabase, guestId);

    if (!details) {
      return jsonError(404, "guest_not_found", "Guest was not found.");
    }

    await requireProjectPermission(
      apiContext,
      details.guest.project_id,
      "guests.read",
    );

    return NextResponse.json(details, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    try {
      return handleGuestApiError(error);
    } catch (projectError) {
      return handleProjectApiError(projectError);
    }
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { guestId } = await context.params;
    const details = await getGuestDetails(apiContext.supabase, guestId);

    if (!details) {
      return jsonError(404, "guest_not_found", "Guest was not found.");
    }

    await requireGuestSidePermission(
      apiContext,
      details.guest.project_id,
      details.guest.guest_side,
    );
    await requireGuestListContractGateOpen(
      apiContext,
      details.guest.project_id,
    );

    const input = parseUpdateGuestPayload(await readJson(request));

    if (input.guestSide && input.guestSide !== details.guest.guest_side) {
      await requireGuestSidePermission(
        apiContext,
        details.guest.project_id,
        input.guestSide,
      );
    }

    if (guestUpdateRequiresDeactivationPermission(details.guest, input)) {
      await requireGuestDeactivationPermission(
        apiContext,
        details.guest.project_id,
      );
    }

    const guest = await updateGuest(
      apiContext.supabase,
      guestId,
      input,
      apiContext.user.id,
    );

    return NextResponse.json({ guest });
  } catch (error) {
    try {
      return handleGuestApiError(error);
    } catch (projectError) {
      return handleProjectApiError(projectError);
    }
  }
}
