
import type { Meta, StoryObj } from "@storybook/react"
import { NeighborhoodMultiSelect } from "./neighborhood-multi-select"
import { useState } from "react"

const meta = {
    title: "Molecules/Event Forms/NeighborhoodMultiSelect",
    component: NeighborhoodMultiSelect,
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component: "A multi-select component for choosing neighborhoods.\n\n**Used in:** EventForm (`event-form.tsx`), AnnouncementForm (`announcement-form.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
} satisfies Meta<typeof NeighborhoodMultiSelect>

export default meta
type Story = StoryObj<typeof meta>

const mockNeighborhoods = [
    { id: "1", name: "North Village", description: "Quiet residential area" },
    { id: "2", name: "Downtown", description: "City center and shops" },
    { id: "3", name: "Lakeside", description: "Scenic views" },
]

export const Default: Story = {
    args: {
        tenantId: "tenant-1",
        selectedNeighborhoodIds: [],
        initialNeighborhoods: mockNeighborhoods,
        onChange: () => { },
    },
    render: function Render(args) {
        const [selected, setSelected] = useState(args.selectedNeighborhoodIds)
        return <NeighborhoodMultiSelect {...args} selectedNeighborhoodIds={selected} onChange={setSelected} />
    },
}

export const WithSelection: Story = {
    args: {
        tenantId: "tenant-1",
        selectedNeighborhoodIds: ["1", "3"],
        initialNeighborhoods: mockNeighborhoods,
        onChange: () => { },
    },
    render: function Render(args) {
        const [selected, setSelected] = useState(args.selectedNeighborhoodIds)
        return <NeighborhoodMultiSelect {...args} selectedNeighborhoodIds={selected} onChange={setSelected} />
    },
}
