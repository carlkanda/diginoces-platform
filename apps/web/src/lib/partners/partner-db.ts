import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildPartnerDashboardView,
  type PartnerProjectApprovalStatus,
  type PartnerProjectDashboardInput,
  type PartnerProjectReviewAction,
  type PartnerStatus,
  type PartnerUserRole,
} from "@/lib/partners/partner-service";

type AnySupabase = SupabaseClient;
type BaseRow = Record<string, unknown>;

export const partnerProfileSelectColumns = [
  "id",
  "organization_name",
  "primary_contact_name",
  "contact_email",
  "contact_phone",
  "whatsapp_phone",
  "status",
  "partner_type",
  "approved_at",
  "suspended_at",
  "archived_at",
  "created_at",
  "updated_at",
] as const;

const partnerProfileSelect =
  "id, organization_name, primary_contact_name, contact_email, contact_phone, whatsapp_phone, status, partner_type, approved_at, suspended_at, archived_at, created_at, updated_at";

async function listRows<T extends BaseRow>(
  query: PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function maybeRow<T extends BaseRow>(
  query: PromiseLike<{ data: T | null; error: unknown }>,
) {
  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

async function rpcRow<T extends BaseRow>(
  query: PromiseLike<{ data: T | null; error: unknown }>,
) {
  const { data, error } = await query;

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Partner RPC did not return a row.");
  }

  return data;
}

function table(supabase: AnySupabase, name: string) {
  return supabase.from(name);
}

function normalizeProjectDashboardInput(
  row: BaseRow,
): PartnerProjectDashboardInput {
  const assignments = Array.isArray(row.assigned_partner_ids)
    ? row.assigned_partner_ids.filter(
        (value): value is string => typeof value === "string",
      )
    : [];

  return {
    approvalStatus: String(
      row.approval_status ?? "draft",
    ) as PartnerProjectApprovalStatus,
    assignedPartnerIds: assignments,
    brideName: String(row.bride_name ?? ""),
    contractStatus:
      typeof row.contract_status === "string" ? row.contract_status : null,
    eventDates: Array.isArray(row.event_dates)
      ? row.event_dates.filter(
          (value): value is string => typeof value === "string",
        )
      : [],
    groomName: String(row.groom_name ?? ""),
    paymentStatus:
      typeof row.payment_status === "string" ? row.payment_status : null,
    projectCode: String(row.project_code ?? ""),
    projectId: String(row.project_id ?? row.id),
    sourcePartnerId:
      typeof row.source_partner_id === "string" ? row.source_partner_id : null,
    status: String(row.status ?? "draft"),
  };
}

export async function listPartners(supabase: AnySupabase) {
  return listRows(
    table(supabase, "partners")
      .select(partnerProfileSelect)
      .order("created_at", { ascending: false }),
  );
}

export async function getPartnerDetails(
  supabase: AnySupabase,
  partnerId: string,
) {
  const partner = await maybeRow(
    table(supabase, "partners")
      .select(partnerProfileSelect)
      .eq("id", partnerId)
      .maybeSingle(),
  );

  if (!partner) {
    return null;
  }

  const [users, sources, submissions, assignments] = await Promise.all([
    listRows(
      table(supabase, "partner_users")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false }),
    ),
    listRows(
      table(supabase, "partner_project_sources")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false }),
    ),
    listRows(
      table(supabase, "partner_project_submissions")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false }),
    ),
    listRows(
      table(supabase, "partner_project_assignments")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false }),
    ),
  ]);

  return {
    assignments,
    partner,
    sources,
    submissions,
    users,
  };
}

