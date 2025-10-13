# Seed Data Quickstart

## Apply Seed Data to Database

### Prerequisites
- Migrations applied (including M1 migration)
- Supabase project configured
- Database connection available

### Option 1: Supabase CLI (Recommended)
```bash
# From project root
supabase db reset

# This will:
# 1. Drop and recreate the database
# 2. Run all migrations
# 3. Run seed.sql (cohorts & invite codes)
# 4. Run seed-resources.sql (reading materials)
```

### Option 2: Direct SQL Execution
```bash
# Apply migrations first (if not already done)
psql $DATABASE_URL -f supabase/migrations/20251011001_initial_schema.sql
psql $DATABASE_URL -f supabase/migrations/20251012001_rls_policies.sql
psql $DATABASE_URL -f supabase/migrations/20251012002_auto_create_profile.sql
psql $DATABASE_URL -f supabase/migrations/20251012003_storage_buckets.sql
psql $DATABASE_URL -f supabase/migrations/202510131012_milestone1_reader_highlights_schema.sql

# Then apply seed data
psql $DATABASE_URL -f supabase/seed.sql
psql $DATABASE_URL -f supabase/seed-resources.sql
```

### Option 3: Supabase Dashboard (Manual)
1. Go to Supabase Dashboard → SQL Editor
2. Copy content from `supabase/seed.sql`
3. Execute query
4. Copy content from `supabase/seed-resources.sql`
5. Execute query

## Verify Seed Data

### Check Resources
```sql
-- Should return 3 resources
select id, title, author, sequence_order
from public.resources
order by sequence_order;
```

Expected output:
```
1. Manifesto of the Communist Party (Marx & Engels)
2. Wage Labour and Capital (Marx)
3. Principles of Communism (Engels)
```

### Check Sections
```sql
-- Should return 7 sections total
select
  r.title as resource,
  rs.title as section,
  rs.order,
  rs.word_count
from public.resource_sections rs
join public.resources r on r.id = rs.resource_id
order by r.sequence_order, rs.order;
```

### Check Invite Codes
```sql
-- Should return 3 invite codes
select code, type, max_uses, uses
from public.invite_codes;
```

Expected codes:
- `FALL2025` (member, 100 uses)
- `FALL2025-FACILITATOR` (facilitator, 10 uses)
- `DEMO123` (member, unlimited)

## Test the Application

### 1. Sign Up
Navigate to `/invite` and use code: `DEMO123`

### 2. Visit Library
Go to `/library` - should see 3 resources

### 3. Read Content
Click on "Manifesto of the Communist Party"
- Should load reader with 3 sections
- Theme selector should work (light/dark/sepia)
- Font size controls should work

### 4. Test Highlighting
- Select some text
- Highlight toolbar should appear
- Choose a color
- Click "Save Highlight"
- Highlight should persist

### 5. Test Progress
- Scroll through the section
- Progress bar at bottom should update
- Navigate between sections
- Progress should be tracked per section

## Sample Data Statistics

### Resources
- **Total**: 3 classic Marxist texts
- **Total Sections**: 7
- **Total Words**: ~2,740
- **Reading Time**: ~14 minutes total

### Content Breakdown
1. **Communist Manifesto**: 3 sections, 1,460 words (~7 min)
2. **Wage Labour**: 2 sections, 780 words (~4 min)
3. **Principles**: 2 sections, 500 words (~3 min)

## Adding More Content

See `docs/seed-data-structure.md` for:
- Database schema details
- HTML formatting guidelines
- Content preparation best practices
- Examples of properly structured resources

## Troubleshooting

### No resources showing in library
```sql
-- Check if resources exist
select count(*) from public.resources;

-- Check RLS policies
set role authenticated;
select * from public.resources;
```

### Can't create highlights
```sql
-- Verify user is authenticated
select auth.uid();

-- Check if profile exists
select * from public.profiles where id = auth.uid();
```

### Progress not tracking
```sql
-- Check progress table
select * from public.progress
where user_id = auth.uid();
```

### Sections not loading
```sql
-- Verify sections exist and are linked
select r.title, count(rs.id) as section_count
from public.resources r
left join public.resource_sections rs on rs.resource_id = r.id
group by r.id, r.title;
```

## Reset Everything

If you need to start fresh:

```bash
# WARNING: This deletes all data!
supabase db reset

# Or manually:
delete from public.progress;
delete from public.notes;
delete from public.highlights;
delete from public.resource_sections;
delete from public.resources;
delete from public.user_cohorts;
delete from public.profiles;
delete from public.invite_codes;
delete from public.cohorts;

# Then reapply seeds
psql $DATABASE_URL -f supabase/seed.sql
psql $DATABASE_URL -f supabase/seed-resources.sql
```

## Next Steps

After seeding:
1. Test full reading flow
2. Create test highlights and notes
3. Track progress across sections
4. Verify theme switching works
5. Test on mobile devices
6. Add more resources from Science of Revolution curriculum

For production deployment, see `docs/deployment.md` (coming soon).
