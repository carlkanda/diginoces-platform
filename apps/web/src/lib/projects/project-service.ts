import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type ProjectRow =
  Database["public"]["Tables"]["wedding_projects"]["Row"];
export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type WorkflowTaskRow =
  Database["public"]["Tables"]["workflow_tasks"]["Row"];

export type ProjectDetails = {
  events: EventRow[];
  project: ProjectRow;
  workflowTasks: WorkflowTaskRow[];
};

export type EventDetails = {
  event: EventRow;
  project: ProjectRow;
  workflowTasks: WorkflowTaskRow[];
};

export type CreateProjectInput = {
  brideName: string;
  groomName: string;
  internalNotes?: string;
  preferredLanguage?: string;
  primaryContactEmail?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  projectYear?: number;
  timelineNotes?: string;
};

export type UpdateProjectInput = Partial<
  Omit<CreateProjectInput, "projectYear"> & {
    projectCode: string;
    projectYear: number;
    status: Database["public"]["Enums"]["project_lifecycle_status"];
  }
>;

export type CreateEventInput = {
  endsAt?: string;
  eventDate?: string;
  eventType: Database["public"]["Enums"]["event_type"];
  name: string;
  startsAt?: string;
  venueAddress?: string;
  venueName?: string;
};

export type UpdateEventInput = Partial<
  CreateEventInput & {
    eventCode: string;
    status: Database["public"]["Enums"]["event_lifecycle_status"];
  }
>;

export class ProjectValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectValidationError";
  }
}

const eventTypes = new Set<Database["public"]["Enums"]["event_type"]>([
  "brunch",
  "civil",
  "customary",
  "other",
  "reception",
  "religious",
]);

const projectStatuses = new Set<
  Database["public"]["Enums"]["project_lifecycle_status"]
>([
  "active",
  "approved",
  "archived",
  "completed",
  "draft",
  "event_operations",
  "lead",
  "ready_for_invitations",
  "submitted",
]);

const eventStatuses = new Set<
  Database["public"]["Enums"]["event_lifecycle_status"]
>([
  "archived",
  "cancelled",
  "completed",
  "draft",
  "in_progress",
  "ready",
  "scheduled",
]);

function asRecord(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ProjectValidationError("Request body must be a JSON object.");
  }

  return payload as Record<string, unknown>;
}

function requiredText(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ProjectValidationError(`${fieldName} is required.`);
  }

  return value.trim();
}

function optionalText(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ProjectValidationError("Optional text fields must be strings.");
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalYear(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 2020 ||
    value > 2100
  ) {
    throw new ProjectValidationError(
      "projectYear must be between 2020 and 2100.",
    );
  }

  return value;
}

export function parseCreateProjectPayload(
  payload: unknown,
): CreateProjectInput {
  const body = asRecord(payload);

  return {
    brideName: requiredText(body.brideName, "brideName"),
    groomName: requiredText(body.groomName, "groomName"),
    internalNotes: optionalText(body.internalNotes),
    preferredLanguage: optionalText(body.preferredLanguage),
    primaryContactEmail: optionalText(body.primaryContactEmail),
    primaryContactName: optionalText(body.primaryContactName),
    primaryContactPhone: optionalText(body.primaryContactPhone),
    projectYear: optionalYear(body.projectYear),
    timelineNotes: optionalText(body.timelineNotes),
  };
}

export function parseUpdateProjectPayload(
  payload: unknown,
): UpdateProjectInput {
  const body = asRecord(payload);
  const input: UpdateProjectInput = {};

  if (body.brideName !== undefined) {
    input.brideName = requiredText(body.brideName, "brideName");
  }

  if (body.groomName !== undefined) {
    input.groomName = requiredText(body.groomName, "groomName");
  }

  if (body.projectCode !== undefined) {
    input.projectCode = requiredText(
      body.projectCode,
      "projectCode",
    ).toUpperCase();
  }

  if (body.projectYear !== undefined) {
    input.projectYear = optionalYear(body.projectYear);
  }

  if (body.status !== undefined) {
    if (
      typeof body.status !== "string" ||
      !projectStatuses.has(
        body.status as Database["public"]["Enums"]["project_lifecycle_status"],
      )
    ) {
      throw new ProjectValidationError(
        "status is not a supported project status.",
      );
    }

    input.status =
      body.status as Database["public"]["Enums"]["project_lifecycle_status"];
  }

  input.internalNotes = optionalText(body.internalNotes);
  input.preferredLanguage = optionalText(body.preferredLanguage);
  input.primaryContactEmail = optionalText(body.primaryContactEmail);
  input.primaryContactName = optionalText(body.primaryContactName);
  input.primaryContactPhone = optionalText(body.primaryContactPhone);
  input.timelineNotes = optionalText(body.timelineNotes);

  return input;
}

export function parseCreateEventPayload(payload: unknown): CreateEventInput {
  const body = asRecord(payload);

  if (
    typeof body.eventType !== "string" ||
    !eventTypes.has(body.eventType as Database["public"]["Enums"]["event_type"])
  ) {
    throw new ProjectValidationError("eventType is not supported.");
  }

  return {
    endsAt: optionalText(body.endsAt),
    eventDate: optionalText(body.eventDate),
    eventType: body.eventType as Database["public"]["Enums"]["event_type"],
    name: requiredText(body.name, "name"),
    startsAt: optionalText(body.startsAt),
    venueAddress: optionalText(body.venueAddress),
    venueName: optionalText(body.venueName),
  };
}

