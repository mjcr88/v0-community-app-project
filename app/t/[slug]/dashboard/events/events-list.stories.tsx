
import type { Meta, StoryObj } from "@storybook/react"
import { EventsList } from "./events-list"

// Shared mock user data
const mockUser = {
    id: "user-1",
    first_name: "John",
    last_name: "Doe",
    profile_picture_url: "https://github.com/shadcn.png",
}

// Shared mock event data generator
const createMockEvent = (id: string, title: string, daysOffset = 7, overrides = {}) => {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + daysOffset)
    const endDate = new Date(startDate)
    endDate.setHours(endDate.getHours() + 2)

    return {
        id,
        title,
        description: "Join us for a wonderful community event where we will gather and celebrate.",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        start_time: "14:00:00",
        end_time: "16:00:00",
        is_all_day: false,
        event_type: "resident",
        event_categories: {
            name: "Social",
            icon: "🎉",
        },
        creator: mockUser,
        tenant_id: "tenant-1",
        requires_rsvp: true,
        max_attendees: 50,
        attending_count: 12,
        rsvp_deadline: new Date(startDate.getTime() - 86400000).toISOString(),
        user_rsvp_status: null,
        is_saved: false,
        visibility_scope: "community",
        location_type: "community_location",
        location: {
            id: "loc-1",
            name: "Community Hall",
        },
        ...overrides,
    }
}

const mockEvents = [
    createMockEvent("1", "Summer Block Party", 2),
    createMockEvent("2", "Book Club Meeting", 5, {
        event_categories: { name: "Education", icon: "📚" },
        location_type: "custom_temporary",
        custom_location_name: "Library Meeting Room",
        location: null
    }),
    createMockEvent("3", "Yoga in the Park", 1, {
        event_categories: { name: "Wellness", icon: "🧘" },
        event_type: "official",
        is_saved: true
    }),
] as any[]

const meta = {
    title: "Organisms/Events/EventsList",
    component: EventsList,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: "Displays a list of events with filtering capabilities and empty states.\n\n**Used in:** EventsPageClient (`events-page-client.tsx`), LocationEventsSection (`location-events-section.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="p-6 bg-background min-h-screen">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof EventsList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        events: mockEvents,
        slug: "demo-community",
        hasActiveFilters: false,
        userId: "user-1",
        tenantId: "tenant-1",
    },
}

export const Filtered: Story = {
    args: {
        ...Default.args,
        events: [mockEvents[0]],
        hasActiveFilters: true,
    },
}

export const EmptyNoUpcoming: Story = {
    args: {
        ...Default.args,
        events: [],
        emptyStateVariant: "no-upcoming",
    },
}

export const EmptyNoMatches: Story = {
    args: {
        ...Default.args,
        events: [],
        hasActiveFilters: true,
        emptyStateVariant: "no-matches",
    },
}

export const EmptyNoPast: Story = {
    args: {
        ...Default.args,
        events: [],
        emptyStateVariant: "no-past",
    },
}
