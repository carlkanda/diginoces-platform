import type { NextRequest } from "next/server";
import { readJson } from "@/lib/api/read-json";
import {
  handleCommercialApiError,
  requireCommercialProjectPermission,
} from "@/lib/contracts/contract-api";
import { recordProjectPayment } from "@/lib/contracts/contract-db";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
} from "@/lib/projects/project-api";

type PaymentsRouteProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: PaymentsRouteProps,
) {
  const context = await getProjectApiContext();

  if (!isProjectApiContext(context)) {
    return context;
  }

  try {
    const { projectId } = await params;

    await requireCommercialProjectPermission(
      context,
      projectId,
      "payments.record",
    );

    return Response.json(
      await recordProjectPayment(
        context.supabase,
        projectId,
        await readJson(request),
        context.user.id,
      ),
      { status: 201 },
    );
  } catch (error) {
    try {
      return handleCommercialApiError(error);
    } catch (projectError) {
      return handleProjectApiError(projectError);
    }
  }
}
