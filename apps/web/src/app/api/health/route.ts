import { NextResponse } from "next/server";
import { getPublicEnvironment } from "@/lib/env/public-env";
import { getPlatformFoundationStatus } from "@/lib/platform/foundation";
import { getSprint2FoundationStatus } from "@/lib/projects/project-foundation";

export const dynamic = "force-dynamic";

export function GET() {
  const foundation = getPlatformFoundationStatus();
  const sprint2Foundation = getSprint2FoundationStatus();
  const env = getPublicEnvironment();

  return NextResponse.json(
    {
      status: "ok",
      sprints: [
        {
          issue: 1,
          modules: foundation.modules.map((module) => module.name),
          requirements: foundation.requirementIds,
          sprint: foundation.sprint,
        },
        {
          features: sprint2Foundation.features,
          issue: sprint2Foundation.issue,
          modules: sprint2Foundation.modules.map((module) => module.name),
          sprint: sprint2Foundation.sprint,
        },
      ],
      supabaseConfigured: env.supabaseConfigured,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
