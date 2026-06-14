-- ============================================================
-- SHARP Messenger — Storage Bucket
-- messenger-media: private, signed URLs only, 2MB max
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'messenger-media',
  'messenger-media',
  false,
  2097152,  -- 2MB
  array['image/jpeg','image/png','image/gif','application/pdf']
)
on conflict (id) do update set
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg','image/png','image/gif','application/pdf'];

-- RLS on storage.objects
alter storage bucket 'messenger-media' enable row level security;

create policy "messenger_media_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'messenger-media'
    and auth.role() in ('authenticated')
  );

create policy "messenger_media_read"
  on storage.objects for select
  using (
    bucket_id = 'messenger-media'
    and (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.conversation_participants cp
        join public.conversations c on c.id = cp.conversation_id
        join public.messages m on m.conversation_id = c.id
        where m.media_bucket = 'messenger-media'
          and cp.profile_id = auth.uid()
      )
    )
  );