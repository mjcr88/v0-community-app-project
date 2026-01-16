import type { Meta, StoryObj } from "@storybook/react"
import { MobileDock } from "./mobile-dock"
import { MockNextNavigation, WithRioFeedback } from "@/components/exchange/storybook-decorators"

const meta: Meta<typeof MobileDock> = {
    title: "Organisms/Navigation/MobileDock",
    component: MobileDock,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "The floating bottom navigation dock for mobile devices. Used in `MobileNav` within `app/t/[slug]/dashboard/layout.tsx`. Provides quick access to Home, Map, Events, Exchange, and a central 'Create' action.",
            },
        },
    },
    decorators: [MockNextNavigation, WithRioFeedback],
    tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof MobileDock>

const mockCategories = [
    { id: "cat-1", name: "Tools" },
    { id: "cat-2", name: "Kitchen" },
    { id: "cat-3", name: "Electronics" },
]

const mockNeighborhoods = [
    { id: "nbhd-1", name: "Sunny Side" },
    { id: "nbhd-2", name: "Green Valley" },
]

export const Default: Story = {
    args: {
        tenantSlug: "demo-tenant",
        tenantId: "tenant-1",
        unreadEvents: 0,
        categories: mockCategories,
        neighborhoods: mockNeighborhoods,
    },
}

export const WithBadges: Story = {
    args: {
        ...Default.args,
        unreadEvents: 5,
    },
}
