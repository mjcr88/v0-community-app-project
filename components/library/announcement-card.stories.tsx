import type { Meta, StoryObj } from '@storybook/react';
import { AnnouncementCard } from '@/components/announcements/announcement-card';

const meta = {
    title: 'Organisms/Announcements/AnnouncementCard',
    component: AnnouncementCard,
    decorators: [
        (Story) => {
            // Mock Next.js router for Storybook
            const mockRouter = {
                push: () => { },
                refresh: () => { },
                pathname: '/dashboard/announcements',
            };
            return <Story />;
        },
    ],
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
                component: 'Main announcement card for list display. Shows title, description, metadata, priority, and read status. \n\n**Status**: Used on announcement pages\n\n**Pages**: `/dashboard/announcements` (list view)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof AnnouncementCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockAnnouncement = {
    id: '1',
    title: 'Community Pool Maintenance',
    description: 'The community pool will be closed for scheduled maintenance this weekend. We apologize for any inconvenience.',
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
};

export const Unread: Story = {
    args: {
        announcement: {
            ...mockAnnouncement,
            is_read: false,
        },
        slug: 'example-community',
    },
};

export const Read: Story = {
    args: {
        announcement: {
            ...mockAnnouncement,
            is_read: true,
        },
        slug: 'example-community',
    },
};

export const Urgent: Story = {
    args: {
        announcement: {
            ...mockAnnouncement,
            title: 'Emergency: Water Shutoff Tomorrow',
            description: 'Due to urgent repairs, water will be shut off tomorrow from 9 AM to 2 PM. Please plan accordingly.',
            priority: 'urgent' as const,
            announcement_type: 'emergency' as const,
            is_read: false,
        },
        slug: 'example-community',
    },
};

export const WithImage: Story = {
    args: {
        announcement: {
            ...mockAnnouncement,
            images: ['/api/placeholder/400/300'],
            is_read: false,
        },
        slug: 'example-community',
    },
};

export const WithNeighborhood: Story = {
    args: {
        announcement: {
            ...mockAnnouncement,
            neighborhoods: [
                { id: '1', name: 'Northside', slug: 'northside', created_at: '', tenant_id: '1' }
            ],
            is_read: false,
        },
        slug: 'example-community',
    },
};
