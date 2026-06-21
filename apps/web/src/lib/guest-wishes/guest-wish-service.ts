import { buildCsv, type CsvColumn } from "@/lib/reports/report-service";
import { hasScopedPermission } from "@/lib/projects/project-permissions";
import type { RoleAssignment } from "@/lib/security/permissions";

export type GuestMessageStatus =
  | "admin_approved"
  | "admin_edited"
  | "archived"
  | "couple_approved"
  | "couple_correction_requested"
  | "excluded"
  | "exported"
  | "flagged"
  | "pending_review";

const guestEditableMessageStatuses = new Set<string>([
  "couple_correction_requested",
  "not_submitted",
  "pending_review",
]);

export type GuestMessage = {
  approvedText: string | null;
  coupleComment: string | null;
  coupleReviewedAt: string | null;
  currentText: string;
  eventId: string | null;
  exportedAt: string | null;
  guestDisplayName: string;
  guestId: string;
  id: string;
  internalModerationNote: string | null;
  language: string;
  originalText: string;
  projectCode: string;
  projectId: string;
  status: GuestMessageStatus;
  submittedAt: string;
};

export type GuestMessageReviewAction =
  | "approve"
  | "edit_and_approve"
  | "exclude"
  | "flag"
  | "restore";

export type CoupleGuestMessageReviewAction =
  | "approve"
  | "exclude"
  | "request_correction";

export type GuestMessageReviewEvent = {
  action: GuestMessageReviewAction | CoupleGuestMessageReviewAction;
  comment: string | null;
  messageId: string;
  reviewedAt: string;
  reviewerUserId: string;
  source: "couple_review" | "moderation";
};

export type GuestBookCanvaRow = {
  approved_at: string;
  category: string;
  couple_names: string;
  event_name: string;
  guest_display_name: string;
  language: string;
  message_text: string;
  page_order: number;
  project_code: string;
  submitted_at: string;
};

export type PostEventFeedbackInput = {
  feedbackText: string;
  improvementSuggestions: string | null;
  invitationCommunicationRating: number | null;
  overallRating: number;
  publicDisplayName: string | null;
  serviceQualityRating: number | null;
  testimonialPermissionGranted: boolean;
  testimonialText: string | null;
};

export type TestimonialReviewStatus =
  | "approved_for_public_use"
  | "pending"
  | "rejected"
  | "reviewed";

export class GuestWishValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuestWishValidationError";
  }
}

const maxMessageLength = 1200;
const supportedLanguages = new Set(["en", "fr"]);
const uploadFieldPattern =
  /(?:^|[_-])(?:attachment|file|upload)(?:s|[_-]|$)|(?:photo|video|audio)(?:data|blob|file)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(
  input: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = input[key];

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
  }

  return undefined;
}

function normalizeLanguage(value: unknown) {
  if (typeof value !== "string") {
    return "fr";
  }

  const normalized = value.trim().toLowerCase();
  return supportedLanguages.has(normalized) ? normalized : "fr";
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseRating(value: unknown, fieldName: string, required: true): number;
function parseRating(
  value: unknown,
  fieldName: string,
  required?: false,
): number | null;
function parseRating(value: unknown, fieldName: string, required = false) {
  if (value === null || value === undefined || value === "") {
    if (required) {
      throw new GuestWishValidationError(`${fieldName} is required.`);
    }

    return null;
  }

  const rating = Number(value);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new GuestWishValidationError(`${fieldName} must be between 1 and 5.`);
  }

  return rating;
}

function normalizeGuestMessageText(value: string | undefined) {
  const messageText = value?.trim();

  if (!messageText) {
    throw new GuestWishValidationError("Guest message text is required.");
  }

  if (messageText.length > maxMessageLength) {
    throw new GuestWishValidationError(
      `Guest message text must be ${maxMessageLength} characters or fewer.`,
    );
  }

  return messageText;
}

function hasUploadAttempt(input: Record<string, unknown>) {
  const attachmentCount = Number(input.attachmentCount ?? 0);

  if (Number.isFinite(attachmentCount) && attachmentCount > 0) {
    return true;
  }

  return Object.entries(input).some(([key, value]) => {
    if (!uploadFieldPattern.test(key)) {
      return false;
    }

    return isUploadLikeValue(value);
  });
}

function isUploadLikeValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(isUploadLikeValue);
  }

  if (value === null || value === undefined) {
    return false;
  }

  if (typeof File !== "undefined" && value instanceof File) {
    return value.size > 0 && value.name.length > 0;
  }

  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return value.size > 0;
  }

  if (value instanceof Uint8Array) {
    return value.byteLength > 0;
  }

  return (
    typeof value === "object" && ("arrayBuffer" in value || "stream" in value)
  );
}

export function parsePublicGuestMessagePayload(value: unknown) {
  if (!isRecord(value)) {
    throw new GuestWishValidationError("Guest message payload is required.");
  }

  if (hasUploadAttempt(value)) {
    throw new GuestWishValidationError(
      "Guest message file uploads are not available yet.",
    );
  }

  return {
    language: normalizeLanguage(value.language),
    messageText: normalizeGuestMessageText(
      readText(value, ["messageText", "message", "wishText"]),
    ),
  };
}

export function canEditGuestMessage(input: {
  deadlineAt?: string | null;
  now: string;
  status?: string | null;
}) {
  if (input.status && !guestEditableMessageStatuses.has(input.status)) {
    return { allowed: false, reason: "message_locked" } as const;
  }

  if (!input.deadlineAt) {
    return { allowed: true } as const;
  }

  return new Date(input.now) <= new Date(input.deadlineAt)
    ? ({ allowed: true } as const)
    : ({ allowed: false, reason: "deadline_passed" } as const);
}

export function upsertGuestMessage(
  records: GuestMessage[],
  input: {
    eventId?: string | null;
    guestDisplayName: string;
    guestId: string;
    language: string;
    messageText: string;
    now: string;
    projectCode: string;
    projectId: string;
  },
) {
  const messageText = normalizeGuestMessageText(input.messageText);
  const existing = records.find((record) => record.guestId === input.guestId);

  if (!existing) {
    const message: GuestMessage = {
      approvedText: null,
      coupleComment: null,
      coupleReviewedAt: null,
      currentText: messageText,
      eventId: input.eventId ?? null,
      exportedAt: null,
      guestDisplayName: input.guestDisplayName,
      guestId: input.guestId,
      id: `guest-message-${input.guestId}`,
      internalModerationNote: null,
      language: normalizeLanguage(input.language),
      originalText: messageText,
      projectCode: input.projectCode,
      projectId: input.projectId,
      status: "pending_review",
      submittedAt: input.now,
    };

    return {
      messages: [...records, message],
      result: {
        message,
        status: "created" as const,
      },
    };
  }

  const editStatus = canEditGuestMessage({
    now: input.now,
    status: existing.status,
  });

  if (!editStatus.allowed) {
    throw new GuestWishValidationError(
      "Guest message can no longer be edited.",
    );
  }

  const updated = {
    ...existing,
    approvedText: null,
    coupleComment: null,
    coupleReviewedAt: null,
    currentText: messageText,
    eventId: input.eventId ?? existing.eventId,
    language: normalizeLanguage(input.language),
    status: "pending_review" as const,
  };

  return {
    messages: records.map((record) =>
      record.guestId === input.guestId ? updated : record,
    ),
    result: {
      message: updated,
      status: "updated" as const,
    },
  };
}

