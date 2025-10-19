import { defineConfig, devices } from '@playwright/test'

/**
 * Dedicated Playwright configuration for smoke testing
 * Optimized for quick validation of core functionality
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*smoke*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Fewer retries for smoke tests
  workers: process.env.CI ? 2 : 1, // Parallelize smoke tests
  timeout: 30000, // 30 second timeout for smoke tests
  expect: {
    timeout: 10000 // 10 second assertion timeout
  },
  reporter: process.env.CI ? [['json', { outputFile: 'test-results/smoke-results.json' }], 'html'] : 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Faster load for smoke tests
    navigationTimeout: 15000
  },
  projects: [
    {
      name: 'chromium-smoke',
      use: {
        ...devices['Desktop Chrome'],
        // More lenient for smoke testing
        bypassCSP: true
      }
    },
    // Add mobile smoke testing
    {
      name: 'mobile-chrome-smoke',
      use: { ...devices['Pixel 5'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60000 // Shorter timeout for smoke tests
  },
  // Output directory for smoke test results
  outputDir: 'test-results/smoke'
})