import type { Meta, StoryObj } from '@storybook/react';
import { AnimatedList } from './animated-list';

const NotificationItem = ({ name, color }: { name: string; color: string }) => (
    <div className={`p-4 rounded-lg shadow-sm w-64 mb-2 text-white ${color}`}>
        <span className="font-bold">{name}</span>
        <p className="text-sm opacity-90">New notification received</p>
    </div>
);

const meta = {
    title: 'Molecules/Layout/AnimatedList',
    component: AnimatedList,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'List container that animates items in sequence. \n\n**Status**: Unused (orphaned in library).',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof AnimatedList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <div className="h-[400px] flex items-center justify-center">
            <AnimatedList {...args}>
                <NotificationItem name="Payment Received" color="bg-green-500" />
                <NotificationItem name="New User" color="bg-blue-500" />
                <NotificationItem name="Server Error" color="bg-red-500" />
                <NotificationItem name="Warning" color="bg-yellow-500" />
            </AnimatedList>
        </div>
    ),
    args: {
        delay: 1500,
    },
};
