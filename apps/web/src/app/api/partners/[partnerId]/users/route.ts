import type { NextRequest } from "next/server";
import { methodNotAllowed } from "@/lib/projects/project-api";
import {
  getPartnerApiContext,
  handlePartnerApiError,
  isPartnerApiContext,
  parseLinkPartnerUserPayload,
  requirePartnerManagePermission,
} from "@/lib/partners/partner-api";
import { linkPartnerUser } from "@/lib/partners/partner-db";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    partnerId: string;
  }>;
};

export function GET() {
  return methodNotAllowed("POST");
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { partnerId } = await params;
  const context = await getPartnerApiContext();

  if (!isPartnerApiContext(context)) {
    return context;
  }

  try {
    await requirePartnerManagePermission(context);
    const input = parseLinkPartnerUserPayload(await request.json());
    const partnerUser = await linkPartnerUser(context.supabase, {
      partnerId,
      role: input.role,
      userId: input.userId,
    });

    return Response.json({ partnerUser }, { status: 201 });
  } catch (error) {
    return handlePartnerApiError(error);
  }
}
