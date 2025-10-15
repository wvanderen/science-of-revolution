-- Migration: facilitator_resource_upload_permissions
-- Created: 2025-11-01
-- Description: Ensure resources storage bucket exists and grant facilitators insert/update/delete access to resources table

-- ============================================================================
-- ENSURE RESOURCES STORAGE BUCKET EXISTS WITH EXPECTED SETTINGS
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resources',
  'resources',
  true,
  52428800, -- 50MB
  array['application/pdf', 'text/markdown', 'text/plain', 'text/html']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================================
-- RLS POLICIES FOR PUBLIC.RESOURCES TABLE
-- Allow facilitators (profiles.roles contains 'facilitator') to manage resources
-- ============================================================================
drop policy if exists "Facilitators can insert resources" on public.resources;
create policy "Facilitators can insert resources"
  on public.resources
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and 'facilitator' = any(profiles.roles)
    )
  );

drop policy if exists "Facilitators can update resources" on public.resources;
create policy "Facilitators can update resources"
  on public.resources
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and 'facilitator' = any(profiles.roles)
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and 'facilitator' = any(profiles.roles)
    )
  );

drop policy if exists "Facilitators can delete resources" on public.resources;
create policy "Facilitators can delete resources"
  on public.resources
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and 'facilitator' = any(profiles.roles)
    )
  );
