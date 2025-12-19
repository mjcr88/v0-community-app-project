import type { Meta, StoryObj } from "@storybook/react"
import { NotificationsClient } from "./notifications-client"
import { MockNextNavigation, WithRioFeedback } from "@/components/exchange/storybook-decorators"
import type { NotificationFull } from "@/types/notifications"

const meta: Meta<typeof NotificationsClient> = {
    title: "Organisms/Notifications/NotificationsClient",
    component: NotificationsClient,
    parameters: {
        layout: "fullscreen",
        nextjs: {
            appDirectory: true,
        },
        docs: {
            description: {
                component:
                    "The main client-side component for the Notifications Dashboard (`/dashboard/notifications`). It manages the tabs (All, Exchange, etc.), filtering (Unread, Archived), and renders the appropriate notification cards.",
            },
        },
    },
    decorators: [MockNextNavigation, WithRioFeedback],
    tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof NotificationsClient>

const baseActor = {
    id: "actor-1",
    first_name: "John",
    last_name: "Doe",
    profile_picture_url: "https://i.pravatar.cc/150?u=john",
}

const mockNotifications: NotificationFull[] = [
    {
        id: "1",
        tenant_id: "tenant-1",
        recipient_id: "user-1",
        type: "request_status_changed",
        title: "Maintenance Request Updated",
        message: "Your request for fixing the sink has been marked as 'In Progress'.",
        is_read: false,
        is_archived: false,
        action_required: false,
        action_taken: false,
        action_response: null,
        created_at: new Date().toISOString(),
        read_at: null,
        exchange_transaction_id: null,
        exchange_listing_id: null,
        event_id: null,
        check_in_id: null,
        resident_request_id: null,
        announcement_id: null,
        actor_id: "admin-1",
        actor: { ...baseActor, first_name: "Admin" },
        action_url: null,
        metadata: null,
    },
    {
        id: "2",
        tenant_id: "tenant-1",
        recipient_id: "user-1",
        type: "exchange_request",
        title: "New Borrow Request",
        message: "Alice wants to borrow your Ladder",
        is_read: false,
        is_archived: false,
        action_required: true,
        action_taken: false,
        action_response: null,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        read_at: null,
        exchange_transaction_id: "tx-1",
        exchange_listing_id: "listing-1",
        event_id: null,
        check_in_id: null,
        resident_request_id: null,
        announcement_id: null,
        actor_id: "alice-1",
        actor: { ...baseActor, first_name: "Alice" },
        action_url: null,
        metadata: null,
        exchange_listing: {
            id: "listing-1",
            title: "Ladder",
            hero_photo: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=300&q=80",
            category: { id: "cat-1", name: "Tools" },
        },
        exchange_transaction: {
            id: "tx-1",
            quantity: 1,
            status: "pending",
            proposed_pickup_date: new Date(Date.now() + 86400000).toISOString(),
            proposed_return_date: new Date(Date.now() + 172800000).toISOString(),
            expected_return_date: null,
            actual_return_date: null,
            return_condition: null,
            return_notes: null,
            borrower_message: "Need for painting",
            lender_message: null,
        },
    },
    {
        id: "3",
        tenant_id: "tenant-1",
        recipient_id: "user-1",
        type: "announcement",
        title: "Community BBQ",
        message: "Join us this Saturday for a community BBQ!",
        is_read: true,
        is_archived: false,
        action_required: false,
        action_taken: false,
        action_response: null,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        read_at: new Date().toISOString(),
        exchange_transaction_id: null,
        exchange_listing_id: null,
        event_id: null,
        check_in_id: null,
        resident_request_id: null,
        announcement_id: "ann-1",
        actor_id: null,
        actor: null,
        action_url: null,
        metadata: null,
    },
]

export const Default: Story = {
    args: {
        tenantSlug: "demo-tenant",
        tenantId: "tenant-1",
        userId: "user-1",
        initialNotifications: mockNotifications,
    },
}

export const Empty: Story = {
    args: {
        tenantSlug: "demo-tenant",
        tenantId: "tenant-1",
        userId: "user-1",
        initialNotifications: [],
    },
}