export function parseUpdateEventPayload(payload: unknown): UpdateEventInput {
  const body = asRecord(payload);
  const input: UpdateEventInput = {};

  if (body.name !== undefined) {
    input.name = requiredText(body.name, "name");
  }

  if (body.eventCode !== undefined) {
    input.eventCode = requiredText(body.eventCode, "eventCode").toUpperCase();
  }

  if (body.eventType !== undefined) {
    if (
      typeof body.eventType !== "string" ||
      !eventTypes.has(
        body.eventType as Database["public"]["Enums"]["event_type"],
      )
    ) {
      throw new ProjectValidationError("eventType is not supported.");
    }

    input.eventType =
      body.eventType as Database["public"]["Enums"]["event_type"];
  }

  if (body.status !== undefined) {
    if (
      typeof body.status !== "string" ||
      !eventStatuses.has(
        body.status as Database["public"]["Enums"]["event_lifecycle_status"],
      )
    ) {
      throw new ProjectValidationError(
        "status is not a supported event status.",
      );
    }

    input.status =
      body.status as Database["public"]["Enums"]["event_lifecycle_status"];
  }

  input.endsAt = optionalText(body.endsAt);
  input.eventDate = optionalText(body.eventDate);
  input.startsAt = optionalText(body.startsAt);
  input.venueAddress = optionalText(body.venueAddress);
  input.venueName = optionalText(body.venueName);

  return input;
}

export async function listProjects(
  supabase: SupabaseClient<Database>,
): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from("wedding_projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function getProjectDetails(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<ProjectDetails | null> {
  const { data: project, error: projectError } = await supabase
    .from("wedding_projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    throw projectError;
  }

  if (!project) {
    return null;
  }

  const [eventsResult, workflowResult] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("project_id", projectId)
      .order("event_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("workflow_tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true }),
  ]);

  if (eventsResult.error) {
    throw eventsResult.error;
  }

  if (workflowResult.error) {
    throw workflowResult.error;
  }

  return {
    events: eventsResult.data,
    project,
    workflowTasks: workflowResult.data,
  };
}

export async function getEventDetails(
  supabase: SupabaseClient<Database>,
  eventId: string,
): Promise<EventDetails | null> {
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    throw eventError;
  }

  if (!event) {
    return null;
  }

  const [projectResult, workflowResult] = await Promise.all([
    supabase
      .from("wedding_projects")
      .select("*")
      .eq("id", event.project_id)
      .maybeSingle(),
    supabase
      .from("workflow_tasks")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true }),
  ]);

  if (projectResult.error) {
    throw projectResult.error;
  }

  if (workflowResult.error) {
    throw workflowResult.error;
  }

  if (!projectResult.data) {
    return null;
  }

  return {
    event,
    project: projectResult.data,
    workflowTasks: workflowResult.data,
  };
}

export async function createProject(
  supabase: SupabaseClient<Database>,
  input: CreateProjectInput,
  actorUserId: string,
) {
  const { data, error } = await supabase
    .from("wedding_projects")
    .insert({
      bride_name: input.brideName,
      created_by: actorUserId,
      groom_name: input.groomName,
      internal_notes: input.internalNotes,
      preferred_language: input.preferredLanguage,
      primary_contact_email: input.primaryContactEmail,
      primary_contact_name: input.primaryContactName,
      primary_contact_phone: input.primaryContactPhone,
      project_year: input.projectYear,
      timeline_notes: input.timelineNotes,
      updated_by: actorUserId,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProject(
  supabase: SupabaseClient<Database>,
  projectId: string,
  input: UpdateProjectInput,
  actorUserId: string,
) {
  const { data, error } = await supabase
    .from("wedding_projects")
    .update({
      bride_name: input.brideName,
      groom_name: input.groomName,
      internal_notes: input.internalNotes,
      preferred_language: input.preferredLanguage,
      primary_contact_email: input.primaryContactEmail,
      primary_contact_name: input.primaryContactName,
      primary_contact_phone: input.primaryContactPhone,
      project_code: input.projectCode,
      project_year: input.projectYear,
      status: input.status,
      timeline_notes: input.timelineNotes,
      updated_by: actorUserId,
    })
    .eq("id", projectId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createEvent(
  supabase: SupabaseClient<Database>,
  projectId: string,
  input: CreateEventInput,
  actorUserId: string,
) {
  const { data, error } = await supabase
    .from("events")
    .insert({
      created_by: actorUserId,
      ends_at: input.endsAt,
      event_date: input.eventDate,
      event_type: input.eventType,
      name: input.name,
      project_id: projectId,
      starts_at: input.startsAt,
      updated_by: actorUserId,
      venue_address: input.venueAddress,
      venue_name: input.venueName,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateEvent(
  supabase: SupabaseClient<Database>,
  eventId: string,
  input: UpdateEventInput,
  actorUserId: string,
) {
  const { data, error } = await supabase
    .from("events")
    .update({
      ends_at: input.endsAt,
      event_code: input.eventCode,
      event_date: input.eventDate,
      event_type: input.eventType,
      name: input.name,
      starts_at: input.startsAt,
      status: input.status,
      updated_by: actorUserId,
      venue_address: input.venueAddress,
      venue_name: input.venueName,
    })
    .eq("id", eventId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
