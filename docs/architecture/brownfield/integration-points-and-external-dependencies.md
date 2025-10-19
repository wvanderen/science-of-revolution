# Integration Points and External Dependencies

## External Services

| Service  | Purpose  | Integration Type | Key Files                      |
| -------- | -------- | ---------------- | ------------------------------ |
| Supabase | Backend  | SDK + REST API   | `src/lib/supabase/`           |
| Supabase Auth | Authentication | SDK | `src/lib/supabase/`          |
| Supabase Storage | File Storage | SDK | `src/lib/supabase/`          |

## Internal Integration Points

- **Feature Communication**: Well-designed via custom hooks and repositories
- **State Sharing**: React Query for server state, Zustand for UI state
- **Component Composition**: Clean provider pattern for theme and keyboard shortcuts
