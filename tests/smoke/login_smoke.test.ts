import { test, expect } from '@playwright/test';

test('login page loads and has title', async ({ page }) => {
    // 1. Navigate to the login page (root or /login)
    await page.goto('http://localhost:3000/login');

    // 2. Check for basic title/heading presence to confirm app is running
    // Adjust the text based on actual UI, but "Sign In" or "Login" is standard.
    // Using a regex for flexibility.
    await expect(page).toHaveTitle(/Login|Sign in|Isabela|Rio Community/i);
});
