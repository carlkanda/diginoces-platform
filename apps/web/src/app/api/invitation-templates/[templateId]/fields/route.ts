import { NextResponse, type NextRequest } from "next/server";
import { readJson } from "@/lib/api/read-json";
import {
  handleInvitationApiError,
  requireInvitationEventPermission,
} from "@/lib/invitations/invitation-api";
import {
  getInvitationTemplateDetails,
  saveInvitationTemplateFields,
} from "@/lib/invitations/invitation-db";
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
      "invitation_templates.update",
    );

    const body = await readJson(request);

    if (
      Object.prototype.hasOwnProperty.call(body, "fields") &&
      !Array.isArray(body.fields)
    ) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_fields",
            message: "fields must be an array.",
          },
        },
        { status: 400 },
      );
    }

    const fields = await saveInvitationTemplateFields(
      apiContext.supabase,
      details.template,
      Array.isArray(body.fields) ? body.fields : [],
      apiContext.user.id,
    );

    return NextResponse.json({ fields });
  } catch (error) {
    try {
      return handleInvitationApiError(error);
    } catch (projectError) {
      return handleProjectApiError(projectError);
    }
  }
}
