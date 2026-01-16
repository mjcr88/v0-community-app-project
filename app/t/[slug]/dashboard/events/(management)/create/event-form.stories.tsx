
import type { Meta, StoryObj } from "@storybook/react"
import { EventForm } from "./event-form"
import { Toaster } from "@/components/ui/toaster"

const meta = {
    title: "Organisms/Events/EventForm",
    component: EventForm,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: "The multi-step form for creating and editing events.\n\n**Used in:** Event Create Page (`create/page.tsx`), Event Edit Page (`edit-event-form.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="p-6 bg-background min-h-screen max-w-2xl mx-auto">
                <Toaster />
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof EventForm>

export default meta
type Story = StoryObj<typeof meta>

const mockCategories = [
    { id: "1", name: "Social", icon: "🎉" },
    { id: "2", name: "Sports", icon: "⚽" },
    { id: "3", name: "Meeting", icon: "🤝" },
    { id: "4", name: "Other", icon: "❓" },
]

export const Default: Story = {
    args: {
        tenantSlug: "demo-community",
        tenantId: "tenant-1",
        categories: mockCategories,
        initialLocation: null,
    },
}

export const WithInitialLocation: Story = {
    args: {
        ...Default.args,
        initialLocation: {
            id: "loc-1",
            name: "Community Center",
            type: "community",
            coordinates: { lat: 10, lng: 10 },
        },
    },
}