export async function createPartnerProfile(
  supabase: AnySupabase,
  input: {
    actorUserId: string;
    contactEmail: string;
    contactPhone?: string | null;
    internalNotes?: string | null;
    organizationName: string;
    partnerType: string;
    primaryContactName?: string | null;
    status?: PartnerStatus;
    whatsappPhone?: string | null;
  },
) {
  const now = new Date().toISOString();
  const status = input.status ?? "active";
  const { data, error } = await table(supabase, "partners")
    .insert({
      approved_at: status === "active" ? now : null,
      approved_by: status === "active" ? input.actorUserId : null,
      contact_email: input.contactEmail,
      contact_phone: input.contactPhone ?? null,
      created_by: input.actorUserId,
      internal_notes: input.internalNotes ?? null,
      organization_name: input.organizationName,
      partner_type: input.partnerType,
      primary_contact_name: input.primaryContactName ?? null,
      status,
      updated_by: input.actorUserId,
      whatsapp_phone: input.whatsappPhone ?? null,
    })
    .select(partnerProfileSelect)
    .single();

  if (error) {
    throw error;
  }

  return data as BaseRow;
}

export async function updatePartnerStatus(
  supabase: AnySupabase,
  input: {
    actorUserId: string;
    partnerId: string;
    status: PartnerStatus;
  },
) {
  const now = new Date().toISOString();
  const { data, error } = await table(supabase, "partners")
    .update({
      approved_at: input.status === "active" ? now : undefined,
      approved_by: input.status === "active" ? input.actorUserId : undefined,
      archived_at: input.status === "archived" ? now : null,
      status: input.status,
      suspended_at: input.status === "suspended" ? now : null,
      updated_by: input.actorUserId,
    })
    .eq("id", input.partnerId)
    .select(partnerProfileSelect)
    .single();

  if (error) {
    throw error;
  }

  return data as BaseRow;
}

export async function linkPartnerUser(
  supabase: AnySupabase,
  input: {
    partnerId: string;
    role: PartnerUserRole;
    userId: string;
  },
) {
  return rpcRow(
    supabase.rpc("link_partner_user", {
      p_partner_id: input.partnerId,
      p_role: input.role,
      p_user_id: input.userId,
    }),
  );
}

export async function createPartnerProjectDraft(
  supabase: AnySupabase,
  input: {
    brideName: string;
    eventNotes?: string | null;
    groomName: string;
    partnerId: string;
    partnerNotes?: string | null;
    plannedGuestCount?: number | null;
    primaryContactEmail?: string | null;
    primaryContactPhone?: string | null;
    projectYear?: number | null;
  },
) {
  return rpcRow(
    supabase.rpc("create_partner_project_draft", {
      p_bride_name: input.brideName,
      p_event_notes: input.eventNotes ?? null,
      p_groom_name: input.groomName,
      p_partner_id: input.partnerId,
      p_partner_notes: input.partnerNotes ?? null,
      p_planned_guest_count: input.plannedGuestCount ?? null,
      p_primary_contact_email: input.primaryContactEmail ?? null,
      p_primary_contact_phone: input.primaryContactPhone ?? null,
      p_project_year: input.projectYear ?? null,
    }),
  );
}

export async function submitPartnerProjectSubmission(
  supabase: AnySupabase,
  submissionId: string,
) {
  return rpcRow(
    supabase.rpc("submit_partner_project_submission", {
      p_submission_id: submissionId,
    }),
  );
}

export async function reviewPartnerProjectSubmissionRecord(
  supabase: AnySupabase,
  input: {
    action: PartnerProjectReviewAction;
    reason: string;
    submissionId: string;
  },
) {
  return rpcRow(
    supabase.rpc("review_partner_project_submission", {
      p_action: input.action,
      p_reason: input.reason,
      p_submission_id: input.submissionId,
    }),
  );
}

export async function listPartnerReviewQueue(supabase: AnySupabase) {
  return listRows(
    table(supabase, "partner_project_submissions")
      .select("*, partners(organization_name)")
      .in("status", ["submitted", "changes_requested"])
      .order("created_at", { ascending: false }),
  );
}

export async function listProjectComments(
  supabase: AnySupabase,
  projectId: string,
) {
  return listRows(
    table(supabase, "project_comments")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
  );
}

export async function createProjectComment(
  supabase: AnySupabase,
  input: {
    body: string;
    projectId: string;
    visibility?: "internal_only" | "partner_visible";
  },
) {
  return rpcRow(
    supabase.rpc("create_project_comment", {
      p_body: input.body,
      p_project_id: input.projectId,
      p_visibility: input.visibility ?? "partner_visible",
    }),
  );
}

