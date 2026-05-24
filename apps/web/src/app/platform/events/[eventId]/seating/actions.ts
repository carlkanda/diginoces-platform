"use server";

import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import {
  assignGuestToEventTable,
  bulkCreateEventTables,
  createEventTable,
  generateTableCardCsvExport,
  removeGuestFromEventTable,
  updateEventTable,
} from "@/lib/seating/seating-db";
import { SeatingValidationError } from "@/lib/seating/seating-service";
import { requireEventPermission } from "@/lib/projects/project-api";
import type { PermissionSlug } from "@/lib/security/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new SeatingValidationError(`${key} must be a text value.`);
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function numberValue(formData: FormData, key: string) {
  const value = formValue(formData, key);

  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new SeatingValidationError(`${key} must be a number.`);
  }

  return parsed;
}

function requiredNumberValue(formData: FormData, key: string) {
  const value = numberValue(formData, key);

  if (value === undefined) {
    throw new SeatingValidationError(`${key} is required.`);
  }

  return value;
}

function seatingPath(eventId: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);

  return `/platform/events/${eventId}/seating?${searchParams.toString()}`;
}

async function getActionContext(eventId: string, permission: PermissionSlug) {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    throw new SeatingValidationError("Authentication is required.");
  }

  if (authContext.status === "not_configured") {
    throw new SeatingValidationError("Supabase is not configured.");
  }

  const context = {
    supabase: await createSupabaseServerClient(),
    user: authContext.user,
  };

  await requireEventPermission(context, eventId, permission);

  return context;
}

export async function createEventTableAction(
  eventId: string,
  formData: FormData,
) {
  try {
    const context = await getActionContext(eventId, "seating.tables.manage");

    await createEventTable(
      context.supabase,
      eventId,
      {
        assignmentMode: formValue(formData, "assignmentMode"),
        capacity: requiredNumberValue(formData, "capacity"),
        description: formValue(formData, "description"),
        displayOrder: numberValue(formData, "displayOrder"),
        notes: formValue(formData, "notes"),
        tableCode: formValue(formData, "tableCode"),
        tableName: formValue(formData, "tableName"),
      },
      context.user.id,
    );
  } catch (error) {
    redirect(
      seatingPath(eventId, {
        seatingError:
          error instanceof SeatingValidationError
            ? error.message
            : "Unable to create event table.",
      }),
    );
  }

  redirect(seatingPath(eventId, { seatingStatus: "table_created" }));
}

export async function updateEventTableAction(
  eventId: string,
  tableId: string,
  formData: FormData,
) {
  try {
    const context = await getActionContext(eventId, "seating.tables.manage");

    await updateEventTable(
      context.supabase,
      eventId,
      tableId,
      {
        assignmentMode: formValue(formData, "assignmentMode"),
        capacity: requiredNumberValue(formData, "capacity"),
        description: formValue(formData, "description"),
        displayOrder: numberValue(formData, "displayOrder"),
        notes: formValue(formData, "notes"),
        status: formValue(formData, "status"),
        tableCode: formValue(formData, "tableCode"),
        tableName: formValue(formData, "tableName"),
      },
      context.user.id,
    );
  } catch (error) {
    redirect(
      seatingPath(eventId, {
        seatingError:
          error instanceof SeatingValidationError
            ? error.message
            : "Unable to update event table.",
      }),
    );
  }

  redirect(seatingPath(eventId, { seatingStatus: "table_updated" }));
}

export async function bulkCreateEventTablesAction(
  eventId: string,
  formData: FormData,
) {
  try {
    const context = await getActionContext(eventId, "seating.tables.manage");

    await bulkCreateEventTables(
      context.supabase,
      eventId,
      {
        assignmentMode: formValue(formData, "assignmentMode"),
        capacity: requiredNumberValue(formData, "bulkCapacity"),
        count: requiredNumberValue(formData, "tableCount"),
        startNumber: numberValue(formData, "startNumber"),
        tableCodePrefix: formValue(formData, "tableCodePrefix"),
        tableNamePrefix: formValue(formData, "tableNamePrefix"),
      },
      context.user.id,
    );
  } catch (error) {
    redirect(
      seatingPath(eventId, {
        seatingError:
          error instanceof SeatingValidationError
            ? error.message
            : "Unable to bulk-create event tables.",
      }),
    );
  }

  redirect(seatingPath(eventId, { seatingStatus: "tables_created" }));
}

export async function assignGuestToEventTableAction(
  eventId: string,
  formData: FormData,
) {
  try {
    const context = await getActionContext(eventId, "seating.assign");

    await assignGuestToEventTable(context.supabase, eventId, {
      guestId: formValue(formData, "guestId"),
      seatingNotes: formValue(formData, "seatingNotes"),
      tableId: formValue(formData, "tableId"),
      vipProtocolNotes: formValue(formData, "vipProtocolNotes"),
    });
  } catch (error) {
    redirect(
      seatingPath(eventId, {
        seatingError:
          error instanceof SeatingValidationError
            ? error.message
            : "Unable to assign guest to table.",
      }),
    );
  }

  redirect(seatingPath(eventId, { seatingStatus: "guest_assigned" }));
}

export async function removeGuestFromEventTableAction(
  eventId: string,
  guestId: string,
  formData: FormData,
) {
  try {
    const context = await getActionContext(eventId, "seating.assign");

    await removeGuestFromEventTable(context.supabase, eventId, {
      guestId,
      reason: formValue(formData, "reason"),
    });
  } catch (error) {
    redirect(
      seatingPath(eventId, {
        seatingError:
          error instanceof SeatingValidationError
            ? error.message
            : "Unable to remove guest from table.",
      }),
    );
  }

  redirect(seatingPath(eventId, { seatingStatus: "guest_removed" }));
}

export async function generateTableCardCsvExportAction(eventId: string) {
  try {
    const context = await getActionContext(eventId, "seating.export");

    await generateTableCardCsvExport(context.supabase, eventId);
  } catch (error) {
    redirect(
      seatingPath(eventId, {
        seatingError:
          error instanceof SeatingValidationError
            ? error.message
            : "Unable to generate table-card CSV.",
      }),
    );
  }

  redirect(seatingPath(eventId, { seatingStatus: "export_generated" }));
}
