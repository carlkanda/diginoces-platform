-- Sprint 3 post-merge hardening.
-- Align the guest insert RLS policy with the explicit guests.create permission
-- while preserving bride/groom own-side creation rules from Sprint 3.

drop policy if exists "Guests inserted by side managers" on public.guests;
create policy "Guests inserted by side managers"
on public.guests
for insert
to authenticated
with check (
  app_private.user_can_access_project((select auth.uid()), project_id, 'guests.create')
  or app_private.user_can_manage_guest_side((select auth.uid()), project_id, guest_side)
);
