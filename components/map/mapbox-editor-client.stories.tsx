
import type { Meta, StoryObj } from "@storybook/react"
import { MapboxEditorClient } from "./MapboxEditorClient"
import { Toaster } from "@/components/ui/toaster"

const mockLocations = [
    {
        id: "loc-1",
        name: "Yoga Pavilion",
        type: "facility",
        facility_type: "yoga",
        description: "Open air yoga space",
        coordinates: { lat: 9.9567, lng: -84.5333 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        tenant_id: "tenant-1",
    },
    {
        id: "loc-2",
        name: "Lot 42",
        type: "lot",
        description: "Residential lot",
        path_coordinates: [[9.95, -84.53], [9.951, -84.531], [9.952, -84.53]],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        tenant_id: "tenant-1",
    },
] as any[]

const mockLots = [
    {
        id: "lot-1",
        lot_number: "C-349",
        address: "Central 349",
        neighborhoods: { name: "Ceiba" },
    },
]

const meta = {
    title: "Organisms/Map/MapboxEditorClient",
    component: MapboxEditorClient,
    parameters: {
        layout: "fullscreen",
        nextjs: {
            appDirectory: true,
        },
        docs: {
            description: {
                component: "The main map editor for creating and updating locations. Includes drawing tools and a sidebar form.\n\n**Used in:** Admin Location Creation Page (`app/t/[slug]/admin/map/locations/create/page.tsx`)",
            },
        },
    },
    decorators: [
        (Story) => (
            <div className="h-screen w-full relative">
                <Toaster />
                <Story />
            </div>
        ),
    ],
    tags: ["autodocs"],
} satisfies Meta<typeof MapboxEditorClient>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        locations: mockLocations,
        lots: mockLots,
        tenantId: "tenant-123",
        tenantSlug: "demo-tenant",
        mapCenter: { lat: 9.9567, lng: -84.5333 },
        mapZoom: 14,
    },
}

export const DrawModeEnabled: Story = {
    args: {
        ...Default.args,
    },
    play: async ({ canvasElement }) => {
        // We can't easily click the map to start drawing in a static story,
        // but this story serves as the base for testing drawing interactions.
        // The DrawingToolbar is visible by default.
    },
    parameters: {
        docs: {
            description: {
                story: "The editor with the drawing toolbar visible. Users can select Point, Line, or Polygon modes.",
            },
        },
    },
}
