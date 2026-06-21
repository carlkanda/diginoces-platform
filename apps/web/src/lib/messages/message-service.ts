import { randomUUID } from "node:crypto";
import { hasScopedPermission } from "@/lib/projects/project-permissions";
import type {
  PermissionSlug,
  RoleAssignment,
} from "@/lib/security/permissions";

export class MessageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MessageValidationError";
  }
}

export type MessageType =
  | "event_reminder"
  | "invitation"
  | "invitation_resend"
  | "manual_custom"
  | "maybe_follow_up"
  | "modification_notice"
  | "rsvp_request"
  | "welcome_table_placeholder";

export type MessageLanguage = "en" | "fr";

export type MessageTemplateStatus =
  | "active"
  | "archived"
  | "draft"
  | "inactive";

export type MessageChannel = "whatsapp";
export type MessageSendingMode = "api_ready" | "api_sent" | "guided_manual";
export type MessageDeliveryStatus =
  | "cancelled"
  | "failed"
  | "not_prepared"
  | "opened_manually"
  | "prepared"
  | "queued"
  | "resent"
  | "sent"
  | "skipped";

export type MessageTemplate = {
  body: string;
  id: string;
  language: MessageLanguage;
  messageType: MessageType;
  projectId: string;
  status: MessageTemplateStatus;
  title: string;
  variables: string[];
  version: number;
};

export type CreateMessageTemplateInput = {
  body: string;
  language: MessageLanguage;
  messageType: MessageType;
  status?: MessageTemplateStatus;
  title: string;
  variables?: string[];
};

export type PrepareMessagePayload = {
  changeReason?: string;
  eventId: string;
  guestId: string;
  invitationId?: string;
  messageType: MessageType;
  publicGuestPageLink?: string;
};

export type MessageGuestContext = {
  displayName: string;
  eventAssignments: Array<{
    eventId: string;
    invited: boolean;
  }>;
  id: string;
  isActive: boolean;
  isPrintedOnly: boolean;
  preferredLanguage: string | null;
  projectId: string;
  whatsappNumber: string | null;
};

export type MessageEventContext = {
  id: string;
  name: string;
  rsvpDeadlineAt: string | null;
  startsAt: string | null;
  venueName: string | null;
};

export type MessageInvitationContext = {
  id: string;
  latestActiveFileId: string | null;
  publicGuestPageLink: string | null;
  status: "failed" | "generated" | "needs_regeneration" | "resent" | "sent";
};

export type MessageProjectContext = {
  defaultLanguage: string | null;
  id: string;
  name: string;
};

export type MessagePreparationInput = {
  changeReason?: string;
  event: MessageEventContext;
  guest: MessageGuestContext;
  invitation?: MessageInvitationContext | null;
  messageType: MessageType;
  paymentGate: "locked" | "unlocked";
  preparedAt: string;
  preparedBy: string;
  project: MessageProjectContext;
  templates: MessageTemplate[];
};

export type MessageRenderingContext = {
  changeReason?: string;
  event: MessageEventContext;
  guest: MessageGuestContext;
  invitation?: MessageInvitationContext | null;
  project: MessageProjectContext;
};

export type MessageRenderResult = {
  missingOptionalVariables: string[];
  missingRequiredVariables: string[];
  renderedBody: string;
  variables: string[];
};

export type MessageReadinessIssue = {
  blocking: boolean;
  code:
    | "guest_inactive"
    | "guest_not_assigned_to_event"
    | "invitation_not_generated"
    | "missing_active_invitation_file"
    | "missing_public_guest_page_link"
    | "missing_required_template_variables"
    | "missing_template"
    | "missing_whatsapp_number"
    | "payment_gate_locked"
    | "project_mismatch";
  message: string;
  requirementIds: string[];
};

export type PreparedMessageLog = {
  auditActions: MessageAuditAction[];
  channel: MessageChannel;
  eventId: string;
  failureReason: string | null;
  guestId: string;
  id: string;
  invitationId: string | null;
  language: MessageLanguage;
  manualWhatsappUrl: string | null;
  messageType: MessageType;
  openedAt: string | null;
  openedBy: string | null;
  preparedAt: string;
  preparedBy: string;
  previousMessageLogId: string | null;
  projectId: string;
  renderedBody: string;
  sendingMode: MessageSendingMode;
  sentAt: string | null;
  sentConfirmedBy: string | null;
  skippedReason: string | null;
  status: MessageDeliveryStatus;
  targetWhatsappNumber: string | null;
  templateId: string;
  templateVersion: number;
};

