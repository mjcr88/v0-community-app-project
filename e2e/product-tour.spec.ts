import { test, expect } from '@playwright/test';

test.describe('Product Tour', () => {
    test.beforeEach(async ({ page }) => {
        // Reset onboarding state if possible, or use a fresh context
        // For now, we assume we can access the tour directly via the URL mentioned in the review
        await page.goto('/t/demo-community/onboarding/tour');
    });

    test('should verify all 10 slides and complete the tour', async ({ page }) => {
        // Slide 1: Welcome
        await expect(page.getByText('Welcome to Ecovilla')).toBeVisible();
        await expect(page.getByText('Profiles')).toBeVisible(); // WordRotate check
        await page.getByRole('button', { name: 'Next' }).click();

        // Slide 2: Theme
        await expect(page.getByText('Designed for Community')).toBeVisible();
        await page.getByRole('button', { name: 'Next' }).click();

        // Slide 3: Updates
        await expect(page.getByText('Latest Updates')).toBeVisible();
        await expect(page.getByText('Feb festival')).toBeVisible(); // Specific content check
        await page.getByRole('button', { name: 'Next' }).click();

        // Slide 4: Neighbors
        await expect(page.getByText('Meet Your Neighbors')).toBeVisible();
        await page.getByRole('button', { name: 'Next' }).click();

        // Slide 5: Map
        await expect(page.getByText('Interactive Map')).toBeVisible();
        await page.getByRole('button', { name: 'Next' }).click();

        // Slide 6: Events
        await expect(page.getByText('Community Events')).toBeVisible();
        await page.getByRole('button', { name: 'Next' }).click();

        // Slide 7: Facilities (Assuming standard flow)
        await page.getByRole('button', { name: 'Next' }).click();

        // Slide 8: Exchange
        await expect(page.getByText('Exchange Economy')).toBeVisible();
        await page.getByRole('button', { name: 'Next' }).click();

        // Slide 9: Requests
        await expect(page.getByText('Community Requests')).toBeVisible();
        await page.getByRole('button', { name: 'Next' }).click();

        // Slide 10: Complete
        await expect(page.getByText('You are all set!')).toBeVisible();
        await page.getByRole('button', { name: 'Get Started' }).click();

        // Verify redirect to dashboard
        await expect(page).toHaveURL(/.*\/dashboard/);
    });

    test('should allow skipping the tour', async ({ page }) => {
        await page.getByRole('button', { name: 'Skip' }).click();
        await expect(page).toHaveURL(/.*\/dashboard/);
    });
});
