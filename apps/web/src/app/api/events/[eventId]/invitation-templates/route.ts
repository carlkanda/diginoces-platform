import { NextResponse, type NextRequest } from "next/server";
import { readJson } from "@/lib/api/read-json";
import {
  handleInvitationApiError,
  requireInvitationEventPermission,
} from "@/lib/invitations/invitation-api";
import {
  listEventInvitationTemplates,
  registerInvitationTemplate,
} from "@/lib/invitations/invitation-db";
import { parseTemplateRegistrationPayload } from "@/lib/invitations/invitation-service";
import {
  getProjectApiContext,
  isProjectApiContext,
} from "@/lib/projects/project-api";
import { getEventDetails } from "@/lib/projects/project-service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { eventId } = await context.params;
    await requireInvitationEventPermission(
      apiContext,
      eventId,
      "invitation_templates.read",
    );

    const templates = await listEventInvitationTemplates(
      apiContext.supabase,
      eventId,
    );

    return NextResponse.json(
      { templates },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return handleInvitationApiError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { eventId } = await context.params;
    await requireInvitationEventPermission(
      apiContext,
      eventId,
      "invitation_templates.create",
    );

    const details = await getEventDetails(apiContext.supabase, eventId);

    if (!details) {
      return NextResponse.json(
        { error: { code: "not_found", message: "Event was not found." } },
        { status: 404 },
      );
    }

    const body = await readJson(request);
    const input = parseTemplateRegistrationPayload({ ...body, eventId });
    const template = await registerInvitationTemplate(
      apiContext.supabase,
      details.project.id,
      input,
      apiContext.user.id,
    );

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    return handleInvitationApiError(error);
  }
}
