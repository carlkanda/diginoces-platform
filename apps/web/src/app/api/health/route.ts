import { NextResponse } from "next/server";
import { getPublicEnvironment } from "@/lib/env/public-env";
import { getSprint4ImportStatus } from "@/lib/guest-imports/guest-import-service";
import { getSprint3FoundationStatus } from "@/lib/guests/guest-service";
import { getPlatformFoundationStatus } from "@/lib/platform/foundation";
import { getSprint2FoundationStatus } from "@/lib/projects/project-foundation";
import { getSprint5RsvpStatus } from "@/lib/rsvp/rsvp-service";

export const dynamic = "force-dynamic";

export function GET() {
  const foundation = getPlatformFoundationStatus();
  const sprint2Foundation = getSprint2FoundationStatus();
  const sprint3Foundation = getSprint3FoundationStatus();
  const sprint4Foundation = getSprint4ImportStatus();
  const sprint5Foundation = getSprint5RsvpStatus();
  const env = getPublicEnvironment();

  return NextResponse.json(
    {
      status: "ok",
      sprints: [
        {
          issue: 1,
          moduleCount: foundation.modules.length,
          requirementCount: foundation.requirementIds.length,
          sprint: foundation.sprint,
        },
        {
          featureCount: sprint2Foundation.features.length,
          issue: sprint2Foundation.issue,
          moduleCount: sprint2Foundation.modules.length,
          sprint: sprint2Foundation.sprint,
        },
        {
          featureCount: sprint3Foundation.features.length,
          issue: sprint3Foundation.issue,
          moduleCount: sprint3Foundation.modules.length,
          sprint: "Sprint 3 — Guest Management & Guest Lists Foundation",
        },
        {
          featureCount: sprint4Foundation.features.length,
          issue: sprint4Foundation.issue,
          moduleCount: sprint4Foundation.modules.length,
          sprint: sprint4Foundation.sprint,
        },
        {
          featureCount: sprint5Foundation.features.length,
          issue: sprint5Foundation.issue,
          moduleCount: sprint5Foundation.modules.length,
          sprint: sprint5Foundation.sprint,
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
