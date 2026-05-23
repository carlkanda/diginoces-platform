import { NextResponse, type NextRequest } from "next/server";
import { readJson } from "@/lib/api/read-json";
import {
  createMessageTemplate,
  listProjectMessageTemplates,
} from "@/lib/messages/message-db";
import { handleMessageApiError } from "@/lib/messages/message-api";
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
    return handleMessageApiError(error);
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

    const template = await createMessageTemplate(
      apiContext.supabase,
      projectId,
      await readJson(request),
      apiContext.user.id,
    );

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    return handleMessageApiError(error);
  }
}
