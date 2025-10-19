# Source Tree and Module Organization

## Project Structure (Actual)

```text
science-of-revolution/
├── src/
│   ├── components/          # Shared UI components (providers, base components)
│   │   ├── ui/             # Reusable UI primitives
│   │   └── providers/      # Context providers (theme, keyboard shortcuts)
│   ├── features/           # Feature-based modules (GOOD ARCHITECTURE)
│   │   ├── education-plans/  # Learning path system
│   │   ├── highlights/      # Annotation system
│   │   ├── library/         # Resource listing and management
│   │   ├── notes/           # Note-taking functionality
│   │   ├── preferences/     # Reader settings
│   │   ├── progress/        # Progress tracking
│   │   └── reader/          # PROBLEMATIC READING MODULE
│   │       ├── components/  # Reader UI components
│   │       ├── hooks/       # Reader-specific logic
│   │       └── ReaderPage.tsx  # MONOLITHIC COMPONENT (1,127 lines)
│   ├── hooks/              # Global and feature-specific hooks
│   ├── lib/                # Utilities, repositories, database types
│   │   └── repositories/   # Data access layer abstraction
│   ├── pages/              # Page-level components
│   └── styles/             # Global styles and themes
├── docs/                   # EXCELLENT DOCUMENTATION
├── tests/                  # Test files organized by type
└── public/                 # Static assets
```

## Key Modules and Their Purpose

- **User Management**: Supabase Auth integration via `src/lib/supabase/`
- **Reading Experience**: `src/features/reader/` - **CRITICAL: Needs complete re-architecture**
- **Progress Tracking**: `src/features/progress/` - Well-designed system
- **Annotation System**: `src/features/highlights/` - Good separation of concerns
- **Educational Paths**: `src/features/education-plans/` - Solid architecture
- **Data Access**: `src/lib/repositories/` - Clean abstraction layer
