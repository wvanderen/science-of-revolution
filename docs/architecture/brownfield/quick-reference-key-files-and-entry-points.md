# Quick Reference - Key Files and Entry Points

## Critical Files for Understanding the System

- **Main Entry**: `src/main.tsx` (React application entry point)
- **Configuration**: `vite.config.ts`, `.env.example`, `tailwind.config.js`
- **Core Business Logic**: `src/features/` (feature-based modules)
- **API Definitions**: `src/lib/supabase/` (Supabase client configuration)
- **Database Models**: `src/lib/database.types.ts` (Supabase-generated types)
- **Key Problem Area**: `src/features/reader/ReaderPage.tsx` (1,127 lines - needs re-architecture)

## Reader Component Re-architecture Impact Areas

**Primary Target**: `src/features/reader/ReaderPage.tsx` - This monolithic component requires complete decomposition
- **Secondary Targets**:
  - `src/features/reader/hooks/useParagraphNavigation.ts` (227 lines - well-designed)
  - `src/features/reader/hooks/usePlanContextReader.ts` (185 lines - good structure)
  - `src/features/reader/components/ReaderContent.tsx` (134 lines - well-structured)
  - `src/features/reader/components/ReaderToolbar.tsx` (280 lines - well-designed)
