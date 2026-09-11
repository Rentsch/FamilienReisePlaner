-- Supabase Storage bucket for appointment ("Tagesablauf") attachments.
--
-- Unlike the "avatars" bucket (admin-only, requires an authenticated Supabase
-- session), this app's family-facing schedule is reachable by anyone with the
-- trip's share link and nobody signs in there — so writes are authorized by
-- the share link itself, not by Supabase auth. These policies therefore allow
-- the public role to read/write/delete within this bucket, mirroring the
-- no-login trust model already used for creating/voting on variants and for
-- appointments themselves.
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

create policy "attachments public read"
  on storage.objects for select
  to public
  using (bucket_id = 'attachments');

create policy "attachments public write"
  on storage.objects for insert
  to public
  with check (bucket_id = 'attachments');

create policy "attachments public delete"
  on storage.objects for delete
  to public
  using (bucket_id = 'attachments');
