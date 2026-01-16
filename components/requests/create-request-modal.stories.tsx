import type { Meta, StoryObj } from "@storybook/react"
import { CreateRequestModal } from "./create-request-modal"
import { MockNextNavigation, WithRioFeedback } from "@/components/exchange/storybook-decorators"

const meta = {
    title: "Organisms/Requests/CreateRequestModal",
    component: CreateRequestModal,
    decorators: [MockNextNavigation, WithRioFeedback],
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: "A multi-step modal for creating new community requests (maintenance, complaints, etc.).\n\n**Used in:** RequestsPage (`app/t/[slug]/dashboard/requests/page.tsx`), CreateRequestModalWrapper (`components/requests/create-request-modal-wrapper.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
    argTypes: {
        onOpenChange: { action: "onOpenChange" },
    },
} satisfies Meta<typeof CreateRequestModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        open: true,
        tenantSlug: "demo-community",
        tenantId: "tenant-1",
        onOpenChange: () => { },
    },
}

export const MaintenancePreselected: Story = {
    args: {
        ...Default.args,
        defaultType: "maintenance",
    },
}
