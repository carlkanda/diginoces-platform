-- Sprint 5 RPC hardening.
-- Keep privileged RSVP/public-page logic in the private schema and expose only
-- security-invoker public wrappers for Supabase RPC compatibility.

alter function public.create_guest_public_token(uuid, timestamptz) set schema app_private;
alter function public.revoke_guest_public_token(uuid) set schema app_private;
alter function public.resolve_guest_public_page(text) set schema app_private;
alter function public.preview_guest_public_page(uuid) set schema app_private;
alter function public.submit_public_rsvp(text, uuid, public.rsvp_status, text) set schema app_private;
alter function public.get_project_rsvp_summary(uuid) set schema app_private;

revoke all on all functions in schema app_private from public;
grant usage on schema app_private to anon, authenticated;

grant execute on function app_private.resolve_guest_public_page(text) to anon, authenticated;
grant execute on function app_private.submit_public_rsvp(text, uuid, public.rsvp_status, text) to anon, authenticated;
grant execute on function app_private.create_guest_public_token(uuid, timestamptz) to authenticated;
grant execute on function app_private.revoke_guest_public_token(uuid) to authenticated;
grant execute on function app_private.preview_guest_public_page(uuid) to authenticated;
grant execute on function app_private.get_project_rsvp_summary(uuid) to authenticated;

create or replace function public.create_guest_public_token(
  p_guest_id uuid,
  p_expires_at timestamptz default null
)
returns table (
  token_id uuid,
  guest_id uuid,
  project_id uuid,
  token text,
  token_preview text,
  expires_at timestamptz
)
language sql
security invoker
set search_path = public, app_private, pg_temp
as $$
  select *
  from app_private.create_guest_public_token(p_guest_id, p_expires_at);
$$;

create or replace function public.revoke_guest_public_token(
  p_token_id uuid
)
returns void
language sql
security invoker
set search_path = public, app_private, pg_temp
as $$
  select app_private.revoke_guest_public_token(p_token_id);
$$;

create or replace function public.resolve_guest_public_page(
  p_token text
)
returns jsonb
language sql
security invoker
set search_path = public, app_private, pg_temp
as $$
  select app_private.resolve_guest_public_page(p_token);
$$;

create or replace function public.preview_guest_public_page(
  p_guest_id uuid
)
returns jsonb
language sql
security invoker
set search_path = public, app_private, pg_temp
as $$
  select app_private.preview_guest_public_page(p_guest_id);
$$;

create or replace function public.submit_public_rsvp(
  p_token text,
  p_event_id uuid,
  p_response public.rsvp_status,
  p_preferred_language text default null
)
returns jsonb
language sql
security invoker
set search_path = public, app_private, pg_temp
as $$
  select app_private.submit_public_rsvp(
    p_token,
    p_event_id,
    p_response,
    p_preferred_language
  );
$$;

create or replace function public.get_project_rsvp_summary(
  p_project_id uuid
)
returns jsonb
language sql
security invoker
set search_path = public, app_private, pg_temp
as $$
  select app_private.get_project_rsvp_summary(p_project_id);
$$;

revoke all on function public.create_guest_public_token(uuid, timestamptz) from public;
revoke all on function public.revoke_guest_public_token(uuid) from public;
revoke all on function public.resolve_guest_public_page(text) from public;
revoke all on function public.preview_guest_public_page(uuid) from public;
revoke all on function public.submit_public_rsvp(text, uuid, public.rsvp_status, text) from public;
revoke all on function public.get_project_rsvp_summary(uuid) from public;

grant execute on function public.resolve_guest_public_page(text) to anon, authenticated;
grant execute on function public.submit_public_rsvp(text, uuid, public.rsvp_status, text) to anon, authenticated;
grant execute on function public.create_guest_public_token(uuid, timestamptz) to authenticated;
grant execute on function public.revoke_guest_public_token(uuid) to authenticated;
grant execute on function public.preview_guest_public_page(uuid) to authenticated;
grant execute on function public.get_project_rsvp_summary(uuid) to authenticated;
