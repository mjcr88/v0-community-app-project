import type { Meta, StoryObj } from '@storybook/react';
import { AnnouncementsWidget } from '@/components/dashboard/announcements-widget';

const meta = {
    title: 'Organisms/Dashboard/AnnouncementsWidget',
    component: AnnouncementsWidget,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Dashboard widget displaying recent announcements with unread count. Fetches data from API and shows empty state when no announcements exist. \n\n**Status**: Used on dashboard\n\n**Pages**: `/dashboard` (Explore & catch-up section)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof AnnouncementsWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        slug: 'example-community',
        tenantId: '1',
        userId: '1',
    },
};
