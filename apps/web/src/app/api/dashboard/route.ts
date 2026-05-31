import { NextResponse } from "next/server";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
} from "@/lib/projects/project-api";
import {
  getReportingPermissionSet,
  requireGlobalDashboardPermission,
} from "@/lib/reports/report-api";
import { getDashboardVisibility } from "@/lib/reports/report-service";
import { getGlobalDashboardOverview } from "@/lib/reports/report-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await getProjectApiContext();

  if (!isProjectApiContext(context)) {
    return context;
  }

  try {
    await requireGlobalDashboardPermission(context);
    const permissions = await getReportingPermissionSet(context);
    const visibility = getDashboardVisibility(permissions);

    return NextResponse.json(
      await getGlobalDashboardOverview(context.supabase, visibility),
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return handleProjectApiError(error);
  }
}
