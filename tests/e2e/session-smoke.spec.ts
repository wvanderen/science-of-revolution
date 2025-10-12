import { test, expect } from '@playwright/test'

test('invite portal renders without crashing', async ({ page }) => {
  await page.goto('/invite')
  await expect(page.getByRole('heading', { name: /invite code/i })).toBeVisible()
})
