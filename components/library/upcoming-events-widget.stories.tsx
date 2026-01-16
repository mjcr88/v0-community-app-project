import type { Meta, StoryObj } from '@storybook/react';
import { UpcomingEventsWidget } from '@/components/dashboard/upcoming-events-widget';

const meta = {
    title: 'Organisms/Dashboard/UpcomingEventsWidget',
    component: UpcomingEventsWidget,
    parameters: {
        layout: 'padded',
        nextjs: {
            appDirectory: true,
        },
        docs: {
            description: {
                component: 'Dashboard widget displaying upcoming events with RSVP functionality. Shows event cards with date, category, location, and inline RSVP actions. \n\n**Status**: Used on dashboard\n\n**Pages**: `/dashboard` (Explore & catch-up section)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof UpcomingEventsWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        slug: 'example-community',
        userId: '1',
        tenantId: '1',
    },
};
