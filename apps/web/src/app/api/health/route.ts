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
        {
          epic: sprint4Foundation.epic,
          features: sprint4Foundation.features,
          issue: sprint4Foundation.issue,
          modules: sprint4Foundation.modules.map((module) => module.name),
          sprint: sprint4Foundation.sprint,
        },
        {
          epic: sprint5Foundation.epic,
          features: sprint5Foundation.features,
          issue: sprint5Foundation.issue,
          modules: sprint5Foundation.modules.map((module) => module.name),
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
