import type { Meta, StoryObj } from "@storybook/react"
import { ExchangeFilterCards } from "./exchange-filter-cards"
import { useState } from "react"

const meta = {
    title: "Molecules/Exchange/ExchangeFilterCards",
    component: ExchangeFilterCards,
    parameters: {
        layout: "padded",
        docs: {
            description: {
                component: "Grid of filter toggle cards used in the Exchange dashboard to filter listings by category, price, condition, etc.\n\n**Used in:** ExchangePageClient (`app/t/[slug]/dashboard/exchange/exchange-page-client.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
    argTypes: {
        onFilterChange: { action: "onFilterChange" },
    },
} satisfies Meta<typeof ExchangeFilterCards>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        activeFilter: null,
        onFilterChange: () => { },
    },
}

export const CategoryActive: Story = {
    args: {
        activeFilter: "categories",
        onFilterChange: () => { },
    },
}

export const SortActive: Story = {
    args: {
        activeFilter: "sort",
        onFilterChange: () => { },
    },
}

export const Interactive = () => {
    const [active, setActive] = useState<any>(null)
    return <ExchangeFilterCards activeFilter={active} onFilterChange={setActive} />
}
