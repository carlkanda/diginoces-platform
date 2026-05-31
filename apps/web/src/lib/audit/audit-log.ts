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
  | "service_packages.created"
  | "service_packages.updated"
  | "service_package_addons.created"
  | "service_package_addons.updated"
  | "project_event_package_selections.selected"
  | "project_event_package_selections.updated"
  | "pricing_calculations.generated"
  | "contracts.generated"
  | "contracts.updated"
  | "contracts.approved"
  | "contract_approvals.created"
  | "contract_addendums.generated"
  | "contract_addendums.updated"
  | "contract_addendums.approved"
  | "payments.recorded"
  | "payments.updated"
  | "payments.confirmed"
  | "payment_exceptions.created"
  | "payment_exceptions.updated"
  | "payment_exceptions.revoked"
  | "commercial_gestures.applied"
  | "commercial_gestures.updated"
  | "payment_gate_events.created"
  | "guest_messages.approved"
  | "guest_messages.couple_approved"
  | "guest_messages.couple_correction_requested"
  | "guest_messages.couple_reviewed"
  | "guest_messages.edited"
  | "guest_messages.edited_by_admin"
  | "guest_messages.excluded"
  | "guest_messages.exported"
  | "guest_messages.flagged"
  | "guest_messages.moderated"
  | "guest_messages.submitted"
  | "guest_book_exports.generated"
  | "guest_book_exports.updated"
  | "post_event_feedback.submitted"
  | "post_event_feedback.reviewed"
  | "post_event_feedback.testimonial_permission_changed"
  | "testimonial_permissions.recorded"
  | "testimonial_permissions.reviewed"
  | "reports.exported"
  | "reports.updated"
  | "audit_logs.exported"
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
      "seating_exports",
      // Redaction matches literal DB table names like seating_export_files;
      // audit actions use semantic groups like seating_exports.* for queries.
      "seating_export_files",
      "service_packages",
      "service_package_addons",
      "project_event_package_selections",
      "pricing_calculations",
      "contracts",
      "contract_approvals",
      "contract_addendums",
      "payments",
      "payment_exceptions",
      "commercial_gestures",
      "payment_gate_events",
      "report_exports",
      "audit_log_exports",
      "guest_messages",
      "guest_message_reviews",
      "guest_book_exports",
      "post_event_feedback",
      "testimonial_permissions",
      "reports",
      "audit_logs",
    ],
  };
}
