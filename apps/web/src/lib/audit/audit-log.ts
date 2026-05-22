export type AuditSource = "api" | "auth" | "system" | "storage";

export type AuditAction =
  | "auth.magic_link_requested"
  | "permissions.role_assigned"
  | "permissions.role_revoked"
  | "projects.created"
  | "projects.updated"
  | "events.created"
  | "events.updated"
  | "workflow_tasks.created"
  | "workflow_tasks.updated"
  | "workflow_tasks.deleted"
  | "guests.created"
  | "guests.updated"
  | "guests.deactivated"
  | "guest_event_assignments.created"
  | "guest_event_assignments.updated"
  | "guest_event_assignments.deleted"
  | "guest_tags.assigned"
  | "guest_tags.removed"
  | "guest_tags.created"
  | "guest_tags.updated"
  | "guest_title_types.created"
  | "guest_title_types.updated"
  | "guest_duplicates.detected"
  | "guest_duplicates.reviewed"
  | "storage.file_registered"
  | "system.foundation_health_checked";

export type AuditLogEvent = {
  action: AuditAction;
  actorUserId?: string;
  after?: Record<string, unknown>;
  before?: Record<string, unknown>;
  objectId?: string;
  objectType: string;
  reason?: string;
  source: AuditSource;
};

export type AuditLogWriter = {
  record(event: AuditLogEvent): Promise<void>;
};

export const noopAuditLogWriter: AuditLogWriter = {
  async record() {
    return Promise.resolve();
  },
};

export async function recordAuditEvent(
  writer: AuditLogWriter,
  event: AuditLogEvent,
) {
  await writer.record({
    ...event,
    before: event.before ?? {},
    after: event.after ?? {},
  });
}

export function getAuditFoundationSummary() {
  return {
    appendOnly: true,
    backendOnly: true,
    requirementIds: ["REP-006", "ROLE-007"],
    sensitiveActionsTracked: [
      "auth",
      "permissions",
      "projects",
      "events",
      "workflow_tasks",
      "files",
      "future guest/RSVP/check-in/payment actions",
    ],
  };
}
