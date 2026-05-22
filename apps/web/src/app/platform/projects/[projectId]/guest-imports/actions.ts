"use server";

import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import {
  applyGuestImportApprovedRows,
  createGuestImportSession,
  getGuestImportDetails,
  reviewGuestImportRows,
  rowApprovalStatusFromForm,
  submitGuestImportSession,
  validateGuestImportMapping,
} from "@/lib/guest-imports/guest-import-db";
import {
  requireGuestImportApplyPermission,
  requireGuestImportProjectPermission,
  requireGuestImportReviewPermission,
  requireGuestImportSidePermission,
} from "@/lib/guest-imports/guest-import-api";
import {
  GuestImportValidationError,
  importColumnTargets,
  MAX_GUEST_IMPORT_CSV_BYTES,
  type ImportColumnMapping,
} from "@/lib/guest-imports/guest-import-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (value === null) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : undefined;
}

async function getActionContext() {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    throw new Error("Authentication is required.");
  }

  if (authContext.status === "not_configured") {
    throw new Error("Supabase is not configured.");
  }

  return {
    supabase: await createSupabaseServerClient(),
    user: authContext.user,
  };
}

function assertCsvInputSize(byteLength: number) {
  if (byteLength > MAX_GUEST_IMPORT_CSV_BYTES) {
    throw new GuestImportValidationError("CSV input must be 5 MB or smaller.");
  }
}

async function readCsvInput(formData: FormData) {
  const file = formData.get("csvFile");
  const pastedCsv = formValue(formData, "csvContent");

  if (file instanceof File && file.size > 0) {
    assertCsvInputSize(file.size);

    return {
      csvContent: await file.text(),
      sourceFilename: formValue(formData, "sourceFilename") ?? file.name,
    };
  }

  if (!pastedCsv) {
    throw new GuestImportValidationError(
      "Upload a CSV file or paste CSV content.",
    );
  }

  assertCsvInputSize(new TextEncoder().encode(pastedCsv).byteLength);

  return {
    csvContent: pastedCsv,
    sourceFilename: formValue(formData, "sourceFilename") ?? "guest-import.csv",
  };
}

export async function startGuestImportAction(
  projectId: string,
  formData: FormData,
) {
  const context = await getActionContext();
  const importSide = formValue(formData, "importSide");

  if (
    importSide !== "bride" &&
    importSide !== "groom" &&
    importSide !== "both"
  ) {
    throw new GuestImportValidationError("Select a supported guest side.");
  }

  await requireGuestImportSidePermission(
    context,
    projectId,
    importSide,
    "guest_imports.create",
  );

  const csvInput = await readCsvInput(formData);

  const session = await createGuestImportSession(context.supabase, projectId, {
    ...csvInput,
    importSide,
  });

  redirect(
    `/platform/projects/${projectId}/guest-imports/${session.id}/mapping`,
  );
}

export async function saveGuestImportMappingAction(
  projectId: string,
  importSessionId: string,
  formData: FormData,
) {
  const context = await getActionContext();
  await requireGuestImportProjectPermission(
    context,
    projectId,
    "guest_imports.create",
  );

  const details = await getGuestImportDetails(
    context.supabase,
    projectId,
    importSessionId,
  );

  if (!details) {
    throw new GuestImportValidationError("Guest import session was not found.");
  }

  await requireGuestImportSidePermission(
    context,
    projectId,
    details.session.import_side,
    "guest_imports.create",
  );

  const mapping: ImportColumnMapping = {};
  for (const target of importColumnTargets) {
    const value = formValue(formData, target);
    if (value) {
      mapping[target] = value;
    }
  }

  await validateGuestImportMapping(
    context.supabase,
    projectId,
    importSessionId,
    mapping,
  );

  redirect(`/platform/projects/${projectId}/guest-imports/${importSessionId}`);
}

export async function submitGuestImportAction(
  projectId: string,
  importSessionId: string,
) {
  const context = await getActionContext();
  await requireGuestImportProjectPermission(
    context,
    projectId,
    "guest_imports.submit",
  );

  const details = await getGuestImportDetails(
    context.supabase,
    projectId,
    importSessionId,
  );

  if (!details) {
    throw new GuestImportValidationError("Guest import session was not found.");
  }

  await requireGuestImportSidePermission(
    context,
    projectId,
    details.session.import_side,
    "guest_imports.submit",
  );

  await submitGuestImportSession(context.supabase, importSessionId);

  redirect(`/platform/projects/${projectId}/guest-imports/${importSessionId}`);
}

export async function reviewGuestImportRowsAction(
  projectId: string,
  importSessionId: string,
  formData: FormData,
) {
  const context = await getActionContext();
  await requireGuestImportReviewPermission(context, projectId);
  const details = await getGuestImportDetails(
    context.supabase,
    projectId,
    importSessionId,
  );

  if (!details) {
    throw new GuestImportValidationError("Guest import session was not found.");
  }

  const approvedRowIds: string[] = [];
  const heldRowIds: string[] = [];
  const rejectedRowIds: string[] = [];

  for (const rowId of formData.getAll("rowIds").map((value) => String(value))) {
    const status = rowApprovalStatusFromForm(
      formData.get(`rowStatus:${rowId}`),
    );

    if (status === "approved") {
      approvedRowIds.push(rowId);
    } else if (status === "held") {
      heldRowIds.push(rowId);
    } else if (status === "rejected") {
      rejectedRowIds.push(rowId);
    }
  }

  await reviewGuestImportRows(context.supabase, importSessionId, {
    approvedRowIds,
    heldRowIds,
    rejectedRowIds,
    reviewNotes: formValue(formData, "reviewNotes") ?? null,
  });

  redirect(`/platform/projects/${projectId}/guest-imports/${importSessionId}`);
}

export async function applyGuestImportRowsAction(
  projectId: string,
  importSessionId: string,
) {
  const context = await getActionContext();
  await requireGuestImportApplyPermission(context, projectId);
  const details = await getGuestImportDetails(
    context.supabase,
    projectId,
    importSessionId,
  );

  if (!details) {
    throw new GuestImportValidationError("Guest import session was not found.");
  }

  await applyGuestImportApprovedRows(context.supabase, importSessionId);

  redirect(`/platform/projects/${projectId}/guest-imports/${importSessionId}`);
}
