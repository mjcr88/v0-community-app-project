import { test, expect } from '@playwright/test';
const TEST_EVENT_SERIES_ID = 'TEST-SERIES-1'; // Mock or seed this
const TEST_EVENT_ID = 'test-event-series-123';
const TEST_TENANT_SLUG = 'demo';

test.describe('Series RSVP', () => {
    test.beforeEach(async ({ page }) => {
        // Intercept Supabase calls to provide stable test data
        await page.route('**/rest/v1/events?*', async (route) => {
            const url = new URL(route.request().url());
            if (url.searchParams.get('id') === `eq.${TEST_EVENT_ID}`) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([{
                        id: TEST_EVENT_ID,
                        parent_event_id: 'series-parent-456',
                        title: 'E2E Test Series Event',
                        description: 'A recurring test event',
                        start_date: new Date().toISOString(),
                        end_date: new Date(Date.now() + 3600000).toISOString(),
                        max_attendees: 50,
                        requires_rsvp: true,
                        tenant_id: 'tenant-123'
                    }])
                });
            } else {
                await route.continue();
            }
        });

        await page.goto(`/t/${TEST_TENANT_SLUG}/dashboard/events/${TEST_EVENT_ID}`);
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
