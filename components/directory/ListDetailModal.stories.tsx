import type { Meta, StoryObj } from "@storybook/react"
import { ListDetailModal } from "./ListDetailModal"

const meta = {
    title: "Directory/ListDetailModal",
    component: ListDetailModal,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof ListDetailModal>

export default meta
type Story = StoryObj<typeof meta>

const mockList = {
    id: "1",
    name: "Pool Buddies",
    emoji: "🏊",
    description: "Neighbors who like to swim in the mornings",
    is_shared: false,
    owner_id: "user1",
    created_at: new Date().toISOString(),
    member_count: 3
}

const mockResidents = [
    { id: "1", first_name: "Alice", last_name: "Smith", avatar_url: "https://i.pravatar.cc/150?u=1" },
    { id: "2", first_name: "Bob", last_name: "Jones", avatar_url: "https://i.pravatar.cc/150?u=2" },
    { id: "3", first_name: "Charlie", last_name: "Brown", avatar_url: "https://i.pravatar.cc/150?u=3" },
    { id: "4", first_name: "Diana", last_name: "Prince", avatar_url: "https://i.pravatar.cc/150?u=4" },
]

export const Default: Story = {
    args: {
        list: mockList,
        open: true,
        allResidents: mockResidents,
        initialMembers: [mockResidents[0], mockResidents[1]]
    },
}

export const Empty: Story = {
    args: {
        list: mockList,
        open: true,
        allResidents: mockResidents,
        initialMembers: []
    },
}
