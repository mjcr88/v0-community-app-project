import type { Meta, StoryObj } from '@storybook/react';
import { EditStatModal } from '@/components/dashboard/EditStatModal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const meta = {
    title: 'Organisms/Dashboard/EditStatModal',
    component: EditStatModal,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Modal for configuring dashboard stats. Allows selection of scope (community/neighborhood) and reordering of stats via drag-and-drop. \n\n**Status**: Used on dashboard\n\n**Pages**: `/dashboard` (triggered from Quick Stats edit buttons)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof EditStatModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockAvailableStats = [
    { id: 'total_residents', label: '# Total Residents', scope: 'Community' },
    { id: 'active_events', label: '# Active Events', scope: 'Events' },
    { id: 'my_listings', label: '# My Active Listings', scope: 'Exchange' },
    { id: 'pending_requests', label: '# Pending Requests', scope: 'Requests' },
    { id: 'unread_announcements', label: '# Unread Announcements', scope: 'Announcements' },
    { id: 'active_checkins', label: '# Active Check-ins', scope: 'Check-ins' },
];

export const Default: Story = {
    render: () => {
        const [open, setOpen] = useState(false);
        return (
            <>
                <Button onClick={() => setOpen(true)}>Open Edit Modal</Button>
                <EditStatModal
                    open={open}
                    onOpenChange={setOpen}
                    currentStats={['total_residents', 'active_events', 'my_listings', 'pending_requests']}
                    availableStats={mockAvailableStats}
                    currentScope="tenant"
                    onSave={async (stats, scope) => {
                        console.log('Saving stats:', stats, 'Scope:', scope);
                    }}
                />
            </>
        );
    },
};

export const NeighborhoodScope: Story = {
    render: () => {
        const [open, setOpen] = useState(true);
        return (
            <EditStatModal
                open={open}
                onOpenChange={setOpen}
                currentStats={['total_residents', 'active_events']}
                availableStats={mockAvailableStats}
                currentScope="neighborhood"
                onSave={async (stats, scope) => {
                    console.log('Saving stats:', stats, 'Scope:', scope);
                }}
            />
        );
    },
};
