# Coding Standards

## Overview

This document outlines the coding standards and conventions for the Science of Revolution web application to ensure consistency, maintainability, and quality across the codebase.

## TypeScript Standards

### General Principles
- **Strict Mode**: All TypeScript code must adhere to strict type checking enabled in `tsconfig.json`
- **Type Safety**: Prefer explicit types over implicit `any`. Use `unknown` instead of `any` when type is uncertain
- **Interfaces vs Types**: Use `interface` for object shapes and type definitions, `type` for unions, computed types, and aliases
- **Readonly**: Use `readonly` modifier for immutable properties and arrays

```typescript
// ✅ Good
interface User {
  readonly id: string
  name: string
  email: string
  readonly createdAt: Date
}

const users: readonly User[] = []

// ❌ Bad
const users: any[] = []
```

### Function Types
- Use arrow functions for component props and callbacks
- Prefer explicit return types for complex functions
- Use function declarations for module-level functions

```typescript
// ✅ Good
type OnSaveCallback = (data: FormData) => Promise<void>

function calculateProgress(completed: number, total: number): number {
  return total > 0 ? completed / total : 0
}

// ❌ Bad
function calculateProgress(completed, total) {
  return completed / total
}
```

## React Component Standards

### Functional Components
- All components must be functional components using hooks
- Use TypeScript interfaces for props
- Destructure props in function signature

```typescript
// ✅ Good
interface ResourceCardProps {
  resource: Resource
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  className?: string
}

export default function ResourceCard({
  resource,
  onEdit,
  onDelete,
  className = ''
}: ResourceCardProps): JSX.Element {
  return <div className={className}>...</div>
}

// ❌ Bad
export default function ResourceCard(props) {
  const { resource, onEdit, onDelete } = props
  return <div>...</div>
}
```

### Hooks Standards
- Custom hooks must start with `use`
- Return consistent tuple or object interfaces
- Include proper TypeScript generics where needed

```typescript
// ✅ Good
interface UseNotesReturn {
  notes: Note[]
  loading: boolean
  error: string | null
  createNote: (content: string) => Promise<void>
  deleteNote: (id: string) => Promise<void>
}

export function useNotes(resourceId: string): UseNotesReturn {
  // Implementation
}

// ❌ Bad
export function useNotes(resourceId) {
  // Implementation
}
```

## File and Folder Organization

### Naming Conventions
- **Files**: Use PascalCase for components (`ResourceCard.tsx`), camelCase for utilities (`formatDate.ts`)
- **Folders**: Use kebab-case for feature folders (`education-plans`, `resource-library`)
- **Constants**: Use UPPER_SNAKE_CASE for exported constants (`API_ENDPOINTS`)

### Import Organization
```typescript
// 1. React and related libraries
import React from 'react'
import { BrowserRouter } from 'react-router-dom'

// 2. Third-party libraries
import { createClient } from '@supabase/supabase-js'

// 3. Internal modules (absolute imports)
import { useNotes } from '@/features/notes/hooks/useNotes'
import { ResourceCard } from '@/features/library/components/ResourceCard'

// 4. Relative imports
import { formatDate } from '../utils/formatDate'
import './styles.css'
```

## CSS and Styling Standards

### Tailwind CSS Usage
- Use Tailwind utility classes for all styling
- Group related utilities together
- Use consistent spacing and color scales from design tokens
- Avoid custom CSS unless absolutely necessary

```typescript
// ✅ Good
<div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
  <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
  <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
    Action
  </button>
</div>

// ❌ Bad
<div className="p-4 border shadow">
  <h3 className="text-lg font-bold">{title}</h3>
  <button className="px-4 py-2 bg-blue-500 text-white">Action</button>
</div>
```

### Component Styling
- Use className prop for custom styling overrides
- Provide default styling via Tailwind classes
- Use conditional classes sparingly and with clear logic

## State Management Standards

### Zustand Store Patterns
- Use slices for organizing stores by feature
- Keep stores focused and minimal
- Use TypeScript interfaces for store state

