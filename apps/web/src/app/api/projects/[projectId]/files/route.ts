import { NextResponse, type NextRequest } from "next/server";
import { InvalidJsonBodyError, readJson } from "@/lib/api/read-json";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
} from "@/lib/projects/project-api";
import {
  requireProjectFileReadPermission,
  requireProjectFileRegisterPermission,
} from "@/lib/files/file-api";
import { listProjectFiles, registerProjectFile } from "@/lib/files/file-db";
import {
  fileCategories,
  FileValidationError,
  type FileCategory,
} from "@/lib/files/file-service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

function normalizeFilter(value: string | null) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function normalizeCategory(value: string | null): FileCategory | null {
  const normalized = normalizeFilter(value);

  if (!normalized) {
    return null;
  }

  if (fileCategories.includes(normalized as FileCategory)) {
    return normalized as FileCategory;
  }

  throw new FileValidationError("File category is invalid.");
}

export async function GET(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { projectId } = await context.params;
    await requireProjectFileReadPermission(apiContext, projectId);

    const searchParams = request.nextUrl.searchParams;
    const files = await listProjectFiles(apiContext.supabase, projectId, {
      activeOnly: searchParams.get("activeOnly") === "true",
      category: normalizeCategory(searchParams.get("category")),
      eventId: normalizeFilter(searchParams.get("eventId")),
      guestId: normalizeFilter(searchParams.get("guestId")),
      latestOnly: searchParams.get("latestOnly") !== "false",
    });

    return NextResponse.json(
      {
        files,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
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
            code: "invalid_file_filter",
            message: error.message,
          },
        },
        { status: 400 },
      );
    }

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
    await requireProjectFileRegisterPermission(apiContext, projectId);

    const body = await readJson(request);
    const file = await registerProjectFile(
      apiContext.supabase,
      projectId,
      body,
      {
        eventId: typeof body.eventId === "string" ? body.eventId : null,
        guestId: typeof body.guestId === "string" ? body.guestId : null,
        invitationId:
          typeof body.invitationId === "string" ? body.invitationId : null,
        metadata: {
          apiRegistered: true,
        },
      },
    );

    return NextResponse.json({ file }, { status: 201 });
  } catch (error) {
    if (error instanceof FileValidationError) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_file",
            message: error.message,
          },
        },
        { status: 400 },
      );
    }

    return handleProjectApiError(error);
  }
}
