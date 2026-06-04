-- Sprint 15 release security hardening.
-- Related: GitHub issue #31; sprint plan docs/planning/sprint-15-plan.md;
-- requirements ROLE-001, ROLE-007, ROLE-009, TECH-004, TECH-010, FILE-009.
--
-- Supabase advisors flagged RPCs that inherited default PUBLIC execute
-- privileges. Keep guest-token RPCs public by explicit grant, and make every
-- authenticated application RPC explicit rather than inherited.
--
-- This migration must run after the Sprint 1-14 migrations that create these
-- RPCs. It intentionally fails fast if any referenced signature is missing,
-- because that indicates migration-history drift in the target database.
--
-- Default-privileges convention:
-- `alter default privileges for role postgres in schema public revoke execute
-- on functions from public` applies to future functions created by the Supabase
-- migration role used by the CLI in this project. Every new application RPC
-- must receive an explicit grant in the same migration. Token-scoped public
-- guest RPCs must be rare and explicitly documented before an anon execute
-- grant is added.

begin;

alter default privileges for role postgres in schema public revoke execute on functions from public;

revoke execute on function public.archive_project_file(uuid, public.file_archive_action, text) from public;
revoke execute on function public.apply_guest_import_approved_rows(uuid) from public;
revoke execute on function public.approve_invitation_template_preview(uuid) from public;
revoke execute on function public.approve_project_contract(uuid, text, boolean) from public;
revoke execute on function public.assign_guest_to_event_table(uuid, uuid, uuid, uuid, uuid, text, text) from public;
revoke execute on function public.couple_review_guest_message(uuid, text, text) from public;
revoke execute on function public.create_check_in_token(uuid, uuid, uuid) from public;
revoke execute on function public.create_file_version(uuid, text, text, bigint, text, text, jsonb) from public;
revoke execute on function public.create_guest_book_export(uuid) from public;
revoke execute on function public.create_guest_import_session(uuid, public.guest_side, text, text, jsonb, jsonb, jsonb) from public;
revoke execute on function public.create_guest_public_token(uuid, timestamptz) from public;
revoke execute on function public.create_partner_project_draft(uuid, text, text, text, text, integer, text, text, integer) from public;
revoke execute on function public.create_project_comment(uuid, text, text) from public;
revoke execute on function public.create_report_export(uuid, text, public.report_scope_type, uuid, uuid, public.report_export_format, public.report_export_status, uuid, text, text, integer, jsonb, jsonb, boolean, text[]) from public;
revoke execute on function public.create_seating_export_file(uuid, integer, integer, integer) from public;
revoke execute on function public.create_unexpected_guest_request(uuid, text, public.guest_side, text, uuid) from public;
revoke execute on function public.current_user_can_access_event(uuid, text) from public;
revoke execute on function public.current_user_can_access_events(uuid[], text) from public;
revoke execute on function public.current_user_can_access_file(uuid, text) from public;
revoke execute on function public.current_user_can_access_partner(uuid, text) from public;
revoke execute on function public.current_user_can_access_project(uuid, text) from public;
revoke execute on function public.current_user_can_access_project_permissions(uuid, text[]) from public;
revoke execute on function public.current_user_can_manage_guest_side(uuid, public.guest_side) from public;
revoke execute on function public.current_user_has_any_commercial_read(uuid) from public;
revoke execute on function public.current_user_has_permission(text, public.role_scope_type, uuid) from public;
revoke execute on function public.enqueue_invitation_generation_job(uuid, public.invitation_generation_mode, uuid[]) from public;
revoke execute on function public.get_project_payment_balance(uuid) from public;
revoke execute on function public.get_project_rsvp_summary(uuid) from public;
revoke execute on function public.link_partner_user(uuid, uuid, text) from public;
revoke execute on function public.list_couple_guest_messages(uuid) from public;
revoke execute on function public.list_guest_file_downloads(text) from public;
revoke execute on function public.list_post_event_feedback(uuid) from public;
revoke execute on function public.mark_guided_manual_message_status(uuid, uuid, public.message_delivery_status, text) from public;
revoke execute on function public.mark_invitation_template_preview_generated(uuid, jsonb) from public;
revoke execute on function public.perform_guest_check_in(uuid, uuid, public.check_in_method, integer, uuid, uuid, uuid, public.check_in_sync_status, timestamptz, text, boolean, text) from public;
revoke execute on function public.prepare_message_log_with_queue(uuid, uuid, uuid, uuid, uuid, integer, public.message_type, public.message_language, public.message_channel, public.message_sending_mode, public.message_delivery_status, text, text, text, text, jsonb, uuid, uuid) from public;
revoke execute on function public.preview_guest_public_page(uuid) from public;
revoke execute on function public.record_file_access_event(uuid, public.file_access_action, boolean, text, timestamptz, jsonb) from public;
revoke execute on function public.register_project_file(uuid, public.file_category, text, text, bigint, public.file_visibility, uuid, uuid, uuid, text, text, jsonb) from public;
revoke execute on function public.refresh_project_payment_gate(uuid) from public;
revoke execute on function public.remove_guest_from_event_table(uuid, uuid, uuid, text) from public;
revoke execute on function public.replace_guest_foundation_assignments(uuid, uuid[], uuid[]) from public;
revoke execute on function public.resolve_check_in_token(uuid, text) from public;
revoke execute on function public.resolve_guest_file_download(text, uuid) from public;
revoke execute on function public.resolve_guest_public_page(text) from public;
revoke execute on function public.revoke_guest_public_token(uuid) from public;
revoke execute on function public.review_guest_import_rows(uuid, uuid[], uuid[], uuid[], text) from public;
revoke execute on function public.review_guest_message(uuid, text, text, text) from public;
revoke execute on function public.review_partner_project_submission(uuid, text, text) from public;
revoke execute on function public.review_post_event_feedback(uuid, public.post_event_feedback_review_status, text) from public;
revoke execute on function public.review_unexpected_guest_request(uuid, public.unexpected_guest_request_status, text, public.unexpected_guest_approval_mode, integer) from public;
revoke execute on function public.save_guest_import_preview(uuid, uuid, jsonb, jsonb, jsonb, jsonb) from public;
revoke execute on function public.save_invitation_template_fields(uuid, jsonb, uuid) from public;
revoke execute on function public.submit_guest_import_session(uuid) from public;
revoke execute on function public.submit_offline_check_in_sync_batch(uuid, uuid, jsonb, jsonb, public.check_in_sync_batch_status, jsonb) from public;
revoke execute on function public.submit_partner_project_submission(uuid) from public;
revoke execute on function public.submit_post_event_feedback(uuid, integer, integer, integer, text, text, text, boolean, text) from public;
revoke execute on function public.submit_public_guest_message(text, text, text, uuid) from public;
revoke execute on function public.submit_public_rsvp(text, uuid, public.rsvp_status, text) from public;
revoke execute on function public.update_project_archive_lifecycle(uuid, public.project_archive_action, text, timestamptz) from public;

