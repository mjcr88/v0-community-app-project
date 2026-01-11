import type { Meta, StoryObj } from "@storybook/react"
import { ListCard } from "./ListCard"

const meta = {
    title: "Directory/ListCard",
    component: ListCard,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        onClick: { action: "clicked" },
    },
} satisfies Meta<typeof ListCard>

export default meta
type Story = StoryObj<typeof meta>

// Mock data
const mockMembers = [
    { id: "1", first_name: "Alice", last_name: "Smith", avatar_url: "https://i.pravatar.cc/150?u=1" },
    { id: "2", first_name: "Bob", last_name: "Jones", avatar_url: "https://i.pravatar.cc/150?u=2" },
    { id: "3", first_name: "Charlie", last_name: "Brown", avatar_url: "https://i.pravatar.cc/150?u=3" },
    { id: "4", first_name: "Diana", last_name: "Prince", avatar_url: "https://i.pravatar.cc/150?u=4" },
    { id: "5", first_name: "Evan", last_name: "Wright", avatar_url: "https://i.pravatar.cc/150?u=5" },
    { id: "6", first_name: "Frank", last_name: "Castle", avatar_url: "https://i.pravatar.cc/150?u=6" },
]

export const Default: Story = {
    args: {
        list: {
            id: "1",
            name: "Pool Buddies",
            emoji: "🏊",
            description: "Neighbors who like to swim in the mornings",
            is_shared: false,
            owner_id: "user1",
            created_at: new Date().toISOString(),
            member_count: 3,
            members: mockMembers.slice(0, 3)
        },
    },
}

export const Shared: Story = {
    args: {
        list: {
            id: "2",
            name: "Family Friends",
            emoji: "👨‍👩‍👧‍👦",
            description: "Close friends of the family",
            is_shared: true,
            owner_id: "user1",
            created_at: new Date().toISOString(),
            member_count: 8,
            members: mockMembers // Shows overlap behavior
        },
    },
}

export const Empty: Story = {
    args: {
        list: {
            id: "3",
            name: "New Project",
            emoji: "🚀",
            description: null,
            is_shared: false,
            owner_id: "user1",
            created_at: new Date().toISOString(),
            member_count: 0,
            members: []
        },
    },
}
