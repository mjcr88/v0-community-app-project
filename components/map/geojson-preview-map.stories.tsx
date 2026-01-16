
import type { Meta, StoryObj } from "@storybook/react"
import { GeoJSONPreviewMap } from "./geojson-preview-map"
import { Toaster } from "@/components/ui/toaster"

const meta = {
    title: "Organisms/Map/GeoJSONPreviewMap",
    component: GeoJSONPreviewMap,
    parameters: {
        layout: "fullscreen",
        nextjs: {
            appDirectory: true,
        },
        docs: {
            description: {
                component: "A specialized map for previewing GeoJSON data before import. Relies on `sessionStorage` for data, which this story mocks.\n\n**Used in:** Admin Location Creation Page (`app/t/[slug]/admin/map/locations/create/page.tsx`)",
            },
        },
    },
    decorators: [
        (Story) => (
            <div className="h-[800px] w-full relative">
                <Toaster />
                <Story />
            </div>
        ),
    ],
    tags: ["autodocs"],
} satisfies Meta<typeof GeoJSONPreviewMap>

export default meta
type Story = StoryObj<typeof meta>

// Mock data to be injected into sessionStorage
const mockGeoJSON = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [-84.5333, 9.9567],
            },
            properties: {
                name: "Test Location",
            },
        },
    ],
}

export const Default: Story = {
    args: {
        tenantSlug: "demo-tenant",
        tenantId: "tenant-123",
    },
    loaders: [
        async () => {
            sessionStorage.setItem("geojson-preview", JSON.stringify(mockGeoJSON))
        },
    ],
}

export const NoData: Story = {
    args: {
        ...Default.args,
    },
    loaders: [
        async () => {
            sessionStorage.removeItem("geojson-preview")
        },
    ],
    parameters: {
        docs: {
            description: {
                story: "If no data exists in session storage, it should redirect (simulated/warned here).",
            },
        },
    },
}
