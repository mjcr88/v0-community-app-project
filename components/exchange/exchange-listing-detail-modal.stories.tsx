import type { Meta, StoryObj } from "@storybook/react"
import { ExchangeListingDetailModal } from "./exchange-listing-detail-modal"
import { MockNextNavigation, WithRioFeedback } from "./storybook-decorators"

const meta = {
    title: "Organisms/Exchange/ExchangeListingDetailModal",
    component: ExchangeListingDetailModal,
    decorators: [MockNextNavigation, WithRioFeedback],
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: "A modal for viewing details of an exchange listing. Has different states for Creator and Viewer.\n\n**Used in:** ExchangePageClient (`app/t/[slug]/dashboard/exchange/exchange-page-client.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
    argTypes: {
        onOpenChange: { action: "onOpenChange" },
    },
} satisfies Meta<typeof ExchangeListingDetailModal>

export default meta
type Story = StoryObj<typeof meta>

const mockCreator = {
    id: "user-1",
    first_name: "Jane",
    last_name: "Doe",
    profile_picture_url: "https://i.pravatar.cc/150?u=user-1",
}

const mockViewer = {
    id: "user-2",
    first_name: "John",
    last_name: "Smith",
}

const mockListing = {
    id: "listing-1",
    title: "Vintage Bicycle",
    description: "<p>A beautiful vintage bicycle in great condition. <strong>Pickup only.</strong></p>",
    status: "published",
    is_available: true,
    pricing_type: "fixed_price",
    price: 150,
    condition: "used",
    available_quantity: 1,
    photos: ["https://images.unsplash.com/photo-1485965120184-e224f7a1dbfe?auto=format&fit=crop&q=80&w=800"],
    hero_photo: "https://images.unsplash.com/photo-1485965120184-e224f7a1dbfe?auto=format&fit=crop&q=80&w=800",
    category: {
        id: "cat-1",
        name: "Sports & Outdoors",
    },
    creator: mockCreator,
    created_by: mockCreator.id,
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    location: {
        id: "loc-1",
        name: "Community Center",
        type: "facility",
        coordinates: { lat: 0, lng: 0 },
    },
    location_id: "loc-1",
}

export const CreatorView: Story = {
    args: {
        open: true,
        listingId: "listing-1",
        tenantId: "tenant-1",
        tenantSlug: "community-slug",
        userId: mockCreator.id, // Same as creator
        userRole: "resident",
        locations: [],
        categories: [{ id: "cat-1", name: "Sports & Outdoors" }],
        neighborhoods: [],
        initialListing: mockListing,
        onOpenChange: () => { },
    },
}

export const ViewerView: Story = {
    args: {
        ...CreatorView.args,
        userId: mockViewer.id, // Different from creator
    },
}

export const ViewerViewWithPendingRequest: Story = {
    args: {
        ...ViewerView.args,
        initialPendingRequest: { id: "req-1", status: "pending" },
    },
}

export const PausedEvaluator: Story = {
    args: {
        ...CreatorView.args,
        initialListing: {
            ...mockListing,
            is_available: false,
        },
    },
}

export const AdminView: Story = {
    args: {
        ...ViewerView.args,
        isAdmin: true,
        initialFlagCount: 2,
        initialHasUserFlagged: false,
    },
}
