import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
} from "@/lib/projects/project-api";
import { requireAnyCommercialReadPermission } from "@/lib/contracts/contract-api";
import { getProjectCommercialOverview } from "@/lib/contracts/contract-db";

type CommercialRouteProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(_request: Request, { params }: CommercialRouteProps) {
  const context = await getProjectApiContext();

  if (!isProjectApiContext(context)) {
    return context;
  }

  try {
    const { projectId } = await params;

    await requireAnyCommercialReadPermission(context, projectId);

    return Response.json(
      await getProjectCommercialOverview(context.supabase, projectId),
    );
  } catch (error) {
    return handleProjectApiError(error);
  }
}
