import { NextResponse, type NextRequest } from "next/server";
import { InvalidJsonBodyError, readJson } from "@/lib/api/read-json";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
  methodNotAllowed,
} from "@/lib/projects/project-api";
import {
  requireDiginocesAdminFileSoftDeletePermission,
  requireProjectFileArchivePermission,
} from "@/lib/files/file-api";
import { archiveProjectFile, getProjectFileDetails } from "@/lib/files/file-db";
import { FileValidationError } from "@/lib/files/file-service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    fileId: string;
    projectId: string;
  }>;
};

export function GET() {
  return methodNotAllowed("POST");
}

export async function POST(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { fileId, projectId } = await context.params;
    await requireProjectFileArchivePermission(apiContext, projectId);

    const body = await readJson(request);
    const actionValue = body.action;

    if (actionValue !== "archive" && actionValue !== "soft_delete") {
      return NextResponse.json(
        {
          error: {
            code: "invalid_request",
            message: "Archive action must be archive or soft_delete.",
          },
        },
        { status: 400 },
      );
    }

    const action = actionValue;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (action === "soft_delete") {
      await requireDiginocesAdminFileSoftDeletePermission(apiContext);
    }

    if (!reason) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_request",
            message: "A reason is required for archive operations.",
          },
        },
        { status: 400 },
      );
    }

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

    const file = await archiveProjectFile(
      apiContext.supabase,
      fileId,
      action,
      reason,
    );

    return NextResponse.json({ file });
  } catch (error) {
    if (error instanceof InvalidJsonBodyError) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_request",
            message: "Request body must be valid JSON.",
          },
        },
        { status: 400 },
      );
    }

    if (error instanceof FileValidationError) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_file_archive",
            message: error.message,
          },
        },
        { status: 400 },
      );
    }

    return handleProjectApiError(error);
  }
}
