import type { Meta, StoryObj } from "@storybook/react"
import { RequestsPageClient } from "./requests-page-client"
import { MockNextNavigation, WithRioFeedback } from "@/components/exchange/storybook-decorators"

const meta = {
    title: "Organisms/Requests/RequestsPageClient",
    component: RequestsPageClient,
    decorators: [MockNextNavigation, WithRioFeedback],
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: "The main client component for the Requests Dashboard. Handles searching, filtering, and displaying request cards.\n\n**Used in:** Requests Page (`app/t/[slug]/dashboard/requests/page.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
    argTypes: {
    },
} satisfies Meta<typeof RequestsPageClient>

export default meta
type Story = StoryObj<typeof meta>

const mockCreator = {
    id: "user-1",
    first_name: "Jane",
    last_name: "Doe",
    profile_picture_url: "https://i.pravatar.cc/150?u=user-1",
}

const mockRequests = Array.from({ length: 8 }).map((_, i) => ({
    id: `req-${i}`,
    title: `Request ${i + 1} - ${i % 2 === 0 ? "Maintenance Needed" : "Question regarding policy"}`,
    description: "This is a detailed description of the request. It outlines the issue or question in depth.",
    request_type: i % 4 === 0 ? "maintenance" : i % 4 === 1 ? "question" : i % 4 === 2 ? "complaint" : "safety",
    status: i % 3 === 0 ? "pending" : i % 3 === 1 ? "in_progress" : "resolved",
    priority: i % 5 === 0 ? "urgent" : i % 10 === 0 ? "emergency" : "normal",
    created_at: new Date().toISOString(),
    is_anonymous: false,
    creator: mockCreator,
    location: { name: "Community Hall" },
    tenant_id: "tenant-1",
})) as any[]

export const Default: Story = {
    args: {
        tenantSlug: "demo-community",
        requests: mockRequests,
    },
}

export const Empty: Story = {
    args: {
        tenantSlug: "demo-community",
        requests: [],
    },
}
