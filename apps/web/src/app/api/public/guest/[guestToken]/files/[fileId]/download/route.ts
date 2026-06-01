import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  recordFileAccessEvent,
  resolveGuestFileDownload,
} from "@/lib/files/file-db";
import { serverLogger } from "@/lib/logging";
import { createSupabaseStorageAdapter } from "@/lib/storage/storage-provider";

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
  const supabase = await createSupabaseServerClient();
  const result = await resolveGuestFileDownload(supabase, guestToken, fileId);

  if (result.status !== "ok") {
    return NextResponse.json(
      {
        error: {
          code: String(result.status),
          message: "Guest file is not available.",
        },
      },
      { status: result.status === "payment_gate_locked" ? 402 : 404 },
    );
  }

  const bucket = stringField(result, "bucket");
  const filename = stringField(result, "filename");
  const path = stringField(result, "storagePath");
  const expiresInSeconds =
    typeof result.expiresInSeconds === "number" ? result.expiresInSeconds : 300;

  if (!bucket || !path) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_file",
          message: "Guest file metadata is incomplete.",
        },
      },
      { status: 500 },
    );
  }

  let signedUrl: string;

  try {
    signedUrl = await createSupabaseStorageAdapter(supabase).getSignedReadUrl({
      bucket,
      expiresInSeconds,
      path,
    });
  } catch (error) {
    await recordGuestDownloadEvent(supabase, fileId, {
      accessAction: "download_denied",
      allowed: false,
      denialReason: "signed_url_failed",
    });
    serverLogger.error("Guest file signed URL generation failed.", {
      error,
      fileId,
    });
    return NextResponse.json(
      {
        error: {
          code: "storage_error",
          message: "Guest file download link could not be generated.",
        },
      },
      { status: 502 },
    );
  }

  await recordGuestDownloadEvent(supabase, fileId, {
    accessAction: "guest_signed_url_created",
    allowed: true,
    signedUrlExpiresAt: new Date(
      Date.now() + expiresInSeconds * 1000,
    ).toISOString(),
  });

  const downloadUrl = new URL(signedUrl);
  downloadUrl.searchParams.set(
    "download",
    filename || path.split("/").at(-1) || "download",
  );

  return NextResponse.redirect(downloadUrl.toString(), 307);
}

async function recordGuestDownloadEvent(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  fileId: string,
  input: Parameters<typeof recordFileAccessEvent>[2],
) {
  try {
    await recordFileAccessEvent(supabase, fileId, {
      ...input,
      metadata: {
        accessContext: "public_guest_page",
      },
    });
  } catch (error) {
    serverLogger.error("Guest file access-event recording failed.", {
      error,
      fileId,
    });
  }
}