export type MarkGuidedManualMessageInput = {
  actorUserId: string;
  markedAt: string;
  nextStatus: Extract<
    MessageDeliveryStatus,
    "failed" | "opened_manually" | "resent" | "sent" | "skipped"
  >;
  reason?: string | null;
};

export type MaybeFollowUpCandidate = {
  eventId: string;
  guestId: string;
  rsvpDeadlineAt: string | null;
  status: "locked" | "manual_review" | "maybe" | "no" | "pending" | "yes";
};

export type MessageAction =
  | "history.read"
  | "messages.prepare"
  | "messages.send"
  | "templates.manage"
  | "templates.read";

export const messageTypes = [
  "invitation",
  "invitation_resend",
  "rsvp_request",
  "maybe_follow_up",
  "event_reminder",
  "modification_notice",
  "welcome_table_placeholder",
  "manual_custom",
] as const satisfies readonly MessageType[];

export const supportedMessageLanguages = [
  "fr",
  "en",
] as const satisfies readonly MessageLanguage[];

export const messageDeliveryStatuses = [
  "not_prepared",
  "prepared",
  "queued",
  "opened_manually",
  "sent",
  "failed",
  "skipped",
  "resent",
  "cancelled",
] as const satisfies readonly MessageDeliveryStatus[];

export const manualMessageStatuses = [
  "failed",
  "opened_manually",
  "resent",
  "sent",
  "skipped",
] as const satisfies readonly MessageDeliveryStatus[];

export type ManualMessageStatus = Extract<
  MessageDeliveryStatus,
  (typeof manualMessageStatuses)[number]
>;

export const allowedManualStatuses = new Set<MessageDeliveryStatus>(
  manualMessageStatuses,
);

const templateStatuses = [
  "active",
  "archived",
  "draft",
  "inactive",
] as const satisfies readonly MessageTemplateStatus[];

export const allowedTemplateStatuses = new Set<MessageTemplateStatus>(
  templateStatuses,
);

const requiredInvitationMessageTypes = new Set<MessageType>([
  "invitation",
  "invitation_resend",
]);

const optionalVariableNames = new Set([
  "invitation_download_link",
  "table.code",
  "table.name",
]);

const actionPermissions: Record<MessageAction, PermissionSlug> = {
  "history.read": "messages.read",
  "messages.prepare": "messages.prepare",
  "messages.send": "messages.send",
  "templates.manage": "message_templates.manage",
  "templates.read": "message_templates.read",
};

export const messageAuditActions = [
  "message_templates.created",
  "message_templates.updated",
  "message_templates.activated",
  "message_templates.deactivated",
  "messages.prepared",
  // Emitted by the database audit trigger for generic message_log updates.
  "messages.updated",
  "messages.opened_manually",
  "messages.sent",
  "messages.failed",
  "messages.skipped",
  "messages.resent",
  "message_reminders.prepared",
  "message_reminders.updated",
  "message_modifications.prepared",
  "message_queue_items.updated",
] as const;

export type MessageAuditAction = (typeof messageAuditActions)[number];

function requiredText(value: string | null | undefined, fieldName: string) {
  if (!value || value.trim().length === 0) {
    throw new MessageValidationError(`${fieldName} is required.`);
  }

  return value.trim();
}

function asRecord(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new MessageValidationError("Request body must be a JSON object.");
  }

  return payload as Record<string, unknown>;
}

function requiredPayloadText(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new MessageValidationError(`${fieldName} is required.`);
  }

  return value.trim();
}

function optionalPayloadText(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new MessageValidationError("Optional text fields must be strings.");
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Normalizes language input to the supported MessageLanguage values.
 * Non-English input, including null/undefined, intentionally falls back to French.
 */
function normalizeLanguage(value: string | null | undefined): MessageLanguage {
  return value?.trim().toLowerCase().startsWith("en") ? "en" : "fr";
}

function parseLanguage(value: unknown): MessageLanguage {
  if (value === "en" || value === "fr") {
    return value;
  }

  throw new MessageValidationError("Language must be French or English.");
}

function parseMessageType(value: unknown): MessageType {
  if (
    typeof value === "string" &&
    (messageTypes as readonly string[]).includes(value)
  ) {
    return value as MessageType;
  }

  throw new MessageValidationError("messageType is not supported.");
}

function parseTemplateStatus(
  value: unknown,
): MessageTemplateStatus | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (
    value === "active" ||
    value === "archived" ||
    value === "draft" ||
    value === "inactive"
  ) {
    return value;
  }

  throw new MessageValidationError("status is not supported.");
}

