import type { Meta, StoryObj } from "@storybook/react"
import { ExchangeListingCard } from "./exchange-listing-card"

const meta = {
    title: "Molecules/Exchange/ExchangeListingCard",
    component: ExchangeListingCard,
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component: "A card component for displaying exchange listing summaries in a grid or list.\n\n**Used in:** ExchangePageClient (`app/t/[slug]/dashboard/exchange/exchange-page-client.tsx`), MyListingsAndTransactionsWidget (`components/exchange/my-listings-and-transactions-widget.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
    argTypes: {
        onClick: { action: "clicked" },
    },
} satisfies Meta<typeof ExchangeListingCard>

export default meta
type Story = StoryObj<typeof meta>

const mockCreator = {
    id: "user-1",
    first_name: "Jane",
    last_name: "Doe",
    profile_picture_url: "https://i.pravatar.cc/150?u=user-1",
}

const baseListing = {
    id: "listing-1",
    title: "Vintage Bicycle",
    description: "A beautiful vintage bicycle in great condition.",
    status: "published",
    is_available: true,
    pricing_type: "fixed_price" as const,
    price_amount: 150,
    condition: "used",
    available_quantity: 1,
    hero_photo: "https://images.unsplash.com/photo-1485965120184-e224f7a1dbfe?auto=format&fit=crop&q=80&w=800",
    photos: ["https://images.unsplash.com/photo-1485965120184-e224f7a1dbfe?auto=format&fit=crop&q=80&w=800"],
    category: {
        id: "cat-1",
        name: "Sports & Outdoors",
    },
    creator: mockCreator,
    location: {
        name: "Community Center",
    },
    flag_count: 0,
}

export const Default: Story = {
    args: {
        listing: baseListing,
    },
}

export const NoImage: Story = {
    args: {
        listing: {
            ...baseListing,
            hero_photo: null,
            photos: [],
        },
    },
}

export const FreeItem: Story = {
    args: {
        listing: {
            ...baseListing,
            title: "Leftover Paint",
            pricing_type: "free",
            price_amount: 0,
            category: { id: "cat-2", name: "DIY & Tools" },
        },
    },
}

export const PayWhatYouWant: Story = {
    args: {
        listing: {
            ...baseListing,
            title: "Homemade Cookies",
            pricing_type: "pay_what_you_want",
            price_amount: null,
            category: { id: "cat-3", name: "Food & Produce" },
            available_quantity: 12,
        },
    },
}

export const Draft: Story = {
    args: {
        listing: {
            ...baseListing,
            status: "draft",
            is_available: false,
        },
    },
}

export const Unavailable: Story = {
    args: {
        listing: {
            ...baseListing,
            is_available: false,
        },
    },
}

export const Flagged: Story = {
    args: {
        listing: {
            ...baseListing,
            flag_count: 3,
        },
    },
}

export const CustomLocation: Story = {
    args: {
        listing: {
            ...baseListing,
            location: null,
            custom_location_name: "My Garage (Unit 42)",
        },
    },
}
