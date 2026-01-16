import type { Meta, StoryObj } from '@storybook/react';
import { AnnouncementPriorityBadge } from '@/components/announcements/announcement-priority-badge';

const meta = {
    title: 'Molecules/Announcements/PriorityBadge',
    component: AnnouncementPriorityBadge,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Priority indicator badge (urgent/important/normal). \n\n**Status**: Used on announcement pages\n\n**Pages**: `/dashboard/announcements`, `/dashboard/announcements/[id]`, `/admin/announcements`',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof AnnouncementPriorityBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Urgent: Story = {
    args: {
        priority: 'urgent',
    },
};

export const Important: Story = {
    args: {
        priority: 'important',
    },
};

export const Normal: Story = {
    args: {
        priority: 'normal',
    },
};
