import type { Meta, StoryObj } from '@storybook/react';
import { UpdatedIndicator } from '@/components/announcements/updated-indicator';

const meta = {
    title: 'Molecules/Announcements/UpdatedIndicator',
    component: UpdatedIndicator,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Indicator showing when announcement was last edited (only shows if >1min after publish). \n\n**Status**: Used on announcement pages\n\n**Pages**: `/dashboard/announcements` (on cards)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof UpdatedIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RecentlyUpdated: Story = {
    args: {
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        lastEditedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
};

export const UpdatedYesterday: Story = {
    args: {
        publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        lastEditedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
};
