"use server";

import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  getReportingPermissionSet,
  requireAuditExportPermission,
  requireEventReportExportPermission,
  requireProjectReportExportPermission,
} from "@/lib/reports/report-api";
import { generateReportCsv } from "@/lib/reports/report-db";
import { parseReportKey, parseReportScope } from "@/lib/reports/report-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formText(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function reportsPath(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return `/platform/reports${query ? `?${query}` : ""}`;
}

async function getEventProjectId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  eventId: string,
) {
  const { data, error } = await supabase
    .from("events")
    .select("project_id")
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new ProjectAccessError("Event was not found.", 404);
  }

  return data.project_id;
}

export async function exportReportAction(formData: FormData) {
  const authContext = await getAuthContext();
  const reportKey = parseReportKey(formText(formData, "reportKey"));
  const scope = parseReportScope(formText(formData, "scope"));
  const eventId = formText(formData, "eventId");
  let projectId = formText(formData, "projectId");

  if (authContext.status === "anonymous") {
    redirect("/login?next=/platform/reports");
  }

  if (authContext.status === "not_configured") {
    redirect(reportsPath({ reportError: "supabase_not_configured" }));
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    if (scope === "event") {
      if (!eventId) {
        throw new ProjectAccessError("Event report scope is required.", 400);
      }

      await requireEventReportExportPermission(context, eventId);
      projectId = await getEventProjectId(supabase, eventId);
    } else if (scope === "project") {
      if (!projectId) {
        throw new ProjectAccessError("Project report scope is required.", 400);
      }

      await requireProjectReportExportPermission(context, projectId);
    } else {
      await requireAuditExportPermission(context);
    }

    const permissions = await getReportingPermissionSet(context, {
      eventId,
      projectId,
    });
    const result = await generateReportCsv(supabase, {
      actorUserId: context.user.id,
      eventId,
      filters: {},
      permissions,
      projectId,
      reportKey,
      scope,
    });

    redirect(
      reportsPath({
        eventId,
        generated: String(result.exportRecord.id),
        projectId,
        reportStatus: "generated",
      }),
    );
  } catch (error) {
    const reportError =
      error instanceof ProjectAccessError
        ? "permission_denied"
        : "report_export_failed";

    redirect(
      reportsPath({
        eventId,
        projectId,
        reportError,
      }),
    );
  }
}
