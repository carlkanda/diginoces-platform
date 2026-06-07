import {
  handleCommercialApiError,
  requireCommercialProjectPermission,
} from "@/lib/contracts/contract-api";
import { generateProjectCommercialContract } from "@/lib/contracts/contract-db";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
  methodNotAllowed,
} from "@/lib/projects/project-api";

type ContractsRouteProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export function GET() {
  return methodNotAllowed("POST");
}

export async function POST(_request: Request, { params }: ContractsRouteProps) {
  const context = await getProjectApiContext();

  if (!isProjectApiContext(context)) {
    return context;
  }

  try {
    const { projectId } = await params;

    await requireCommercialProjectPermission(
      context,
      projectId,
      "contracts.generate",
    );

    return Response.json(
      await generateProjectCommercialContract(
        context.supabase,
        projectId,
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
