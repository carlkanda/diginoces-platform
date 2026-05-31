import { NextResponse } from "next/server";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
} from "@/lib/projects/project-api";
import {
  getReportingPermissionSet,
  requireProjectDashboardPermission,
} from "@/lib/reports/report-api";
import { getProjectDashboardOverview } from "@/lib/reports/report-db";
import { getDashboardVisibility } from "@/lib/reports/report-service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { projectId } = await context.params;
    await requireProjectDashboardPermission(apiContext, projectId);
    const permissions = await getReportingPermissionSet(apiContext, {
      projectId,
    });
    const overview = await getProjectDashboardOverview(
      apiContext.supabase,
      projectId,
      getDashboardVisibility(permissions),
    );

    if (!overview) {
      return NextResponse.json(
        {
          error: {
            code: "not_found",
            message: "Project was not found.",
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
