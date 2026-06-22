import type { AuthError, EmailOtpType, User } from "@supabase/supabase-js";
import { cache } from "react";
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
      code: LoginAuthErrorCode;
      message: string;
      status: "failed";
    };

export type EmailOtpVerificationResult =
  | {
      requiresMfa: boolean;
      status: "authenticated";
    }
  | {
      code: LoginAuthErrorCode;
      message: string;
      status: "failed";
    };

export type MfaAssuranceResult =
  | {
      currentLevel: string | null;
      nextLevel: string | null;
      requiresMfa: boolean;
      status: "ready";
    }
  | {
      message: string;
      status: "failed";
    };

export type MfaVerificationResult =
  | {
      status: "verified";
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
const invalidOrExpiredEmailCodeMessage =
  "Authentication code is invalid or expired. Request a fresh email.";
const invalidMfaCodeMessage =
  "MFA code is invalid or expired. Enter the current 6-digit authenticator code.";
const maxImplicitCallbackTokenLength = 8192;
const emailOtpTokenPattern = /^[0-9]{6}$/;
const mfaCodePattern = /^[0-9]{6}$/;

export const LOGIN_AUTH_ERROR_CODES = {
  AUTH_CODE_INVALID: "AUTH_CODE_INVALID",
  AUTH_EMAIL_CODE_REQUIRED: "AUTH_EMAIL_CODE_REQUIRED",
  AUTH_EMAIL_INVALID: "AUTH_EMAIL_INVALID",
  AUTH_GENERIC_ERROR: "AUTH_GENERIC_ERROR",
  AUTH_LINK_INVALID: "AUTH_LINK_INVALID",
  AUTH_MAGIC_LINK_RATE_LIMITED: "AUTH_MAGIC_LINK_RATE_LIMITED",
  AUTH_MAGIC_LINK_REQUEST_FAILED: "AUTH_MAGIC_LINK_REQUEST_FAILED",
  AUTH_WORKSPACE_NOT_CONFIGURED: "AUTH_WORKSPACE_NOT_CONFIGURED",
} as const;

export type LoginAuthErrorCode =
  (typeof LOGIN_AUTH_ERROR_CODES)[keyof typeof LOGIN_AUTH_ERROR_CODES];

const loginAuthErrorMessages: Record<LoginAuthErrorCode, string> = {
  AUTH_CODE_INVALID: invalidOrExpiredEmailCodeMessage,
  AUTH_EMAIL_CODE_REQUIRED: "Enter the 6-digit code from the email.",
  AUTH_EMAIL_INVALID: "Enter a valid email address.",
  AUTH_GENERIC_ERROR: "Unable to complete sign-in. Try again.",
  AUTH_LINK_INVALID: invalidOrExpiredMagicLinkMessage,
  AUTH_MAGIC_LINK_RATE_LIMITED:
    "Too many magic links requested. Wait a few minutes, then request a fresh link.",
  AUTH_MAGIC_LINK_REQUEST_FAILED: "Unable to request a magic link.",
  AUTH_WORKSPACE_NOT_CONFIGURED: "Missing Supabase configuration.",
};

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

type MfaFactorCandidate = {
  factor_type?: string | null;
  factorType?: string | null;
  id?: string | null;
  status?: string | null;
};

export const getAuthContext = cache(
  async function getAuthContext(): Promise<AuthContext> {
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
  },
);

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
    return buildLoginAuthFailure("AUTH_EMAIL_INVALID");
  }

  if (!env.supabaseConfigured) {
    return buildLoginAuthFailure(
      "AUTH_WORKSPACE_NOT_CONFIGURED",
      `Missing Supabase configuration: ${env.missingSupabaseVariables.join(", ")}`,
    );
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
    const code = getMagicLinkRequestErrorCode(error);

    return buildLoginAuthFailure(code, getMagicLinkRequestErrorMessage(error));
  }

  return {
    status: "sent",
  };
}

