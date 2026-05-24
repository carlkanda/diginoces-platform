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

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

function withNoStore(response: NextResponse) {
  for (const [name, value] of Object.entries(noStoreHeaders)) {
    response.headers.set(name, value);
  }

  return response;
}

type RouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

type SeatingApiAction =
  | "assign_guest"
  | "bulk_create_tables"
  | "create_table"
  | "generate_table_cards_csv"
  | "remove_guest";

const seatingApiActionValues = [
  "assign_guest",
  "bulk_create_tables",
  "create_table",
  "generate_table_cards_csv",
  "remove_guest",
] satisfies SeatingApiAction[];

const seatingApiActions = new Set<SeatingApiAction>(seatingApiActionValues);

function isSeatingApiAction(value: string): value is SeatingApiAction {
  return seatingApiActions.has(value as SeatingApiAction);
}

function parseSeatingAction(value: unknown): SeatingApiAction {
  if (typeof value !== "string") {
    throw new SeatingValidationError("action is required.");
  }

  if (isSeatingApiAction(value)) {
    return value;
  }

  throw new SeatingValidationError("Unsupported seating action.");
}

function assertNeverSeatingAction(action: never): never {
  throw new SeatingValidationError(
    `Unhandled seating action: ${String(action)}`,
  );
}

async function requireSeatingAction(
  context: Awaited<ReturnType<typeof getProjectApiContext>>,
  eventId: string,
  action: SeatingApiAction,
) {
  if (!isProjectApiContext(context)) {
    throw new ProjectAccessError("Invalid API context.", 401);
  }

  switch (action) {
    case "create_table":
    case "bulk_create_tables":
      await requireEventPermission(context, eventId, "seating.tables.manage");
      return;
    case "assign_guest":
    case "remove_guest":
      await requireEventPermission(context, eventId, "seating.assign");
      return;
    case "generate_table_cards_csv":
      await requireEventPermission(context, eventId, "seating.export");
      return;
    default:
      assertNeverSeatingAction(action);
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return withNoStore(apiContext);
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
      { headers: noStoreHeaders },
    );
  } catch (error) {
    return withNoStore(handleSeatingApiError(error));
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const apiContext = await getProjectApiContext();

  if (!isProjectApiContext(apiContext)) {
    return withNoStore(apiContext);
  }

  try {
    const { eventId } = await context.params;
    const payload = await readJson(request);

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new SeatingValidationError("Request body must be a JSON object.");
    }

    const action = parseSeatingAction(
      (payload as Record<string, unknown>).action,
    );

    await requireSeatingAction(apiContext, eventId, action);

    // createEventTable and bulkCreateEventTables write direct table rows and need explicit created_by/updated_by user IDs.
    // assignGuestToEventTable, removeGuestFromEventTable, and generateTableCardCsvExport use Supabase RPC/RLS auth context.
    switch (action) {
      case "create_table": {
        const table = await createEventTable(
          apiContext.supabase,
          eventId,
          payload,
          apiContext.user.id,
        );
        return NextResponse.json(
          { table },
          { headers: noStoreHeaders, status: 201 },
        );
      }
      case "bulk_create_tables": {
        const tables = await bulkCreateEventTables(
          apiContext.supabase,
          eventId,
          payload,
          apiContext.user.id,
        );
        return NextResponse.json(
          { tables },
          { headers: noStoreHeaders, status: 201 },
        );
      }
      case "assign_guest": {
        const result = await assignGuestToEventTable(
          apiContext.supabase,
          eventId,
          payload,
        );
        return NextResponse.json({ result }, { headers: noStoreHeaders });
      }
      case "remove_guest": {
        const result = await removeGuestFromEventTable(
          apiContext.supabase,
          eventId,
          payload,
        );
        return NextResponse.json({ result }, { headers: noStoreHeaders });
      }
      case "generate_table_cards_csv": {
        const exportFile = await generateTableCardCsvExport(
          apiContext.supabase,
          eventId,
        );
        return NextResponse.json(
          { exportFile },
          { headers: noStoreHeaders, status: 201 },
        );
      }
      default:
        assertNeverSeatingAction(action);
    }
  } catch (error) {
    return withNoStore(handleSeatingApiError(error));
  }
}
