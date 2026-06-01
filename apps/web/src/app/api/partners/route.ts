import type { NextRequest } from "next/server";
import {
  getPartnerApiContext,
  handlePartnerApiError,
  isPartnerApiContext,
  parseCreatePartnerProfilePayload,
  requirePartnerManagePermission,
} from "@/lib/partners/partner-api";
import { createPartnerProfile, listPartners } from "@/lib/partners/partner-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await getPartnerApiContext();

  if (!isPartnerApiContext(context)) {
    return context;
  }

  try {
    return Response.json({
      partners: await listPartners(context.supabase),
    });
  } catch (error) {
    return handlePartnerApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const context = await getPartnerApiContext();

  if (!isPartnerApiContext(context)) {
    return context;
  }

  try {
    await requirePartnerManagePermission(context);
    const input = parseCreatePartnerProfilePayload(await request.json());
    const partner = await createPartnerProfile(context.supabase, {
      ...input,
      actorUserId: context.user.id,
    });

    return Response.json({ partner }, { status: 201 });
  } catch (error) {
    return handlePartnerApiError(error);
  }
}
