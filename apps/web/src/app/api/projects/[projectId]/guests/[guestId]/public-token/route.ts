import { NextResponse, type NextRequest } from "next/server";
import { InvalidJsonBodyError, readJson } from "@/lib/api/read-json";
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

    let body: Record<string, unknown>;

    try {
      body = await readJson(request);
    } catch (error) {
      if (error instanceof InvalidJsonBodyError) {
        return jsonError(400, "invalid_json", error.message);
      }

      throw error;
    }

    const expiresAt =
      typeof body.expiresAt === "string" && body.expiresAt.trim().length > 0
        ? body.expiresAt.trim()
        : null;
    const parsedExpiresAt = expiresAt === null ? null : Date.parse(expiresAt);

    if (parsedExpiresAt !== null && Number.isNaN(parsedExpiresAt)) {
      return jsonError(
        400,
        "invalid_expires_at",
        "expiresAt must be a valid ISO 8601 date.",
      );
    }

    const normalizedExpiresAt =
      parsedExpiresAt === null ? null : new Date(parsedExpiresAt).toISOString();

    const token = await createGuestPublicToken(
      apiContext.supabase,
      guestId,
      normalizedExpiresAt,
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
