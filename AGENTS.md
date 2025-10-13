# Repository Guidelines

## Project Structure & Module Organization
The Vite-powered client lives in `src/`, with feature-driven folders (e.g., `src/features/reader`, `src/features/library`) owning UI, hooks, and data access for a domain slice. Shared UI building blocks sit in `src/components`, while Supabase typings and repositories land in `src/lib`. Global styles and Tailwind config reside in `src/styles` and `tailwind.config.ts`. End-to-end specs are under `tests/e2e`, unit and integration tests pair with the code they cover, and backend artifacts such as migrations and the seed script live in `supabase/`.

## Build, Test, and Development Commands
Use `npm run dev` to launch the Vite dev server with hot reload. Production bundles are generated with `npm run build`, and `npm run preview` serves the built output for smoke checks. Static analysis runs through `npm run lint` and `npm run typecheck`. Unit tests execute with `npm test`, UI mode for exploratory runs is available via `npm run test:ui`, and Playwright scenarios live behind `npm run test:e2e`. Database artifacts are managed with `npm run migration:create` and `npm run migration:check`.

## Coding Style & Naming Conventions
Code is TypeScript-first with React 18 and Tailwind. Stick to 2-space indentation, prefer arrow functions for components, and keep file names kebab-case for UI (`reader-toolbar.tsx`) and camelCase for utilities (`contentIngestion.ts`). Run `npm run lint` before raising a PR; ESLint with `eslint-config-standard-with-typescript` enforces consistent imports, promise handling, and React hooks rules.

## Testing Guidelines
Vitest drives unit and integration coverage—co-locate `*.test.ts(x)` files beside the modules they verify. Mock Supabase calls with the helpers in `src/lib` when possible. Use Playwright specs in `tests/e2e` for full-stack regression, and gate new UI flows with at least one deterministic scenario. Aim to keep smoke tests fast; longer journeys belong in optional suites flagged with `test.describe.skip` until stable. Run `npm run ci` locally before pushing to surface type, lint, migration, and test drift.

## Commit & Pull Request Guidelines
Commits should use the imperative mood (`Add resource sections seed`) and focus on one logical change. Reference Supabase or frontend paths in the body when touching migrations or seed data. PRs need a concise summary, linked issue (if applicable), reproduction steps for bug fixes, and screenshots or GIFs for UI changes. Note any schema alterations in the PR description and confirm that `supabase/seed.sql` stays in sync with new migrations.