export async function verifyEmailOtp(
  email: string,
  token: string,
): Promise<EmailOtpVerificationResult> {
  const trimmedEmail = email.trim().toLowerCase();
  const normalizedToken = normalizeEmailOtpToken(token);
  const env = getPublicEnvironment();

  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    return buildLoginAuthFailure("AUTH_EMAIL_INVALID");
  }

  if (!normalizedToken) {
    return buildLoginAuthFailure("AUTH_EMAIL_CODE_REQUIRED");
  }

  if (!env.supabaseConfigured) {
    return buildLoginAuthFailure(
      "AUTH_WORKSPACE_NOT_CONFIGURED",
      `Missing Supabase configuration: ${env.missingSupabaseVariables.join(", ")}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email: trimmedEmail,
    token: normalizedToken,
    type: "email",
  });

  if (error) {
    return buildLoginAuthFailure(getInvalidOrExpiredEmailCodeErrorCode());
  }

  const assurance = await getMfaAssuranceLevelForClient(supabase);

  return {
    requiresMfa: assurance.status === "ready" && assurance.requiresMfa,
    status: "authenticated",
  };
}

export async function getMfaAssuranceLevelForClient(
  supabase: SupabaseServerClient,
): Promise<MfaAssuranceResult> {
  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error) {
    return {
      message: "Unable to inspect MFA status.",
      status: "failed",
    };
  }

  const currentLevel = data.currentLevel ?? null;
  const nextLevel = data.nextLevel ?? null;

  return {
    currentLevel,
    nextLevel,
    requiresMfa: currentLevel === "aal1" && nextLevel === "aal2",
    status: "ready",
  };
}

export async function getCurrentMfaAssuranceLevel() {
  const env = getPublicEnvironment();

  if (!env.supabaseConfigured) {
    return {
      message: `Missing Supabase configuration: ${env.missingSupabaseVariables.join(", ")}`,
      status: "failed" as const,
    };
  }

  return getMfaAssuranceLevelForClient(await createSupabaseServerClient());
}

export async function buildMfaStepUpRedirectPathForClient(
  supabase: SupabaseServerClient,
  nextPath: string,
): Promise<string | null> {
  const assurance = await getMfaAssuranceLevelForClient(supabase);

  if (assurance.status === "ready" && assurance.requiresMfa) {
    return buildMfaRedirectPath(nextPath);
  }

  return null;
}

export async function verifyMfaCode(
  code: string,
): Promise<MfaVerificationResult> {
  const normalizedCode = normalizeMfaCode(code);
  const env = getPublicEnvironment();

  if (!normalizedCode) {
    return {
      message: "Enter the 6-digit authenticator code.",
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
  const { data: factors, error: factorsError } =
    await supabase.auth.mfa.listFactors();

  if (factorsError) {
    return {
      message: "Unable to list verified MFA factors.",
      status: "failed",
    };
  }

  const factor = selectVerifiedTotpFactor(factors);

  if (!factor) {
    return {
      message: "No verified TOTP factor is available for this account.",
      status: "failed",
    };
  }

  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({
      factorId: factor.id,
    });

  if (challengeError) {
    return {
      message: "Unable to start MFA verification.",
      status: "failed",
    };
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    challengeId: challenge.id,
    code: normalizedCode,
    factorId: factor.id,
  });

  if (verifyError) {
    return {
      message: invalidMfaCodeMessage,
      status: "failed",
    };
  }

  return {
    status: "verified",
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

export function buildMfaRedirectPath(nextPath: string, error?: string) {
  const params = new URLSearchParams({
    next: normalizeInternalPath(nextPath),
  });

  if (error) {
    params.set("error", error);
  }

  return `/login/mfa?${params.toString()}`;
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

  return type as EmailOtpType;
}

export function getAuthCallbackOtpTypeCandidates(
  searchParams: URLSearchParams,
) {
  const type = getAuthCallbackOtpType(searchParams);

  if (!type) {
    return [];
  }

  if (type === "email") {
    return ["email", "magiclink"] satisfies EmailOtpType[];
  }

  if (type === "magiclink") {
    return ["magiclink", "email"] satisfies EmailOtpType[];
  }

  return [type];
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

export function getInvalidOrExpiredMagicLinkErrorCode(): LoginAuthErrorCode {
  return "AUTH_LINK_INVALID";
}

export function getInvalidOrExpiredEmailCodeErrorCode(): LoginAuthErrorCode {
  return "AUTH_CODE_INVALID";
}

export function normalizeEmailOtpToken(token: string) {
  const normalized = token.replace(/\s+/g, "");

  if (!emailOtpTokenPattern.test(normalized)) {
    return null;
  }

  return normalized;
}

export function normalizeMfaCode(code: string) {
  const normalized = code.replace(/\s+/g, "");

  if (!mfaCodePattern.test(normalized)) {
    return null;
  }

  return normalized;
}

export function selectVerifiedTotpFactor(
  factors: {
    all?: MfaFactorCandidate[];
    totp?: MfaFactorCandidate[];
  } | null,
) {
  const totpFactor = (factors?.totp ?? []).find(
    (factor) => factor.id && factor.status === "verified",
  );

  if (totpFactor?.id) {
    return {
      id: totpFactor.id,
    };
  }

  const fallbackFactor = (factors?.all ?? []).find((factor) => {
    const factorType = factor.factor_type ?? factor.factorType;

    return factor.id && factor.status === "verified" && factorType === "totp";
  });

  if (!fallbackFactor?.id) {
    return null;
  }

  return {
    id: fallbackFactor.id,
  };
}

export function buildImplicitAuthCallbackPage(nextPath: string) {
  const normalizedNext = normalizeInternalPath(nextPath);
  const loginErrorPath = buildLoginErrorRedirectPath(
    normalizedNext,
    getInvalidOrExpiredMagicLinkErrorCode(),
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
  return loginAuthErrorMessages[getMagicLinkRequestErrorCode(error)];
}

export function getMagicLinkRequestErrorCode(
  error: Pick<AuthError, "code" | "status">,
): LoginAuthErrorCode {
  if (error.code === "over_email_send_rate_limit" || error.status === 429) {
    return "AUTH_MAGIC_LINK_RATE_LIMITED";
  }

  return "AUTH_MAGIC_LINK_REQUEST_FAILED";
}

function buildLoginAuthFailure(
  code: LoginAuthErrorCode,
  message = loginAuthErrorMessages[code],
) {
  return {
    code,
    message,
    status: "failed" as const,
  };
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
