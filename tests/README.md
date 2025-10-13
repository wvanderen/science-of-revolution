# Testing Guide

## Overview
This project uses Vitest for unit/integration tests and Playwright for E2E tests.

## Unit Tests (Vitest)

### Running Unit Tests
```bash
# Run all unit tests
npm test

# Run with UI
npm run test:ui

# Run in watch mode
npm test -- --watch
```

### Writing Unit Tests
- Place tests in `__tests__` directories next to the code they test
- Use `.test.ts` or `.test.tsx` extensions
- Mock external dependencies using `vi.hoisted()` for proper hoisting

Example:
```typescript
import { renderHook } from '@testing-library/react'
import { myHook } from '../myHook'

describe('myHook', () => {
  it('returns expected value', () => {
    const { result } = renderHook(() => myHook())
    expect(result.current).toBe('expected')
  })
})
```

## E2E Tests (Playwright)

### Running E2E Tests
E2E tests require the dev server to be running:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run E2E tests
npm run test:e2e

# Run in UI mode for debugging
npx playwright test --ui

# Run specific test
npx playwright test session-smoke
```

### Auto-start Dev Server (Optional)
Uncomment the `webServer` configuration in `playwright.config.ts` to automatically start the dev server when running E2E tests.

### Writing E2E Tests
- Place E2E tests in `tests/e2e/`
- Use `.spec.ts` extension
- Follow Playwright best practices for selectors

Example:
```typescript
import { test, expect } from '@playwright/test'

test('feature works correctly', async ({ page }) => {
  await page.goto('/feature')
  await expect(page.getByRole('heading')).toBeVisible()
})
```

## Test Coverage

### Current Coverage
- Auth flows: ✓ useSession hook, invite gate page
- E2E smoke tests: ✓ invite portal, protected routes, form validation

### Coverage Goals
- Unit/integration tests: ≥70% for core modules
- E2E tests: smoke tests for critical user journeys

## CI/CD
Tests are configured to run in CI with:
- Retries enabled (2 retries in CI)
- Screenshots on failure
- HTML report generation

## Debugging
- Use `screen.debug()` in React Testing Library tests
- Use `--debug` flag with Playwright: `npx playwright test --debug`
- Check test artifacts in `test-results/` and `playwright-report/`
