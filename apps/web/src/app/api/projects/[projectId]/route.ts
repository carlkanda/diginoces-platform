import { NextResponse, type NextRequest } from "next/server";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import {
  getProjectDetails,
  parseUpdateProjectPayload,
  ProjectValidationError,
  updateProject,
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
    await requireProjectPermission(apiContext, projectId, "projects.read");

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
    const { projectId } = await context.params;
    await requireProjectPermission(apiContext, projectId, "projects.update");

    const input = parseUpdateProjectPayload(await readJson(request));
    const project = await updateProject(
      apiContext.supabase,
      projectId,
      input,
      apiContext.user.id,
    );

    return NextResponse.json({
      project,
    });
  } catch (error) {
    return handleProjectApiError(error);
  }
}
