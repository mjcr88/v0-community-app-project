import type { Meta, StoryObj } from "@storybook/react"
import { AnnouncementsPageClient } from "./announcements-page-client"
import { MockNextNavigation, WithRioFeedback } from "@/components/exchange/storybook-decorators"
import type { AnnouncementWithRelations } from "@/types/announcements"

const meta: Meta<typeof AnnouncementsPageClient> = {
    title: "Organisms/Announcements/AnnouncementsPageClient",
    component: AnnouncementsPageClient,
    parameters: {
        layout: "fullscreen",
        nextjs: {
            appDirectory: true,
        },
        docs: {
            description: {
                component:
                    "The main client-side component for the Announcements Dashboard (`/dashboard/announcements`). It displays a searchable list of announcements with tabs for New, Read, and Archived items.",
            },
        },
    },
    decorators: [MockNextNavigation, WithRioFeedback],
    tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof AnnouncementsPageClient>

const baseAnnouncement: AnnouncementWithRelations & { is_read?: boolean } = {
    id: "1",
    tenant_id: "tenant-1",
    created_by: "admin-1",
    title: "Test Announcement",
    description: "This is a test announcement description.",
    announcement_type: "general",
    priority: "normal",
    status: "published",
    event_id: null,
    location_type: null,
    location_id: null,
    custom_location_name: null,
    custom_location_lat: null,
    custom_location_lng: null,
    images: [],
    auto_archive_date: null,
    published_at: new Date().toISOString(),
    archived_at: null,
    deleted_at: null,
    last_edited_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_read: false,
    neighborhoods: [],
}

const mockAnnouncements: (AnnouncementWithRelations & { is_read?: boolean })[] = [
    {
        ...baseAnnouncement,
        id: "1",
        title: "Community BBQ",
        description: "Join us for a BBQ this weekend at the community center. Food and drinks provided!",
        announcement_type: "event",
        priority: "normal",
        images: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80"],
        is_read: false,
    },
    {
        ...baseAnnouncement,
        id: "2",
        title: "Urgent: Water Main Break",
        description: "There is a water main break on Main St. Crews are on site. Water may be unavailable for 4-6 hours.",
        announcement_type: "emergency",
        priority: "urgent",
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        published_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        ...baseAnnouncement,
        id: "3",
        title: "New Recycling Policy",
        description: "Please separate glass and plastic into different bins starting next week.",
        announcement_type: "policy",
        priority: "important",
        is_read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        published_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        ...baseAnnouncement,
        id: "4",
        title: "Pool Closed for Winter",
        description: "The community pool is now closed for the winter season.",
        announcement_type: "maintenance",
        status: "archived",
        is_read: true,
        auto_archive_date: new Date(Date.now() - 10000000).toISOString(), // Past date
    },
]

export const Default: Story = {
    args: {
        announcements: mockAnnouncements,
        slug: "demo-tenant",
        userId: "user-1",
        tenantId: "tenant-1",
    },
}

export const Empty: Story = {
    args: {
        announcements: [],
        slug: "demo-tenant",
        userId: "user-1",
        tenantId: "tenant-1",
    },
}
