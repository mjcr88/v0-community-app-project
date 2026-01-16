import type { Meta, StoryObj } from '@storybook/react';
import { AnnouncementEmptyState } from '@/components/announcements/announcement-empty-state';

const meta = {
    title: 'Organisms/Announcements/EmptyState',
    component: AnnouncementEmptyState,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Empty state display with Rio mascot for different announcement tabs. \n\n**Status**: Used on announcement pages\n\n**Pages**: `/dashboard/announcements` (shown when no announcements in active tab)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof AnnouncementEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const New: Story = {
    args: {
        type: 'new',
    },
};

export const Read: Story = {
    args: {
        type: 'read',
    },
};

export const Archived: Story = {
    args: {
        type: 'archived',
    },
};

export const Search: Story = {
    args: {
        type: 'search',
        onClearSearch: () => console.log(' Clear search clicked'),
    },
};
