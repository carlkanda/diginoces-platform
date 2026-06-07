import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveGuestFileDownload } from "@/lib/files/file-db";
import { serverLogger } from "@/lib/logging";
import { jsonError } from "@/lib/projects/project-api";
import { createSupabaseServerStorageAdapter } from "@/lib/storage/storage-provider";
import { isUuid } from "@/lib/validation/uuid";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    fileId: string;
    guestToken: string;
  }>;
};

function stringField(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { fileId, guestToken } = await context.params;

  if (!isUuid(fileId)) {
    return jsonError(404, "file_not_found", "Guest file is not available.");
  }

  let result: Awaited<ReturnType<typeof resolveGuestFileDownload>>;

  try {
    const supabase = await createSupabaseServerClient();
    result = await resolveGuestFileDownload(supabase, guestToken, fileId);
  } catch (error) {
    serverLogger.error("Guest file download resolution failed.", {
      error,
      fileId,
    });
    return jsonError(500, "server_error", "Guest file is not available.");
  }

  if (result.status !== "ok") {
    return jsonError(
      result.status === "payment_gate_locked" ? 402 : 404,
      String(result.status),
      "Guest file is not available.",
    );
  }

  const bucket = stringField(result, "bucket");
  const filename = stringField(result, "filename");
  const path = stringField(result, "storagePath");
  const expiresInSeconds =
    typeof result.expiresInSeconds === "number" ? result.expiresInSeconds : 300;

  if (!bucket || !path) {
    return jsonError(500, "invalid_file", "Guest file metadata is incomplete.");
  }

  let signedUrl: string;

  try {
    signedUrl = await createSupabaseServerStorageAdapter().getSignedReadUrl({
      bucket,
      expiresInSeconds,
      path,
    });
  } catch (error) {
    serverLogger.error("Guest file signed URL generation failed.", {
      error,
      fileId,
    });
    return jsonError(
      500,
      "storage_error",
      "Guest file download link could not be generated.",
    );
  }

  const downloadUrl = new URL(signedUrl);
  downloadUrl.searchParams.set(
    "download",
    filename || path.split("/").at(-1) || "download",
  );

  return NextResponse.redirect(downloadUrl.toString(), 307);
}
