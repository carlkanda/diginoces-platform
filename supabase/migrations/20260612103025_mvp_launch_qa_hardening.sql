-- MVP launch QA hardening.
-- Related: launch-readiness evidence issue #58.
--
-- Partner-scoped users should not receive partner internal notes or internal
-- actor columns through direct Supabase REST access. Keep authenticated SELECT
-- access column-scoped to the public partner profile fields used by the app.

begin;

revoke select on public.partners from authenticated;

grant select (
  id,
  organization_name,
  primary_contact_name,
  contact_email,
  contact_phone,
  whatsapp_phone,
  status,
  partner_type,
  approved_at,
  suspended_at,
  archived_at,
  created_at,
  updated_at
) on public.partners to authenticated;

grant select on public.partners to service_role;

commit;