export function moderateGuestMessage(
  message: GuestMessage,
  input: {
    action: GuestMessageReviewAction;
    approvedText?: string | null;
    internalNote?: string | null;
    now: string;
    reviewerUserId: string;
  },
) {
  const statusByAction = {
    approve: "admin_approved",
    edit_and_approve: "admin_edited",
    exclude: "excluded",
    flag: "flagged",
    restore: "pending_review",
  } satisfies Record<GuestMessageReviewAction, GuestMessageStatus>;

  if (!Object.prototype.hasOwnProperty.call(statusByAction, input.action)) {
    throw new GuestWishValidationError(
      "Guest message action is not supported.",
    );
  }

  const approvedText =
    input.action === "approve"
      ? normalizeGuestMessageText(message.currentText)
      : input.action === "edit_and_approve"
        ? normalizeGuestMessageText(input.approvedText ?? undefined)
        : message.approvedText;
  const nextMessage: GuestMessage = {
    ...message,
    approvedText:
      input.action === "exclude" || input.action === "flag"
        ? message.approvedText
        : approvedText,
    internalModerationNote:
      normalizeOptionalText(input.internalNote) ??
      message.internalModerationNote,
    status: statusByAction[input.action],
  };

  return {
    message: nextMessage,
    reviewEvent: {
      action: input.action,
      comment: normalizeOptionalText(input.internalNote),
      messageId: message.id,
      reviewedAt: input.now,
      reviewerUserId: input.reviewerUserId,
      source: "moderation",
    } satisfies GuestMessageReviewEvent,
  };
}

export function coupleReviewGuestMessage(
  message: GuestMessage,
  input: {
    action: CoupleGuestMessageReviewAction;
    comment?: string | null;
    now: string;
    reviewerUserId: string;
  },
) {
  const statusByAction = {
    approve: "couple_approved",
    exclude: "excluded",
    request_correction: "couple_correction_requested",
  } satisfies Record<CoupleGuestMessageReviewAction, GuestMessageStatus>;

  if (!Object.prototype.hasOwnProperty.call(statusByAction, input.action)) {
    throw new GuestWishValidationError(
      "Guest message action is not supported.",
    );
  }

  const nextMessage: GuestMessage = {
    ...message,
    coupleComment: normalizeOptionalText(input.comment),
    coupleReviewedAt: input.now,
    status: statusByAction[input.action],
  };

  return {
    message: nextMessage,
    reviewEvent: {
      action: input.action,
      comment: normalizeOptionalText(input.comment),
      messageId: message.id,
      reviewedAt: input.now,
      reviewerUserId: input.reviewerUserId,
      source: "couple_review",
    } satisfies GuestMessageReviewEvent,
  };
}

export function toCoupleGuestMessageView(message: GuestMessage) {
  return {
    approvedText: message.approvedText,
    coupleComment: message.coupleComment,
    guestDisplayName: message.guestDisplayName,
    id: message.id,
    status: message.status,
    submittedAt: message.submittedAt,
  };
}

type GuestBookCanvaMessage = GuestMessage & {
  coupleNames?: string | null;
  eventName?: string | null;
};

export function buildGuestBookCanvaRows(messages: GuestBookCanvaMessage[]) {
  return messages
    .filter(
      (message) =>
        message.status === "couple_approved" && Boolean(message.approvedText),
    )
    .map(
      (message, index): GuestBookCanvaRow => ({
        approved_at: message.coupleReviewedAt ?? "",
        category: "guest_wish",
        couple_names: message.coupleNames ?? "",
        event_name: message.eventName ?? "",
        guest_display_name: message.guestDisplayName,
        language: message.language,
        message_text: message.approvedText ?? "",
        page_order: index + 1,
        project_code: message.projectCode,
        submitted_at: message.submittedAt,
      }),
    );
}

const guestBookCanvaColumns = [
  { key: "guest_display_name", label: "guest_display_name" },
  { key: "message_text", label: "message_text" },
  { key: "project_code", label: "project_code" },
  { key: "couple_names", label: "couple_names" },
  { key: "event_name", label: "event_name" },
  { key: "page_order", label: "page_order" },
  { key: "language", label: "language" },
  { key: "category", label: "category" },
  { key: "submitted_at", label: "submitted_at" },
  { key: "approved_at", label: "approved_at" },
] satisfies CsvColumn<GuestBookCanvaRow>[];

export function buildGuestBookCanvaCsv(rows: GuestBookCanvaRow[]) {
  return buildCsv(rows, guestBookCanvaColumns);
}

