import type { AuthError, EmailOtpType, User } from "@supabase/supabase-js";
import { getPublicEnvironment } from "@/lib/env/public-env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthContext =
  | {
      email: string;
      status: "authenticated";
      supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
      user: User;
    }
  | {
      missingSupabaseVariables: string[];
      status: "not_configured";
    }
  | {
      status: "anonymous";
    };

export type MagicLinkResult =
  | {
      status: "sent";
    }
  | {
      message: string;
      status: "failed";
    };

export type ImplicitCallbackPayload = {
  accessToken: string;
  nextPath: string;
  refreshToken: string;
};

const invalidOrExpiredMagicLinkMessage =
  "Authentication link is invalid or expired. Request a fresh magic link.";
const maxImplicitCallbackTokenLength = 8192;

export async function getAuthContext(): Promise<AuthContext> {
  const env = getPublicEnvironment();

  if (!env.supabaseConfigured) {
    return {
      missingSupabaseVariables: env.missingSupabaseVariables,
      status: "not_configured",
    };
  }

  const supabase = await createSupabaseServerClient();
  const claimsResult = await supabase.auth.getClaims();

  if (claimsResult.error || !claimsResult.data?.claims) {
    return {
      status: "anonymous",
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      status: "anonymous",
    };
  }

  return {
    email: user.email ?? "unknown user",
    status: "authenticated",
    supabase,
    user,
  };
}

export async function requestMagicLink(
  email: string,
  nextPath = "/platform",
  options: {
    requestOrigin?: string | null;
  } = {},
): Promise<MagicLinkResult> {
  const trimmedEmail = email.trim().toLowerCase();
  const env = getPublicEnvironment();

  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    return {
      message: "Enter a valid email address.",
      status: "failed",
    };
  }

  if (!env.supabaseConfigured) {
    return {
      message: `Missing Supabase configuration: ${env.missingSupabaseVariables.join(", ")}`,
      status: "failed",
    };
  }

  const supabase = await createSupabaseServerClient();
  const redirectTo = new URL(
    "/auth/callback",
    getAuthRedirectOrigin(options.requestOrigin, env.appUrl),
  );
  redirectTo.searchParams.set("next", normalizeInternalPath(nextPath));

  const { error } = await supabase.auth.signInWithOtp({
    email: trimmedEmail,
    options: {
      emailRedirectTo: redirectTo.toString(),
    },
  });

  if (error) {
    return {
      message: getMagicLinkRequestErrorMessage(error),
      status: "failed",
    };
  }

  return {
    status: "sent",
  };
}

const controlCharacterPattern = /[\u0000-\u001F\u007F]/;
const backslashPattern = /\\/;
const encodedBackslashPattern = /%5c/i;
const encodedControlCharacterPattern = /%(?:0[0-9A-Fa-f]|1[0-9A-Fa-f]|7[Ff])/;
const encodedDotSegmentPattern = /(?:^|\/)(?:\.|%2e)(?:\.|%2e)(?:\/|$)/i;
const pathTraversalSegmentPattern = /(?:^|\/)\.\.(?:\/|$)/;
const maxDecodeIterations = 3;

