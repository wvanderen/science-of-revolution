# Supabase Storage Setup

## Overview
This document describes the Supabase Storage bucket configuration and access policies for the Science of Revolution web app.

## Storage Buckets

### 1. Resources Bucket (`resources`)
**Purpose**: Store curriculum reading materials (PDFs, markdown, HTML files)

**Configuration**:
- **Public**: Yes (read-only)
- **File Size Limit**: 50MB
- **Allowed MIME Types**:
  - `application/pdf`
  - `text/markdown`
  - `text/plain`
  - `text/html`

**Access Policies**:
- **Public Read**: Anyone can download resources
- **Facilitator Write**: Only users with `facilitator` role can upload/update/delete

**Naming Convention**:
```
resources/
├── {resource_id}/
│   ├── content.pdf
│   └── metadata.json
└── {resource_id}.md
```

### 2. Avatars Bucket (`avatars`)
**Purpose**: Store user profile pictures

**Configuration**:
- **Public**: Yes (read-only)
- **File Size Limit**: 2MB
- **Allowed MIME Types**:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/gif`

**Access Policies**:
- **Public Read**: Anyone can view avatars
- **User Write**: Users can only manage their own avatar

**Naming Convention**:
```
avatars/
└── {user_id}/
    └── avatar.{ext}
```

Or flat structure:
```
avatars/
└── {user_id}.{ext}
```

### 3. User Uploads Bucket (`user-uploads`)
**Purpose**: Store user-generated content (future use: annotations, exports, etc.)

**Configuration**:
- **Public**: No (private)
- **File Size Limit**: 10MB
- **Allowed MIME Types**:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `application/pdf`
  - `text/plain`
  - `text/markdown`

**Access Policies**:
- **User Read/Write**: Users can only access their own folder

**Naming Convention**:
```
user-uploads/
└── {user_id}/
    ├── annotations/
    ├── exports/
    └── highlights/
```

## Setup Instructions

### Automated Setup (Preferred)
The storage buckets and policies are created automatically via the migration:
```bash
# Migration file: supabase/migrations/20251012003_storage_buckets.sql
```

Apply via Supabase Dashboard or CLI:
```bash
supabase db push
```

### Manual Setup (Alternative)
If you need to set up buckets manually via the Supabase Dashboard:

1. Go to Storage → Create bucket
2. Configure each bucket as described above
3. Add RLS policies via SQL editor using the migration file

## Using Storage in Code

### Uploading a Resource (Facilitator)
```typescript
import supabase from './supabaseClient'

async function uploadResource(file: File, resourceId: string) {
  const { data, error } = await supabase.storage
    .from('resources')
    .upload(`${resourceId}/${file.name}`, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('resources')
    .getPublicUrl(`${resourceId}/${file.name}`)

  return publicUrl
}
```

### Uploading an Avatar (User)
```typescript
async function uploadAvatar(file: File, userId: string) {
  const fileExt = file.name.split('.').pop()
  const filePath = `${userId}/avatar.${fileExt}`

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true  // Replace existing avatar
    })

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  return publicUrl
}
```

### Downloading a Resource (Public)
```typescript
async function getResourceUrl(resourceId: string, filename: string) {
  const { data: { publicUrl } } = supabase.storage
    .from('resources')
    .getPublicUrl(`${resourceId}/${filename}`)

  return publicUrl
}
```

### Listing User Uploads
```typescript
async function listUserUploads(userId: string) {
  const { data, error } = await supabase.storage
    .from('user-uploads')
    .list(`${userId}/`, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    })

  return data
}
```

## Security Considerations

### RLS Policies
All buckets have Row Level Security (RLS) enabled via policies. Key security features:

1. **Path-based Authorization**: User folders use `{user_id}` in path, enforced by `storage.foldername()` function
2. **Role-based Access**: Facilitators identified via `profiles.roles` array
3. **Public vs Private**: Public buckets allow read by anyone, private buckets require authentication

### File Validation
While MIME types are restricted at the bucket level, additional validation should be performed:

```typescript
function validateFile(file: File, allowedTypes: string[], maxSize: number) {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}`)
  }

  if (file.size > maxSize) {
    throw new Error(`File too large: ${file.size} bytes`)
  }

  return true
}
```

### Content Security
- **Resources**: Store trusted curriculum materials only
- **Avatars**: Consider image sanitization/resizing
- **User Uploads**: Scan for malicious content if accepting arbitrary files

## Storage Limits

| Bucket | File Size | Total Storage |
|--------|-----------|---------------|
| resources | 50MB per file | Unlimited (Supabase plan dependent) |
| avatars | 2MB per file | 2MB per user |
| user-uploads | 10MB per file | 100MB per user (recommended) |

## Maintenance

### Cleaning Up Old Files
Implement periodic cleanup for unused files:

```sql
-- Find orphaned resource files (no matching resource record)
select *
from storage.objects
where bucket_id = 'resources'
and not exists (
  select 1 from public.resources
  where storage_path like '%' || objects.name || '%'
);
```

### Monitoring Usage
Track storage usage via Supabase Dashboard or queries:

```sql
-- Storage usage by bucket
select
  bucket_id,
  count(*) as file_count,
  sum(metadata->>'size')::bigint / 1024 / 1024 as total_mb
from storage.objects
group by bucket_id;
```

## Troubleshooting

### Upload Fails with "Policy Violation"
- Verify user has correct role (for resources)
- Check path uses correct `{user_id}` (for avatars/uploads)
- Ensure file MIME type is allowed

### Cannot Access File (404)
- For public buckets: verify file exists and path is correct
- For private buckets: ensure user is authenticated and path matches their ID

### File Size Exceeded
- Check bucket configuration matches file size
- Consider implementing client-side compression for large files

## Future Enhancements
- Image optimization pipeline (resize/compress avatars)
- CDN integration for better performance
- Virus scanning for user uploads
- Batch upload support for resources

## Resources
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Storage Helper Functions](https://supabase.com/docs/guides/storage/security/access-control#helper-functions)
