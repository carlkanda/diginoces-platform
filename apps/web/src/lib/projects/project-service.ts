import type { SupabaseClient } from "@supabase/supabase-js";
import {
  eventLifecycleOptions,
  eventTypeOptions,
  projectLifecycleOptions,
} from "@/lib/projects/project-foundation";
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

type OptionalNullableText = string | null | undefined;

export type CreateProjectInput = {
  brideName: string;
  groomName: string;
  internalNotes?: OptionalNullableText;
  preferredLanguage?: OptionalNullableText;
  primaryContactEmail?: OptionalNullableText;
  primaryContactName?: OptionalNullableText;
  primaryContactPhone?: OptionalNullableText;
  projectYear?: number;
  timelineNotes?: OptionalNullableText;
};

export type UpdateProjectInput = Partial<
  Omit<CreateProjectInput, "projectYear"> & {
    projectCode: string;
    projectYear: number;
    status: Database["public"]["Enums"]["project_lifecycle_status"];
  }
>;

export type CreateEventInput = {
  endsAt?: OptionalNullableText;
  eventDate?: OptionalNullableText;
  eventType: Database["public"]["Enums"]["event_type"];
  name: string;
  startsAt?: OptionalNullableText;
  venueAddress?: OptionalNullableText;
  venueName?: OptionalNullableText;
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

const eventTypes = new Set<Database["public"]["Enums"]["event_type"]>(
  eventTypeOptions.map((option) => option.value),
);

const projectStatuses = new Set<
  Database["public"]["Enums"]["project_lifecycle_status"]
>(projectLifecycleOptions.map((option) => option.value));

const eventStatuses = new Set<
  Database["public"]["Enums"]["event_lifecycle_status"]
>(eventLifecycleOptions.map((option) => option.value));

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

function optionalText(value: unknown): OptionalNullableText {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ProjectValidationError("Optional text fields must be strings.");
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalDate(value: unknown, fieldName: string): OptionalNullableText {
  const normalized = optionalText(value);

  if (normalized === undefined || normalized === null) {
    return normalized;
  }

  const match = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/.exec(
    normalized,
  );

  if (!match?.groups) {
    throw new ProjectValidationError(`${fieldName} must be an ISO date.`);
  }

  const year = Number(match.groups.year);
  const month = Number(match.groups.month);
  const day = Number(match.groups.day);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new ProjectValidationError(`${fieldName} must be a valid ISO date.`);
  }

  return normalized;
}

function optionalTime(value: unknown, fieldName: string): OptionalNullableText {
  const normalized = optionalText(value);

  if (normalized === undefined || normalized === null) {
    return normalized;
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(normalized)) {
    throw new ProjectValidationError(`${fieldName} must be a valid time.`);
  }

  return normalized;
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

function optionalFormYear(value: unknown) {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim().length === 0)
  ) {
    return undefined;
  }

  return optionalYear(typeof value === "string" ? Number(value) : value);
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

export function parseCreateProjectFormPayload(
  payload: unknown,
): CreateProjectInput {
  const body = asRecord(payload);

  return parseCreateProjectPayload({
    ...body,
    projectYear: optionalFormYear(body.projectYear),
  });
}

export function parseUpdateProjectFormPayload(
  payload: unknown,
): UpdateProjectInput {
  const body = asRecord(payload);
  const nullableTextFields = [
    "internalNotes",
    "preferredLanguage",
    "primaryContactEmail",
    "primaryContactName",
    "primaryContactPhone",
    "timelineNotes",
  ] as const;
  const normalized = { ...body };

  for (const field of nullableTextFields) {
    if (normalized[field] === "") {
      normalized[field] = null;
    }
  }

  if (normalized.projectYear !== undefined) {
    normalized.projectYear = optionalFormYear(normalized.projectYear);
  }

  if (normalized.projectCode === "") {
    delete normalized.projectCode;
  }

  return parseUpdateProjectPayload(normalized);
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

  const optionalProjectTextFields = [
    "internalNotes",
    "preferredLanguage",
    "primaryContactEmail",
    "primaryContactName",
    "primaryContactPhone",
    "timelineNotes",
  ] as const;

  for (const field of optionalProjectTextFields) {
    if (body[field] !== undefined) {
      input[field] = optionalText(body[field]);
    }
  }

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
    endsAt: optionalTime(body.endsAt, "endsAt"),
    eventDate: optionalDate(body.eventDate, "eventDate"),
    eventType: body.eventType as Database["public"]["Enums"]["event_type"],
    name: requiredText(body.name, "name"),
    startsAt: optionalTime(body.startsAt, "startsAt"),
    venueAddress: optionalText(body.venueAddress),
    venueName: optionalText(body.venueName),
  };
}

