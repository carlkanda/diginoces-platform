import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getProjectApiContext,
  handleProjectApiError,
  jsonError,
  ProjectAccessError,
  requireGlobalPermission,
  type ProjectApiContext,
} from "@/lib/projects/project-api";
import {
  PartnerValidationError,
  type PartnerProjectReviewAction,
  type PartnerStatus,
} from "@/lib/partners/partner-service";
import type { PermissionSlug } from "@/lib/security/permissions";
import { isUuid } from "@/lib/validation/uuid";

export async function getPartnerApiContext() {
  return getProjectApiContext();
}

export function isPartnerApiContext(
  value: ProjectApiContext | NextResponse,
): value is ProjectApiContext {
  return !(value instanceof NextResponse);
}

function asRecord(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new PartnerValidationError("Request body must be a JSON object.");
  }

  return payload as Record<string, unknown>;
}

function requiredText(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new PartnerValidationError(`${fieldName} is required.`);
  }

  return value.trim();
}

function optionalText(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new PartnerValidationError("Optional text fields must be strings.");
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalInteger(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new PartnerValidationError(`${fieldName} must be non-negative.`);
  }

  return parsed;
}

function optionalYear(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(parsed) || parsed < 2020 || parsed > 2100) {
    throw new PartnerValidationError(
      "projectYear must be between 2020 and 2100.",
    );
  }

  return parsed;
}

export async function hasPartnerPermission(
  context: ProjectApiContext,
  partnerId: string,
  permission: PermissionSlug,
) {
  if (!isUuid(partnerId)) {
    return false;
  }

  const supabase = context.supabase as SupabaseClient;
  const { data, error } = await supabase.rpc(
    "current_user_can_access_partner",
    {
      p_partner_id: partnerId,
      p_permission: permission,
    },
  );

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function hasGlobalPartnerPermission(
  supabase: SupabaseClient,
  permission: PermissionSlug,
) {
  const { data, error } = await supabase.rpc("current_user_has_permission", {
    p_permission: permission,
    p_scope: "global",
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function requirePartnerPermission(
  context: ProjectApiContext,
  partnerId: string,
  permission: PermissionSlug,
) {
  if (!(await hasPartnerPermission(context, partnerId, permission))) {
    throw new ProjectAccessError("Partner access denied.", 403);
  }
}

export async function requirePartnerManagePermission(
  context: ProjectApiContext,
) {
  await requireGlobalPermission(context, "partners.manage");
}

export function parseCreatePartnerProfilePayload(payload: unknown) {
  const body = asRecord(payload);

  return {
    contactEmail: requiredText(body.contactEmail, "contactEmail"),
    contactPhone: optionalText(body.contactPhone),
    internalNotes: optionalText(body.internalNotes),
    organizationName: requiredText(body.organizationName, "organizationName"),
    partnerType: requiredText(body.partnerType, "partnerType"),
    primaryContactName: optionalText(body.primaryContactName),
    whatsappPhone: optionalText(body.whatsappPhone),
  };
}

export function parsePartnerStatusPayload(payload: unknown) {
  const body = asRecord(payload);

  if (
    body.status !== "active" &&
    body.status !== "archived" &&
    body.status !== "inactive" &&
    body.status !== "pending" &&
    body.status !== "suspended"
  ) {
    throw new PartnerValidationError("status is not supported.");
  }

  return {
    status: body.status as PartnerStatus,
  };
}

export function parseLinkPartnerUserPayload(payload: unknown) {
  const body = asRecord(payload);

  if (
    body.role !== undefined &&
    body.role !== "admin" &&
    body.role !== "member"
  ) {
    throw new PartnerValidationError("role is not supported.");
  }

  return {
    role: body.role === "admin" ? "admin" : "member",
    userId: requiredText(body.userId, "userId"),
  } as const;
}

export function parseCreatePartnerProjectDraftPayload(payload: unknown) {
  const body = asRecord(payload);

  return {
    brideName: requiredText(body.brideName, "brideName"),
    eventNotes: optionalText(body.eventNotes),
    groomName: requiredText(body.groomName, "groomName"),
    partnerNotes: optionalText(body.partnerNotes),
    plannedGuestCount: optionalInteger(
      body.plannedGuestCount,
      "plannedGuestCount",
    ),
    primaryContactEmail: optionalText(body.primaryContactEmail),
    primaryContactPhone: optionalText(body.primaryContactPhone),
    projectYear: optionalYear(body.projectYear),
  };
}

export function parseReviewPartnerProjectPayload(payload: unknown) {
  const body = asRecord(payload);

  if (
    body.action !== "approve" &&
    body.action !== "archive" &&
    body.action !== "reject" &&
    body.action !== "request_changes"
  ) {
    throw new PartnerValidationError("action is not supported.");
  }

  return {
    action: body.action as PartnerProjectReviewAction,
    reason: requiredText(body.reason, "reason"),
  };
}

export function parseProjectCommentPayload(payload: unknown) {
  const body = asRecord(payload);

  if (
    body.visibility !== undefined &&
    body.visibility !== "partner_visible" &&
    body.visibility !== "internal_only"
  ) {
    throw new PartnerValidationError("visibility is not supported.");
  }

  return {
    body: requiredText(body.body, "body"),
    visibility:
      body.visibility === "internal_only" ? "internal_only" : "partner_visible",
  } as const;
}

export function requiredProjectCommentPermissions(
  visibility: ReturnType<typeof parseProjectCommentPayload>["visibility"],
) {
  return visibility === "internal_only"
    ? ([
        "project_comments.create",
        "project_comments.internal.read",
      ] as const satisfies readonly PermissionSlug[])
    : ([
        "project_comments.create",
      ] as const satisfies readonly PermissionSlug[]);
}

export function handlePartnerApiError(error: unknown) {
  if (error instanceof PartnerValidationError) {
    return jsonError(400, "invalid_request", error.message);
  }

  return handleProjectApiError(error);
}
