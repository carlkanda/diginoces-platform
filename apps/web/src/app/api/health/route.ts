import { NextResponse } from "next/server";
import { getPublicEnvironment } from "@/lib/env/public-env";
import { getSprint3FoundationStatus } from "@/lib/guests/guest-service";
import { getPlatformFoundationStatus } from "@/lib/platform/foundation";
import { getSprint2FoundationStatus } from "@/lib/projects/project-foundation";

export const dynamic = "force-dynamic";

export function GET() {
  const foundation = getPlatformFoundationStatus();
  const sprint2Foundation = getSprint2FoundationStatus();
  const sprint3Foundation = getSprint3FoundationStatus();
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
        {
          epic: sprint3Foundation.epic,
          features: sprint3Foundation.features,
          issue: sprint3Foundation.issue,
          modules: sprint3Foundation.modules.map((module) => module.name),
          sprint: "Sprint 3 — Guest Management & Guest Lists Foundation",
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
