
import type { Meta, StoryObj } from "@storybook/react"
import { GeoJSONUploadButton } from "./geojson-upload-button"
import { Toaster } from "sonner"

const meta = {
    title: "Molecules/Map/GeoJSONUploadButton",
    component: GeoJSONUploadButton,
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component: "A button that opens a dialog to upload GeoJSON files for bulk location creation.\n\n**Used in:** Admin Map Page (`app/t/[slug]/admin/map/page.tsx`)",
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
} satisfies Meta<typeof GeoJSONUploadButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        tenantId: "tenant-123",
        tenantSlug: "demo-tenant",
    },
}
