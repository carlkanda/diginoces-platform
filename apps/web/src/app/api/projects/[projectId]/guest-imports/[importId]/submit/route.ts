import { NextResponse, type NextRequest } from "next/server";
import {
  getGuestImportDetails,
  submitGuestImportSession,
} from "@/lib/guest-imports/guest-import-db";
import {
  handleGuestImportApiError,
  requireGuestImportProjectPermission,
  requireGuestImportSidePermission,
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

export async function POST(_request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { importId, projectId } = await context.params;
    await requireGuestImportProjectPermission(
      apiContext,
      projectId,
      "guest_imports.submit",
    );

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

    await requireGuestImportSidePermission(
      apiContext,
      projectId,
      details.session.import_side,
      "guest_imports.submit",
    );

    await submitGuestImportSession(apiContext.supabase, importId);

    return NextResponse.json({ status: "ready_for_review" });
  } catch (error) {
    try {
      return handleGuestImportApiError(error);
    } catch (projectError) {
      return handleProjectApiError(projectError);
    }
  }
}
