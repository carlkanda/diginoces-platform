import { NextResponse, type NextRequest } from "next/server";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
  requireGlobalPermission,
} from "@/lib/projects/project-api";
import {
  createProject,
  listProjects,
  parseCreateProjectPayload,
  ProjectValidationError,
} from "@/lib/projects/project-service";

export const dynamic = "force-dynamic";

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    throw new ProjectValidationError("Request body must be valid JSON.");
  }
}

export async function GET() {
  const context = await getProjectApiContext();

  if (!isProjectApiContext(context)) {
    return context;
  }

  try {
    await requireGlobalPermission(context, "projects.read");

    const projects = await listProjects(context.supabase);

    return NextResponse.json(
      {
        projects,
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

export async function POST(request: NextRequest) {
  const context = await getProjectApiContext();

  if (!isProjectApiContext(context)) {
    return context;
  }

  try {
    await requireGlobalPermission(context, "projects.create");

    const input = parseCreateProjectPayload(await readJson(request));
    const project = await createProject(
      context.supabase,
      input,
      context.user.id,
    );

    return NextResponse.json(
      {
        project,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return handleProjectApiError(error);
  }
}
