import type { Meta, StoryObj } from "@storybook/react"
import { NotificationCard } from "./notification-card"
import type { NotificationFull } from "@/types/notifications"

import { MockNextNavigation } from "@/components/exchange/storybook-decorators"

const meta: Meta<typeof NotificationCard> = {
    title: "Molecules/Notifications/NotificationCard",
    component: NotificationCard,
    decorators: [MockNextNavigation],
    tags: ["autodocs"],
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component:
                    "A generic notification card used to display various types of notifications (system, announcements, requests) in the notifications dashboard (`/dashboard/notifications`). It handles read state, archiving, and navigation to related content.",
            },
        },
    },
    argTypes: {
        onUpdate: { action: "updated" },
    },
}

export default meta
type Story = StoryObj<typeof NotificationCard>

const baseNotification: NotificationFull = {
    id: "1",
    tenant_id: "tenant-1",
    recipient_id: "user-1",
    type: "request_status_changed",
    title: "Request Updated",
    message: "Your maintenance request has been updated.",
    is_read: true,
    is_archived: false,
    action_required: false,
    action_taken: false,
    action_response: null,
    created_at: new Date().toISOString(),
    read_at: new Date().toISOString(),
    exchange_transaction_id: null,
    exchange_listing_id: null,
    event_id: null,
    check_in_id: null,
    resident_request_id: null,
    announcement_id: null,
    actor_id: "actor-1",
    action_url: null,
    metadata: null,
    actor: {
        id: "actor-1",
        first_name: "John",
        last_name: "Doe",
        profile_picture_url: "https://i.pravatar.cc/150?u=actor-1",
    },
}

export const Default: Story = {
    args: {
        notification: baseNotification,
        tenantSlug: "demo-tenant",
    },
}

export const Unread: Story = {
    args: {
        notification: {
            ...baseNotification,
            is_read: false,
            read_at: null,
        },
        tenantSlug: "demo-tenant",
    },
}

export const ActionRequired: Story = {
    args: {
        notification: {
            ...baseNotification,
            title: "Action Required",
            message: "Please confirm this action.",
            action_required: true,
            action_taken: false,
            is_read: false,
        },
        tenantSlug: "demo-tenant",
    },
}

export const ActionConfirmed: Story = {
    args: {
        notification: {
            ...baseNotification,
            title: "Action Confirmed",
            message: "You have confirmed this request.",
            action_required: true,
            action_taken: true,
            action_response: "confirmed",
        },
        tenantSlug: "demo-tenant",
    },
}

export const ActionDeclined: Story = {
    args: {
        notification: {
            ...baseNotification,
            title: "Action Declined",
            message: "You have declined this request.",
            action_required: true,
            action_taken: true,
            action_response: "declined",
        },
        tenantSlug: "demo-tenant",
    },
}

export const Announcement: Story = {
    args: {
        notification: {
            ...baseNotification,
            type: "announcement",
            title: "Community Announcement",
            message: "Water will be shut off tomorrow for maintenance.",
            announcement_id: "announcement-1",
            actor: null, // Announcements often don't have a specific actor shown or use a generic icon
        },
        tenantSlug: "demo-tenant",
    },
}
