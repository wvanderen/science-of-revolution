import { test, expect } from '@playwright/test'

test.describe('Authentication flows', () => {
  test('invite portal renders without crashing', async ({ page }) => {
    await page.goto('/invite')
    await expect(page.getByRole('heading', { name: /invite code/i })).toBeVisible()
  })

  test('protected route redirects to invite when unauthenticated', async ({ page }) => {
    // Try to access the root route (protected dashboard)
    await page.goto('/')

    // Should redirect to /invite
    await expect(page).toHaveURL(/\/invite/)
    await expect(page.getByRole('heading', { name: /invite code/i })).toBeVisible()
  })

  test('invite form validates required fields', async ({ page }) => {
    await page.goto('/invite')

    // Try to submit without filling in fields
    await page.getByRole('button', { name: /continue/i }).click()

    // Should show validation error
    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('invite form accepts user input', async ({ page }) => {
    await page.goto('/invite')

    // Fill in the form fields
    await page.getByLabel(/invite code/i).fill('TEST123')
    await page.getByLabel(/display name/i).fill('Test User')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('TestPass123!')

    // Verify fields are filled
    await expect(page.getByLabel(/invite code/i)).toHaveValue('TEST123')
    await expect(page.getByLabel(/display name/i)).toHaveValue('Test User')
    await expect(page.getByLabel(/email/i)).toHaveValue('test@example.com')
  })
})
