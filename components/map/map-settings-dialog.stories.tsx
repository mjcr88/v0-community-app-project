
import type { Meta, StoryObj } from "@storybook/react"
import { MapSettingsDialog } from "../../app/t/[slug]/admin/map/map-settings-dialog"
import { Toaster } from "sonner"

const meta = {
    title: "Molecules/Map/MapSettingsDialog",
    component: MapSettingsDialog,
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component: "A dialog for configuring the default map center coordinates and zoom level.\n\n**Used in:** Admin Map Page (`app/t/[slug]/admin/map/page.tsx`)",
            },
        },
    },
    decorators: [
        (Story) => (
            <>
                <Toaster />
                <Story />
            </>
        ),
    ],
    tags: ["autodocs"],
} satisfies Meta<typeof MapSettingsDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        tenantId: "tenant-123",
        currentCenter: null,
        currentZoom: null,
    },
}

export const WithExistingSettings: Story = {
    args: {
        tenantId: "tenant-123",
        currentCenter: { lat: 9.9567, lng: -84.5333 },
        currentZoom: 16,
    },
    parameters: {
        docs: {
            description: {
                story: "The dialog pre-filled with existing latitude, longitude, and zoom values.",
            },
        },
    },
}
