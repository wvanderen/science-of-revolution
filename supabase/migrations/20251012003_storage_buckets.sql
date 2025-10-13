-- Migration: Create Storage Buckets
-- Created: 2025-10-12
-- Description: Creates storage buckets for resources and user assets with RLS policies

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Resources bucket (reading materials: PDFs, markdown, etc.)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resources',
  'resources',
  true,  -- Public read access
  52428800,  -- 50MB limit
  array['application/pdf', 'text/markdown', 'text/plain', 'text/html']
)
on conflict (id) do nothing;

-- User avatars bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,  -- Public read access
  2097152,  -- 2MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- User uploads bucket (for future use: user-submitted content, annotations, etc.)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-uploads',
  'user-uploads',
  false,  -- Private
  10485760,  -- 10MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain', 'text/markdown']
)
on conflict (id) do nothing;

-- ============================================
-- RESOURCES BUCKET POLICIES
-- ============================================

-- Anyone can read resources (public bucket)
create policy "Public read access for resources"
  on storage.objects
  for select
  to public
  using (bucket_id = 'resources');

-- Only facilitators can upload resources
create policy "Facilitators can upload resources"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'resources'
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
      and 'facilitator' = any(roles)
    )
  );

-- Only facilitators can update resources
create policy "Facilitators can update resources"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'resources'
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
      and 'facilitator' = any(roles)
    )
  );

-- Only facilitators can delete resources
create policy "Facilitators can delete resources"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'resources'
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
      and 'facilitator' = any(roles)
    )
  );

-- ============================================
-- AVATARS BUCKET POLICIES
-- ============================================

-- Anyone can read avatars (public bucket)
create policy "Public read access for avatars"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

-- Users can upload their own avatar
-- Naming convention: avatars/{user_id}/* or avatars/{user_id}.{ext}
create policy "Users can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own avatar
create policy "Users can update their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own avatar
create policy "Users can delete their own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- USER UPLOADS BUCKET POLICIES
-- ============================================

-- Users can read their own uploads
create policy "Users can read their own uploads"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'user-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can upload to their own folder
create policy "Users can upload to their own folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'user-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own uploads
create policy "Users can update their own uploads"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'user-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own uploads
create policy "Users can delete their own uploads"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'user-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- HELPER COMMENTS
-- ============================================

comment on table storage.buckets is 'Storage buckets for resources, avatars, and user uploads';
comment on table storage.objects is 'Storage objects with RLS policies for secure access control';
