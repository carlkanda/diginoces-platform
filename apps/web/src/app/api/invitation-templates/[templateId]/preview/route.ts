import { NextResponse, type NextRequest } from "next/server";
import {
  handleInvitationApiError,
  requireInvitationEventPermission,
} from "@/lib/invitations/invitation-api";
import {
  getInvitationTemplateDetails,
  markInvitationTemplatePreviewGenerated,
} from "@/lib/invitations/invitation-db";
import { PDF_ENGINE_IDENTIFIER } from "@/lib/invitations/invitation-service";
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

export async function POST(_request: NextRequest, context: RouteContext) {
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

    const result = await markInvitationTemplatePreviewGenerated(
      apiContext.supabase,
      templateId,
      {
        engine: PDF_ENGINE_IDENTIFIER,
        fieldCount: details.fields.length,
      },
    );

    return NextResponse.json({ preview: result });
  } catch (error) {
    try {
      return handleInvitationApiError(error);
    } catch (projectError) {
      return handleProjectApiError(projectError);
    }
  }
}
