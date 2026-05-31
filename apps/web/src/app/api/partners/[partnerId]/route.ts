import type { NextRequest } from "next/server";
import {
  getPartnerApiContext,
  handlePartnerApiError,
  isPartnerApiContext,
  parsePartnerStatusPayload,
  requirePartnerManagePermission,
  requirePartnerPermission,
} from "@/lib/partners/partner-api";
import {
  getPartnerDetails,
  updatePartnerStatus,
} from "@/lib/partners/partner-db";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    partnerId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { partnerId } = await params;
  const context = await getPartnerApiContext();

  if (!isPartnerApiContext(context)) {
    return context;
  }

  try {
    await requirePartnerPermission(context, partnerId, "partners.read");
    const details = await getPartnerDetails(context.supabase, partnerId);

    if (!details) {
      return Response.json(
        { error: { code: "not_found", message: "Partner not found." } },
        { status: 404 },
      );
    }

    return Response.json({ details });
  } catch (error) {
    return handlePartnerApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { partnerId } = await params;
  const context = await getPartnerApiContext();

  if (!isPartnerApiContext(context)) {
    return context;
  }

  try {
    await requirePartnerManagePermission(context);
    const input = parsePartnerStatusPayload(await request.json());
    const partner = await updatePartnerStatus(context.supabase, {
      actorUserId: context.user.id,
      partnerId,
      status: input.status,
    });

    return Response.json({ partner });
  } catch (error) {
    return handlePartnerApiError(error);
  }
}
