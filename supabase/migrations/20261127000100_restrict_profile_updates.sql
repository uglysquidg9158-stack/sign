-- Restrict client-side profile updates to non-privileged fields.
-- Admin account creation/deletion is performed by the admin-accounts Edge Function.
revoke update on table public.profiles from authenticated;
grant update (name, username, updated_at) on table public.profiles to authenticated;
