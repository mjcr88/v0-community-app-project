
import type { Meta, StoryObj } from "@storybook/react"
import { ReservationForm } from "./ReservationForm"

const meta = {
    title: "Components/Reservations/ReservationForm",
    component: ReservationForm,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        locationId: { control: "text" },
        tenantSlug: { control: "text" },
    },
} satisfies Meta<typeof ReservationForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        locationId: "loc_123",
        tenantSlug: "demo-tenant",
    },
}

export const InModal: Story = {
    args: {
        locationId: "loc_456",
        tenantSlug: "demo-tenant",
        onCancel: () => console.log("Cancel clicked"),
        onSuccess: () => console.log("Success"),
    },
    decorators: [
        (Story) => (
            <div className="w-[400px] p-6 border rounded-lg shadow-lg bg-background">
                <h2 className="text-lg font-semibold mb-4">Reserve Facility</h2>
                <Story />
            </div>
        ),
    ],
}
