import type { Meta, StoryObj } from "@storybook/react"
import { AnnouncementCard } from "./announcement-card"
import type { AnnouncementWithRelations } from "@/types/announcements"

import { MockNextNavigation } from "@/components/exchange/storybook-decorators"

const meta: Meta<typeof AnnouncementCard> = {
    title: "Molecules/Announcements/AnnouncementCard",
    component: AnnouncementCard,
    decorators: [MockNextNavigation],
    tags: ["autodocs"],
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component:
                    "A card component for displaying announcements. Used in the main announcements feed (`/dashboard/announcements`) and on the individual announcement detail page. Supports various priorities (urgent, normal), types (maintenance, event, etc.), and read states.",
            },
        },
    },
    argTypes: {
        onClick: { action: "clicked" },
        onMarkAsRead: { action: "marked as read" },
    },
}

export default meta
type Story = StoryObj<typeof AnnouncementCard>

const baseAnnouncement: AnnouncementWithRelations & { is_read?: boolean } = {
    id: "1",
    tenant_id: "tenant-1",
    created_by: "admin-1",
    title: "Water Shutoff Notice",
    description: "Water will be shut off for maintenance from 9am to 5pm tomorrow.",
    announcement_type: "maintenance",
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
    is_read: true,
    neighborhoods: [],
}

export const Default: Story = {
    args: {
        announcement: baseAnnouncement,
        slug: "demo-tenant",
    },
}

export const WithImage: Story = {
    args: {
        announcement: {
            ...baseAnnouncement,
            images: [
                "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?auto=format&fit=crop&w=800&q=80",
            ],
            title: "Community Garden Update",
            announcement_type: "general",
        },
        slug: "demo-tenant",
    },
}

export const Urgent: Story = {
    args: {
        announcement: {
            ...baseAnnouncement,
            title: "Emergency Alert",
            description: "Severe weather warning in effect. Please stay indoors.",
            announcement_type: "emergency",
            priority: "urgent",
            is_read: false,
        },
        slug: "demo-tenant",
    },
}

export const Unread: Story = {
    args: {
        announcement: {
            ...baseAnnouncement,
            is_read: false,
            title: "New Policy Update",
            announcement_type: "policy",
        },
        slug: "demo-tenant",
    },
}

export const LocationBadge: Story = {
    args: {
        announcement: {
            ...baseAnnouncement,
            title: "Pool Party",
            announcement_type: "event",
            location_type: "community_location",
            location: {
                id: "loc-1",
                name: "Community Pool",
                coordinates: { lat: 0, lng: 0 },
            },
        },
        slug: "demo-tenant",
    },
}
