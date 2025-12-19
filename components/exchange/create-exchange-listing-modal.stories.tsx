import type { Meta, StoryObj } from "@storybook/react"
import { CreateExchangeListingModal } from "./create-exchange-listing-modal"
import { MockNextNavigation, WithRioFeedback } from "./storybook-decorators"

const meta = {
    title: "Organisms/Exchange/CreateExchangeListingModal",
    component: CreateExchangeListingModal,
    decorators: [MockNextNavigation, WithRioFeedback],
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: "A multi-step modal for creating new exchange listings.\n\n**Used in:** ExchangePageClient (`app/t/[slug]/dashboard/exchange/exchange-page-client.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
    argTypes: {
        onOpenChange: { action: "onOpenChange" },
    },
} satisfies Meta<typeof CreateExchangeListingModal>

export default meta
type Story = StoryObj<typeof meta>

const mockCategories = [
    { id: "cat-1", name: "Sports & Outdoors" },
    { id: "cat-2", name: "Home & Garden" },
    { id: "cat-3", name: "Food & Produce" },
]

const mockNeighborhoods = [
    { id: "hood-1", name: "Downtown" },
    { id: "hood-2", name: "Westside" },
]

export const Default: Story = {
    args: {
        open: true,
        tenantSlug: "demo-community",
        tenantId: "tenant-1",
        categories: mockCategories,
        neighborhoods: mockNeighborhoods,
        onOpenChange: () => { },
    },
}

export const WithInitialLocation: Story = {
    args: {
        ...Default.args,
        initialLocation: {
            id: "loc-1",
            name: "Community Center",
        },
    },
}
