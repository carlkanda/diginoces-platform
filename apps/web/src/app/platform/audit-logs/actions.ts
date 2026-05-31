"use server";

import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import {
  getReportingPermissionSet,
  requireAuditExportPermission,
} from "@/lib/reports/report-api";
import { generateReportCsv } from "@/lib/reports/report-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formText(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function auditLogsPath(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return `/platform/audit-logs${query ? `?${query}` : ""}`;
}

export async function exportAuditLogsAction(formData: FormData) {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect("/login?next=/platform/audit-logs");
  }

  if (authContext.status === "not_configured") {
    redirect(auditLogsPath({ auditError: "supabase_not_configured" }));
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };
  const filters = {
    action: formText(formData, "action"),
    actorUserId: formText(formData, "actorUserId"),
    from: formText(formData, "from"),
    objectType: formText(formData, "objectType"),
    search: formText(formData, "search"),
    to: formText(formData, "to"),
  };
  let generatedId: string | undefined;

  try {
    await requireAuditExportPermission(context);
    const permissions = await getReportingPermissionSet(context);
    const result = await generateReportCsv(supabase, {
      actorUserId: context.user.id,
      filters,
      permissions,
      reportKey: "audit_log_export",
      scope: "global",
    });
    generatedId =
      result.exportRecord.id == null
        ? undefined
        : String(result.exportRecord.id);
  } catch {
    redirect(
      auditLogsPath({
        auditError: "audit_export_failed",
      }),
    );
  }

  redirect(
    auditLogsPath({
      action: filters.action,
      actorUserId: filters.actorUserId,
      auditStatus: "exported",
      from: filters.from,
      objectType: filters.objectType,
      search: filters.search,
      to: filters.to,
      generated: generatedId,
    }),
  );
}
