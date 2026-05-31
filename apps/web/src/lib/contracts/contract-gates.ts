import {
  hasProjectPermission,
  ProjectAccessError,
} from "@/lib/projects/project-api";
import type { ProjectApiContext } from "@/lib/projects/project-api";

export function guestListGateAllowsAccess(status: string | null | undefined) {
  return status === "contract_approved";
}

export async function requireGuestListContractGateOpen(
  context: ProjectApiContext,
  projectId: string,
) {
  if (await hasProjectPermission(context, projectId, "contracts.generate")) {
    return;
  }

  const { data, error } = await context.supabase
    .from("wedding_projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const status = (data as { guest_list_access_status?: string } | null)
    ?.guest_list_access_status;

  if (!guestListGateAllowsAccess(status)) {
    throw new ProjectAccessError(
      "Guest list is locked pending contract approval.",
      403,
    );
  }
}
