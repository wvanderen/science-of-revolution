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
4. Generate anon and service role keys under **Project Settings → API** and store them securely. Populate `.env.local` using `.env.example` as a template.

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

## 5. Configure Policies and Functions
After the initial schema migration, add row-level security policies and edge functions using subsequent migrations. Placeholder policies are included in `supabase/migrations` to be filled in during Milestone 1.

## 6. Secrets Storage
Store service role keys in your password manager and add them to deployment environment variables (e.g., Vercel, GitHub Actions) as `SUPABASE_SERVICE_ROLE_KEY`. Never commit real keys.

## 7. Verification Checklist
- [ ] Anon and service role keys stored securely
- [ ] Email/password and magic link enabled
- [ ] Migrations applied without errors
- [ ] Sample auth flow tested locally via `/auth/v1/signup`
