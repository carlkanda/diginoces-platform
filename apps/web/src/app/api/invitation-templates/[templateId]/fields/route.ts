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
  InvitationValidationError,
  validateInvitationFieldConfiguration,
} from "@/lib/invitations/invitation-service";
import {
  getProjectApiContext,
  isProjectApiContext,
} from "@/lib/projects/project-api";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    templateId: string;
  }>;
};

function parseFields(body: Record<string, unknown>) {
  if (
    Object.prototype.hasOwnProperty.call(body, "fields") &&
    !Array.isArray(body.fields)
  ) {
    throw new InvitationValidationError("fields must be an array.");
  }

  const fields = Array.isArray(body.fields) ? body.fields : [];

  fields.forEach((field, index) => {
    if (!field || typeof field !== "object" || Array.isArray(field)) {
      throw new InvitationValidationError(
        `fields[${index}] must be an object.`,
      );
    }

    const candidate = field as Record<string, unknown>;

    if (typeof candidate.key !== "string") {
      throw new InvitationValidationError(
        `fields[${index}].key must be a string.`,
      );
    }

    if (typeof candidate.label !== "string") {
      throw new InvitationValidationError(
        `fields[${index}].label must be a string.`,
      );
    }

    if (
      !candidate.position ||
      typeof candidate.position !== "object" ||
      Array.isArray(candidate.position)
    ) {
      throw new InvitationValidationError(
        `fields[${index}].position must be an object.`,
      );
    }
  });

  return validateInvitationFieldConfiguration(fields);
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
      "invitation_templates.update",
    );

    const body = await readJson(request);

    const fields = await saveInvitationTemplateFields(
      apiContext.supabase,
      details.template,
      parseFields(body),
      apiContext.user.id,
    );

    return NextResponse.json({ fields });
  } catch (error) {
    return handleInvitationApiError(error);
  }
}
