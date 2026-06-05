import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  buildImplicitAuthCallbackPage,
  getAuthCallbackNextPath,
  getAuthCallbackTokenHash,
  buildLoginErrorRedirectPath,
  getInvalidOrExpiredMagicLinkMessage,
} from "@/lib/auth/auth-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicEnvironment } from "@/lib/env/public-env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const env = getPublicEnvironment();
  const next = getAuthCallbackNextPath(requestUrl.searchParams, [
    requestUrl.origin,
    env.appUrl,
  ]);
  const tokenHash = getAuthCallbackTokenHash(requestUrl.searchParams);
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const code = requestUrl.searchParams.get("code");

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

  if (!tokenHash && !type && !code) {
    return new NextResponse(buildImplicitAuthCallbackPage(next), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Security-Policy":
          "default-src 'none'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
        "Content-Type": "text/html; charset=utf-8",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return NextResponse.redirect(
    new URL(
      buildLoginErrorRedirectPath(next, getInvalidOrExpiredMagicLinkMessage()),
      requestUrl,
    ),
  );
}