export function parseCreateEventFormPayload(
  payload: unknown,
): CreateEventInput {
  return parseCreateEventPayload(payload);
}

export function parseUpdateEventPayload(payload: unknown): UpdateEventInput {
  const body = asRecord(payload);
  const input: UpdateEventInput = {};

  if (body.name !== undefined) {
    input.name = requiredText(body.name, "name");
  }

  if (body.eventCode !== undefined) {
    if (body.eventCode === null) {
      throw new ProjectValidationError("eventCode cannot be cleared.");
    }

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

  if (body.endsAt !== undefined) {
    input.endsAt = optionalTime(body.endsAt, "endsAt");
  }

  if (body.eventDate !== undefined) {
    input.eventDate = optionalDate(body.eventDate, "eventDate");
  }

  if (body.startsAt !== undefined) {
    input.startsAt = optionalTime(body.startsAt, "startsAt");
  }

  const optionalEventTextFields = ["venueAddress", "venueName"] as const;

  for (const field of optionalEventTextFields) {
    if (body[field] !== undefined) {
      input[field] = optionalText(body[field]);
    }
  }

  return input;
}

export function parseUpdateEventFormPayload(
  payload: unknown,
): UpdateEventInput {
  const body = asRecord(payload);
  const nullableTextFields = [
    "endsAt",
    "eventDate",
    "startsAt",
    "venueAddress",
    "venueName",
  ] as const;
  const normalized = { ...body };

  for (const field of nullableTextFields) {
    if (normalized[field] === "") {
      normalized[field] = null;
    }
  }

  if (normalized.eventCode === "") {
    delete normalized.eventCode;
  }

  return parseUpdateEventPayload(normalized);
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

export async function projectExists(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("wedding_projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function listProjectEvents(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("project_id", projectId)
    .order("event_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

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
  // Generated Supabase types cannot infer trigger-generated project codes.
  const payload = {
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
  } as Database["public"]["Tables"]["wedding_projects"]["Insert"];

  const { data, error } = await supabase
    .from("wedding_projects")
    .insert(payload)
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
  const updates: Database["public"]["Tables"]["wedding_projects"]["Update"] = {
    updated_by: actorUserId,
  };

  if (input.brideName !== undefined) {
    updates.bride_name = input.brideName;
  }

  if (input.groomName !== undefined) {
    updates.groom_name = input.groomName;
  }

  if (input.internalNotes !== undefined) {
    updates.internal_notes = input.internalNotes;
  }

  if (input.preferredLanguage !== undefined) {
    updates.preferred_language = input.preferredLanguage;
  }

  if (input.primaryContactEmail !== undefined) {
    updates.primary_contact_email = input.primaryContactEmail;
  }

  if (input.primaryContactName !== undefined) {
    updates.primary_contact_name = input.primaryContactName;
  }

  if (input.primaryContactPhone !== undefined) {
    updates.primary_contact_phone = input.primaryContactPhone;
  }

  if (input.projectCode !== undefined) {
    updates.project_code = input.projectCode;
  }

  if (input.projectYear !== undefined) {
    updates.project_year = input.projectYear;
  }

  if (input.status !== undefined) {
    updates.status = input.status;
  }

  if (input.timelineNotes !== undefined) {
    updates.timeline_notes = input.timelineNotes;
  }

  const { data, error } = await supabase
    .from("wedding_projects")
    .update(updates)
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
  // Generated Supabase types cannot infer trigger-generated event codes.
  const payload = {
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
  } as Database["public"]["Tables"]["events"]["Insert"];

  const { data, error } = await supabase
    .from("events")
    .insert(payload)
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
  const updates: Database["public"]["Tables"]["events"]["Update"] = {
    updated_by: actorUserId,
  };

  if (input.endsAt !== undefined) {
    updates.ends_at = input.endsAt;
  }

  if (input.eventCode !== undefined) {
    updates.event_code = input.eventCode;
  }

  if (input.eventDate !== undefined) {
    updates.event_date = input.eventDate;
  }

  if (input.eventType !== undefined) {
    updates.event_type = input.eventType;
  }

  if (input.name !== undefined) {
    updates.name = input.name;
  }

  if (input.startsAt !== undefined) {
    updates.starts_at = input.startsAt;
  }

  if (input.status !== undefined) {
    updates.status = input.status;
  }

  if (input.venueAddress !== undefined) {
    updates.venue_address = input.venueAddress;
  }

  if (input.venueName !== undefined) {
    updates.venue_name = input.venueName;
  }

  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", eventId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
