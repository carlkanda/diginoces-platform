import type { NextRequest } from "next/server";
import { readJson } from "@/lib/api/read-json";
import {
  handleCommercialApiError,
  requireCommercialProjectPermission,
} from "@/lib/contracts/contract-api";
import { recordProjectPayment } from "@/lib/contracts/contract-db";
import { CommercialValidationError } from "@/lib/contracts/contract-service";
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
    const payload = await readJson(request);
    const status = payload.status;

    await requireCommercialProjectPermission(
      context,
      projectId,
      "payments.record",
    );

    if (
      status !== undefined &&
      status !== null &&
      status !== "recorded" &&
      status !== "confirmed"
    ) {
      throw new CommercialValidationError(
        "Payment status must be recorded or confirmed.",
      );
    }

    if (status === "confirmed") {
      await requireCommercialProjectPermission(
        context,
        projectId,
        "payments.confirm",
      );
    }

    return Response.json(
      await recordProjectPayment(
        context.supabase,
        projectId,
        {
          ...payload,
          status: status === "confirmed" ? "confirmed" : "recorded",
        },
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
