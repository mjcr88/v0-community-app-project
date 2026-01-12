import type { Meta, StoryObj } from "@storybook/react"
import { EmojiPicker } from "./emoji-picker"

const meta = {
    title: "UI/EmojiPicker",
    component: EmojiPicker,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        onEmojiSelect: { action: "selected" },
    },
} satisfies Meta<typeof EmojiPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        selectedEmoji: "😊",
    },
}

export const WithCustomTrigger: Story = {
    args: {
        selectedEmoji: "🎉",
        trigger: <button className="px-4 py-2 bg-blue-500 text-white rounded">Click me</button>,
    },
}

export const NoSelection: Story = {
    args: {},
}
