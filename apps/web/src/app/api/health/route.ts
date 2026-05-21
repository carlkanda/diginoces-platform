import { NextResponse } from "next/server";
import { getPublicEnvironment } from "@/lib/env/public-env";
import { getPlatformFoundationStatus } from "@/lib/platform/foundation";

export const dynamic = "force-dynamic";

export function GET() {
  const foundation = getPlatformFoundationStatus();
  const env = getPublicEnvironment();

  return NextResponse.json(
    {
      status: "ok",
      sprint: foundation.sprint,
      issue: 1,
      requirements: foundation.requirementIds,
      modules: foundation.modules.map((module) => module.name),
      supabaseConfigured: env.supabaseConfigured,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
