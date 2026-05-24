import { NextResponse, type NextRequest } from "next/server";
import { readJson } from "@/lib/api/read-json";
import {
  getMessageLogDetails,
  markGuidedManualMessageStatus,
} from "@/lib/messages/message-db";
import { handleMessageApiError } from "@/lib/messages/message-api";
import { validateManualStatusUpdate } from "@/lib/messages/message-service";
import {
  getProjectApiContext,
  isProjectApiContext,
  requireProjectPermission,
} from "@/lib/projects/project-api";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    messageLogId: string;
    projectId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { messageLogId, projectId } = await context.params;
    await requireProjectPermission(apiContext, projectId, "messages.send");

    const messageLog = await getMessageLogDetails(
      apiContext.supabase,
      projectId,
      messageLogId,
    );

    if (!messageLog) {
      return NextResponse.json(
        {
          error: {
            code: "not_found",
            message: "Message log was not found.",
          },
        },
        { status: 404 },
      );
    }

    const payload = await readJson(request);
    const input = validateManualStatusUpdate(payload.status, payload.reason);
    const result = await markGuidedManualMessageStatus(
      apiContext.supabase,
      messageLogId,
      input.status,
      input.reason,
    );

    return NextResponse.json({ result });
  } catch (error) {
    return handleMessageApiError(error);
  }
}
