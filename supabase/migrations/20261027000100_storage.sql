-- =============================================================
-- DRAFT – Supabase Storage for the forms app.
-- form-uploads: private, answers of type file_upload.
--   Path convention: <user_id>/<submission_id>/<question_id>/<file name>
-- form-media:   private, images attached to questions by admins.
--   Path convention: <form_id>/<question_id>/<file name>
-- Size limits are placeholders until decision D23 is made.
-- =============================================================

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('form-uploads', 'form-uploads', false, 10485760),  -- 10 MB
  ('form-media', 'form-media', false, 5242880)        -- 5 MB
on conflict (id) do nothing;

-- form-uploads: users manage files in their own folder, admins read everything.
create policy "Users upload own form files" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'form-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Users read own form files" on storage.objects
  for select to authenticated using (
    bucket_id = 'form-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Users delete own form files" on storage.objects
  for delete to authenticated using (
    bucket_id = 'form-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Admins read all form files" on storage.objects
  for select to authenticated using (
    bucket_id = 'form-uploads' and public.is_admin()
  );

-- form-media: admins manage, every signed-in user can read.
create policy "Admins manage form media" on storage.objects
  for all to authenticated
  using (bucket_id = 'form-media' and public.is_admin())
  with check (bucket_id = 'form-media' and public.is_admin());
create policy "Signed-in users read form media" on storage.objects
  for select to authenticated using (bucket_id = 'form-media');
