import type { User } from "@supabase/supabase-js";
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
  const redirectTo = new URL("/auth/callback", env.appUrl);
  redirectTo.searchParams.set("next", normalizeInternalPath(nextPath));

  const { error } = await supabase.auth.signInWithOtp({
    email: trimmedEmail,
    options: {
      emailRedirectTo: redirectTo.toString(),
    },
  });

  if (error) {
    return {
      message: "Unable to request a magic link.",
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
