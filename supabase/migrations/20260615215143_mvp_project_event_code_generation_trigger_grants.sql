-- MVP launch QA hardening for issue #58 / QA-003.
--
-- Authenticated inserts into wedding_projects/events pass RLS before project and
-- event codes are generated. The trigger functions call these app_private
-- helpers as the inserting user, so authenticated sessions need execute access
-- to the helper functions while anonymous and inherited PUBLIC execution remain
-- revoked.

revoke all on function app_private.generate_project_code(text, text, integer) from public;
revoke all on function app_private.generate_event_code(uuid, public.event_type) from public;

grant execute on function app_private.generate_project_code(text, text, integer)
  to authenticated, service_role;

grant execute on function app_private.generate_event_code(uuid, public.event_type)
  to authenticated, service_role;
