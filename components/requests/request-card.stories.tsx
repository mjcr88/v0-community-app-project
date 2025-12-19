import type { Meta, StoryObj } from "@storybook/react"
import { RequestCard } from "./request-card"

const meta = {
    title: "Molecules/Requests/RequestCard",
    component: RequestCard,
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component: "A card component for displaying request summaries in a grid or list.\n\n**Used in:** RequestsPageClient (`components/requests/requests-page-client.tsx`), MyRequestsWidget (`components/requests/my-requests-widget.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
    argTypes: {
        onClick: { action: "clicked" },
    },
} satisfies Meta<typeof RequestCard>

export default meta
type Story = StoryObj<typeof meta>

const mockCreator = {
    id: "user-1",
    first_name: "Jane",
    last_name: "Doe",
    profile_picture_url: "https://i.pravatar.cc/150?u=user-1",
}

const baseRequest: any = {
    id: "req-1",
    title: "Broken Streetlight",
    description: "The streetlight at the corner is flickering.",
    request_type: "maintenance",
    status: "pending",
    priority: "normal",
    created_at: new Date().toISOString(),
    is_anonymous: false,
    creator: mockCreator,
    location: {
        name: "Main St. Intersection",
    },
    custom_location_name: null,
}

export const Default: Story = {
    args: {
        request: baseRequest,
    },
}

export const UrgentMaintenance: Story = {
    args: {
        request: {
            ...baseRequest,
            title: "Water Leak in Gym",
            priority: "urgent",
            status: "in_progress",
        },
    },
}

export const EmergencySafety: Story = {
    args: {
        request: {
            ...baseRequest,
            title: "Suspicious Activity",
            request_type: "safety",
            priority: "emergency",
            status: "pending",
        },
    },
}

export const AnonymousComplaint: Story = {
    args: {
        request: {
            ...baseRequest,
            title: "Noise Complaint",
            request_type: "complaint",
            is_anonymous: true,
            creator: null,
        },
    },
}

export const ResolvedQuestion: Story = {
    args: {
        request: {
            ...baseRequest,
            title: "Pool Hours?",
            request_type: "question",
            status: "resolved",
            priority: "normal",
        },
    },
}

export const Rejected: Story = {
    args: {
        request: {
            ...baseRequest,
            status: "rejected",
        },
    },
}