export function normalizeInternalPath(path: string) {
  const normalized = path.trim();
  let candidate = normalized;

  for (let iteration = 0; iteration < maxDecodeIterations; iteration += 1) {
    const candidatePath = candidate.split(/[?#]/, 1)[0] ?? "";

    if (
      !candidate.startsWith("/") ||
      candidate.startsWith("//") ||
      backslashPattern.test(candidate) ||
      encodedBackslashPattern.test(candidate) ||
      controlCharacterPattern.test(candidate) ||
      encodedControlCharacterPattern.test(candidate) ||
      encodedDotSegmentPattern.test(candidatePath) ||
      pathTraversalSegmentPattern.test(candidatePath)
    ) {
      return "/platform";
    }

    try {
      const decoded = decodeURIComponent(candidate);

      if (decoded === candidate) {
        return normalized;
      }

      candidate = decoded;
    } catch {
      return "/platform";
    }
  }

  return "/platform";
}

export function buildLoginRedirectPath(nextPath: string) {
  return `/login?${new URLSearchParams({
    next: normalizeInternalPath(nextPath),
  }).toString()}`;
}

export function buildLoginErrorRedirectPath(nextPath: string, error: string) {
  return `/login?${new URLSearchParams({
    error,
    next: normalizeInternalPath(nextPath),
  }).toString()}`;
}

export function getAuthCallbackTokenHash(searchParams: URLSearchParams) {
  return searchParams.get("token_hash") ?? searchParams.get("token");
}

const authCallbackOtpTypes = new Set<EmailOtpType>([
  "email",
  "email_change",
  "invite",
  "magiclink",
  "recovery",
  "signup",
]);

export function getAuthCallbackOtpType(searchParams: URLSearchParams) {
  const type = searchParams.get("type");

  if (!type || !authCallbackOtpTypes.has(type as EmailOtpType)) {
    return null;
  }

  if (type === "email") {
    return "magiclink";
  }

  return type as EmailOtpType;
}

export function getAuthRedirectOrigin(
  requestOrigin: string | null | undefined,
  configuredAppUrl: string,
) {
  const configuredOrigin = parseUrlOrigin(configuredAppUrl);
  const currentOrigin = parseUrlOrigin(requestOrigin);

  if (!configuredOrigin) {
    return currentOrigin ?? configuredAppUrl;
  }

  if (!currentOrigin) {
    return configuredOrigin;
  }

  if (currentOrigin === configuredOrigin) {
    return currentOrigin;
  }

  if (areEquivalentLocalOrigins(currentOrigin, configuredOrigin)) {
    return currentOrigin;
  }

  return configuredOrigin;
}

export function getAuthCallbackNextPath(
  searchParams: URLSearchParams,
  allowedOrigins: string[],
) {
  const nextPath = searchParams.get("next");

  if (nextPath) {
    return normalizeInternalPath(nextPath);
  }

  const redirectTo = searchParams.get("redirect_to");

  if (!redirectTo) {
    return "/platform";
  }

  try {
    const redirectUrl = new URL(redirectTo);
    const allowed = new Set(allowedOrigins.filter(Boolean));

    if (!allowed.has(redirectUrl.origin)) {
      return "/platform";
    }

    const nestedNext = redirectUrl.searchParams.get("next");

    if (nestedNext) {
      return normalizeInternalPath(nestedNext);
    }

    if (redirectUrl.pathname === "/auth/callback") {
      return "/platform";
    }

    return normalizeInternalPath(
      `${redirectUrl.pathname}${redirectUrl.search}`,
    );
  } catch {
    return "/platform";
  }
}

export function getInvalidOrExpiredMagicLinkMessage() {
  return invalidOrExpiredMagicLinkMessage;
}

export function buildImplicitAuthCallbackPage(nextPath: string) {
  const normalizedNext = normalizeInternalPath(nextPath);
  const loginErrorPath = buildLoginErrorRedirectPath(
    normalizedNext,
    invalidOrExpiredMagicLinkMessage,
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="referrer" content="no-referrer" />
    <title>Diginoces authentication</title>
  </head>
  <body>
    <p>Completing sign-in...</p>
    <script>
      (function completeImplicitAuthCallback() {
        var nextPath = ${JSON.stringify(normalizedNext)};
        var loginErrorPath = ${JSON.stringify(loginErrorPath)};
        var hash = window.location.hash || "";

        window.history.replaceState(null, "", window.location.pathname + window.location.search);

        var params = new URLSearchParams(hash.slice(1));
        var accessToken = params.get("access_token");
        var refreshToken = params.get("refresh_token");

        if (!accessToken || !refreshToken) {
          window.location.replace(loginErrorPath);
          return;
        }

        fetch("/auth/callback/implicit", {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            accessToken: accessToken,
            next: nextPath,
            refreshToken: refreshToken
          })
        })
          .then(function (response) {
            return response.json().catch(function () {
              return {};
            }).then(function (payload) {
              if (response.ok && typeof payload.next === "string") {
                window.location.replace(payload.next);
                return;
              }

              window.location.replace(loginErrorPath);
            });
          })
          .catch(function () {
            window.location.replace(loginErrorPath);
          });
      })();
    </script>
  </body>
</html>`;
}

export function parseImplicitAuthCallbackPayload(
  payload: unknown,
): ImplicitCallbackPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Authentication callback payload is invalid.");
  }

  const candidate = payload as Record<string, unknown>;
  const accessToken = getBoundedCallbackToken(candidate.accessToken);
  const refreshToken = getBoundedCallbackToken(candidate.refreshToken);

  if (!accessToken || !refreshToken) {
    throw new Error("Authentication callback payload is missing tokens.");
  }

  return {
    accessToken,
    nextPath: normalizeInternalPath(
      typeof candidate.next === "string" ? candidate.next : "/platform",
    ),
    refreshToken,
  };
}

export function getMagicLinkRequestErrorMessage(
  error: Pick<AuthError, "code" | "status">,
) {
  if (error.code === "over_email_send_rate_limit" || error.status === 429) {
    return "Too many magic links requested. Wait a few minutes, then request a fresh link.";
  }

  return "Unable to request a magic link.";
}

function getBoundedCallbackToken(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed.length > maxImplicitCallbackTokenLength) {
    return null;
  }

  return trimmed;
}

function parseUrlOrigin(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function areEquivalentLocalOrigins(origin: string, configuredOrigin: string) {
  const currentUrl = new URL(origin);
  const configuredUrl = new URL(configuredOrigin);

  return (
    isLoopbackHost(currentUrl.hostname) &&
    isLoopbackHost(configuredUrl.hostname)
  );
}

function isLoopbackHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}
