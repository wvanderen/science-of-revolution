# Appendix - Useful Commands and Scripts

## Frequently Used Commands

```bash
npm run dev              # Start development server
npm run build            # Production build
npm run preview          # Preview production build
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests
npm run test:coverage    # Test coverage report
npm run typecheck        # TypeScript validation
npm run lint             # Code linting
npm run lint:fix         # Auto-fix linting issues
npm run ci               # Complete CI pipeline
```

## Development Workflow

- **Feature Development**: Work in feature-specific directories
- **Component Creation**: Use existing UI components from `src/components/ui/`
- **State Management**: Use React Query for server state, Zustand for UI state
- **Testing**: Write tests alongside components in `tests/` directory
- **Documentation**: Update relevant docs in `docs/` directory

## Debugging and Troubleshooting

- **React DevTools**: Essential for debugging component state
- **Supabase Dashboard**: Monitor database queries and auth
- **Network Tab**: Debug Supabase API calls
- **Console Logs**: React Query devtools for data flow debugging