function parseVariableArray(value: unknown, body: string) {
  if (value === undefined || value === null || value === "") {
    return extractMessageVariables(body);
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new MessageValidationError("variables must be an array of strings.");
  }

  return Array.from(
    new Set([...value.map((item) => item.trim()).filter(Boolean)]),
  );
}

export function parseCreateMessageTemplatePayload(
  payload: unknown,
): CreateMessageTemplateInput {
  const body = asRecord(payload);
  const templateBody = requiredPayloadText(body.body, "body");

  return {
    body: templateBody,
    language: parseLanguage(body.language),
    messageType: parseMessageType(body.messageType),
    status: parseTemplateStatus(body.status),
    title: requiredPayloadText(body.title, "title"),
    variables: parseVariableArray(body.variables, templateBody),
  };
}

export function parsePrepareMessagePayload(
  payload: unknown,
): PrepareMessagePayload {
  const body = asRecord(payload);

  return {
    changeReason: optionalPayloadText(body.changeReason),
    eventId: requiredPayloadText(body.eventId, "eventId"),
    guestId: requiredPayloadText(body.guestId, "guestId"),
    invitationId: optionalPayloadText(body.invitationId),
    messageType: parseMessageType(body.messageType),
    publicGuestPageLink: optionalPayloadText(body.publicGuestPageLink),
  };
}

export function validateManualStatusUpdate(
  status: unknown,
  reason: unknown,
): {
  reason: string | null;
  status: ManualMessageStatus;
} {
  if (typeof status !== "string") {
    throw new MessageValidationError("status must be a string.");
  }

  if (!allowedManualStatuses.has(status as MessageDeliveryStatus)) {
    throw new MessageValidationError("Unsupported manual message status.");
  }

  if (reason !== undefined && reason !== null && typeof reason !== "string") {
    throw new MessageValidationError("reason must be text.");
  }

  if (
    (status === "failed" || status === "skipped") &&
    (typeof reason !== "string" || reason.trim().length === 0)
  ) {
    throw new MessageValidationError(
      "reason is required for failed/skipped statuses.",
    );
  }

  const normalizedReason =
    typeof reason === "string" && reason.trim().length > 0
      ? reason.trim()
      : null;

  return {
    reason: normalizedReason,
    status: status as ManualMessageStatus,
  };
}

export function parseManualStatusUpdatePayload(payload: unknown) {
  const body = asRecord(payload);

  return validateManualStatusUpdate(body.status, body.reason);
}

export function extractMessageVariables(body: string) {
  return Array.from(
    new Set(
      [...body.matchAll(/{{\s*([a-zA-Z0-9_.]+)\s*}}/g)].map(
        (match) => match[1],
      ),
    ),
  );
}

export function selectMessageTemplate(input: {
  messageType: MessageType;
  preferredLanguage: string | null | undefined;
  projectDefaultLanguage: string | null | undefined;
  templates: MessageTemplate[];
}) {
  const preferredLanguage = normalizeLanguage(input.preferredLanguage);
  const projectDefaultLanguage = normalizeLanguage(
    input.projectDefaultLanguage,
  );
  const activeTemplates = input.templates.filter(
    (template) =>
      template.messageType === input.messageType &&
      template.status === "active",
  );

  const preferredTemplate = activeTemplates.find(
    (template) => template.language === preferredLanguage,
  );

  if (preferredTemplate) {
    return {
      fallbackUsed: false,
      template: preferredTemplate,
    };
  }

  const fallbackTemplate =
    activeTemplates.find(
      (template) => template.language === projectDefaultLanguage,
    ) ?? activeTemplates[0];

  if (!fallbackTemplate) {
    throw new MessageValidationError(
      "No active template is available for this message type.",
    );
  }

  return {
    fallbackUsed: fallbackTemplate.language !== preferredLanguage,
    template: fallbackTemplate,
  };
}

function formatDateTime(
  value: string | null,
  options: Intl.DateTimeFormatOptions,
  locale = "fr",
) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    ...options,
  }).format(date);
}

