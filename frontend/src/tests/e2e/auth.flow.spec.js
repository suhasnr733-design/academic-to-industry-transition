// src/tests/e2e/auth.flow.spec.js

import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/register')
    
    await page.fill('input[name="full_name"]', 'Test User')
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'TestPass123!')
    await page.fill('input[name="confirmPassword"]', 'TestPass123!')
    await page.fill('input[name="department"]', 'Computer Science')
    await page.fill('input[name="year_of_study"]', '4')
    
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/login')
    await expect(page.locator('text=Registration successful')).toBeVisible()
  })

  test('should login successfully', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="password"]', 'TestPass123!')
    
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Welcome back')).toBeVisible()
  })
})