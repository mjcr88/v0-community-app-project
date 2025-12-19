
import type { Meta, StoryObj } from "@storybook/react"
import { LocationBadge } from "./location-badge"

const meta = {
    title: "Molecules/Events/LocationBadge",
    component: LocationBadge,
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component: "A badge component for displaying the event location type (Community, Custom, or None).\n\n**Used in:** EventsList, EventsCalendar (`app/t/[slug]/dashboard/events/events-list.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
    argTypes: {
        compact: { control: "boolean" },
    },
} satisfies Meta<typeof LocationBadge>

export default meta
type Story = StoryObj<typeof meta>

export const CommunityLocation: Story = {
    args: {
        locationType: "community_location",
        locationName: "Central Park",
    },
}

export const CustomLocation: Story = {
    args: {
        locationType: "custom_temporary",
        customLocationName: "Near the Old Oak Tree",
    },
}

export const NoLocation: Story = {
    args: {
        locationType: null,
    },
}

export const Compact: Story = {
    args: {
        locationType: "community_location",
        locationName: "Community Hall",
        compact: true,
    },
}
