import type { NextRequest } from "next/server";
import {
  getPartnerApiContext,
  handlePartnerApiError,
  isPartnerApiContext,
  parseProjectCommentPayload,
} from "@/lib/partners/partner-api";
import {
  createProjectComment,
  listProjectComments,
} from "@/lib/partners/partner-db";
import { requireProjectPermission } from "@/lib/projects/project-api";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { projectId } = await params;
  const context = await getPartnerApiContext();

  if (!isPartnerApiContext(context)) {
    return context;
  }

  try {
    await requireProjectPermission(context, projectId, "project_comments.read");
    const comments = await listProjectComments(context.supabase, projectId);

    return Response.json({ comments });
  } catch (error) {
    return handlePartnerApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { projectId } = await params;
  const context = await getPartnerApiContext();

  if (!isPartnerApiContext(context)) {
    return context;
  }

  try {
    const input = parseProjectCommentPayload(await request.json());
    const permission =
      input.visibility === "internal_only"
        ? "project_comments.internal.read"
        : "project_comments.create";
    await requireProjectPermission(context, projectId, permission);
    const comment = await createProjectComment(context.supabase, {
      ...input,
      projectId,
    });

    return Response.json({ comment }, { status: 201 });
  } catch (error) {
    return handlePartnerApiError(error);
  }
}
