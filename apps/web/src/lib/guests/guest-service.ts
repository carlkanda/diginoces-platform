import {
  hasScopedPermission,
  type PermissionTarget,
} from "@/lib/projects/project-permissions";
import type { RoleAssignment } from "@/lib/security/permissions";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export class GuestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuestValidationError";
  }
}

export type GuestSide = Database["public"]["Enums"]["guest_side"];
export type GuestRow = Database["public"]["Tables"]["guests"]["Row"];
export type GuestTitleTypeRow =
  Database["public"]["Tables"]["guest_title_types"]["Row"];
export type GuestTagRow = Database["public"]["Tables"]["guest_tags"]["Row"];
export type GuestEventAssignmentRow =
  Database["public"]["Tables"]["guest_event_assignments"]["Row"];
export type GuestDuplicateCandidateRow =
  Database["public"]["Tables"]["guest_duplicate_candidates"]["Row"];

export type GuestEventAssignmentSummary = {
  eventId: string;
  guestId: string;
  invited: boolean;
};

export type GuestTitleTypeSummary = {
  defaultGuestCount: number;
  id: string;
  label: string;
  slug: string;
};

export type GuestFoundationRecord = {
  displayName: string;
  eventAssignments: GuestEventAssignmentSummary[];
  guestSide: GuestSide;
  guestTitleTypeId: string | null;
  id: string;
  isActive: boolean;
  isPrintedOnly: boolean;
  normalizedName: string;
  projectId: string;
  titleType?: GuestTitleTypeSummary | null;
  whatsappNumber: string | null;
};

export type CreateGuestInput = {
  displayName: string;
  eventIds?: string[];
  guestSide: GuestSide;
  guestTitleTypeId: string;
  internalNotes?: string | null;
  isPrintedOnly?: boolean;
  preferredLanguage?: string | null;
  tagIds?: string[];
  whatsappNumber?: string | null;
};

export type UpdateGuestInput = Partial<
  Omit<CreateGuestInput, "guestTitleTypeId"> & {
    guestTitleTypeId: string | null;
    isActive: boolean;
  }
>;

export type GuestListFilters = {
  eventId?: string;
  side?: GuestSide | "all";
};

export type GuestValidationIssue = {
  code:
    | "missing_display_name"
    | "missing_event_assignment"
    | "missing_side"
    | "missing_title_type";
  message: string;
  requirementIds: string[];
};

export type GuestDuplicateCandidate = {
  matchedGuestId: string;
  reason: "normalized_name" | "title_and_name" | "whatsapp_number";
  requirementIds: string[];
};

const guestSides = new Set<GuestSide>(["bride", "groom", "both"]);

export const defaultGuestTitleTypes = [
  {
    defaultGuestCount: 1,
    label: "Mr.",
    requiresAdminApproval: false,
    slug: "mr",
  },
  {
    defaultGuestCount: 1,
    label: "Mme.",
    requiresAdminApproval: false,
    slug: "mme",
  },
  {
    defaultGuestCount: 1,
    label: "Mlle.",
    requiresAdminApproval: false,
    slug: "mlle",
  },
  {
    defaultGuestCount: 2,
    label: "Couple",
    requiresAdminApproval: true,
    slug: "couple",
  },
] as const;

export const defaultGuestTags = [
  "family",
  "friends",
  "colleagues",
  "vip",
  "protocol",
  "printed_invitation",
  "digital_invitation",
  "child",
  "special_attention",
  "follow_up_needed",
] as const;

function asRecord(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new GuestValidationError("Request body must be a JSON object.");
  }

  return payload as Record<string, unknown>;
}

function requiredText(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new GuestValidationError(`${fieldName} is required.`);
  }

  return value.trim();
}

function optionalText(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new GuestValidationError("Optional text fields must be strings.");
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalBoolean(value: unknown, fieldName: string) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new GuestValidationError(`${fieldName} must be true or false.`);
  }

  return value;
}

function optionalStringArray(value: unknown, fieldName: string) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new GuestValidationError(`${fieldName} must be an array of strings.`);
  }

  return [...new Set(value.map((item) => item.trim()).filter(Boolean))];
}

function requiredGuestSide(value: unknown) {
  if (typeof value !== "string" || !guestSides.has(value as GuestSide)) {
    throw new GuestValidationError("guestSide is not supported.");
  }

  return value as GuestSide;
}

function optionalGuestSide(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return requiredGuestSide(value);
}

