import { NextResponse, type NextRequest } from "next/server";
import {
  getProjectApiContext,
  isProjectApiContext,
} from "@/lib/projects/project-api";
import {
  handleGuestWishApiError,
  requireAnyGuestBookPagePermission,
  requireGuestBookExportCreatePermission,
} from "@/lib/guest-wishes/guest-wish-api";
import {
  generateGuestBookExport,
  listGuestBookExports,
  listGuestMessagesForPermissions,
} from "@/lib/guest-wishes/guest-wish-db";

export const dynamic = "force-dynamic";

function csvDownloadFilename(filename: string) {
  return filename.replace(/[^\w.-]/g, "_") || "guest-book-messages.csv";
}

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { projectId } = await context.params;
    const permissions = await requireAnyGuestBookPagePermission(
      apiContext,
      projectId,
    );

    const [exports, messages] = await Promise.all([
      listGuestBookExports(apiContext.supabase, projectId),
      listGuestMessagesForPermissions(
        apiContext.supabase,
        projectId,
        permissions,
      ),
    ]);

    return NextResponse.json(
      { exports, messages },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return handleGuestWishApiError(error);
  }
}

export async function POST(_request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { projectId } = await context.params;
    await requireGuestBookExportCreatePermission(apiContext, projectId);

    const result = await generateGuestBookExport(
      apiContext.supabase,
      projectId,
    );

    return new NextResponse(result.csv, {
      headers: {
        "Content-Disposition": `attachment; filename="${csvDownloadFilename(
          result.filename,
        )}"`,
        "Content-Type": "text/csv; charset=utf-8",
        "X-Diginoces-Export-Id": String(result.exportRecord.id ?? ""),
        "X-Diginoces-Row-Count": String(result.rowCount),
      },
      status: 201,
    });
  } catch (error) {
    return handleGuestWishApiError(error);
  }
}
