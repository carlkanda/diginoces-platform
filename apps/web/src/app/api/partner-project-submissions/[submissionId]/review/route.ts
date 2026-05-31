import type { NextRequest } from "next/server";
import {
  getPartnerApiContext,
  handlePartnerApiError,
  isPartnerApiContext,
  parseReviewPartnerProjectPayload,
} from "@/lib/partners/partner-api";
import { reviewPartnerProjectSubmissionRecord } from "@/lib/partners/partner-db";
import { requireGlobalPermission } from "@/lib/projects/project-api";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    submissionId: string;
  }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { submissionId } = await params;
  const context = await getPartnerApiContext();

  if (!isPartnerApiContext(context)) {
    return context;
  }

  try {
    await requireGlobalPermission(context, "partner_projects.review");
    const input = parseReviewPartnerProjectPayload(await request.json());
    const submission = await reviewPartnerProjectSubmissionRecord(
      context.supabase,
      {
        ...input,
        submissionId,
      },
    );

    return Response.json({ submission });
  } catch (error) {
    return handlePartnerApiError(error);
  }
}