-- Remove any direct anon grants for authenticated-only RPCs before adding the
-- final explicit authenticated/service_role grants below.
revoke execute on function public.archive_project_file(uuid, public.file_archive_action, text) from anon;
revoke execute on function public.apply_guest_import_approved_rows(uuid) from anon;
revoke execute on function public.approve_invitation_template_preview(uuid) from anon;
revoke execute on function public.approve_project_contract(uuid, text, boolean) from anon;
revoke execute on function public.assign_guest_to_event_table(uuid, uuid, uuid, uuid, uuid, text, text) from anon;
revoke execute on function public.couple_review_guest_message(uuid, text, text) from anon;
revoke execute on function public.create_check_in_token(uuid, uuid, uuid) from anon;
revoke execute on function public.create_file_version(uuid, text, text, bigint, text, text, jsonb) from anon;
revoke execute on function public.create_guest_book_export(uuid) from anon;
revoke execute on function public.create_guest_import_session(uuid, public.guest_side, text, text, jsonb, jsonb, jsonb) from anon;
revoke execute on function public.create_guest_public_token(uuid, timestamptz) from anon;
revoke execute on function public.create_partner_project_draft(uuid, text, text, text, text, integer, text, text, integer) from anon;
revoke execute on function public.create_project_comment(uuid, text, text) from anon;
revoke execute on function public.create_report_export(uuid, text, public.report_scope_type, uuid, uuid, public.report_export_format, public.report_export_status, uuid, text, text, integer, jsonb, jsonb, boolean, text[]) from anon;
revoke execute on function public.create_seating_export_file(uuid, integer, integer, integer) from anon;
revoke execute on function public.create_unexpected_guest_request(uuid, text, public.guest_side, text, uuid) from anon;
revoke execute on function public.current_user_can_access_event(uuid, text) from anon;
revoke execute on function public.current_user_can_access_events(uuid[], text) from anon;
revoke execute on function public.current_user_can_access_file(uuid, text) from anon;
revoke execute on function public.current_user_can_access_partner(uuid, text) from anon;
revoke execute on function public.current_user_can_access_project(uuid, text) from anon;
revoke execute on function public.current_user_can_access_project_permissions(uuid, text[]) from anon;
revoke execute on function public.current_user_can_manage_guest_side(uuid, public.guest_side) from anon;
revoke execute on function public.current_user_has_any_commercial_read(uuid) from anon;
revoke execute on function public.current_user_has_permission(text, public.role_scope_type, uuid) from anon;
revoke execute on function public.enqueue_invitation_generation_job(uuid, public.invitation_generation_mode, uuid[]) from anon;
revoke execute on function public.get_project_payment_balance(uuid) from anon;
revoke execute on function public.get_project_rsvp_summary(uuid) from anon;
revoke execute on function public.link_partner_user(uuid, uuid, text) from anon;
revoke execute on function public.list_couple_guest_messages(uuid) from anon;
revoke execute on function public.list_post_event_feedback(uuid) from anon;
revoke execute on function public.mark_guided_manual_message_status(uuid, uuid, public.message_delivery_status, text) from anon;
revoke execute on function public.mark_invitation_template_preview_generated(uuid, jsonb) from anon;
revoke execute on function public.perform_guest_check_in(uuid, uuid, public.check_in_method, integer, uuid, uuid, uuid, public.check_in_sync_status, timestamptz, text, boolean, text) from anon;
revoke execute on function public.prepare_message_log_with_queue(uuid, uuid, uuid, uuid, uuid, integer, public.message_type, public.message_language, public.message_channel, public.message_sending_mode, public.message_delivery_status, text, text, text, text, jsonb, uuid, uuid) from anon;
revoke execute on function public.preview_guest_public_page(uuid) from anon;
revoke execute on function public.record_file_access_event(uuid, public.file_access_action, boolean, text, timestamptz, jsonb) from anon;
revoke execute on function public.register_project_file(uuid, public.file_category, text, text, bigint, public.file_visibility, uuid, uuid, uuid, text, text, jsonb) from anon;
revoke execute on function public.refresh_project_payment_gate(uuid) from anon;
revoke execute on function public.remove_guest_from_event_table(uuid, uuid, uuid, text) from anon;
revoke execute on function public.replace_guest_foundation_assignments(uuid, uuid[], uuid[]) from anon;
revoke execute on function public.resolve_check_in_token(uuid, text) from anon;
revoke execute on function public.revoke_guest_public_token(uuid) from anon;
revoke execute on function public.review_guest_import_rows(uuid, uuid[], uuid[], uuid[], text) from anon;
revoke execute on function public.review_guest_message(uuid, text, text, text) from anon;
revoke execute on function public.review_partner_project_submission(uuid, text, text) from anon;
revoke execute on function public.review_post_event_feedback(uuid, public.post_event_feedback_review_status, text) from anon;
revoke execute on function public.review_unexpected_guest_request(uuid, public.unexpected_guest_request_status, text, public.unexpected_guest_approval_mode, integer) from anon;
revoke execute on function public.save_guest_import_preview(uuid, uuid, jsonb, jsonb, jsonb, jsonb) from anon;
revoke execute on function public.save_invitation_template_fields(uuid, jsonb, uuid) from anon;
revoke execute on function public.submit_guest_import_session(uuid) from anon;
revoke execute on function public.submit_offline_check_in_sync_batch(uuid, uuid, jsonb, jsonb, public.check_in_sync_batch_status, jsonb) from anon;
revoke execute on function public.submit_partner_project_submission(uuid) from anon;
revoke execute on function public.submit_post_event_feedback(uuid, integer, integer, integer, text, text, text, boolean, text) from anon;
revoke execute on function public.update_project_archive_lifecycle(uuid, public.project_archive_action, text, timestamptz) from anon;

