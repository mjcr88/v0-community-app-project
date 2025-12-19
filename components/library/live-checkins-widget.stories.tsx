import type { Meta, StoryObj } from '@storybook/react';
import { LiveCheckInsWidget } from '@/components/dashboard/live-checkins-widget';

const meta = {
    title: 'Organisms/Dashboard/LiveCheckInsWidget',
    component: LiveCheckInsWidget,
    parameters: {
        layout: 'padded',
        nextjs: {
            appDirectory: true,
        },
        docs: {
            description: {
                component: 'Dashboard widget displaying active check-ins with RSVP functionality. Shows grid of check-in cards with creator, location, and attendance count. Includes modal detail view. \n\n**Status**: Used on dashboard\n\n**Pages**: `/dashboard` (Explore & catch-up section, shown when check-ins enabled)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof LiveCheckInsWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        tenantSlug: 'example-community',
        tenantId: '1',
        userId: '1',
    },
};
