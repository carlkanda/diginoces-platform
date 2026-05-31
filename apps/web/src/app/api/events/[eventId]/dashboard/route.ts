import { NextResponse } from "next/server";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
} from "@/lib/projects/project-api";
import { requireEventDashboardPermission } from "@/lib/reports/report-api";
import { getEventDashboardOverview } from "@/lib/reports/report-db";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { eventId } = await context.params;
    await requireEventDashboardPermission(apiContext, eventId);
    const overview = await getEventDashboardOverview(
      apiContext.supabase,
      eventId,
    );

    if (!overview) {
      return NextResponse.json(
        {
          error: {
            code: "not_found",
            message: "Event was not found.",
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json(overview, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleProjectApiError(error);
  }
}
