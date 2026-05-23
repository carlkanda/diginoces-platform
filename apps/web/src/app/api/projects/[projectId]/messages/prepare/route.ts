import { NextResponse, type NextRequest } from "next/server";
import { readJson } from "@/lib/api/read-json";
import { prepareProjectMessage } from "@/lib/messages/message-db";
import {
  handleMessageApiError,
  requireMessageProjectPermission,
} from "@/lib/messages/message-api";
import {
  getProjectApiContext,
  isProjectApiContext,
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
    await requireMessageProjectPermission(
      apiContext,
      projectId,
      "messages.prepare",
    );

    const messageLog = await prepareProjectMessage(
      apiContext.supabase,
      projectId,
      await readJson(request),
      apiContext.user.id,
    );

    return NextResponse.json({ messageLog }, { status: 201 });
  } catch (error) {
    return handleMessageApiError(error);
  }
}
