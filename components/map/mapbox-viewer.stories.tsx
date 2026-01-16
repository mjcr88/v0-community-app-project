
import type { Meta, StoryObj } from "@storybook/react"
import { MapboxFullViewer } from "./MapboxViewer"
import { Toaster } from "@/components/ui/toaster"

// Mock Locations Data
const mockLocations = [
    {
        id: "loc-1",
        name: "Central Park",
        type: "recreational_zone",
        description: "A large green park in the center",
        coordinates: { lat: 9.9567, lng: -84.5333 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        tenant_id: "tenant-1",
        neighborhood: { name: "Downtown" },
    },
    {
        id: "loc-2",
        name: "Community Center",
        type: "facility",
        facility_type: "community_center",
        description: "Main gathering place",
        coordinates: { lat: 9.958, lng: -84.531 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        tenant_id: "tenant-1",
    },
    {
        id: "loc-boundary",
        name: "Community Boundary",
        type: "boundary",
        boundary_coordinates: [
            [9.96, -84.54],
            [9.96, -84.52],
            [9.95, -84.52],
            [9.95, -84.54],
            [9.96, -84.54],
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        tenant_id: "tenant-1",
    },
] as any[]

const meta = {
    title: "Organisms/Map/MapboxFullViewer",
    component: MapboxFullViewer,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "The primary map component using Mapbox GL. It handles displaying locations, check-ins, and user interactions.\n\n**Used in:** CommunityMapClient, EventLocationSection (`dashboard/events/[eventId]/event-location-section.tsx`)\n\n**Note:** This story requires a valid `NEXT_PUBLIC_MAPBOX_TOKEN` in your environment variables to render the map tiles.",
            },
        },
    },
    decorators: [
        (Story) => (
            <div className="h-[600px] w-full relative border rounded-lg overflow-hidden">
                <Toaster />
                <Story />
            </div>
        ),
    ],
    tags: ["autodocs"],
    argTypes: {
        onLocationClick: { action: "locationClicked" },
        onMapClick: { action: "mapClicked" },
        onPoiClick: { action: "poiClicked" },
    },
} satisfies Meta<typeof MapboxFullViewer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        locations: mockLocations,
        checkIns: [],
        tenantId: "tenant-1",
        tenantSlug: "demo-tenant",
        mapCenter: { lat: 9.9567, lng: -84.5333 },
        mapZoom: 14,
    },
}

export const WithSelectedLocation: Story = {
    args: {
        ...Default.args,
        highlightLocationId: "loc-1",
    },
    parameters: {
        docs: {
            description: {
                story: "The map allows programmatically highlighting a location via `highlightLocationId`.",
            },
        },
    },
}

export const MinimalControls: Story = {
    args: {
        ...Default.args,
        showControls: false,
        hideSidebar: true,
    },
    parameters: {
        docs: {
            description: {
                story: "A minimal version suitable for dashboard widgets or small previews.",
            },
        },
    },
}

export const SelectionMode: Story = {
    args: {
        ...Default.args,
        enableSelection: false,
        onMapClick: undefined, // Simulates external handling logic like in LocationSelector
        customMarker: { lat: 9.9567, lng: -84.5333, label: "Selected Spot" },
        showControls: false,
        hideSidebar: true,
    },
    parameters: {
        docs: {
            description: {
                story: "Mode used in `LocationSelector` for choosing a location. Sidebar is hidden, and clicks are handled externally to place a custom marker.",
            },
        },
    },
}

export const DetailPreviewMode: Story = {
    args: {
        ...Default.args,
        enableSelection: false,
        highlightLocationId: "loc-1",
        showControls: false,
        hideSidebar: true,
        disableAutoScroll: true,
        animationDuration: 0,
    },
    parameters: {
        docs: {
            description: {
                story: "Static preview mode used in `EventLocationSection`. No controls, no sidebar, specific location highlighted.",
            },
        },
    },
}
