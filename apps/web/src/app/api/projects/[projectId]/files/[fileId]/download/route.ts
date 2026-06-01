import { NextResponse, type NextRequest } from "next/server";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
  ProjectAccessError,
} from "@/lib/projects/project-api";
import { requireProjectFileDownloadPermission } from "@/lib/files/file-api";
import {
  getProjectFileDetails,
  recordFileAccessEvent,
} from "@/lib/files/file-db";
import { serverLogger } from "@/lib/logging";
import { createSupabaseStorageAdapter } from "@/lib/storage/storage-provider";

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
    await requireProjectFileDownloadPermission(apiContext, projectId);

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

    const file = details.file;

    if (
      file.status === "deleted" ||
      file.revoked_at ||
      !file.is_active ||
      !file.is_latest
    ) {
      try {
        await recordFileAccessEvent(apiContext.supabase, file.id, {
          accessAction: "download_denied",
          allowed: false,
          denialReason: "inactive_or_revoked",
        });
      } catch (auditError) {
        serverLogger.error("File deny-event recording failed.", {
          auditError,
          fileId: file.id,
        });
      }

      throw new ProjectAccessError("File is not available for download.", 403);
    }

    const expiresInSeconds = 300;
    const expiresAt = new Date(
      Date.now() + expiresInSeconds * 1000,
    ).toISOString();
    const signedUrl = await createSupabaseStorageAdapter(
      apiContext.supabase,
    ).getSignedReadUrl({
      bucket: file.bucket,
      expiresInSeconds,
      path: file.storage_path,
    });

    try {
      await recordFileAccessEvent(apiContext.supabase, file.id, {
        accessAction: "signed_url_created",
        allowed: true,
        signedUrlExpiresAt: expiresAt,
      });
    } catch (auditError) {
      serverLogger.error("File access-event recording failed.", {
        auditError,
        fileId: file.id,
      });
    }

    return NextResponse.redirect(signedUrl, 307);
  } catch (error) {
    return handleProjectApiError(error);
  }
}
