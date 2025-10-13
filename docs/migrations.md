# Database Migrations Guide

## Overview
This project uses SQL migration files to manage database schema changes. All migrations are stored in `supabase/migrations/` and should be applied in order.

## Creating a New Migration

### Using the Script
```bash
npm run migration:create add_highlights_table
```

This creates a new migration file with:
- Timestamp prefix (YYYYMMDDHHMM format)
- Descriptive name
- Template with best practices

### Manual Creation
If you prefer to create migrations manually:

1. Create a file in `supabase/migrations/` with format: `YYYYMMDDHHMM_description.sql`
2. Add your SQL statements
3. Remember to include RLS policies for new tables
4. Test locally before committing

## Migration File Best Practices

### Naming Convention
```
YYYYMMDDHHMM_descriptive_name.sql
```
Examples:
- `202510120930_add_highlights_table.sql`
- `202510121045_add_user_preferences.sql`

### File Structure
```sql
-- Migration: Add highlights table
-- Created: 2025-10-12
-- Description: Creates highlights table with RLS policies

-- Create table
create table public.highlights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.highlights enable row level security;

-- Create policies
create policy "Users can read their own highlights"
  on public.highlights
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Add indexes
create index highlights_user_id_idx on public.highlights(user_id);

-- Add comments
comment on table public.highlights is 'User-created highlights on reading materials';
```

### Safety Checklist
- [ ] Use `IF EXISTS` for DROP statements
- [ ] Enable RLS for all tables with user data
- [ ] Include appropriate indexes
- [ ] Add rollback instructions as comments for complex migrations
- [ ] Test migration locally before committing

## Checking Migrations

### Run Checks
```bash
npm run migration:check
```

This validates:
- Filename format
- Files are not empty
- DROP statements include IF EXISTS
- New tables have RLS enabled

### Manual Review
Before committing migrations, verify:
1. SQL syntax is correct
2. RLS policies are appropriate
3. Indexes are added for foreign keys
4. No sensitive data is exposed

## Applying Migrations

### Local Development
If using Supabase CLI locally:
```bash
supabase db reset  # Reset and apply all migrations
supabase db push   # Push new migrations
```

### Production
Migrations are typically applied via:
1. Supabase Dashboard (manual)
2. CI/CD pipeline
3. Supabase CLI with appropriate credentials

**Warning**: Never apply untested migrations directly to production!

## Migration Patterns

### Adding a New Table
```sql
-- Create table
create table public.my_table (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.my_table enable row level security;

-- Create policies
create policy "Policy description"
  on public.my_table
  for select
  to authenticated
  using (true);
```

### Adding a Column
```sql
-- Add column
alter table public.my_table
  add column new_column text;

-- Add constraint if needed
alter table public.my_table
  add constraint new_column_length check (length(new_column) <= 500);
```

### Creating an Index
```sql
-- Add index
create index my_table_column_idx
  on public.my_table(column_name);

-- For foreign keys
create index my_table_fkey_idx
  on public.my_table(foreign_key_column);
```

### Adding RLS Policy
```sql
-- Create policy
create policy "Policy name"
  on public.my_table
  for select
  to authenticated
  using (auth.uid() = user_id);
```

### Creating a Function
```sql
-- Create function
create or replace function my_function(param_name type)
returns return_type
language plpgsql
security definer  -- Use with caution!
as $$
begin
  -- Function body
  return result;
end;
$$;

-- Add comment
comment on function my_function is 'Function description';
```

## Rollback Strategy

While we don't have automated rollbacks, include rollback instructions for complex migrations:

```sql
-- Migration: Complex schema change
-- Rollback instructions:
-- 1. Drop new table: DROP TABLE IF EXISTS new_table;
-- 2. Restore old column: ALTER TABLE old_table ADD COLUMN old_col text;
-- 3. Re-enable old policies: [specific commands]

-- [Migration SQL here]
```

## CI Integration

Migrations are checked automatically in CI via:
```yaml
- name: Check migrations
  run: npm run migration:check
```

Failed checks will block merging until resolved.

## Troubleshooting

### Migration Check Fails
1. Verify filename follows `YYYYMMDDHHMM_description.sql` format
2. Ensure file is not empty
3. Check SQL syntax
4. Verify RLS is enabled for new tables

### Migration Conflicts
If two branches create migrations with the same timestamp:
1. Rename one migration with a later timestamp
2. Update any references to the migration name
3. Test locally

### RLS Issues
If RLS policies aren't working:
1. Verify RLS is enabled: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
2. Check policy conditions match your use case
3. Test with appropriate user context
4. Use `EXPLAIN` to debug policy evaluation

## Additional Resources
- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [SQL Style Guide](https://www.sqlstyle.guide/)
