import type { AuthContext } from "@/lib/auth/auth-service";

export type PrimaryAuthNavigationState =
  | {
      showLoginLink: true;
      showSignOut: false;
    }
  | {
      showLoginLink: false;
      showSignOut: true;
    };

export function getPrimaryAuthNavigationState(
  status: AuthContext["status"],
): PrimaryAuthNavigationState {
  if (status === "authenticated") {
    return {
      showLoginLink: false,
      showSignOut: true,
    };
  }

  return {
    showLoginLink: true,
    showSignOut: false,
  };
}

export function getAuthenticatedLoginRedirectPath(normalizedNextPath: string) {
  if (
    !normalizedNextPath.startsWith("/") ||
    normalizedNextPath.startsWith("//")
  ) {
    return "/platform";
  }

  if (
    normalizedNextPath === "/login" ||
    normalizedNextPath.startsWith("/login?") ||
    normalizedNextPath.startsWith("/login/") ||
    normalizedNextPath.startsWith("/auth/")
  ) {
    return "/platform";
  }

  return normalizedNextPath;
}
