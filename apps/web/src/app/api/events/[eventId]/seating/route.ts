import { NextResponse, type NextRequest } from "next/server";
import { readJson } from "@/lib/api/read-json";
import {
  assignGuestToEventTable,
  bulkCreateEventTables,
  createEventTable,
  generateTableCardCsvExport,
  getEventSeatingOverview,
  removeGuestFromEventTable,
} from "@/lib/seating/seating-db";
import { handleSeatingApiError } from "@/lib/seating/seating-api";
import { SeatingValidationError } from "@/lib/seating/seating-service";
import {
  getProjectApiContext,
  hasProjectPermission,
  isProjectApiContext,
  ProjectAccessError,
  requireEventPermission,
} from "@/lib/projects/project-api";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

async function requireSeatingAction(
  context: Awaited<ReturnType<typeof getProjectApiContext>>,
  eventId: string,
  action: string,
) {
  if (!isProjectApiContext(context)) {
    throw new SeatingValidationError("Invalid API context.");
  }

  if (action === "create_table" || action === "bulk_create_tables") {
    await requireEventPermission(context, eventId, "seating.tables.manage");
    return;
  }

  if (action === "assign_guest" || action === "remove_guest") {
    await requireEventPermission(context, eventId, "seating.assign");
    return;
  }

  if (action === "generate_table_cards_csv") {
    await requireEventPermission(context, eventId, "seating.export");
    return;
  }

  throw new SeatingValidationError("Unsupported seating action.");
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { eventId } = await context.params;
    await requireEventPermission(apiContext, eventId, "seating.read");

    const overview = await getEventSeatingOverview(
      apiContext.supabase,
      eventId,
    );
    const [canManageTables, canAssign, canExport] = await Promise.all([
      hasProjectPermission(
        apiContext,
        overview.project.id,
        "seating.tables.manage",
      ),
      hasProjectPermission(apiContext, overview.project.id, "seating.assign"),
      hasProjectPermission(apiContext, overview.project.id, "seating.export"),
    ]);

    return NextResponse.json(
      {
        capabilities: {
          canAssign,
          canExport,
          canManageTables,
        },
        overview,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const response = handleSeatingApiError(error);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return apiContext;
  }

  try {
    const { eventId } = await context.params;
    const payload = await readJson(request);

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new SeatingValidationError("Request body must be a JSON object.");
    }

    const action = (payload as Record<string, unknown>).action;

    if (typeof action !== "string") {
      throw new SeatingValidationError("action is required.");
    }

    await requireSeatingAction(apiContext, eventId, action);

    if (action === "create_table") {
      const table = await createEventTable(
        apiContext.supabase,
        eventId,
        payload,
        apiContext.user.id,
      );
      return NextResponse.json({ table }, { status: 201 });
    }

    if (action === "bulk_create_tables") {
      const tables = await bulkCreateEventTables(
        apiContext.supabase,
        eventId,
        payload,
        apiContext.user.id,
      );
      return NextResponse.json({ tables }, { status: 201 });
    }

    if (action === "assign_guest") {
      const result = await assignGuestToEventTable(
        apiContext.supabase,
        eventId,
        payload,
      );
      return NextResponse.json({ result });
    }

    if (action === "remove_guest") {
      const result = await removeGuestFromEventTable(
        apiContext.supabase,
        eventId,
        payload,
      );
      return NextResponse.json({ result });
    }

    if (action === "generate_table_cards_csv") {
      const exportFile = await generateTableCardCsvExport(
        apiContext.supabase,
        eventId,
        apiContext.user.id,
      );
      return NextResponse.json({ exportFile }, { status: 201 });
    }

    throw new ProjectAccessError("Unsupported seating action.", 400);
  } catch (error) {
    const response = handleSeatingApiError(error);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
