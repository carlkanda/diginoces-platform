import { NextResponse, type NextRequest } from "next/server";
import { getGuestImportDetails } from "@/lib/guest-imports/guest-import-db";
import {
  handleGuestImportApiError,
  requireGuestImportReadPermission,
} from "@/lib/guest-imports/guest-import-api";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
} from "@/lib/projects/project-api";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    importId: string;
    projectId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { importId, projectId } = await context.params;
    await requireGuestImportReadPermission(apiContext, projectId);

    const details = await getGuestImportDetails(
      apiContext.supabase,
      projectId,
      importId,
    );

    if (!details) {
      return NextResponse.json(
        {
          error: {
            code: "not_found",
            message: "Guest import session was not found.",
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { import: details },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    try {
      return handleGuestImportApiError(error);
    } catch (projectError) {
      return handleProjectApiError(projectError);
    }
  }
}
