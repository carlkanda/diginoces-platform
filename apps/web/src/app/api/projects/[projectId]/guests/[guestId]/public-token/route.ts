import { NextResponse, type NextRequest } from "next/server";
import { getGuestDetails } from "@/lib/guests/guest-service";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
  jsonError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import { createGuestPublicToken } from "@/lib/rsvp/rsvp-db";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    guestId: string;
    projectId: string;
  }>;
};

async function readJson(request: NextRequest) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { guestId, projectId } = await context.params;

    await requireProjectPermission(
      apiContext,
      projectId,
      "guest_public_tokens.manage",
    );

    const details = await getGuestDetails(apiContext.supabase, guestId);

    if (!details || details.guest.project_id !== projectId) {
      return jsonError(404, "guest_not_found", "Guest was not found.");
    }

    const body = await readJson(request);
    const expiresAt =
      typeof body.expiresAt === "string" && body.expiresAt.trim().length > 0
        ? body.expiresAt.trim()
        : null;
    const token = await createGuestPublicToken(
      apiContext.supabase,
      guestId,
      expiresAt,
    );

    return NextResponse.json(
      {
        token,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
        status: 201,
      },
    );
  } catch (error) {
    return handleProjectApiError(error);
  }
}
