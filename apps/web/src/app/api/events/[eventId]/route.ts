import { NextResponse, type NextRequest } from "next/server";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
  requireEventPermission,
} from "@/lib/projects/project-api";
import {
  getEventDetails,
  parseUpdateEventPayload,
  ProjectValidationError,
  updateEvent,
} from "@/lib/projects/project-service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    throw new ProjectValidationError("Request body must be valid JSON.");
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { eventId } = await context.params;
    await requireEventPermission(apiContext, eventId, "events.read");

    const details = await getEventDetails(apiContext.supabase, eventId);

    if (!details) {
      return NextResponse.json(
        {
          error: {
            code: "not_found",
            message: "Event was not found.",
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json(details, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleProjectApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { eventId } = await context.params;
    await requireEventPermission(apiContext, eventId, "events.update");

    const input = parseUpdateEventPayload(await readJson(request));
    const event = await updateEvent(
      apiContext.supabase,
      eventId,
      input,
      apiContext.user.id,
    );

    return NextResponse.json({
      event,
    });
  } catch (error) {
    return handleProjectApiError(error);
  }
}
