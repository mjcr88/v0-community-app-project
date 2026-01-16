
import type { Meta, StoryObj } from "@storybook/react"
import { EventsCalendar } from "./events-calendar"
import { Toaster } from "@/components/ui/toaster"

// Shared mock user data
const mockUser = {
    id: "user-1",
    first_name: "John",
    last_name: "Doe",
    profile_picture_url: "https://github.com/shadcn.png",
}

// Helper to create date relative to today
const getDate = (daysOffset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + daysOffset)
    return d
}

// Shared mock event data generator
const createMockEvent = (id: string, title: string, daysOffset = 0) => {
    const startDate = getDate(daysOffset)
    const endDate = new Date(startDate)
    endDate.setHours(endDate.getHours() + 2)

    return {
        id,
        title,
        description: "Join us for a wonderful community event.",
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
        rsvp_deadline: getDate(daysOffset - 1).toISOString(),
        user_rsvp_status: null,
        is_saved: false,
        visibility_scope: "community",
        location_type: "community_location",
        location: {
            id: "loc-1",
            name: "Community Hall",
        },
    }
}

const mockEvents = [
    createMockEvent("1", "Today's Meetup", 0),
    createMockEvent("2", "Tomorrow's Workshop", 1),
    createMockEvent("3", "Next Week's Party", 7),
] as any[]

const meta = {
    title: "Organisms/Events/EventsCalendar",
    component: EventsCalendar,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: "Displays events in a calendar view.\n\n**Used in:** EventsPageClient (`events-page-client.tsx`), LocationEventsSection (`locations/[id]/location-events-section.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="p-6 bg-background min-h-screen">
                <Toaster />
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof EventsCalendar>

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

export const Empty: Story = {
    args: {
        ...Default.args,
        events: [],
    },
}

export const Filtered: Story = {
    args: {
        ...Default.args,
        hasActiveFilters: true,
        events: [mockEvents[0]],
    },
}