export function parsePostEventFeedbackPayload(value: unknown) {
  if (!isRecord(value)) {
    throw new GuestWishValidationError("Post-event feedback is required.");
  }

  const feedbackText = normalizeOptionalText(value.feedbackText);

  if (!feedbackText) {
    throw new GuestWishValidationError("Feedback text is required.");
  }

  return {
    feedbackText,
    improvementSuggestions: normalizeOptionalText(value.improvementSuggestions),
    invitationCommunicationRating: parseRating(
      value.invitationCommunicationRating,
      "invitationCommunicationRating",
    ),
    overallRating: parseRating(value.overallRating, "overallRating", true),
    publicDisplayName: normalizeOptionalText(value.publicDisplayName),
    serviceQualityRating: parseRating(
      value.serviceQualityRating,
      "serviceQualityRating",
    ),
    testimonialPermissionGranted:
      value.testimonialPermissionGranted === true ||
      value.testimonialPermissionGranted === "true" ||
      value.testimonialPermissionGranted === "on",
    testimonialText: normalizeOptionalText(value.testimonialText),
  } satisfies PostEventFeedbackInput;
}

export function isPublicTestimonialEligible(input: {
  adminReviewStatus: TestimonialReviewStatus;
  permissionGranted: boolean;
  testimonialText: string | null;
}) {
  return (
    input.permissionGranted &&
    input.adminReviewStatus === "approved_for_public_use" &&
    Boolean(input.testimonialText?.trim())
  );
}

export function getGuestWishPermissionSummary(
  assignments: RoleAssignment[],
  projectId: string,
) {
  const projectTarget = {
    projectId,
    scope: "project",
  } as const;

  return {
    canExportGuestBook: hasScopedPermission(
      assignments,
      "guest_book_exports.create",
      projectTarget,
    ),
    canModerateMessages: hasScopedPermission(
      assignments,
      "guest_messages.moderate",
      projectTarget,
    ),
    canReadFeedback: hasScopedPermission(
      assignments,
      "post_event_feedback.read",
      projectTarget,
    ),
    canReadMessages: hasScopedPermission(
      assignments,
      "guest_messages.read",
      projectTarget,
    ),
    canReviewAsCouple: hasScopedPermission(
      assignments,
      "guest_messages.couple_review",
      projectTarget,
    ),
    canReviewFeedback: hasScopedPermission(
      assignments,
      "post_event_feedback.review",
      projectTarget,
    ),
    canSubmitFeedback: hasScopedPermission(
      assignments,
      "post_event_feedback.submit",
      projectTarget,
    ),
  };
}

export function getSprint12GuestWishesStatus() {
  return {
    epic: "EPIC-WISH",
    features: [
      "FEAT-WISH-001",
      "FEAT-WISH-002",
      "FEAT-FEEDBACK-001",
      "FEAT-FEEDBACK-002",
    ],
    issue: 28,
    modules: [
      {
        name: "Guest written-message submission and edit-before-deadline foundation",
        requirementIds: ["WISH-001", "WISH-002", "WISH-003", "ROLE-009"],
      },
      {
        name: "Admin moderation and couple review foundation",
        requirementIds: ["WISH-004", "WISH-005", "WISH-006", "TECH-004"],
      },
      {
        name: "Approved-message Canva CSV export and guest-book file tracking",
        requirementIds: ["WISH-007", "WISH-008", "FILE-008", "REP-005"],
      },
      {
        name: "Post-event feedback and testimonial permission foundation",
        requirementIds: ["REP-006", "TECH-004"],
      },
    ],
    outOfScope: [
      "audio/video/photo guest submissions",
      "file uploads from guests",
      "direct Canva API integration",
      "automatic public testimonial publishing",
      "partner SaaS scaling",
      "partner commission management",
      "advanced AI assistance",
      "full marketing website testimonial publishing",
    ],
    requirementIds: [
      "WISH-001",
      "WISH-002",
      "WISH-003",
      "WISH-004",
      "WISH-005",
      "WISH-006",
      "WISH-007",
      "WISH-008",
      "FILE-001",
      "FILE-002",
      "FILE-005",
      "FILE-008",
      "REP-005",
      "REP-006",
      "ROLE-005",
      "ROLE-009",
      "TECH-004",
    ],
    sprint: "Sprint 12 - Guest Wishes, Guest Book & Post-Event Feedback",
  };
}
