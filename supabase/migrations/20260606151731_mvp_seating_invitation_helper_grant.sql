-- Sprint 15 MVP UI QA hardening:
-- Authenticated seating assignment/removal RPCs call this private helper after
-- the release security pass revoked default function execution.

begin;

revoke execute on function app_private.mark_guest_invitation_needs_regeneration_for_seating(
  uuid,
  uuid,
  uuid,
  uuid
) from public;
revoke execute on function app_private.mark_guest_invitation_needs_regeneration_for_seating(
  uuid,
  uuid,
  uuid,
  uuid
) from anon;
grant execute on function app_private.mark_guest_invitation_needs_regeneration_for_seating(
  uuid,
  uuid,
  uuid,
  uuid
) to authenticated, service_role;

commit;
