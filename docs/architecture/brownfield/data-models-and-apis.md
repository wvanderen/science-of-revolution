# Data Models and APIs

## Data Models

Supabase-generated types in `src/lib/database.types.ts`:

- **Users**: Supabase auth.users + custom profiles
- **Documents**: Reading materials with metadata
- **Sections**: Document subdivisions for progress tracking
- **Highlights**: User annotations and highlights
- **Notes**: User-generated notes and reflections
- **Progress**: Reading progress tracking
- **Education Plans**: Structured learning paths

## API Specifications

- **Supabase**: Auto-generated REST API with PostgreSQL functions
- **Realtime**: Supabase realtime subscriptions for live updates
- **Storage**: Supabase storage for document content and media
