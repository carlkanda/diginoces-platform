import { NextResponse, type NextRequest } from "next/server";
import {
  getGuestImportDetails,
  parseReviewGuestImportRowsPayload,
  reviewGuestImportRows,
} from "@/lib/guest-imports/guest-import-db";
import {
  handleGuestImportApiError,
  requireGuestImportReviewPermission,
} from "@/lib/guest-imports/guest-import-api";
import { GuestImportValidationError } from "@/lib/guest-imports/guest-import-service";
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

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    throw new GuestImportValidationError("Request body must be valid JSON.");
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { importId, projectId } = await context.params;
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

    await requireGuestImportReviewPermission(apiContext, projectId);

    await reviewGuestImportRows(
      apiContext.supabase,
      importId,
      parseReviewGuestImportRowsPayload(await readJson(request)),
    );

    return NextResponse.json({ status: "reviewed" });
  } catch (error) {
    try {
      return handleGuestImportApiError(error);
    } catch (projectError) {
      return handleProjectApiError(projectError);
    }
  }
}
