import type { Meta, StoryObj } from '@storybook/react';
import { AnnouncementList } from '@/components/announcements/announcement-list';

const meta = {
    title: 'Organisms/Announcements/AnnouncementList',
    component: AnnouncementList,
    parameters: {
        layout: 'padded',
        nextjs: {
            appDirectory: true,
            navigation: {
                pathname: '/dashboard/announcements',
            },
        },
        docs: {
            description: {
                component: 'Animated list container for announcement cards. Handles staggered animations. \n\n**Status**: Used on announcement pages\n\n**Pages**: `/dashboard/announcements` (main list container)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof AnnouncementList>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockAnnouncements = [
    {
        id: '1',
        title: 'Community Pool Maintenance',
        description: 'The community pool will be closed for scheduled maintenance this weekend.',
        announcement_type: 'maintenance' as const,
        priority: 'normal' as const,
        status: 'published' as const,
        created_at: '2024-03-15T10:00:00Z',
        published_at: '2024-03-15T10:00:00Z',
        last_edited_at: null,
        auto_archive_date: null,
        location_id: null,
        location_type: null,
        custom_location_name: null,
        images: [],
        neighborhoods: [],
        reads: [],
        location: null,
        tenant_id: '1',
        is_read: false,
    },
    {
        id: '2',
        title: 'Upcoming Community Event',
        description: 'Join us for our monthly community gathering next Saturday!',
        announcement_type: 'event' as const,
        priority: 'normal' as const,
        status: 'published' as const,
        created_at: '2024-03-14T10:00:00Z',
        published_at: '2024-03-14T10:00:00Z',
        last_edited_at: null,
        auto_archive_date: null,
        location_id: null,
        location_type: null,
        custom_location_name: null,
        images: [],
        neighborhoods: [],
        reads: [],
        location: null,
        tenant_id: '1',
        is_read: true,
    },
    {
        id: '3',
        title: 'Emergency: Water Shutoff Tomorrow',
        description: 'Due to urgent repairs, water will be shut off tomorrow from 9 AM to 2 PM.',
        announcement_type: 'emergency' as const,
        priority: 'urgent' as const,
        status: 'published' as const,
        created_at: '2024-03-16T10:00:00Z',
        published_at: '2024-03-16T10:00:00Z',
        last_edited_at: null,
        auto_archive_date: null,
        location_id: null,
        location_type: null,
        custom_location_name: null,
        images: [],
        neighborhoods: [],
        reads: [],
        location: null,
        tenant_id: '1',
        is_read: false,
    },
];

export const MultipleAnnouncements: Story = {
    args: {
        announcements: mockAnnouncements,
        slug: 'example-community',
    },
};

export const SingleAnnouncement: Story = {
    args: {
        announcements: [mockAnnouncements[0]],
        slug: 'example-community',
    },
};
