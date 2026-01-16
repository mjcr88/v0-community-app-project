import type { Meta, StoryObj } from "@storybook/react"
import { RequestsFilterCards } from "./requests-filter-cards"
import { useState } from "react"

const meta = {
    title: "Molecules/Requests/RequestsFilterCards",
    component: RequestsFilterCards,
    parameters: {
        layout: "padded",
        docs: {
            description: {
                component: "Grid of filter toggle cards used in the Requests dashboard to filter requests by type, status, and priority.\n\n**Used in:** RequestsPageClient (`components/requests/requests-page-client.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
    argTypes: {
        onFilterChange: { action: "onFilterChange" },
    },
} satisfies Meta<typeof RequestsFilterCards>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        activeFilter: null,
        onFilterChange: () => { },
    },
}

export const TypeActive: Story = {
    args: {
        activeFilter: "types",
        onFilterChange: () => { },
    },
}

export const PriorityActive: Story = {
    args: {
        activeFilter: "priority",
        onFilterChange: () => { },
    },
}

export const Interactive = () => {
    const [active, setActive] = useState<any>(null)
    return <RequestsFilterCards activeFilter={active} onFilterChange={setActive} />
}
