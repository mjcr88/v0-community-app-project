import type { Meta, StoryObj } from '@storybook/react';
import { AnnouncementReadTracker } from '@/components/announcements/announcement-read-tracker';

const meta = {
    title: 'Organisms/Announcements/ReadTracker',
    component: AnnouncementReadTracker,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Invisible component that automatically marks announcement as read when viewed. Renders nothing (null). \n\n**Status**: Used on announcement detail pages\n\n**Pages**: `/dashboard/announcements/[id]` (auto-marks as read on page load)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof AnnouncementReadTracker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        announcementId: '1',
        slug: 'example-community',
    },
    render: (args) => (
        <div className="p-4 border-2 border-dashed rounded  text-center text-muted-foreground">
            <p>AnnouncementReadTracker renders nothing (null)</p>
            <p className="text-xs mt-2">It silently marks announcements as read on mount</p>
            <AnnouncementReadTracker {...args} />
        </div>
    ),
};
