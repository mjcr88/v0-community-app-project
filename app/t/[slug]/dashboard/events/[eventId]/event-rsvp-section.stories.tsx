
import type { Meta, StoryObj } from "@storybook/react"
import { EventRsvpSection } from "./event-rsvp-section"
import { Toaster } from "@/components/ui/toaster"

const meta = {
    title: "Organisms/Events/EventRsvpSection",
    component: EventRsvpSection,
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component: "Handles user RSVP actions and displays attendee counts.\n\n**Used in:** Event Detail Page (`events/[eventId]/page.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="w-[600px] bg-background p-6">
                <Toaster />
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof EventRsvpSection>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
    args: {
        eventId: "1",
        tenantId: "tenant-1",
        requiresRsvp: true,
        rsvpDeadline: new Date(Date.now() + 86400000).toISOString(),
        maxAttendees: 50,
        userId: "user-1",
        eventStatus: "published",
        initialUserStatus: null,
        initialCounts: { yes: 10, maybe: 2, no: 1 },
        disableAutoFetch: true,
    },
}

export const Attending: Story = {
    args: {
        ...Open.args,
        initialUserStatus: "yes",
    },
}

export const Full: Story = {
    args: {
        ...Open.args,
        maxAttendees: 10,
        initialCounts: { yes: 10, maybe: 0, no: 0 },
    },
}

export const Closed: Story = {
    args: {
        ...Open.args,
        rsvpDeadline: new Date(Date.now() - 86400000).toISOString(),
    },
}

export const Cancelled: Story = {
    args: {
        ...Open.args,
        eventStatus: "cancelled",
    },
}

export const NotLoggedIn: Story = {
    args: {
        ...Open.args,
        userId: null,
    },
}