export function normalizeGuestName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function parseCreateGuestPayload(payload: unknown): CreateGuestInput {
  const body = asRecord(payload);

  return {
    displayName: requiredText(body.displayName, "displayName"),
    eventIds: optionalStringArray(body.eventIds, "eventIds"),
    guestSide: requiredGuestSide(body.guestSide),
    guestTitleTypeId: requiredText(body.guestTitleTypeId, "guestTitleTypeId"),
    internalNotes: optionalText(body.internalNotes),
    isPrintedOnly: optionalBoolean(body.isPrintedOnly, "isPrintedOnly"),
    preferredLanguage: optionalText(body.preferredLanguage),
    tagIds: optionalStringArray(body.tagIds, "tagIds"),
    whatsappNumber: optionalText(body.whatsappNumber),
  };
}

export function parseUpdateGuestPayload(payload: unknown): UpdateGuestInput {
  const body = asRecord(payload);
  const input: UpdateGuestInput = {};

  if (body.displayName !== undefined) {
    input.displayName = requiredText(body.displayName, "displayName");
  }

  if (body.guestSide !== undefined) {
    input.guestSide = optionalGuestSide(body.guestSide);
  }

  if (body.guestTitleTypeId !== undefined) {
    input.guestTitleTypeId =
      body.guestTitleTypeId === null
        ? null
        : requiredText(body.guestTitleTypeId, "guestTitleTypeId");
  }

  if (body.isActive !== undefined) {
    input.isActive = optionalBoolean(body.isActive, "isActive");
  }

  if (body.isPrintedOnly !== undefined) {
    input.isPrintedOnly = optionalBoolean(body.isPrintedOnly, "isPrintedOnly");
  }

  const optionalTextFields = [
    "internalNotes",
    "preferredLanguage",
    "whatsappNumber",
  ] as const;

  for (const field of optionalTextFields) {
    if (body[field] !== undefined) {
      input[field] = optionalText(body[field]);
    }
  }

  if (body.eventIds !== undefined) {
    input.eventIds = optionalStringArray(body.eventIds, "eventIds");
  }

  if (body.tagIds !== undefined) {
    input.tagIds = optionalStringArray(body.tagIds, "tagIds");
  }

  return input;
}

export function filterGuests<T extends GuestFoundationRecord>(
  guests: T[],
  filters: GuestListFilters,
) {
  return guests.filter((guest) => {
    const sideMatches =
      !filters.side ||
      filters.side === "all" ||
      guest.guestSide === filters.side ||
      guest.guestSide === "both";
    const eventMatches =
      !filters.eventId ||
      guest.eventAssignments.some(
        (assignment) => assignment.eventId === filters.eventId,
      );

    return sideMatches && eventMatches;
  });
}

function normalizeWhatsapp(value: string | null | undefined) {
  const normalized = value?.replace(/\D+/g, "") ?? "";
  return normalized.length > 0 ? normalized : null;
}

export function detectGuestDuplicateCandidates(
  guest: GuestFoundationRecord,
  existingGuests: GuestFoundationRecord[],
): GuestDuplicateCandidate[] {
  const normalizedName = normalizeGuestName(guest.displayName);
  const normalizedWhatsapp = normalizeWhatsapp(guest.whatsappNumber);

  return existingGuests.flatMap((existingGuest) => {
    if (
      existingGuest.id === guest.id ||
      existingGuest.projectId !== guest.projectId
    ) {
      return [];
    }

    const candidates: GuestDuplicateCandidate[] = [];

    if (
      normalizedWhatsapp &&
      normalizedWhatsapp === normalizeWhatsapp(existingGuest.whatsappNumber)
    ) {
      candidates.push({
        matchedGuestId: existingGuest.id,
        reason: "whatsapp_number",
        requirementIds: ["GM-008"],
      });
    }

    if (normalizedName === existingGuest.normalizedName) {
      candidates.push({
        matchedGuestId: existingGuest.id,
        reason: "normalized_name",
        requirementIds: ["GM-008"],
      });
    }

    if (
      guest.guestTitleTypeId &&
      guest.guestTitleTypeId === existingGuest.guestTitleTypeId &&
      normalizedName === existingGuest.normalizedName
    ) {
      candidates.push({
        matchedGuestId: existingGuest.id,
        reason: "title_and_name",
        requirementIds: ["GM-008", "GM-007"],
      });
    }

    return candidates;
  });
}

export function validateGuestForFoundation(
  guest: GuestFoundationRecord,
): GuestValidationIssue[] {
  const issues: GuestValidationIssue[] = [];

  if (guest.displayName.trim().length === 0) {
    issues.push({
      code: "missing_display_name",
      message: "Guest display name is required.",
      requirementIds: ["GM-006"],
    });
  }

  if (!guest.guestSide) {
    issues.push({
      code: "missing_side",
      message: "Guest side is required.",
      requirementIds: ["GM-002", "GM-006"],
    });
  }

  if (!guest.guestTitleTypeId || !guest.titleType) {
    issues.push({
      code: "missing_title_type",
      message: "Guest title/type is required before invitation workflows.",
      requirementIds: ["GM-006", "GM-007"],
    });
  }

  if (guest.eventAssignments.length === 0) {
    issues.push({
      code: "missing_event_assignment",
      message: "At least one event assignment is required before invitations.",
      requirementIds: ["GM-006", "PROJ-005"],
    });
  }

  return issues;
}

