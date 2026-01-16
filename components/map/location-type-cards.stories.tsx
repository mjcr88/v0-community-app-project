
import type { Meta, StoryObj } from "@storybook/react"
import { LocationTypeCards } from "./location-type-cards"

const meta = {
    title: "Molecules/Map/LocationTypeCards",
    component: LocationTypeCards,
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component: "A grid of cards displaying counts for different location types (facilities, lots, etc.).\n\n**Used in:** Admin Map Client (`app/t/[slug]/admin/map/admin-map-client.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
    argTypes: {
        onCardClick: { action: "cardClicked" },
    },
} satisfies Meta<typeof LocationTypeCards>

export default meta
type Story = StoryObj<typeof meta>

const defaultCounts = {
    facilities: 5,
    lots: 120,
    neighborhoods: 3,
    walkingPaths: 8,
    protectionZones: 2,
    easements: 4,
    playgrounds: 1,
    publicStreets: 15,
    greenAreas: 6,
    recreationalZones: 2,
}

export const Default: Story = {
    args: {
        counts: defaultCounts,
        clickable: false,
    },
}

export const Clickable: Story = {
    args: {
        counts: defaultCounts,
        clickable: true,
    },
    parameters: {
        docs: {
            description: {
                story: "Cards can be interactive and trigger an `onCardClick` event.",
            },
        },
    },
}

export const Empty: Story = {
    args: {
        counts: {
            facilities: 0,
            lots: 0,
            neighborhoods: 0,
            walkingPaths: 0,
            protectionZones: 0,
            easements: 0,
            playgrounds: 0,
            publicStreets: 0,
            greenAreas: 0,
            recreationalZones: 0,
        },
    },
}
