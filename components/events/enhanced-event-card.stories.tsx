
import type { Meta, StoryObj } from "@storybook/react"
import { EnhancedEventCard } from "./enhanced-event-card"
import { CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

const meta = {
    title: "Molecules/Events/EnhancedEventCard",
    component: EnhancedEventCard,
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component: "A card component for displaying event details, including date, title, description, and status badges.\n\n**Used in:** EventsList (`app/t/[slug]/dashboard/events/events-list.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
    argTypes: {
        isPriority: { control: "boolean" },
        isCancelled: { control: "boolean" },
    },
} satisfies Meta<typeof EnhancedEventCard>

export default meta
type Story = StoryObj<typeof meta>

const SampleContent = () => (
    <>
        <CardHeader>
            <CardTitle>Community Potluck</CardTitle>
            <CardDescription>A fun gathering for everyone!</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Tomorrow at 6:00 PM</span>
            </div>
            <div className="mt-4 flex gap-2">
                <Badge>Social</Badge>
                <Badge variant="outline">Free</Badge>
            </div>
        </CardContent>
    </>
)

export const Default: Story = {
    args: {
        eventDate: new Date().toISOString(),
        children: <SampleContent />,
    },
}

export const Priority: Story = {
    args: {
        eventDate: new Date().toISOString(),
        isPriority: true,
        children: <SampleContent />,
    },
}

export const Cancelled: Story = {
    args: {
        eventDate: new Date().toISOString(),
        isCancelled: true,
        children: <SampleContent />,
    },
}
