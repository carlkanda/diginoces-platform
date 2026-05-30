import { NextResponse, type NextRequest } from "next/server";
import { readJson } from "@/lib/api/read-json";
import { handleCheckInApiError } from "@/lib/check-in/check-in-api";
import {
  createCheckInToken,
  createPreloadSnapshot,
  createUnexpectedGuestRequest,
  getCheckInOverview,
  performGuestCheckIn,
  resolveCheckInToken,
  reviewUnexpectedGuestRequest,
  searchEventCheckInGuests,
  submitOfflineSyncBatch,
  upsertCheckInDevice,
  upsertCheckInSettings,
} from "@/lib/check-in/check-in-db";
import {
  CheckInValidationError,
  parseCheckInSearchPayload,
} from "@/lib/check-in/check-in-service";
import {
  getProjectApiContext,
  hasEventPermission,
  isProjectApiContext,
  ProjectAccessError,
  requireEventPermission,
} from "@/lib/projects/project-api";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

type RouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

type CheckInApiAction =
  | "assign_device"
  | "check_in"
  | "configure_settings"
  | "create_preload_snapshot"
  | "create_token"
  | "create_unexpected_guest"
  | "resolve_token"
  | "review_unexpected_guest"
  | "search"
  | "submit_offline_sync_batch";

const checkInApiActions = new Set<CheckInApiAction>([
  "assign_device",
  "check_in",
  "configure_settings",
  "create_preload_snapshot",
  "create_token",
  "create_unexpected_guest",
  "resolve_token",
  "review_unexpected_guest",
  "search",
  "submit_offline_sync_batch",
]);

function withNoStore(response: NextResponse) {
  for (const [name, value] of Object.entries(noStoreHeaders)) {
    response.headers.set(name, value);
  }

  return response;
}

function parseAction(value: unknown): CheckInApiAction {
  if (typeof value !== "string") {
    throw new CheckInValidationError("action is required.");
  }

  if (checkInApiActions.has(value as CheckInApiAction)) {
    return value as CheckInApiAction;
  }

  throw new CheckInValidationError("Unsupported check-in action.");
}

function asPayloadObject(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new CheckInValidationError("Request body must be a JSON object.");
  }

  return payload as Record<string, unknown>;
}

