import { NextResponse, type NextRequest } from "next/server";
import { readJson } from "@/lib/api/read-json";
import {
  getMessageLogDetails,
  markGuidedManualMessageStatus,
} from "@/lib/messages/message-db";
import { handleMessageApiError } from "@/lib/messages/message-api";
import { MessageValidationError } from "@/lib/messages/message-service";
import type { MessageDeliveryStatus } from "@/lib/messages/message-service";
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

const manualStatuses = [
  "failed",
  "opened_manually",
  "resent",
  "sent",
  "skipped",
] as const;

type ManualMessageStatus = Extract<
  MessageDeliveryStatus,
  (typeof manualStatuses)[number]
>;

const allowedManualStatuses = new Set<string>(manualStatuses);

function parseStatusPayload(payload: Record<string, unknown>): {
  reason: string | null;
  status: ManualMessageStatus;
} {
  const status = payload.status;

  if (typeof status !== "string") {
    throw new MessageValidationError("status must be a string.");
  }

  if (!allowedManualStatuses.has(status)) {
    throw new MessageValidationError("Unsupported manual message status.");
  }

  if (
    payload.reason !== undefined &&
    payload.reason !== null &&
    typeof payload.reason !== "string"
  ) {
    throw new MessageValidationError("reason must be text.");
  }

  if (
    (status === "failed" || status === "skipped") &&
    (typeof payload.reason !== "string" || payload.reason.trim().length === 0)
  ) {
    throw new MessageValidationError(
      "reason is required for failed/skipped statuses.",
    );
  }

  return {
    reason: payload.reason ?? null,
    status: status as ManualMessageStatus,
  };
}

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

    const input = parseStatusPayload(await readJson(request));
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
