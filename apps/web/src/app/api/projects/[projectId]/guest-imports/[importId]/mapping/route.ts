import { NextResponse, type NextRequest } from "next/server";
import {
  getGuestImportDetails,
  parseImportMappingPayload,
  validateGuestImportMapping,
} from "@/lib/guest-imports/guest-import-db";
import {
  handleGuestImportApiError,
  requireGuestImportSidePermission,
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
      throw new GuestImportValidationError(
        "Guest import session was not found.",
      );
    }

    await requireGuestImportSidePermission(
      apiContext,
      projectId,
      details.session.import_side,
      "guest_imports.create",
    );

    const preview = await validateGuestImportMapping(
      apiContext.supabase,
      projectId,
      importId,
      parseImportMappingPayload(await readJson(request)),
    );

    return NextResponse.json({ preview });
  } catch (error) {
    try {
      return handleGuestImportApiError(error);
    } catch (projectError) {
      return handleProjectApiError(projectError);
    }
  }
}
