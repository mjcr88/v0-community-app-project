import type { Meta, StoryObj } from "@storybook/react"
import { ExchangeNotificationCard } from "./exchange-notification-card"
import type { NotificationFull } from "@/types/notifications"

import { MockNextNavigation } from "@/components/exchange/storybook-decorators"

const meta: Meta<typeof ExchangeNotificationCard> = {
    title: "Molecules/Notifications/ExchangeNotificationCard",
    component: ExchangeNotificationCard,
    decorators: [MockNextNavigation],
    tags: ["autodocs"],
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component:
                    "A specialized notification card for Exchange-related updates. Used in the notifications dashboard (`/dashboard/notifications`) to display borrow requests, confirmations, returns, and overdue alerts. Includes inline actions for confirming/rejecting requests.",
            },
        },
    },
    argTypes: {
        onUpdate: { action: "updated" },
    },
}

export default meta
type Story = StoryObj<typeof ExchangeNotificationCard>

const baseActor = {
    id: "borrower-1",
    first_name: "Alice",
    last_name: "Wonder",
    profile_picture_url: "https://i.pravatar.cc/150?u=alice",
}

const baseListing = {
    id: "listing-1",
    title: "Power Drill",
    hero_photo: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=300&q=80",
    category: { id: "cat-1", name: "Tools & Equipment" },
}

const baseNotification: NotificationFull = {
    id: "1",
    tenant_id: "tenant-1",
    recipient_id: "user-1", // Current user is the lender
    type: "exchange_request",
    title: "New Borrow Request",
    message: "Alice wants to borrow your Power Drill",
    is_read: false,
    is_archived: false,
    action_required: true,
    action_taken: false,
    action_response: null,
    created_at: new Date().toISOString(),
    read_at: null,
    exchange_transaction_id: "tx-1",
    exchange_listing_id: "listing-1",
    event_id: null,
    check_in_id: null,
    resident_request_id: null,
    announcement_id: null,
    actor_id: "borrower-1",
    actor: baseActor,
    action_url: null,
    metadata: null,
    exchange_listing: baseListing,
    exchange_transaction: {
        id: "tx-1",
        quantity: 1,
        status: "pending",
        proposed_pickup_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        proposed_return_date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
        expected_return_date: null,
        actual_return_date: null,
        return_condition: null,
        return_notes: null,
        borrower_message: "Need this for a project this weekend!",
        lender_message: null,
        lender_id: "user-1",
        borrower_id: "borrower-1",
    },
}

export const BorrowRequest: Story = {
    args: {
        notification: baseNotification,
        tenantSlug: "demo-tenant",
        userId: "user-1",
    },
}

export const BorrowConfirmed: Story = {
    args: {
        notification: {
            ...baseNotification,
            type: "exchange_confirmed",
            title: "Request Confirmed",
            message: "You confirmed Alice's request",
            is_read: true,
            action_required: false,
            action_taken: true,
            action_response: "confirmed",
            exchange_transaction: {
                ...baseNotification.exchange_transaction!,
                status: "confirmed",
                lender_message: "Sure, go ahead!",
            },
        },
        tenantSlug: "demo-tenant",
        userId: "user-1",
    },
}

export const PickupReady: Story = {
    args: {
        notification: {
            ...baseNotification,
            type: "exchange_confirmed", // Reusing confirmed type for pickup UI trigger in card logic
            title: "Ready for Pickup",
            message: "Time for pickup",
            is_read: true,
            action_required: false,
            exchange_transaction: {
                ...baseNotification.exchange_transaction!,
                status: "confirmed",
            },
        },
        tenantSlug: "demo-tenant",
        userId: "user-1",
    },
}

export const ReturnReminder: Story = {
    args: {
        notification: {
            ...baseNotification,
            type: "exchange_reminder",
            title: "Return Reminder",
            message: "Item is due back tomorrow",
            is_read: false,
            action_required: false,
            exchange_transaction: {
                ...baseNotification.exchange_transaction!,
                status: "picked_up",
                expected_return_date: new Date(Date.now() + 86400000).toISOString(),
            },
        },
        tenantSlug: "demo-tenant",
        userId: "user-1",
    },
}

export const Overdue: Story = {
    args: {
        notification: {
            ...baseNotification,
            type: "exchange_overdue",
            title: "Item Overdue",
            message: "This item was due yesterday",
            is_read: false,
            action_required: true,
            exchange_transaction: {
                ...baseNotification.exchange_transaction!,
                status: "picked_up",
                expected_return_date: new Date(Date.now() - 86400000).toISOString(),
            },
        },
        tenantSlug: "demo-tenant",
        userId: "user-1",
    },
}
