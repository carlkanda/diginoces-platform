import type { NextRequest } from "next/server";
import {
  getPartnerApiContext,
  handlePartnerApiError,
  isPartnerApiContext,
  parseCreatePartnerProjectDraftPayload,
  requirePartnerPermission,
} from "@/lib/partners/partner-api";
import { createPartnerProjectDraft } from "@/lib/partners/partner-db";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    partnerId: string;
  }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { partnerId } = await params;
  const context = await getPartnerApiContext();

  if (!isPartnerApiContext(context)) {
    return context;
  }

  try {
    await requirePartnerPermission(
      context,
      partnerId,
      "partner_projects.create",
    );
    const input = parseCreatePartnerProjectDraftPayload(await request.json());
    const submission = await createPartnerProjectDraft(context.supabase, {
      ...input,
      partnerId,
    });

    return Response.json({ submission }, { status: 201 });
  } catch (error) {
    return handlePartnerApiError(error);
  }
}
