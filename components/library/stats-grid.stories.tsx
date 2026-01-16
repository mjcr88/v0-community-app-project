import type { Meta, StoryObj } from '@storybook/react';
import { StatsGrid } from '@/components/dashboard/StatsGrid';

const meta = {
    title: 'Organisms/Dashboard/StatsGrid',
    component: StatsGrid,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Grid of 4 configurable stat cards with edit modal. Fetches stats from API and allows user customization. \n\n**Status**: Used on dashboard\n\n**Pages**: `/dashboard` (Quick Stats section)\n\n**Note**: Requires authentication. Will show loading state in Storybook.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof StatsGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <div className="max-w-4xl">
            <StatsGrid />
        </div>
    ),
};