function nestedProject(row: BaseRow) {
  const project = Array.isArray(row.wedding_projects)
    ? row.wedding_projects[0]
    : row.wedding_projects;

  return project && typeof project === "object" ? (project as BaseRow) : null;
}

function projectField(project: BaseRow | null, fieldName: string) {
  return project && typeof project[fieldName] === "string"
    ? project[fieldName]
    : "";
}

async function listEventDatesByProject(
  supabase: AnySupabase,
  projectIds: string[],
) {
  const eventDatesByProject = new Map<string, string[]>();
  const uniqueProjectIds = Array.from(new Set(projectIds)).filter(Boolean);

  if (uniqueProjectIds.length === 0) {
    return eventDatesByProject;
  }

  const rows = await listRows(
    table(supabase, "events")
      .select("project_id, event_date")
      .in("project_id", uniqueProjectIds)
      .not("event_date", "is", null)
      .order("event_date", { ascending: true }),
  );

  for (const row of rows) {
    const projectId =
      typeof row.project_id === "string" ? row.project_id : undefined;
    const eventDate =
      typeof row.event_date === "string" ? row.event_date : undefined;

    if (!projectId || !eventDate) {
      continue;
    }

    const existingDates = eventDatesByProject.get(projectId);

    if (existingDates) {
      existingDates.push(eventDate);
    } else {
      eventDatesByProject.set(projectId, [eventDate]);
    }
  }

  return eventDatesByProject;
}

export async function getPartnerDashboardOverview(
  supabase: AnySupabase,
  partnerId: string,
) {
  const [sourceRows, assignmentRows] = await Promise.all([
    listRows(
      table(supabase, "partner_project_sources")
        .select(
          "approval_status, partner_id, project_id, wedding_projects(id, project_code, bride_name, groom_name, status)",
        )
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false }),
    ),
    listRows(
      table(supabase, "partner_project_assignments")
        .select(
          "partner_id, project_id, status, wedding_projects(id, project_code, bride_name, groom_name, status)",
        )
        .eq("partner_id", partnerId)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
    ),
  ]);
  const projectIds = [
    ...sourceRows
      .map((row) => row.project_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
    ...assignmentRows
      .map((row) => row.project_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  ];
  const eventDatesByProject = await listEventDatesByProject(
    supabase,
    projectIds,
  );
  const projectsById = new Map<string, PartnerProjectDashboardInput>();

  for (const row of sourceRows) {
    const projectId = String(row.project_id ?? "");

    if (!projectId) {
      continue;
    }

    const project = nestedProject(row);

    projectsById.set(
      projectId,
      normalizeProjectDashboardInput({
        approval_status: row.approval_status,
        assigned_partner_ids: [],
        bride_name: projectField(project, "bride_name"),
        event_dates: eventDatesByProject.get(projectId) ?? [],
        groom_name: projectField(project, "groom_name"),
        project_code: projectField(project, "project_code"),
        project_id: projectId,
        source_partner_id: row.partner_id,
        status: projectField(project, "status") || "draft",
      }),
    );
  }

  for (const row of assignmentRows) {
    const projectId = String(row.project_id ?? "");

    if (!projectId) {
      continue;
    }

    const existing = projectsById.get(projectId);

    if (existing) {
      if (!existing.assignedPartnerIds.includes(partnerId)) {
        existing.assignedPartnerIds.push(partnerId);
      }
      continue;
    }

    const project = nestedProject(row);
    projectsById.set(
      projectId,
      normalizeProjectDashboardInput({
        approval_status: "approved",
        assigned_partner_ids: [partnerId],
        bride_name: projectField(project, "bride_name"),
        event_dates: eventDatesByProject.get(projectId) ?? [],
        groom_name: projectField(project, "groom_name"),
        project_code: projectField(project, "project_code"),
        project_id: projectId,
        source_partner_id: null,
        status: projectField(project, "status") || "active",
      }),
    );
  }

  return buildPartnerDashboardView({
    now: new Date().toISOString(),
    partnerId,
    projects: Array.from(projectsById.values()),
  });
}
