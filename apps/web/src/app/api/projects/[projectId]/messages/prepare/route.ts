import { NextResponse, type NextRequest } from "next/server";
import { readJson } from "@/lib/api/read-json";
import { prepareProjectMessage } from "@/lib/messages/message-db";
import { handleMessageApiError } from "@/lib/messages/message-api";
import { parsePrepareMessagePayload } from "@/lib/messages/message-service";
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

export async function POST(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { projectId } = await context.params;
    await requireProjectPermission(apiContext, projectId, "messages.prepare");

    const payload = parsePrepareMessagePayload(await readJson(request));
    const messageLog = await prepareProjectMessage(
      apiContext.supabase,
      projectId,
      payload,
      apiContext.user.id,
    );

    return NextResponse.json(
      { messageLog },
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
