import { NextResponse, type NextRequest } from "next/server";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import {
  createEvent,
  getProjectDetails,
  parseCreateEventPayload,
  ProjectValidationError,
} from "@/lib/projects/project-service";

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
    throw new ProjectValidationError("Request body must be valid JSON.");
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { projectId } = await context.params;
    await requireProjectPermission(apiContext, projectId, "events.read");

    const details = await getProjectDetails(apiContext.supabase, projectId);

    if (!details) {
      return NextResponse.json(
        {
          error: {
            code: "not_found",
            message: "Project was not found.",
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        events: details.events,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return handleProjectApiError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { projectId } = await context.params;
    await requireProjectPermission(apiContext, projectId, "events.create");

    const input = parseCreateEventPayload(await readJson(request));
    const event = await createEvent(
      apiContext.supabase,
      projectId,
      input,
      apiContext.user.id,
    );

    return NextResponse.json(
      {
        event,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return handleProjectApiError(error);
  }
}
