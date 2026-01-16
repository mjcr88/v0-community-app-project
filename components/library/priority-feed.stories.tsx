import type { Meta, StoryObj } from '@storybook/react';
import { PriorityFeed } from '@/components/ecovilla/dashboard/PriorityFeed';

const meta = {
    title: 'Organisms/Dashboard/PriorityFeed',
    component: PriorityFeed,
    parameters: {
        layout: 'padded',
        nextjs: {
            appDirectory: true,
        },
        docs: {
            description: {
                component: 'Priority feed showing "What\'s Next" - a smart feed of announcements, events, check-ins, listings, and exchange transactions sorted by relevance and urgency. Supports inline RSVP and save actions. \n\n**Status**: Used on dashboard\n\n**Pages**: `/dashboard` (What\'s Next section)\n\n**Note**: This component requires authenticated API access and will show "Failed to load feed" in Storybook. View it on the live dashboard page instead.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof PriorityFeed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        slug: 'ecovilla-san-mateo',
        userId: '1',
        tenantId: '1',
    },
    render: (args) => (
        <div className="h-[600px] border rounded-xl">
            <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-sm">
                ⚠️ This component requires authentication. Visit <code>http://localhost:3000/t/ecovilla-san-mateo/dashboard</code> to see it in action.
            </div>
            <PriorityFeed {...args} />
        </div>
    ),
};
