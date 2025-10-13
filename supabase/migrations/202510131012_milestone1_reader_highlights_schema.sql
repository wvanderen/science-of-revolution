-- Migration: milestone1_reader_highlights_schema
-- Created: 2025-10-13 10:12:17
-- Description: Adds reader, highlights, notes, and progress tracking tables for Milestone 1

-- ============================================================================
-- RESOURCE SECTIONS TABLE
-- Stores individual sections/chapters of reading materials for granular progress tracking
-- ============================================================================
create table if not exists public.resource_sections (
    id uuid primary key default gen_random_uuid(),
    resource_id uuid not null references public.resources(id) on delete cascade,
    title text not null,
    "order" integer not null,
    content_html text not null,
    word_count integer default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- Ensure sections are ordered uniquely within a resource
    constraint unique_resource_section_order unique (resource_id, "order")
);

-- ============================================================================
-- HIGHLIGHTS TABLE
-- Stores user text highlights with position anchoring and color coding
-- ============================================================================
create table if not exists public.highlights (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    resource_section_id uuid not null references public.resource_sections(id) on delete cascade,
    start_pos integer not null,
    end_pos integer not null,
    text_content text not null,
    color text not null default 'yellow',
    visibility text not null default 'private' check (visibility in ('private', 'cohort', 'global')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- Validate position ordering
    constraint valid_highlight_positions check (end_pos > start_pos)
);

-- ============================================================================
-- NOTES TABLE
-- Stores markdown notes attached to highlights
-- ============================================================================
create table if not exists public.notes (
    id uuid primary key default gen_random_uuid(),
    highlight_id uuid not null references public.highlights(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    content text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- One note per highlight
    constraint unique_note_per_highlight unique (highlight_id)
);

-- ============================================================================
-- PROGRESS TABLE
-- Tracks user reading progress per section with scroll position
-- ============================================================================
create table if not exists public.progress (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    resource_section_id uuid not null references public.resource_sections(id) on delete cascade,
    status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
    scroll_percent numeric(5,2) default 0.00 check (scroll_percent >= 0 and scroll_percent <= 100),
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- One progress record per user per section
    constraint unique_user_section_progress unique (user_id, resource_section_id)
);

-- ============================================================================
-- INDEXES
-- Performance optimization for common queries
-- ============================================================================
create index if not exists idx_resource_sections_resource on public.resource_sections (resource_id, "order");
create index if not exists idx_highlights_user on public.highlights (user_id, created_at desc);
create index if not exists idx_highlights_section on public.highlights (resource_section_id);
create index if not exists idx_highlights_visibility on public.highlights (visibility, created_at desc);
create index if not exists idx_notes_highlight on public.notes (highlight_id);
create index if not exists idx_notes_user on public.notes (user_id);
create index if not exists idx_progress_user on public.progress (user_id);
create index if not exists idx_progress_section on public.progress (resource_section_id);
create index if not exists idx_progress_status on public.progress (status, completed_at desc);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Resource Sections: Anyone authenticated can read; admins can modify
alter table public.resource_sections enable row level security;

create policy "Anyone can read resource sections"
    on public.resource_sections for select
    to authenticated
    using (true);

create policy "Facilitators can manage resource sections"
    on public.resource_sections for all
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and 'facilitator' = any(profiles.roles)
        )
    );

-- Highlights: Users can manage their own; can read based on visibility
alter table public.highlights enable row level security;

create policy "Users can manage their own highlights"
    on public.highlights for all
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

create policy "Users can read private highlights they own"
    on public.highlights for select
    to authenticated
    using (user_id = auth.uid() and visibility = 'private');

create policy "Users can read cohort highlights in their cohorts"
    on public.highlights for select
    to authenticated
    using (
        visibility = 'cohort' and exists (
            select 1 from public.user_cohorts uc1
            join public.user_cohorts uc2 on uc1.cohort_id = uc2.cohort_id
            where uc1.user_id = highlights.user_id
            and uc2.user_id = auth.uid()
        )
    );

create policy "Users can read global highlights"
    on public.highlights for select
    to authenticated
    using (visibility = 'global');

-- Notes: Users can manage their own notes
alter table public.notes enable row level security;

create policy "Users can manage their own notes"
    on public.notes for all
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

create policy "Users can read notes on highlights they can see"
    on public.notes for select
    to authenticated
    using (
        exists (
            select 1 from public.highlights
            where highlights.id = notes.highlight_id
            and (
                highlights.user_id = auth.uid()
                or highlights.visibility = 'global'
                or (
                    highlights.visibility = 'cohort' and exists (
                        select 1 from public.user_cohorts uc1
                        join public.user_cohorts uc2 on uc1.cohort_id = uc2.cohort_id
                        where uc1.user_id = highlights.user_id
                        and uc2.user_id = auth.uid()
                    )
                )
            )
        )
    );

-- Progress: Users can manage their own progress
alter table public.progress enable row level security;

create policy "Users can manage their own progress"
    on public.progress for all
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

create policy "Facilitators can view cohort member progress"
    on public.progress for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and 'facilitator' = any(profiles.roles)
        )
        or user_id = auth.uid()
    );

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================
comment on table public.resource_sections is 'Sections or chapters within reading resources for granular progress tracking and highlighting.';
comment on table public.highlights is 'User-created text highlights with color coding and visibility controls.';
comment on table public.notes is 'Markdown-formatted notes attached to highlights.';
comment on table public.progress is 'User reading progress tracking per section with scroll position and completion status.';

comment on column public.highlights.start_pos is 'Character offset where highlight begins in content_html';
comment on column public.highlights.end_pos is 'Character offset where highlight ends in content_html';
comment on column public.highlights.text_content is 'Snapshot of highlighted text for reference if content changes';
comment on column public.highlights.visibility is 'Controls who can see this highlight: private, cohort, or global';
comment on column public.progress.scroll_percent is 'Percentage of section scrolled; auto-marks complete at ≥90%';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- To rollback this migration, execute:
-- drop table if exists public.progress cascade;
-- drop table if exists public.notes cascade;
-- drop table if exists public.highlights cascade;
-- drop table if exists public.resource_sections cascade;
-- ============================================================================

