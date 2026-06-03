import { NextResponse, type NextRequest } from "next/server";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
} from "@/lib/projects/project-api";
import { requireProjectFileReadPermission } from "@/lib/files/file-api";
import { getProjectFileDetails } from "@/lib/files/file-db";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    fileId: string;
    projectId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { fileId, projectId } = await context.params;
    await requireProjectFileReadPermission(apiContext, projectId);

    const details = await getProjectFileDetails(apiContext.supabase, fileId);

    if (!details || details.file.project_id !== projectId) {
      return NextResponse.json(
        {
          error: {
            code: "not_found",
            message: "File was not found.",
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
