-- Sprint 15 MVP UI QA hardening:
-- Seating/check-in RLS and authenticated RPC flows call these private helpers
-- after the release security pass revoked default function execution.

begin;

revoke execute on function app_private.user_can_manage_guest_seating(
  uuid,
  uuid,
  uuid
) from public;
revoke execute on function app_private.user_can_manage_guest_seating(
  uuid,
  uuid,
  uuid
) from anon;
grant execute on function app_private.user_can_manage_guest_seating(
  uuid,
  uuid,
  uuid
) to authenticated, service_role;

revoke execute on function app_private.check_in_settings_permit_method(
  uuid,
  uuid,
  public.check_in_method
) from public;
revoke execute on function app_private.check_in_settings_permit_method(
  uuid,
  uuid,
  public.check_in_method
) from anon;
grant execute on function app_private.check_in_settings_permit_method(
  uuid,
  uuid,
  public.check_in_method
) to authenticated, service_role;

commit;
