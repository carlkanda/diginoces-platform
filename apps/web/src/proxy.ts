import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

type MutableHeaderResponse = {
  headers: Headers;
};

const publicGuestPagePattern = /^\/g\/[^/]+\/?$/;

export function applyPublicGuestPageSecurityHeaders(
  response: MutableHeaderResponse,
  pathname: string,
) {
  if (!publicGuestPagePattern.test(pathname)) {
    return response;
  }

  response.headers.set(
    "Cache-Control",
    "private, no-store, max-age=0, must-revalidate",
  );
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  return response;
}

export async function proxy(request: NextRequest) {
  const response = await updateSupabaseSession(request);

  return applyPublicGuestPageSecurityHeaders(
    response,
    request.nextUrl.pathname,
  );
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
