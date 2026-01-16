
import type { Meta, StoryObj } from "@storybook/react"
import { CommunityMapClient } from "../../app/t/[slug]/dashboard/community-map/community-map-client"
import { Toaster } from "@/components/ui/toaster"

const mockLocations = [
    {
        id: "loc-1",
        name: "Yoga Pavilion",
        type: "facility",
        facility_type: "yoga",
        description: "Open air yoga space",
        icon: "🧘",
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
        icon: "🏡",
        path_coordinates: [[9.95, -84.53], [9.951, -84.531], [9.952, -84.53]],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        tenant_id: "tenant-1",
        neighborhood: { name: "Riverside" },
    },
] as any[]

const mockCounts = {
    facilities: 5,
    lots: 120,
    neighborhoods: 3,
    walkingPaths: 8,
    protectionZones: 2,
    easements: 4,
    playgrounds: 1,
    publicStreets: 15,
    greenAreas: 6,
    recreationalZones: 2,
}

const meta = {
    title: "Organisms/Map/CommunityMapClient",
    component: CommunityMapClient,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: "The map interface for residents. Includes a side-by-side layout on desktop and a search overlay on mobile.\n\n**Used in:** Dashboard Community Map Page (`app/t/[slug]/dashboard/community-map/page.tsx`)",
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
} satisfies Meta<typeof CommunityMapClient>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        slug: "demo-community",
        tenantId: "tenant-123",
        locations: mockLocations,
        counts: mockCounts,
        checkIns: [],
        mapCenter: { lat: 9.9567, lng: -84.5333 },
        mapZoom: 14,
    },
}

export const FilteredByType: Story = {
    args: {
        ...Default.args,
        initialTypeFilter: "facility",
    },
    parameters: {
        docs: {
            description: {
                story: "The map can start with a specific type filter applied via URL params.",
            },
        },
    },
}