export function canManageGuestSide(
  assignments: RoleAssignment[],
  side: GuestSide,
  projectId: string,
) {
  const target: PermissionTarget = {
    projectId,
    scope: "project",
  };

  if (hasScopedPermission(assignments, "guests.update", target)) {
    return true;
  }

  if (side === "bride") {
    return hasScopedPermission(assignments, "guests.manage_bride_side", target);
  }

  if (side === "groom") {
    return hasScopedPermission(assignments, "guests.manage_groom_side", target);
  }

  return (
    hasScopedPermission(assignments, "guests.manage_bride_side", target) &&
    hasScopedPermission(assignments, "guests.manage_groom_side", target)
  );
}

export function getSprint3FoundationStatus() {
  return {
    epic: "EPIC-GM",
    features: [
      "FEAT-GM-001",
      "FEAT-GM-002",
      "FEAT-GM-003",
      "FEAT-GM-005",
      "FEAT-GM-006",
    ],
    issue: 5,
    modules: [
      {
        name: "Project-level guest database",
        requirementIds: ["GM-001", "PROJ-005"],
      },
      {
        name: "Bride/groom working lists",
        requirementIds: ["GM-002", "GM-009", "ROLE-005"],
      },
      {
        name: "Manual guest creation and update",
        requirementIds: ["GM-003", "TECH-004"],
      },
      {
        name: "Title types, tags, and printed-only flags",
        requirementIds: ["GM-007", "GM-011", "GM-015"],
      },
      {
        name: "Duplicate detection and validation foundation",
        requirementIds: ["GM-006", "GM-008"],
      },
      {
        name: "Guest audit logging",
        requirementIds: ["REP-006"],
      },
      {
        name: "List locking placeholder",
        requirementIds: ["GM-013"],
      },
    ],
    outOfScope: [
      "CSV/Excel import",
      "full duplicate merge workflow",
      "RSVP",
      "public guest page",
      "invitation generation",
      "PDF generation",
      "QR generation",
      "WhatsApp",
      "seating",
      "check-in",
      "contracts",
      "pricing",
      "payments",
      "partner project creation",
    ],
  };
}

