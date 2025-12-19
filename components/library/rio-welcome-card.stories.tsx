import type { Meta, StoryObj } from '@storybook/react';
import { RioWelcomeCard } from '@/components/ecovilla/dashboard/RioWelcomeCard';

const meta = {
    title: 'Organisms/Dashboard/RioWelcomeCard',
    component: RioWelcomeCard,
    parameters: {
        layout: 'padded',
        nextjs: {
            appDirectory: true,
        },
        docs: {
            description: {
                component: 'Rio mascot welcome card with tour and profile completion CTAs. Features gradient background and responsive Rio image positioning. \n\n**Status**: Used on dashboard\n\n**Pages**: `/dashboard` (top section, Rio column)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof RioWelcomeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        slug: 'example-community',
    },
};
