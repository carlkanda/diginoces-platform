import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  buildLoginErrorRedirectPath,
  normalizeInternalPath,
} from "@/lib/auth/auth-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicEnvironment } from "@/lib/env/public-env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = normalizeInternalPath(
    requestUrl.searchParams.get("next") ?? "/platform",
  );
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const code = requestUrl.searchParams.get("code");
  const env = getPublicEnvironment();

  if (!env.supabaseConfigured) {
    return NextResponse.redirect(
      new URL("/login?error=Supabase%20is%20not%20configured", requestUrl),
    );
  }

  const supabase = await createSupabaseServerClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl));
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl));
    }
  }

  return NextResponse.redirect(
    new URL(
      buildLoginErrorRedirectPath(
        next,
        "Authentication link is invalid or expired. Request a fresh magic link.",
      ),
      requestUrl,
    ),
  );
}
