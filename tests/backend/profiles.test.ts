import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const migrationPath = resolve(process.cwd(), 'supabase/migrations/20251115001_profile_extensions.sql')
const migrationSql = readFileSync(migrationPath, 'utf8')

describe('Profiles migration', () => {
  it('adds privacy_settings column with defaults', () => {
    expect(migrationSql).toMatch(/add column if not exists privacy_settings jsonb not null default/)
    expect(migrationSql).toMatch(/create index if not exists idx_profiles_privacy_settings/)
    expect(migrationSql).toMatch(/privacy_settings ->> 'profile_visibility' in \('public', 'cohorts', 'private'\)/)
  })

  it('renames reader_preferences to reading_preferences with constraints', () => {
    expect(migrationSql).toMatch(/rename column reader_preferences to reading_preferences/)
    expect(migrationSql).toMatch(/add constraint reading_preferences_theme_check/)
    expect(migrationSql).toMatch(/add constraint reading_preferences_font_family_check/)
    expect(migrationSql).toMatch(/add constraint reading_preferences_speed_check/)
  })

  it('defines privacy-aware select policy and rollback', () => {
    expect(migrationSql).toMatch(/create policy "Profile visibility based on privacy settings"/)
    expect(migrationSql).toMatch(/revert_20251115001_profile_extensions/)
    expect(migrationSql).toMatch(/create policy "Users can read their own profile"/)
  })
})
