import type { NextRequest } from "next/server";
import {
  getPartnerApiContext,
  handlePartnerApiError,
  isPartnerApiContext,
} from "@/lib/partners/partner-api";
import { submitPartnerProjectSubmission } from "@/lib/partners/partner-db";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    submissionId: string;
  }>;
};

export async function POST(_request: NextRequest, { params }: RouteContext) {
  const { submissionId } = await params;
  const context = await getPartnerApiContext();

  if (!isPartnerApiContext(context)) {
    return context;
  }

  try {
    const submission = await submitPartnerProjectSubmission(
      context.supabase,
      submissionId,
    );

    return Response.json({ submission });
  } catch (error) {
    return handlePartnerApiError(error);
  }
}
