-- Sprint 15 MVP UI QA hardening:
-- RLS policies call these app_private helper functions directly, so authenticated
-- app users need explicit EXECUTE privileges while anonymous access stays closed.

begin;

revoke execute on function app_private.user_can_access_check_in_event_any(
  uuid,
  uuid,
  uuid,
  text[]
) from public;
revoke execute on function app_private.user_can_access_check_in_event_any(
  uuid,
  uuid,
  uuid,
  text[]
) from anon;
grant execute on function app_private.user_can_access_check_in_event_any(
  uuid,
  uuid,
  uuid,
  text[]
) to authenticated, service_role;

revoke execute on function app_private.user_can_access_partner(
  uuid,
  uuid,
  text
) from public;
revoke execute on function app_private.user_can_access_partner(
  uuid,
  uuid,
  text
) from anon;
grant execute on function app_private.user_can_access_partner(
  uuid,
  uuid,
  text
) to authenticated, service_role;

revoke execute on function app_private.user_can_access_partner_project(
  uuid,
  uuid,
  text
) from public;
revoke execute on function app_private.user_can_access_partner_project(
  uuid,
  uuid,
  text
) from anon;
grant execute on function app_private.user_can_access_partner_project(
  uuid,
  uuid,
  text
) to authenticated, service_role;

commit;
