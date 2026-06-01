import { NextResponse } from "next/server";
import { getSprint10CommercialStatus } from "@/lib/contracts/contract-service";
import { getPublicEnvironment } from "@/lib/env/public-env";
import { getSprint4ImportStatus } from "@/lib/guest-imports/guest-import-service";
import { getSprint12GuestWishesStatus } from "@/lib/guest-wishes/guest-wish-service";
import { getSprint3FoundationStatus } from "@/lib/guests/guest-service";
import { getSprint9CheckInStatus } from "@/lib/check-in/check-in-service";
import { getSprint6InvitationStatus } from "@/lib/invitations/invitation-service";
import { getSprint7CommunicationStatus } from "@/lib/messages/message-service";
import { getSprint13PartnerStatus } from "@/lib/partners/partner-service";
import { getPlatformFoundationStatus } from "@/lib/platform/foundation";
import { getSprint2FoundationStatus } from "@/lib/projects/project-foundation";
import { getSprint11ReportingStatus } from "@/lib/reports/report-service";
import { getSprint5RsvpStatus } from "@/lib/rsvp/rsvp-service";
import { getSprint8SeatingStatus } from "@/lib/seating/seating-service";

export const dynamic = "force-dynamic";

export function GET() {
  const foundation = getPlatformFoundationStatus();
  const sprint2Foundation = getSprint2FoundationStatus();
  const sprint3Foundation = getSprint3FoundationStatus();
  const sprint4Foundation = getSprint4ImportStatus();
  const sprint5Foundation = getSprint5RsvpStatus();
  const sprint6Foundation = getSprint6InvitationStatus();
  const sprint7Foundation = getSprint7CommunicationStatus();
  const sprint8Foundation = getSprint8SeatingStatus();
  const sprint9Foundation = getSprint9CheckInStatus();
  const sprint10Foundation = getSprint10CommercialStatus();
  const sprint11Foundation = getSprint11ReportingStatus();
  const sprint12Foundation = getSprint12GuestWishesStatus();
  const sprint13Foundation = getSprint13PartnerStatus();
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
          sprint: sprint3Foundation.sprint,
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
        {
          featureCount: sprint6Foundation.features.length,
          issue: sprint6Foundation.issue,
          moduleCount: sprint6Foundation.modules.length,
          sprint: sprint6Foundation.sprint,
        },
        {
          featureCount: sprint7Foundation.features.length,
          issue: sprint7Foundation.issue,
          moduleCount: sprint7Foundation.modules.length,
          sprint: sprint7Foundation.sprint,
        },
        {
          featureCount: sprint8Foundation.features.length,
          issue: sprint8Foundation.issue,
          moduleCount: sprint8Foundation.modules.length,
          sprint: sprint8Foundation.sprint,
        },
        {
          featureCount: sprint9Foundation.features.length,
          issue: sprint9Foundation.issue,
          moduleCount: sprint9Foundation.modules.length,
          sprint: sprint9Foundation.sprint,
        },
        {
          featureCount: sprint10Foundation.features.length,
          issue: sprint10Foundation.issue,
          moduleCount: sprint10Foundation.modules.length,
          sprint: sprint10Foundation.sprint,
        },
        {
          featureCount: sprint11Foundation.features.length,
          issue: sprint11Foundation.issue,
          moduleCount: sprint11Foundation.modules.length,
          sprint: sprint11Foundation.sprint,
        },
        {
          featureCount: sprint12Foundation.features.length,
          issue: sprint12Foundation.issue,
          moduleCount: sprint12Foundation.modules.length,
          sprint: sprint12Foundation.sprint,
        },
        {
          featureCount: sprint13Foundation.features.length,
          issue: sprint13Foundation.issue,
          moduleCount: sprint13Foundation.modules.length,
          sprint: sprint13Foundation.sprint,
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
