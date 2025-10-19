# High Level Architecture

## Technical Summary

**Science of Revolution** is a mobile-friendly, gamified social reading platform for Marxist study materials with collaborative annotation, progress tracking, and educational path management.

## Actual Tech Stack (from package.json)

| Category  | Technology | Version | Notes                      |
| --------- | ---------- | ------- | -------------------------- |
| Runtime   | Node.js    | 20.x    | Modern ES+ features         |
| Framework | React      | 18.3.1  | TypeScript integration      |
| Language  | TypeScript | 5.5.4   | Strict type checking        |
| Build     | Vite       | 5.4.9   | Fast development and builds |
| Styling   | Tailwind   | 3.4.14  | Typography + line-clamp     |
| State     | React Query| 5.50.1  | Server state management     |
| State     | Zustand    | 4.5.2   | UI state management        |
| Backend   | Supabase   | Latest  | PostgreSQL + Auth + Storage|
| Testing   | Vitest     | 2.1.4   | Unit testing framework     |
| Testing   | Playwright | 1.48.2  | E2E testing framework     |

## Repository Structure Reality Check

- **Type**: Monorepo with feature-based organization
- **Package Manager**: npm (modern)
- **Notable**: Well-organized feature structure, but reader component violates architectural principles