-- Remove any direct anon grants for token-scoped public RPCs before adding the
-- final explicit anon/authenticated/service_role grants below.
revoke execute on function public.list_guest_file_downloads(text) from anon;
revoke execute on function public.resolve_guest_file_download(text, uuid) from anon;
revoke execute on function public.resolve_guest_public_page(text) from anon;
revoke execute on function public.submit_public_guest_message(text, text, text, uuid) from anon;
revoke execute on function public.submit_public_rsvp(text, uuid, public.rsvp_status, text) from anon;

grant execute on function public.archive_project_file(uuid, public.file_archive_action, text) to authenticated, service_role;
grant execute on function public.apply_guest_import_approved_rows(uuid) to authenticated, service_role;
grant execute on function public.approve_invitation_template_preview(uuid) to authenticated, service_role;
grant execute on function public.approve_project_contract(uuid, text, boolean) to authenticated, service_role;
grant execute on function public.assign_guest_to_event_table(uuid, uuid, uuid, uuid, uuid, text, text) to authenticated, service_role;
grant execute on function public.couple_review_guest_message(uuid, text, text) to authenticated, service_role;
grant execute on function public.create_check_in_token(uuid, uuid, uuid) to authenticated, service_role;
grant execute on function public.create_file_version(uuid, text, text, bigint, text, text, jsonb) to authenticated, service_role;
grant execute on function public.create_guest_book_export(uuid) to authenticated, service_role;
grant execute on function public.create_guest_import_session(uuid, public.guest_side, text, text, jsonb, jsonb, jsonb) to authenticated, service_role;
grant execute on function public.create_guest_public_token(uuid, timestamptz) to authenticated, service_role;
grant execute on function public.create_partner_project_draft(uuid, text, text, text, text, integer, text, text, integer) to authenticated, service_role;
grant execute on function public.create_project_comment(uuid, text, text) to authenticated, service_role;
grant execute on function public.create_report_export(uuid, text, public.report_scope_type, uuid, uuid, public.report_export_format, public.report_export_status, uuid, text, text, integer, jsonb, jsonb, boolean, text[]) to authenticated, service_role;
grant execute on function public.create_seating_export_file(uuid, integer, integer, integer) to authenticated, service_role;
grant execute on function public.create_unexpected_guest_request(uuid, text, public.guest_side, text, uuid) to authenticated, service_role;
grant execute on function public.current_user_can_access_event(uuid, text) to authenticated, service_role;
grant execute on function public.current_user_can_access_events(uuid[], text) to authenticated, service_role;
grant execute on function public.current_user_can_access_file(uuid, text) to authenticated, service_role;
grant execute on function public.current_user_can_access_partner(uuid, text) to authenticated, service_role;
grant execute on function public.current_user_can_access_project(uuid, text) to authenticated, service_role;
grant execute on function public.current_user_can_access_project_permissions(uuid, text[]) to authenticated, service_role;
grant execute on function public.current_user_can_manage_guest_side(uuid, public.guest_side) to authenticated, service_role;
grant execute on function public.current_user_has_any_commercial_read(uuid) to authenticated, service_role;
grant execute on function public.current_user_has_permission(text, public.role_scope_type, uuid) to authenticated, service_role;
grant execute on function public.enqueue_invitation_generation_job(uuid, public.invitation_generation_mode, uuid[]) to authenticated, service_role;
grant execute on function public.get_project_payment_balance(uuid) to authenticated, service_role;
grant execute on function public.get_project_rsvp_summary(uuid) to authenticated, service_role;
grant execute on function public.link_partner_user(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.list_couple_guest_messages(uuid) to authenticated, service_role;
grant execute on function public.list_post_event_feedback(uuid) to authenticated, service_role;
grant execute on function public.mark_guided_manual_message_status(uuid, uuid, public.message_delivery_status, text) to authenticated, service_role;
grant execute on function public.mark_invitation_template_preview_generated(uuid, jsonb) to authenticated, service_role;
grant execute on function public.perform_guest_check_in(uuid, uuid, public.check_in_method, integer, uuid, uuid, uuid, public.check_in_sync_status, timestamptz, text, boolean, text) to authenticated, service_role;
grant execute on function public.prepare_message_log_with_queue(uuid, uuid, uuid, uuid, uuid, integer, public.message_type, public.message_language, public.message_channel, public.message_sending_mode, public.message_delivery_status, text, text, text, text, jsonb, uuid, uuid) to authenticated, service_role;
grant execute on function public.preview_guest_public_page(uuid) to authenticated, service_role;
grant execute on function public.record_file_access_event(uuid, public.file_access_action, boolean, text, timestamptz, jsonb) to authenticated, service_role;
grant execute on function public.register_project_file(uuid, public.file_category, text, text, bigint, public.file_visibility, uuid, uuid, uuid, text, text, jsonb) to authenticated, service_role;
grant execute on function public.refresh_project_payment_gate(uuid) to authenticated, service_role;
grant execute on function public.remove_guest_from_event_table(uuid, uuid, uuid, text) to authenticated, service_role;
grant execute on function public.replace_guest_foundation_assignments(uuid, uuid[], uuid[]) to authenticated, service_role;
grant execute on function public.resolve_check_in_token(uuid, text) to authenticated, service_role;
grant execute on function public.revoke_guest_public_token(uuid) to authenticated, service_role;
grant execute on function public.review_guest_import_rows(uuid, uuid[], uuid[], uuid[], text) to authenticated, service_role;
grant execute on function public.review_guest_message(uuid, text, text, text) to authenticated, service_role;
grant execute on function public.review_partner_project_submission(uuid, text, text) to authenticated, service_role;
grant execute on function public.review_post_event_feedback(uuid, public.post_event_feedback_review_status, text) to authenticated, service_role;
grant execute on function public.review_unexpected_guest_request(uuid, public.unexpected_guest_request_status, text, public.unexpected_guest_approval_mode, integer) to authenticated, service_role;
grant execute on function public.save_guest_import_preview(uuid, uuid, jsonb, jsonb, jsonb, jsonb) to authenticated, service_role;
grant execute on function public.save_invitation_template_fields(uuid, jsonb, uuid) to authenticated, service_role;
grant execute on function public.submit_guest_import_session(uuid) to authenticated, service_role;
grant execute on function public.submit_offline_check_in_sync_batch(uuid, uuid, jsonb, jsonb, public.check_in_sync_batch_status, jsonb) to authenticated, service_role;
grant execute on function public.submit_partner_project_submission(uuid) to authenticated, service_role;
grant execute on function public.submit_post_event_feedback(uuid, integer, integer, integer, text, text, text, boolean, text) to authenticated, service_role;
grant execute on function public.update_project_archive_lifecycle(uuid, public.project_archive_action, text, timestamptz) to authenticated, service_role;

-- These five public guest RPCs intentionally retain anon execute because they
-- are guest-token scoped public page, file, message, and RSVP flows.
grant execute on function public.list_guest_file_downloads(text) to anon, authenticated, service_role;
grant execute on function public.resolve_guest_file_download(text, uuid) to anon, authenticated, service_role;
grant execute on function public.resolve_guest_public_page(text) to anon, authenticated, service_role;
grant execute on function public.submit_public_guest_message(text, text, text, uuid) to anon, authenticated, service_role;
grant execute on function public.submit_public_rsvp(text, uuid, public.rsvp_status, text) to anon, authenticated, service_role;

commit;
