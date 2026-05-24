import { NextResponse, type NextRequest } from "next/server";
import { readJson } from "@/lib/api/read-json";
import {
  createMessageTemplate,
  listProjectMessageTemplates,
} from "@/lib/messages/message-db";
import { handleMessageApiError } from "@/lib/messages/message-api";
import { parseCreateMessageTemplatePayload } from "@/lib/messages/message-service";
import {
  getProjectApiContext,
  isProjectApiContext,
  requireProjectPermission,
} from "@/lib/projects/project-api";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { projectId } = await context.params;
    await requireProjectPermission(
      apiContext,
      projectId,
      "message_templates.read",
    );

    const templates = await listProjectMessageTemplates(
      apiContext.supabase,
      projectId,
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
    const response = handleMessageApiError(error);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { projectId } = await context.params;
    await requireProjectPermission(
      apiContext,
      projectId,
      "message_templates.manage",
    );

    const payload = parseCreateMessageTemplatePayload(await readJson(request));
    const template = await createMessageTemplate(
      apiContext.supabase,
      projectId,
      payload,
      apiContext.user.id,
    );

    return NextResponse.json(
      { template },
      {
        headers: {
          "Cache-Control": "no-store",
        },
        status: 201,
      },
    );
  } catch (error) {
    const response = handleMessageApiError(error);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
