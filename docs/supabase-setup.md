# Supabase Project Setup

This guide captures the steps to provision and configure the Supabase project for the Science of Revolution web app.

## 1. Prerequisites
- Supabase CLI (`npm install -g supabase` or download binary)
- Access to the target Supabase organization
- Logged-in Supabase CLI session (`supabase login`)

## 2. Provision Project
1. Create a new project in the Supabase dashboard with region closest to primary cohort.
2. Record the project reference (e.g., `abcd1234`) and update `supabase/config.toml` `project_id`.
3. In the dashboard, enable email/password and magic link auth providers under **Authentication → Providers**.
4. **Disable email confirmations** for development:
   - Navigate to **Authentication → Providers → Email**
   - Toggle OFF "Enable email confirmations"
   - Click **Save**
   - Note: Re-enable for production with custom SMTP provider to avoid rate limits
5. Generate anon and service role keys under **Project Settings → API** and store them securely. Populate `.env.local` using `.env.example` as a template.

## 3. Bootstrap Local Stack (optional)
Run `supabase init` if you have not already, then start the local stack for development testing:
```bash
supabase start
```
This will launch local Postgres, storage, and auth emulation. Ensure ports in `supabase/config.toml` match your environment.

## 4. Apply Migrations
Once the project exists, run migrations from this repo:
```bash
supabase db push
# or for local testing
supabase migration up
```
Ensure the CLI is authenticated and the `project_id` is set.

Migrations included:
- `20251011001_initial_schema.sql` - Creates core tables (cohorts, profiles, user_cohorts, resources, invite_codes)
- `20251012001_rls_policies.sql` - Adds RLS policies for auth flows
- `20251012002_auto_create_profile.sql` - Database trigger to auto-create profiles on signup

## 5. Seed Test Data
Load test data for development:
1. Go to the Supabase Dashboard SQL Editor
2. Copy and paste the contents of `supabase/seed.sql`
3. Run the script

This creates:
- Test cohorts (Fall 2025 Cohort, Demo Cohort)
- Test invite codes: `FALL2025`, `FALL2025-FACILITATOR`, `DEMO123`

## 6. Configure Policies and Functions
RLS policies and the profile creation trigger are automatically applied via migrations. The trigger handles:
- Profile creation on user signup
- Cohort assignment based on invite code
- Role assignment from invite code metadata
- Invite code usage tracking

## 7. Secrets Storage
Store service role keys in your password manager and add them to deployment environment variables (e.g., Vercel, GitHub Actions) as `SUPABASE_SERVICE_ROLE_KEY`. Never commit real keys.

## 8. Verification Checklist
- [x] Anon and service role keys stored securely
- [x] Email/password auth provider enabled
- [x] Email confirmations disabled for development
- [x] Migrations applied without errors
- [x] Test data seeded (invite codes available)
- [x] Signup flow tested end-to-end via `/invite` page
- [x] Profile auto-creation trigger working
- [x] Cohort assignment working on signup
