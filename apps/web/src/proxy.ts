import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

type MutableHeaderResponse = {
  headers: Headers;
};

const publicGuestPagePattern = /^\/g\/[^/]+\/?$/;

export function applyResponseSecurityHeaders(
  response: MutableHeaderResponse,
  pathname: string,
) {
  const pathOnly = pathname.split(/[?#]/, 1)[0] ?? "";

  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
  // Deny framing for legacy browsers that do not enforce CSP frame-ancestors.
  response.headers.set("X-Frame-Options", "DENY");

  if (!publicGuestPagePattern.test(pathOnly)) {
    return response;
  }

  response.headers.set(
    "Cache-Control",
    "private, no-store, max-age=0, must-revalidate",
  );
  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  return response;
}

export async function proxy(request: NextRequest) {
  const response = await updateSupabaseSession(request);

  return applyResponseSecurityHeaders(response, request.nextUrl.pathname);
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