export async function listGuestTitleTypes(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<GuestTitleTypeRow[]> {
  const { data, error } = await supabase
    .from("guest_title_types")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function listGuestTags(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<GuestTagRow[]> {
  const { data, error } = await supabase
    .from("guest_tags")
    .select("*")
    .eq("project_id", projectId)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function listProjectGuests(
  supabase: SupabaseClient<Database>,
  projectId: string,
  filters: GuestListFilters = {},
): Promise<GuestRow[]> {
  let eventGuestIds: string[] | undefined;

  if (filters.eventId) {
    const { data, error } = await supabase
      .from("guest_event_assignments")
      .select("guest_id")
      .eq("project_id", projectId)
      .eq("event_id", filters.eventId);

    if (error) {
      throw error;
    }

    eventGuestIds = data.map((assignment) => assignment.guest_id);

    if (eventGuestIds.length === 0) {
      return [];
    }
  }

  let query = supabase
    .from("guests")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_active", true)
    .order("display_name", { ascending: true });

  if (filters.side && filters.side !== "all") {
    query =
      filters.side === "bride"
        ? query.in("guest_side", ["bride", "both"])
        : query.in("guest_side", ["groom", "both"]);
  }

  if (eventGuestIds) {
    query = query.in("id", eventGuestIds);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

export async function getGuestDetails(
  supabase: SupabaseClient<Database>,
  guestId: string,
) {
  const { data: guest, error: guestError } = await supabase
    .from("guests")
    .select("*")
    .eq("id", guestId)
    .maybeSingle();

  if (guestError) {
    throw guestError;
  }

  if (!guest) {
    return null;
  }

  const titleTypePromise = guest.guest_title_type_id
    ? supabase
        .from("guest_title_types")
        .select("*")
        .eq("id", guest.guest_title_type_id)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [eventsResult, tagsResult, titleTypeResult] = await Promise.all([
    supabase
      .from("guest_event_assignments")
      .select("*")
      .eq("guest_id", guestId)
      .order("created_at", { ascending: true }),
    supabase
      .from("guest_tag_assignments")
      .select("*")
      .eq("guest_id", guestId)
      .order("created_at", { ascending: true }),
    titleTypePromise,
  ]);

  if (eventsResult.error) {
    throw eventsResult.error;
  }

  if (tagsResult.error) {
    throw tagsResult.error;
  }

  if (titleTypeResult.error) {
    throw titleTypeResult.error;
  }

  return {
    eventAssignments: eventsResult.data,
    guest,
    tagAssignments: tagsResult.data,
    titleType: titleTypeResult.data,
  };
}

async function replaceGuestEventAssignments(
  supabase: SupabaseClient<Database>,
  guest: GuestRow,
  eventIds: string[] | undefined,
  actorUserId: string,
) {
  if (eventIds === undefined) {
    return;
  }

  const { error: deleteError } = await supabase
    .from("guest_event_assignments")
    .delete()
    .eq("guest_id", guest.id);

  if (deleteError) {
    throw deleteError;
  }

  if (eventIds.length === 0) {
    return;
  }

  const { error } = await supabase.from("guest_event_assignments").insert(
    eventIds.map((eventId) => ({
      created_by: actorUserId,
      event_id: eventId,
      guest_id: guest.id,
      invited: true,
      project_id: guest.project_id,
      updated_by: actorUserId,
    })),
  );

  if (error) {
    throw error;
  }
}

async function replaceGuestTagAssignments(
  supabase: SupabaseClient<Database>,
  guest: GuestRow,
  tagIds: string[] | undefined,
  actorUserId: string,
) {
  if (tagIds === undefined) {
    return;
  }

  const { error: deleteError } = await supabase
    .from("guest_tag_assignments")
    .delete()
    .eq("guest_id", guest.id);

  if (deleteError) {
    throw deleteError;
  }

  if (tagIds.length === 0) {
    return;
  }

  const { error } = await supabase.from("guest_tag_assignments").insert(
    tagIds.map((tagId) => ({
      created_by: actorUserId,
      guest_id: guest.id,
      project_id: guest.project_id,
      tag_id: tagId,
    })),
  );

  if (error) {
    throw error;
  }
}

export async function createGuest(
  supabase: SupabaseClient<Database>,
  projectId: string,
  input: CreateGuestInput,
  actorUserId: string,
) {
  const { data, error } = await supabase
    .from("guests")
    .insert({
      created_by: actorUserId,
      display_name: input.displayName,
      guest_side: input.guestSide,
      guest_title_type_id: input.guestTitleTypeId,
      internal_notes: input.internalNotes,
      is_printed_only: input.isPrintedOnly,
      preferred_language: input.preferredLanguage,
      project_id: projectId,
      updated_by: actorUserId,
      whatsapp_number: input.whatsappNumber,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await replaceGuestEventAssignments(
    supabase,
    data,
    input.eventIds,
    actorUserId,
  );
  await replaceGuestTagAssignments(supabase, data, input.tagIds, actorUserId);

  return data;
}

export async function updateGuest(
  supabase: SupabaseClient<Database>,
  guestId: string,
  input: UpdateGuestInput,
  actorUserId: string,
) {
  const updates: Database["public"]["Tables"]["guests"]["Update"] = {
    updated_by: actorUserId,
  };

  if (input.displayName !== undefined) {
    updates.display_name = input.displayName;
  }

  if (input.guestSide !== undefined) {
    updates.guest_side = input.guestSide;
  }

  if (input.guestTitleTypeId !== undefined) {
    updates.guest_title_type_id = input.guestTitleTypeId;
  }

  if (input.internalNotes !== undefined) {
    updates.internal_notes = input.internalNotes;
  }

  if (input.isActive !== undefined) {
    updates.is_active = input.isActive;
  }

  if (input.isPrintedOnly !== undefined) {
    updates.is_printed_only = input.isPrintedOnly;
  }

  if (input.preferredLanguage !== undefined) {
    updates.preferred_language = input.preferredLanguage;
  }

  if (input.whatsappNumber !== undefined) {
    updates.whatsapp_number = input.whatsappNumber;
  }

  const { data, error } = await supabase
    .from("guests")
    .update(updates)
    .eq("id", guestId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await replaceGuestEventAssignments(
    supabase,
    data,
    input.eventIds,
    actorUserId,
  );
  await replaceGuestTagAssignments(supabase, data, input.tagIds, actorUserId);

  return data;
}

export async function findDuplicateGuests(
  supabase: SupabaseClient<Database>,
  guest: GuestRow,
) {
  const normalizedName =
    guest.normalized_name ?? normalizeGuestName(guest.display_name);
  const whatsappDigits = normalizeWhatsapp(guest.whatsapp_number);
  let query = supabase
    .from("guests")
    .select("*")
    .eq("project_id", guest.project_id)
    .neq("id", guest.id)
    .eq("is_active", true);

  if (whatsappDigits) {
    query = query.or(
      `normalized_name.eq.${normalizedName},normalized_whatsapp.eq.${whatsappDigits}`,
    );
  } else {
    query = query.eq("normalized_name", normalizedName);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}