```typescript
// ✅ Good
interface NotesStore {
  notes: Record<string, Note>
  loading: boolean
  error: string | null

  // Actions
  setNotes: (notes: Note[]) => void
  addNote: (note: Note) => void
  removeNote: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useNotesStore = create<NotesStore>((set) => ({
  notes: {},
  loading: false,
  error: null,
  setNotes: (notes) => set({ notes: Object.fromEntries(notes.map(n => [n.id, n])) }),
  addNote: (note) => set((state) => ({ notes: { ...state.notes, [note.id]: note } })),
  // ... other actions
}))
```

### React Query Usage
- Use React Query for server state management
- Provide proper error handling and loading states
- Use appropriate cache keys and invalidation strategies

```typescript
// ✅ Good
export function useResources() {
  return useQuery({
    queryKey: ['resources'],
    queryFn: () => resourceRepository.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error instanceof NetworkError) return false
      return failureCount < 3
    }
  })
}
```

## Error Handling Standards

### Error Types
- Create specific error classes for different error scenarios
- Use proper error inheritance
- Include relevant context in error objects

```typescript
// ✅ Good
export class NetworkError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly field: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
```

### Error Boundaries
- Implement error boundaries for different sections of the app
- Provide meaningful error messages to users
- Log errors appropriately for debugging

```typescript
// ✅ Good
export default function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryComponent
      fallback={<ErrorFallback />}
      onError={(error, errorInfo) => {
        console.error('Error caught by boundary:', error, errorInfo)
        // Send to error reporting service
      }}
    >
      {children}
    </ErrorBoundaryComponent>
  )
}
```

## Testing Standards

### Unit Testing
- All utility functions and hooks must have unit tests
- Use Vitest for unit testing
- Follow AAA pattern (Arrange, Act, Assert)
- Test both happy path and error cases

```typescript
// ✅ Good
describe('formatDate', () => {
  it('should format valid date correctly', () => {
    // Arrange
    const date = new Date('2024-01-15')

    // Act
    const result = formatDate(date)

    // Assert
    expect(result).toBe('January 15, 2024')
  })

  it('should handle null date gracefully', () => {
    expect(() => formatDate(null)).not.toThrow()
  })
})
```

### Component Testing
- Test component behavior, not implementation details
- Use React Testing Library for user-centric testing
- Mock external dependencies appropriately

## Code Quality Tools

### ESLint Configuration
- Use ESLint with TypeScript support
- Follow standard configuration with React rules
- Enable strict linting rules for code quality

### Prettier Configuration
- Use Prettier for consistent code formatting
- Configure to match project style preferences
- Integrate with pre-commit hooks

## Performance Guidelines

### React Performance
- Use `React.memo` for expensive components
- Implement proper dependency arrays in hooks
- Use `useCallback` and `useMemo` judiciously
- Avoid unnecessary re-renders

### Bundle Optimization
- Use dynamic imports for code splitting
- Lazy load heavy components and routes
- Optimize imports to avoid unused code

```typescript
// ✅ Good
const ResourceUploadPage = lazy(() => import('./features/library/pages/ResourceUploadPage'))

// ❌ Bad
import ResourceUploadPage from './features/library/pages/ResourceUploadPage'
```

## Security Guidelines

### Input Validation
- Validate all user inputs on both client and server
- Use TypeScript for compile-time validation
- Implement runtime validation for API responses

### Environment Variables
- Never commit sensitive data to repository
- Use proper environment variable management
- Validate required environment variables on startup

## Documentation Standards

### Code Comments
- Document complex business logic
- Explain non-obvious implementation decisions
- Use JSDoc for public APIs

### README Files
- Each feature folder should have a README explaining its purpose
- Include setup instructions and usage examples
- Document any special considerations or dependencies

## Git and Version Control

### Commit Messages
- Use conventional commit format
- Keep messages descriptive and concise
- Reference related issues when applicable

```
feat(education-plans): add plan enrollment functionality
fix(reader): resolve text selection issues on mobile
docs(readme): update installation instructions
```

### Branch Naming
- Use descriptive branch names
- Include feature or fix identifier
- Use kebab-case for branch names

```
feature/education-plan-enrollment
fix/mobile-text-selection
docs/update-readme
```