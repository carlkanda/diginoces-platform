import { NextResponse, type NextRequest } from "next/server";
import {
  handleInvitationApiError,
  requireInvitationEventPermission,
} from "@/lib/invitations/invitation-api";
import {
  approveInvitationTemplatePreview,
  getInvitationTemplateDetails,
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
      "invitation_templates.approve",
    );

    const approval = await approveInvitationTemplatePreview(
      apiContext.supabase,
      templateId,
    );

    return NextResponse.json({ approval });
  } catch (error) {
    try {
      return handleInvitationApiError(error);
    } catch (projectError) {
      return handleProjectApiError(projectError);
    }
  }
}
