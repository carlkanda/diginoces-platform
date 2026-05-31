import { NextResponse, type NextRequest } from "next/server";
import { readJson } from "@/lib/api/read-json";
import {
  getProjectApiContext,
  isProjectApiContext,
} from "@/lib/projects/project-api";
import {
  handleGuestWishApiError,
  requirePostEventFeedbackReadPermission,
  requirePostEventFeedbackSubmitPermission,
} from "@/lib/guest-wishes/guest-wish-api";
import {
  listPostEventFeedback,
  submitPostEventFeedback,
} from "@/lib/guest-wishes/guest-wish-db";

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
    await requirePostEventFeedbackReadPermission(apiContext, projectId);
    const feedback = await listPostEventFeedback(
      apiContext.supabase,
      projectId,
    );

    return NextResponse.json(
      { feedback },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return handleGuestWishApiError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { projectId } = await context.params;
    await requirePostEventFeedbackSubmitPermission(apiContext, projectId);
    const feedback = await submitPostEventFeedback(
      apiContext.supabase,
      projectId,
      await readJson(request),
    );

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    return handleGuestWishApiError(error);
  }
}
