# Development and Deployment

## Local Development Setup

1. **Prerequisites**: Node.js 20+, npm
2. **Setup Steps**:
   ```bash
   npm install
   cp .env.example .env.local  # Configure Supabase credentials
   npm run dev
   ```

## Build and Deployment Process

- **Build Command**: `npm run build` (Vite production build)
- **Development**: `npm run dev` (Hot reload development server)
- **Testing**: `npm run test` (Unit), `npm run test:e2e` (E2E)
- **Type Checking**: `npm run typecheck`
- **Linting**: `npm run lint`
