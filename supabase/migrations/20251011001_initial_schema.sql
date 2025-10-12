-- Initial schema for Science of Revolution Web App
-- Generates core entities required for Milestone 0 foundation

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create table if not exists public.cohorts (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text,
    start_date date,
    end_date date,
    visibility text not null default 'private',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
    id uuid primary key references auth.users on delete cascade,
    display_name text not null,
    roles text[] not null default array['member'],
    primary_cohort_id uuid references public.cohorts(id),
    avatar_url text,
    bio text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.user_cohorts (
    user_id uuid references public.profiles(id) on delete cascade,
    cohort_id uuid references public.cohorts(id) on delete cascade,
    joined_at timestamptz not null default now(),
    added_by uuid references public.profiles(id),
    primary key (user_id, cohort_id)
);

create table if not exists public.resources (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    author text,
    type text not null default 'document',
    source_url text,
    storage_path text not null,
    sequence_order integer,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.invite_codes (
    code text primary key,
    type text not null default 'member',
    max_uses integer,
    uses integer not null default 0,
    expires_at timestamptz,
    cohort_id uuid references public.cohorts(id),
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    created_by uuid references public.profiles(id)
);

create index if not exists idx_profiles_primary_cohort on public.profiles (primary_cohort_id);
create index if not exists idx_resources_sequence_order on public.resources (sequence_order);
create index if not exists idx_invite_codes_cohort on public.invite_codes (cohort_id);

-- Enable row-level security with placeholder policies to be filled in Milestone 1
alter table public.cohorts enable row level security;
alter table public.profiles enable row level security;
alter table public.user_cohorts enable row level security;
alter table public.resources enable row level security;
alter table public.invite_codes enable row level security;

comment on table public.cohorts is 'Study groups or cohorts for the Science of Revolution program.';
comment on table public.profiles is 'Extended user profile aligned with Supabase auth users.';
comment on table public.user_cohorts is 'Join table granting users membership in additional cohorts beyond primary.';
comment on table public.resources is 'Reading materials metadata and storage references.';
comment on table public.invite_codes is 'Invite and demo codes for gating access to cohorts and roles.';
