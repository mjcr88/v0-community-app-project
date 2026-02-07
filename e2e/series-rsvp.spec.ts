import { test, expect } from '@playwright/test';
const TEST_EVENT_SERIES_ID = 'TEST-SERIES-1'; // Mock or seed this
const TEST_EVENT_ID = 'TEST-EVENT-1';

test.describe('Series RSVP', () => {
    test.beforeEach(async ({ page }) => {
        // Mock Login State (Using Vercel Preview cookies or dev bypass)
        // For now, assuming local dev env with auto-login or public access for testing
        await page.goto('/t/demo/dashboard/events');
    });

    test('should show series RSVP dialog options', async ({ page }) => {
        // Navigate to an event that is part of a series
        await page.goto(`/t/demo/dashboard/events/${TEST_EVENT_ID}`);

        // Click RSVP button
        const rsvpBtn = page.getByRole('button', { name: /rsvp/i });
        await expect(rsvpBtn).toBeVisible();
        await rsvpBtn.click();

        // Check for "This Event" vs "This and Future"
        // Note: verify the dialog content
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        // Expect series options
        await expect(page.getByText(/this event only/i)).toBeVisible();
        await expect(page.getByText(/this and future/i)).toBeVisible();
    });

    test('should rsvp to all future events in series', async ({ page }) => {
        await page.goto(`/t/demo/dashboard/events/${TEST_EVENT_ID}`);
        await page.getByRole('button', { name: /rsvp/i }).click();

        // Select "This and Future"
        await page.getByText(/this and future/i).click();

        // Select Status "Going"
        await page.getByRole('button', { name: /going/i }).click();

        // Verify Success
        await expect(page.getByText(/rsvp updated/i)).toBeVisible();
    });
});
