import { NextResponse } from "next/server";
import {
  buildImplicitAuthCallbackPage,
  getAuthCallbackNextPath,
  getAuthCallbackOtpTypeCandidates,
  getAuthCallbackTokenHash,
  buildLoginErrorRedirectPath,
  buildMfaRedirectPath,
  getMfaAssuranceLevelForClient,
  getInvalidOrExpiredMagicLinkErrorCode,
  LOGIN_AUTH_ERROR_CODES,
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
  const typeCandidates = getAuthCallbackOtpTypeCandidates(
    requestUrl.searchParams,
  );
  const type = typeCandidates[0] ?? null;
  const code = requestUrl.searchParams.get("code");

  if (!env.supabaseConfigured) {
    return NextResponse.redirect(
      new URL(
        buildLoginErrorRedirectPath(
          next,
          LOGIN_AUTH_ERROR_CODES.AUTH_WORKSPACE_NOT_CONFIGURED,
        ),
        requestUrl,
      ),
    );
  }

  const supabase = await createSupabaseServerClient();

  if (tokenHash && typeCandidates.length > 0) {
    for (const candidateType of typeCandidates) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: candidateType,
      });

      if (!error) {
        return NextResponse.redirect(
          new URL(await getPostAuthRedirectPath(supabase, next), requestUrl),
        );
      }
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(
        new URL(await getPostAuthRedirectPath(supabase, next), requestUrl),
      );
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
      buildLoginErrorRedirectPath(
        next,
        getInvalidOrExpiredMagicLinkErrorCode(),
      ),
      requestUrl,
    ),
  );
}

async function getPostAuthRedirectPath(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  next: string,
) {
  const assurance = await getMfaAssuranceLevelForClient(supabase);

  if (assurance.status === "ready" && assurance.requiresMfa) {
    return buildMfaRedirectPath(next);
  }

  return next;
}