async function requireCheckInAction(
  context: Awaited<ReturnType<typeof getProjectApiContext>>,
  eventId: string,
  action: CheckInApiAction,
) {
  if (!isProjectApiContext(context)) {
    throw new ProjectAccessError("Invalid API context.", 401);
  }

  switch (action) {
    case "configure_settings":
      await requireEventPermission(
        context,
        eventId,
        "check_in.settings.manage",
      );
      return;
    case "assign_device":
      await requireEventPermission(context, eventId, "check_in.devices.manage");
      return;
    case "create_token":
      await requireEventPermission(context, eventId, "check_in.tokens.manage");
      return;
    case "resolve_token":
    case "check_in":
      await requireEventPermission(context, eventId, "check_in.perform");
      return;
    case "search":
      await requireEventPermission(context, eventId, "check_in.search");
      return;
    case "create_unexpected_guest":
      await requireEventPermission(
        context,
        eventId,
        "check_in.unexpected_guests.create",
      );
      return;
    case "review_unexpected_guest":
      await requireEventPermission(
        context,
        eventId,
        "check_in.unexpected_guests.review",
      );
      return;
    case "create_preload_snapshot":
    case "submit_offline_sync_batch":
      await requireEventPermission(context, eventId, "check_in.offline_sync");
      return;
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return withNoStore(apiContext);
  }

  try {
    const { eventId } = await context.params;
    await requireEventPermission(apiContext, eventId, "check_in.read");

    const overview = await getCheckInOverview(apiContext.supabase, eventId);
    const [
      canConfigure,
      canManageDevices,
      canManageTokens,
      canPerform,
      canReviewUnexpected,
      canSyncOffline,
      canViewDashboard,
    ] = await Promise.all([
      hasEventPermission(apiContext, eventId, "check_in.settings.manage"),
      hasEventPermission(apiContext, eventId, "check_in.devices.manage"),
      hasEventPermission(apiContext, eventId, "check_in.tokens.manage"),
      hasEventPermission(apiContext, eventId, "check_in.perform"),
      hasEventPermission(
        apiContext,
        eventId,
        "check_in.unexpected_guests.review",
      ),
      hasEventPermission(apiContext, eventId, "check_in.offline_sync"),
      hasEventPermission(apiContext, eventId, "check_in.dashboard"),
    ]);

    return NextResponse.json(
      {
        capabilities: {
          canConfigure,
          canManageDevices,
          canManageTokens,
          canPerform,
          canReviewUnexpected,
          canSyncOffline,
          canViewDashboard,
        },
        overview,
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    return withNoStore(handleCheckInApiError(error));
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return withNoStore(apiContext);
  }

  try {
    const { eventId } = await context.params;
    const payload = asPayloadObject(await readJson(request));
    const action = parseAction(payload.action);

    await requireCheckInAction(apiContext, eventId, action);

    switch (action) {
      case "configure_settings": {
        const settings = await upsertCheckInSettings(
          apiContext.supabase,
          eventId,
          payload,
          apiContext.user.id,
        );
        return NextResponse.json({ settings }, { headers: noStoreHeaders });
      }
      case "assign_device": {
        const device = await upsertCheckInDevice(
          apiContext.supabase,
          eventId,
          payload,
          apiContext.user.id,
        );
        return NextResponse.json({ device }, { headers: noStoreHeaders });
      }
      case "create_token": {
        const guestId =
          typeof payload.guestId === "string" ? payload.guestId : null;

        if (!guestId) {
          throw new CheckInValidationError("guestId is required.");
        }

        const token = await createCheckInToken(
          apiContext.supabase,
          eventId,
          guestId,
          typeof payload.invitationId === "string"
            ? payload.invitationId
            : null,
        );
        return NextResponse.json(
          { token },
          { headers: noStoreHeaders, status: 201 },
        );
      }
      case "resolve_token": {
        const tokenValue =
          typeof payload.token === "string" ? payload.token : null;

        if (!tokenValue) {
          throw new CheckInValidationError("token is required.");
        }

        const token = await resolveCheckInToken(
          apiContext.supabase,
          eventId,
          tokenValue,
        );
        return NextResponse.json({ token }, { headers: noStoreHeaders });
      }
      case "check_in": {
        const result = await performGuestCheckIn(
          apiContext.supabase,
          eventId,
          payload,
        );
        return NextResponse.json({ result }, { headers: noStoreHeaders });
      }
      case "search": {
        const guests = await searchEventCheckInGuests(
          apiContext.supabase,
          eventId,
          parseCheckInSearchPayload(payload),
        );
        return NextResponse.json({ guests }, { headers: noStoreHeaders });
      }
      case "create_unexpected_guest": {
        const requestRecord = await createUnexpectedGuestRequest(
          apiContext.supabase,
          eventId,
          payload,
          apiContext.user.id,
        );
        return NextResponse.json(
          { request: requestRecord },
          { headers: noStoreHeaders, status: 201 },
        );
      }
      case "review_unexpected_guest": {
        const result = await reviewUnexpectedGuestRequest(
          apiContext.supabase,
          payload,
        );
        return NextResponse.json({ result }, { headers: noStoreHeaders });
      }
      case "create_preload_snapshot": {
        const snapshot = await createPreloadSnapshot(
          apiContext.supabase,
          eventId,
          {
            deviceId:
              typeof payload.deviceId === "string" ? payload.deviceId : null,
            expiresAt:
              typeof payload.expiresAt === "string" ? payload.expiresAt : null,
          },
          apiContext.user.id,
        );
        return NextResponse.json(
          { snapshot },
          { headers: noStoreHeaders, status: 201 },
        );
      }
      case "submit_offline_sync_batch": {
        if (!Array.isArray(payload.offlineRecords)) {
          throw new CheckInValidationError("offlineRecords must be an array.");
        }

        const result = await submitOfflineSyncBatch(
          apiContext.supabase,
          eventId,
          {
            deviceId:
              typeof payload.deviceId === "string" ? payload.deviceId : null,
            offlineRecords: payload.offlineRecords as never,
          },
          apiContext.user.id,
        );
        return NextResponse.json({ result }, { headers: noStoreHeaders });
      }
    }
  } catch (error) {
    return withNoStore(handleCheckInApiError(error));
  }
}
