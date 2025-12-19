import type { Meta, StoryObj } from '@storybook/react';
import { StatCard } from '@/components/dashboard/StatCard';

const meta = {
    title: 'Molecules/Dashboard/StatCard',
    component: StatCard,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Individual configurable stat card displaying value, label, scope, and optional trend. \n\n**Status**: Used on dashboard\n\n**Pages**: `/ dashboard` (Quick Stats section)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        stat: {
            id: 'stat-1',
            label: 'Total Residents',
            value: 1250,
            scope: 'Community',
            trend: {
                value: 12,
                direction: 'up',
            },
        },
    },
};

export const Editable: Story = {
    args: {
        isEditing: true,
        stat: {
            id: 'stat-2',
            label: 'Active Events',
            value: 5,
            scope: 'Events',
            trend: {
                value: 0,
                direction: 'neutral',
            },
        },
    },
};
