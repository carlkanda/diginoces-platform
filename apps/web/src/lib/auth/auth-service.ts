import type { User } from "@supabase/supabase-js";
import { getPublicEnvironment } from "@/lib/env/public-env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthContext =
  | {
      email: string;
      status: "authenticated";
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

export function normalizeInternalPath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/platform";
  }

  return path;
}
