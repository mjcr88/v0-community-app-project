
import type { Meta, StoryObj } from "@storybook/react"
import { EventActionsMenu } from "./event-actions-menu"

const meta = {
    title: "Molecules/Events/EventActionsMenu",
    component: EventActionsMenu,
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component: "A dropdown menu for event actions (Edit, Cancel, Delete, Flag).\n\n**Used in:** Event Detail Page (`events/[eventId]/page.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="h-64 flex items-start justify-center">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof EventActionsMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Creator: Story = {
    args: {
        eventId: "1",
        slug: "demo-community",
        tenantId: "tenant-1",
        eventTitle: "My Event",
        eventStatus: "published",
        canManageEvent: true,
        isCreator: true,
        hasUserFlagged: false,
        flagCount: 0,
        isTenantAdmin: false,
    },
}

export const Admin: Story = {
    args: {
        ...Creator.args,
        isCreator: false,
        isTenantAdmin: true,
    },
}

export const Resident: Story = {
    args: {
        ...Creator.args,
        canManageEvent: false,
        isCreator: false,
    },
}

export const FlaggedByMe: Story = {
    args: {
        ...Resident.args,
        hasUserFlagged: true,
        flagCount: 1,
    },
}
