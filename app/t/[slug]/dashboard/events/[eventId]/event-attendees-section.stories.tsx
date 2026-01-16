
import type { Meta, StoryObj } from "@storybook/react"
import { EventAttendeesSection } from "./event-attendees-section"

const meta = {
    title: "Organisms/Events/EventAttendeesSection",
    component: EventAttendeesSection,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: "Displays lists of attendees grouped by RSVP status (Going, Maybe, No).\n\n**Used in:** Event Detail Page (`events/[eventId]/page.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="p-6 bg-background max-w-4xl mx-auto">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof EventAttendeesSection>

export default meta
type Story = StoryObj<typeof meta>

const createAttendee = (id: string, name: string, status: string, guests = 0) => ({
    rsvp_status: status,
    attending_count: 1 + guests,
    user: {
        id,
        first_name: name.split(" ")[0],
        last_name: name.split(" ")[1] || "",
        profile_picture_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    },
})

const mockAttendees = {
    yes: [
        createAttendee("1", "John Doe", "yes"),
        createAttendee("2", "Alice Smith", "yes", 2),
        createAttendee("3", "Bob Johnson", "yes"),
    ],
    maybe: [
        createAttendee("4", "Charlie Brown", "maybe"),
    ],
    no: [
        createAttendee("5", "David Wilson", "no"),
    ],
}

export const Default: Story = {
    args: {
        attendees: mockAttendees,
        tenantSlug: "demo-community",
    },
}

export const Empty: Story = {
    args: {
        attendees: { yes: [], maybe: [], no: [] },
        tenantSlug: "demo-community",
    },
}
