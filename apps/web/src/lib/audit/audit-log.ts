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
  | "guest_imports.applied"
  | "guest_imports.created"
  | "guest_imports.mapping_saved"
  | "guest_imports.reviewed"
  | "guest_imports.submitted"
  | "guest_imports.updated"
  | "guest_imports.validation_completed"
  | "guest_import_rows.applied"
  | "guest_import_rows.reviewed"
  | "guest_import_rows.staged"
  | "guest_import_rows.validation_updated"
  | "guest_public_pages.accessed"
  | "guest_public_pages.previewed"
  | "guest_public_tokens.created"
  | "guest_public_tokens.regenerated"
  | "guest_public_tokens.revoked"
  | "rsvps.changed"
  | "rsvps.deadline_review_required"
  | "rsvps.manual_recorded"
  | "rsvps.submitted"
  | "invitation_templates.created"
  | "invitation_templates.updated"
  | "invitation_templates.preview_generated"
  | "invitation_templates.preview_approved"
  | "invitation_generation_jobs.created"
  | "invitation_generation_jobs.updated"
  | "invitations.created"
  | "invitations.generated"
  | "invitations.regeneration_required"
  | "invitation_files.versioned"
  | "message_templates.created"
  | "message_templates.updated"
  | "message_templates.activated"
  | "message_templates.deactivated"
  | "messages.prepared"
  | "messages.updated"
  | "messages.opened_manually"
  | "messages.sent"
  | "messages.failed"
  | "messages.skipped"
  | "messages.resent"
  | "message_reminders.prepared"
  | "message_reminders.updated"
  | "message_modifications.prepared"
  | "message_queue_items.updated"
  | "event_tables.created"
  | "event_tables.updated"
  | "event_tables.archived"
  | "event_tables.capacity_changed"
  | "event_table_seats.created"
  | "event_table_seats.updated"
  | "guest_table_assignments.assigned"
  | "guest_table_assignments.removed"
  | "guest_table_assignments.moved"
  | "guest_table_assignments.updated"
  | "seating_exports.generated"
  | "seating_exports.updated"
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
      "guests",
      "guest_imports",
      "guest_import_rows",
      "guest_public_pages",
      "guest_public_tokens",
      "rsvps",
      "invitation_templates",
      "invitation_generation_jobs",
      "invitations",
      "invitation_files",
      "message_templates",
      // Table/object names are listed here for redaction coverage; their AuditAction values use the messages.* action prefix.
      "message_logs",
      "message_queue_items",
      "event_tables",
      "event_table_seats",
      "guest_table_assignments",
      // Export table redaction is tracked by table name; audit actions use the semantic seating_exports.* prefix.
      "seating_export_files",
      "future check-in/payment actions",
    ],
  };
}
