import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/auth-service";
import { serverLogger } from "@/lib/logging";
import { hasGlobalPermission } from "@/lib/projects/project-api";

export const dynamic = "force-dynamic";

function accessControlVisibilityResponse(showAccessControl: boolean) {
  return NextResponse.json(
    {
      showAccessControl,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function GET() {
  const authContext = await getAuthContext();

  if (authContext.status === "not_configured") {
    return accessControlVisibilityResponse(true);
  }

  if (authContext.status !== "authenticated") {
    return accessControlVisibilityResponse(false);
  }

  try {
    return accessControlVisibilityResponse(
      await hasGlobalPermission(
        { supabase: authContext.supabase, user: authContext.user },
        "roles.manage",
      ),
    );
  } catch (error) {
    serverLogger.error("Access-control visibility check failed.", { error });
    return accessControlVisibilityResponse(false);
  }
}
