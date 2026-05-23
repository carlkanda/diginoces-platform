import { NextResponse, type NextRequest } from "next/server";
import { readJson } from "@/lib/api/read-json";
import {
  getMessageLogDetails,
  markGuidedManualMessageStatus,
} from "@/lib/messages/message-db";
import {
  handleMessageApiError,
  requireMessageProjectPermission,
} from "@/lib/messages/message-api";
import { MessageValidationError } from "@/lib/messages/message-service";
import type { MessageDeliveryStatus } from "@/lib/messages/message-service";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
} from "@/lib/projects/project-api";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    messageLogId: string;
    projectId: string;
  }>;
};

type ManualMessageStatus = Extract<
  MessageDeliveryStatus,
  "failed" | "opened_manually" | "resent" | "sent" | "skipped"
>;

function parseStatusPayload(payload: Record<string, unknown>): {
  reason: string | null;
  status: ManualMessageStatus;
} {
  const status = payload.status;

  if (
    status !== "opened_manually" &&
    status !== "sent" &&
    status !== "failed" &&
    status !== "skipped" &&
    status !== "resent"
  ) {
    throw new MessageValidationError("Unsupported manual message status.");
  }

  if (
    payload.reason !== undefined &&
    payload.reason !== null &&
    typeof payload.reason !== "string"
  ) {
    throw new MessageValidationError("reason must be text.");
  }

  return {
    reason: payload.reason ?? null,
    status,
  };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { messageLogId, projectId } = await context.params;
    await requireMessageProjectPermission(
      apiContext,
      projectId,
      "messages.send",
    );

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

    const input = parseStatusPayload(await readJson(request));
    const result = await markGuidedManualMessageStatus(
      apiContext.supabase,
      messageLogId,
      input.status,
      input.reason,
    );

    return NextResponse.json({ result });
  } catch (error) {
    try {
      return handleMessageApiError(error);
    } catch (projectError) {
      return handleProjectApiError(projectError);
    }
  }
}
