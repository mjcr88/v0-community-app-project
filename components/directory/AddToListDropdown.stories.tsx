import type { Meta, StoryObj } from "@storybook/react"
import { AddToListDropdown } from "./AddToListDropdown"

const meta = {
    title: "Directory/AddToListDropdown",
    component: AddToListDropdown,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof AddToListDropdown>

export default meta
type Story = StoryObj<typeof meta>

// Mock Lists
const mockLists = [
    {
        id: "1",
        name: "Pool Buddies",
        emoji: "🏊",
        description: "Swimmers",
        is_shared: false,
        owner_id: "user1",
        created_at: "",
        member_count: 5
    },
    {
        id: "2",
        name: "Book Club",
        emoji: "📚",
        description: "Weekly reading",
        is_shared: true,
        owner_id: "user1",
        created_at: "",
        member_count: 12
    }
]

export const Default: Story = {
    args: {
        neighborId: "n1",
        tenantId: "t1",
        lists: mockLists,
    },
}

export const CustomTrigger: Story = {
    args: {
        neighborId: "n1",
        tenantId: "t1",
        lists: mockLists,
        trigger: <button className="bg-primary text-primary-foreground px-3 py-1 rounded">Add to List</button>
    },
}