function resolveVariable(
  variable: string,
  context: MessageRenderingContext,
  locale: string,
): string | null {
  switch (variable) {
    case "change.reason":
      return context.changeReason ?? null;
    case "couple.names":
      return context.project.name;
    case "event.date":
      return formatDateTime(
        context.event.startsAt,
        { dateStyle: "medium" },
        locale,
      );
    case "event.name":
      return context.event.name;
    case "event.time":
      return formatDateTime(
        context.event.startsAt,
        { timeStyle: "short" },
        locale,
      );
    case "event.venue":
      return context.event.venueName;
    case "guest.display_name":
      return context.guest.displayName;
    case "invitation.id":
      return context.invitation?.id ?? null;
    case "invitation_download_link":
      return context.invitation?.latestActiveFileId
        ? `/api/invitation-files/${context.invitation.latestActiveFileId}`
        : null;
    case "public_guest_page_link":
      return context.invitation?.publicGuestPageLink ?? null;
    case "rsvp_deadline":
      return formatDateTime(
        context.event.rsvpDeadlineAt,
        {
          dateStyle: "medium",
        },
        locale,
      );
    default:
      return null;
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function renderMessageTemplate(
  template: MessageTemplate,
  context: MessageRenderingContext,
): MessageRenderResult {
  const variables = Array.from(
    new Set([...template.variables, ...extractMessageVariables(template.body)]),
  );
  const missingRequiredVariables: string[] = [];
  const missingOptionalVariables: string[] = [];
  let renderedBody = template.body;

  for (const variable of variables) {
    const value = resolveVariable(variable, context, template.language);

    if (value === null || value.length === 0) {
      if (optionalVariableNames.has(variable)) {
        missingOptionalVariables.push(variable);
      } else {
        missingRequiredVariables.push(variable);
      }
    }

    renderedBody = renderedBody.replaceAll(
      new RegExp(`{{\\s*${escapeRegExp(variable)}\\s*}}`, "g"),
      value ?? "",
    );
  }

  return {
    missingOptionalVariables,
    missingRequiredVariables,
    renderedBody,
    variables,
  };
}

function invitationStatusIsSendReady(
  invitation: MessageInvitationContext | null | undefined,
) {
  return (
    invitation?.status === "generated" ||
    invitation?.status === "sent" ||
    invitation?.status === "resent"
  );
}

export function validateMessageReadiness(
  input: MessagePreparationInput,
): MessageReadinessIssue[] {
  const issues: MessageReadinessIssue[] = [];

  if (input.guest.projectId !== input.project.id) {
    issues.push({
      blocking: true,
      code: "project_mismatch",
      message: "Guest must belong to the selected project.",
      requirementIds: ["MSG-004", "ROLE-001"],
    });
  }

  if (!input.guest.isActive) {
    issues.push({
      blocking: true,
      code: "guest_inactive",
      message: "Guest must be active before communication preparation.",
      requirementIds: ["MSG-004", "GM-006"],
    });
  }

  if (
    !input.guest.eventAssignments.some(
      (assignment) =>
        assignment.eventId === input.event.id && assignment.invited,
    )
  ) {
    issues.push({
      blocking: true,
      code: "guest_not_assigned_to_event",
      message: "Guest must be invited to the selected event.",
      requirementIds: ["MSG-004", "GM-004"],
    });
  }

  if (input.paymentGate === "locked") {
    issues.push({
      blocking: true,
      code: "payment_gate_locked",
      message:
        "Invitation sending is locked until payment is confirmed or an exception is approved.",
      requirementIds: ["MSG-004", "PAY-014", "PAY-015"],
    });
  }

  if (!input.guest.isPrintedOnly && !input.guest.whatsappNumber) {
    issues.push({
      blocking: true,
      code: "missing_whatsapp_number",
      message: "Digital WhatsApp messages require a guest WhatsApp number.",
      requirementIds: ["MSG-004", "GM-015"],
    });
  }

  if (requiredInvitationMessageTypes.has(input.messageType)) {
    if (!invitationStatusIsSendReady(input.invitation)) {
      issues.push({
        blocking: true,
        code: "invitation_not_generated",
        message: "Invitation messages require a generated invitation record.",
        requirementIds: ["MSG-004", "INV-013"],
      });
    }

    if (!input.invitation?.latestActiveFileId) {
      issues.push({
        blocking: true,
        code: "missing_active_invitation_file",
        message:
          "Invitation messages require the latest active invitation file.",
        requirementIds: ["MSG-004", "FILE-005", "FILE-006"],
      });
    }

    if (!input.invitation?.publicGuestPageLink) {
      issues.push({
        blocking: true,
        code: "missing_public_guest_page_link",
        message: "Invitation messages require a secure public guest page link.",
        requirementIds: ["MSG-004", "RSVP-001", "TECH-010"],
      });
    }
  }

  try {
    const { template } = selectMessageTemplate({
      messageType: input.messageType,
      preferredLanguage: input.guest.preferredLanguage,
      projectDefaultLanguage: input.project.defaultLanguage,
      templates: input.templates,
    });
    const rendering = renderMessageTemplate(template, {
      changeReason: input.changeReason,
      event: input.event,
      guest: input.guest,
      invitation: input.invitation,
      project: input.project,
    });

    if (rendering.missingRequiredVariables.length > 0) {
      issues.push({
        blocking: true,
        code: "missing_required_template_variables",
        message: "Message template has unresolved required variables.",
        requirementIds: ["MSG-003", "MSG-004"],
      });
    }
  } catch (error) {
    if (error instanceof MessageValidationError) {
      issues.push({
        blocking: true,
        code: "missing_template",
        message: error.message,
        requirementIds: ["MSG-002", "MSG-003"],
      });
    } else {
      throw error;
    }
  }

  return issues;
}

function normalizeWhatsappDigits(value: string) {
  return value.replace(/\D+/g, "");
}

export function buildGuidedManualWhatsappUrl(
  whatsappNumber: string | null | undefined,
  messageBody: string,
) {
  const digits = normalizeWhatsappDigits(
    requiredText(whatsappNumber, "WhatsApp number"),
  );

  if (digits.length === 0) {
    throw new MessageValidationError("WhatsApp number is required.");
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(messageBody)}`;
}

export function prepareCommunicationMessage(
  input: MessagePreparationInput,
): PreparedMessageLog {
  const readinessIssues = validateMessageReadiness(input);

  if (readinessIssues.some((issue) => issue.blocking)) {
    throw new MessageValidationError(
      "Message cannot be prepared until readiness issues are resolved.",
    );
  }

  const { template } = selectMessageTemplate({
    messageType: input.messageType,
    preferredLanguage: input.guest.preferredLanguage,
    projectDefaultLanguage: input.project.defaultLanguage,
    templates: input.templates,
  });
  const rendering = renderMessageTemplate(template, {
    changeReason: input.changeReason,
    event: input.event,
    guest: input.guest,
    invitation: input.invitation,
    project: input.project,
  });

  if (rendering.missingRequiredVariables.length > 0) {
    throw new MessageValidationError(
      "Message cannot be prepared with unresolved required variables.",
    );
  }

  const auditActions: MessageAuditAction[] = ["messages.prepared"];

  if (input.messageType === "invitation_resend") {
    auditActions.push("messages.resent");
  }

  if (input.messageType === "maybe_follow_up") {
    auditActions.push("message_reminders.prepared");
  }

  if (input.messageType === "modification_notice") {
    auditActions.push("message_modifications.prepared");
  }

  return {
    auditActions,
    channel: "whatsapp",
    eventId: input.event.id,
    failureReason: null,
    guestId: input.guest.id,
    id: randomUUID(),
    invitationId: input.invitation?.id ?? null,
    language: template.language,
    manualWhatsappUrl: input.guest.whatsappNumber
      ? buildGuidedManualWhatsappUrl(
          input.guest.whatsappNumber,
          rendering.renderedBody,
        )
      : null,
    messageType: input.messageType,
    openedAt: null,
    openedBy: null,
    preparedAt: input.preparedAt,
    preparedBy: input.preparedBy,
    previousMessageLogId: null,
    projectId: input.project.id,
    renderedBody: rendering.renderedBody,
    sendingMode: "guided_manual",
    sentAt: null,
    sentConfirmedBy: null,
    skippedReason: null,
    status: "prepared",
    targetWhatsappNumber: input.guest.whatsappNumber,
    templateId: template.id,
    templateVersion: template.version,
  };
}

export function markGuidedManualMessage(
  message: PreparedMessageLog,
  input: MarkGuidedManualMessageInput,
): PreparedMessageLog {
  if (message.sendingMode !== "guided_manual") {
    throw new MessageValidationError(
      "Only guided manual messages can be marked by this workflow.",
    );
  }

  const allowedTransitions: Partial<
    Record<MessageDeliveryStatus, MessageDeliveryStatus[]>
  > = {
    opened_manually: ["sent", "resent", "failed", "skipped"],
    prepared: ["opened_manually", "sent", "resent", "failed", "skipped"],
    resent: ["resent"],
    sent: ["resent"],
  };
  const allowedNextStatuses = allowedTransitions[message.status] ?? [];

  if (!allowedNextStatuses.includes(input.nextStatus)) {
    throw new MessageValidationError(
      `Cannot mark a ${message.status} message as ${input.nextStatus}.`,
    );
  }

  if (input.nextStatus === "opened_manually") {
    return {
      ...message,
      openedAt: input.markedAt,
      openedBy: input.actorUserId,
      status: input.nextStatus,
    };
  }

  if (input.nextStatus === "sent" || input.nextStatus === "resent") {
    return {
      ...message,
      sentAt: input.markedAt,
      sentConfirmedBy: input.actorUserId,
      status: input.nextStatus,
    };
  }

  if (input.nextStatus === "failed") {
    if (!input.reason?.trim()) {
      throw new MessageValidationError("Failure reason is required.");
    }

    return {
      ...message,
      failureReason: input.reason.trim(),
      status: "failed",
    };
  }

  if (!input.reason?.trim()) {
    throw new MessageValidationError("Skip reason is required.");
  }

  return {
    ...message,
    skippedReason: input.reason.trim(),
    status: "skipped",
  };
}

export function filterMaybeFollowUpCandidates(
  candidates: MaybeFollowUpCandidate[],
) {
  return candidates.filter((candidate) => candidate.status === "maybe");
}

export function createApiReadyMessagingAdapter() {
  return {
    async enqueue(message: PreparedMessageLog) {
      return {
        externalProviderMessageId: null,
        messageLogId: message.id,
        mode: "api_ready" as const,
        status: "queued" as const,
      };
    },
    async send(_message?: PreparedMessageLog) {
      const attemptedMessage = _message ? " for a prepared message" : "";
      throw new MessageValidationError(
        `Automatic WhatsApp sending is not connected${attemptedMessage}. Use the guided manual sending workflow instead.`,
      );
    },
  };
}

export function canPerformMessageAction(
  assignments: RoleAssignment[],
  projectId: string,
  action: MessageAction,
) {
  return hasScopedPermission(assignments, actionPermissions[action], {
    projectId,
    scope: "project",
  });
}

export function buildMessageAuditActions() {
  return [...messageAuditActions];
}

export function getSprint7CommunicationStatus() {
  return {
    epic: "EPIC-MSG",
    features: ["FEAT-MSG-001", "FEAT-MSG-002", "FEAT-MSG-003"],
    issue: 21,
    modules: [
      {
        name: "Message template and multilingual foundation",
        requirementIds: ["MSG-002", "MSG-003"],
      },
      {
        name: "Dynamic message variable rendering and readiness validation",
        requirementIds: ["MSG-003", "MSG-004", "PAY-014", "PAY-015"],
      },
      {
        name: "Guided manual WhatsApp sending workflow",
        requirementIds: ["MSG-001", "MSG-008", "MSG-009", "MSG-010"],
      },
      {
        name: "API-ready messaging adapter abstraction",
        requirementIds: ["MSG-001", "MSG-010"],
      },
      {
        name: "Invitation send/resend and status tracking foundation",
        requirementIds: ["MSG-004", "MSG-008", "INV-013"],
      },
      {
        name: "Maybe follow-up, event reminder, and modification placeholders",
        requirementIds: ["MSG-005", "MSG-006", "RSVP-011", "TECH-005"],
      },
      {
        name: "Communication history, permissions, and audit logging",
        requirementIds: ["MSG-009", "REP-006", "ROLE-001", "ROLE-007"],
      },
    ],
    outOfScope: [
      "unofficial WhatsApp Web automation",
      "production WhatsApp API integration requiring real credentials",
      "seating",
      "check-in",
      "contracts",
      "pricing",
      "payments",
      "invitation PDF generation",
      "QR generation",
      "partner project creation",
    ],
    requirementIds: [
      "MSG-001",
      "MSG-002",
      "MSG-003",
      "MSG-004",
      "MSG-005",
      "MSG-006",
      "MSG-007",
      "MSG-008",
      "MSG-009",
      "MSG-010",
      "PV-004",
      "RSVP-011",
      "INV-013",
      "PAY-014",
      "PAY-015",
      "REP-006",
      "TECH-005",
    ],
    sprint: "Sprint 7 - WhatsApp Communication Workflows",
    stories: ["STORY-MSG-001", "STORY-MSG-002"],
    tasks: ["TASK-MSG-001", "TASK-MSG-002"],
    tests: ["TEST-MSG-001", "TEST-MSG-002"],
  };
}
