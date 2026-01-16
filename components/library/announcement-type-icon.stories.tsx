import type { Meta, StoryObj } from '@storybook/react';
import { AnnouncementTypeIcon } from '@/components/announcements/announcement-type-icon';

const meta = {
    title: 'Molecules/Announcements/TypeIcon',
    component: AnnouncementTypeIcon,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Icon indicating announcement type with color coding. \n\n**Status**: Used on announcement pages\n\n**Pages**: `/dashboard/announcements`, `/dashboard/announcements/[id]`',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof AnnouncementTypeIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const General: Story = {
    args: {
        type: 'general',
        className: 'h-8 w-8',
    },
};

export const Emergency: Story = {
    args: {
        type: 'emergency',
        className: 'h-8 w-8',
    },
};

export const Maintenance: Story = {
    args: {
        type: 'maintenance',
        className: 'h-8 w-8',
    },
};

export const Event: Story = {
    args: {
        type: 'event',
        className: 'h-8 w-8',
    },
};

export const Policy: Story = {
    args: {
        type: 'policy',
        className: 'h-8 w-8',
    },
};

export const Safety: Story = {
    args: {
        type: 'safety',
        className: 'h-8 w-8',
    },
};
