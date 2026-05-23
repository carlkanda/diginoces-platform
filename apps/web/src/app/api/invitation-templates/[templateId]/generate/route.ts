import { NextResponse, type NextRequest } from "next/server";
import { readJson } from "@/lib/api/read-json";
import {
  handleInvitationApiError,
  requireInvitationEventPermission,
} from "@/lib/invitations/invitation-api";
import {
  enqueueInvitationGenerationJob,
  getInvitationTemplateDetails,
} from "@/lib/invitations/invitation-db";
import type { InvitationGenerationMode } from "@/lib/invitations/invitation-service";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
} from "@/lib/projects/project-api";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    templateId: string;
  }>;
};

const generationModes = new Set<InvitationGenerationMode>([
  "event",
  "regenerate_selected",
  "selected_guests",
  "technical_preview",
]);

function parseMode(value: unknown): InvitationGenerationMode {
  if (
    typeof value === "string" &&
    generationModes.has(value as InvitationGenerationMode)
  ) {
    return value as InvitationGenerationMode;
  }

  return "event";
}

function parseGuestIds(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return undefined;
  }

  return value;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { templateId } = await context.params;
    const details = await getInvitationTemplateDetails(
      apiContext.supabase,
      templateId,
    );

    if (!details) {
      return NextResponse.json(
        { error: { code: "not_found", message: "Template was not found." } },
        { status: 404 },
      );
    }

    await requireInvitationEventPermission(
      apiContext,
      details.template.event_id,
      "invitations.generate",
    );

    const body = await readJson(request);
    const generationJob = await enqueueInvitationGenerationJob(
      apiContext.supabase,
      templateId,
      parseMode(body.mode),
      parseGuestIds(body.guestIds),
    );

    return NextResponse.json({ generationJob }, { status: 202 });
  } catch (error) {
    try {
      return handleInvitationApiError(error);
    } catch (projectError) {
      return handleProjectApiError(projectError);
    }
  }
}
