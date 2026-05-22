import { NextResponse, type NextRequest } from "next/server";
import {
  createGuestImportSession,
  listGuestImportSessions,
  parseStartGuestImportPayload,
} from "@/lib/guest-imports/guest-import-db";
import {
  handleGuestImportApiError,
  requireGuestImportReadPermission,
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

export async function GET(_request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { projectId } = await context.params;
    await requireGuestImportReadPermission(apiContext, projectId);

    const sessions = await listGuestImportSessions(
      apiContext.supabase,
      projectId,
    );

    return NextResponse.json(
      { sessions },
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

export async function POST(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { projectId } = await context.params;
    const input = parseStartGuestImportPayload(await readJson(request));

    await requireGuestImportSidePermission(
      apiContext,
      projectId,
      input.importSide,
      "guest_imports.create",
    );

    const session = await createGuestImportSession(
      apiContext.supabase,
      projectId,
      input,
    );

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    try {
      return handleGuestImportApiError(error);
    } catch (projectError) {
      return handleProjectApiError(projectError);
    }
  }
}
