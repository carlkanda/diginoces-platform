import { NextResponse } from "next/server";
import {
  getInvalidOrExpiredMagicLinkMessage,
  parseImplicitAuthCallbackPayload,
} from "@/lib/auth/auth-service";
import { getPublicEnvironment } from "@/lib/env/public-env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
const maxCallbackPayloadBytes = 24 * 1024;

export async function POST(request: Request) {
  const env = getPublicEnvironment();

  if (!env.supabaseConfigured) {
    return jsonError(503, "Supabase is not configured.");
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.includes("application/json")) {
    return jsonError(415, "Authentication callback payload must be JSON.");
  }

  const rawBody = await request.text();

  if (new TextEncoder().encode(rawBody).byteLength > maxCallbackPayloadBytes) {
    return jsonError(413, "Authentication callback payload is too large.");
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonError(400, "Authentication callback payload is invalid.");
  }

  let callbackPayload: ReturnType<typeof parseImplicitAuthCallbackPayload>;

  try {
    callbackPayload = parseImplicitAuthCallbackPayload(payload);
  } catch (error) {
    return jsonError(
      400,
      error instanceof Error
        ? error.message
        : "Authentication callback payload is invalid.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: callbackPayload.accessToken,
    refresh_token: callbackPayload.refreshToken,
  });

  if (sessionError) {
    return jsonError(401, getInvalidOrExpiredMagicLinkMessage());
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonError(401, getInvalidOrExpiredMagicLinkMessage());
  }

  return NextResponse.json(
    {
      next: callbackPayload.nextPath,
    },
    {
      headers: noStoreHeaders,
    },
  );
}

function jsonError(status: number, message: string) {
  return NextResponse.json(
    {
      error: {
        message,
      },
    },
    {
      headers: noStoreHeaders,
      status,
    },
  );
}
