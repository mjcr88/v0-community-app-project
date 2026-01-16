import type { Meta, StoryObj } from "@storybook/react"
import { ExchangePageClient } from "./exchange-page-client"
import { MockNextNavigation, WithRioFeedback } from "@/components/exchange/storybook-decorators"

const meta = {
    title: "Organisms/Exchange/ExchangePageClient",
    component: ExchangePageClient,
    decorators: [MockNextNavigation, WithRioFeedback],
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: "The main exchange dashboard page client component. Displays listings with search, filter, and sort capabilities.\n\n**Used in:** Exchange Page (`app/t/[slug]/dashboard/exchange/page.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
    argTypes: {
    },
} satisfies Meta<typeof ExchangePageClient>

export default meta
type Story = StoryObj<typeof meta>

const mockCreator = {
    id: "user-1",
    first_name: "Jane",
    last_name: "Doe",
    profile_picture_url: "https://i.pravatar.cc/150?u=user-1",
}

const mockListings = Array.from({ length: 6 }).map((_, i) => ({
    id: `listing-${i + 1}`,
    title: `Listing Item ${i + 1}`,
    description: "This is a description of the item.",
    status: "published",
    is_available: true,
    pricing_type: i % 3 === 0 ? "free" : i % 3 === 1 ? "fixed_price" : "pay_what_you_want",
    price: i % 3 === 1 ? (i + 1) * 10 : null,
    condition: "used",
    available_quantity: 1,
    photos: [],
    hero_photo: null,
    custom_location_name: null,
    category: {
        id: "cat-1",
        name: i % 2 === 0 ? "Sports & Outdoors" : "Home & Garden",
        description: null,
    },
    creator: mockCreator,
    location: {
        name: "Community Center",
    },
})) as any[]

const mockCategories = [
    { id: "cat-1", name: "Sports & Outdoors", description: null },
    { id: "cat-2", name: "Home & Garden", description: null },
    { id: "cat-3", name: "Food & Produce", description: null },
]

export const Default: Story = {
    args: {
        listings: mockListings,
        categories: mockCategories,
        neighborhoods: [],
        locations: [],
        tenantId: "tenant-1",
        tenantSlug: "demo",
        userId: "user-1",
        userRole: "resident",
    },
}

export const Empty: Story = {
    args: {
        ...Default.args,
        listings: [],
    },
}

export const ManyListings: Story = {
    args: {
        ...Default.args,
        listings: Array.from({ length: 20 }).map((_, i) => ({
            ...mockListings[i % 6],
            id: `listing-${i}`,
            title: `Listing ${i} - ${mockListings[i % 6].title}`,
        })),
    },
}
