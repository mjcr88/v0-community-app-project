
import type { Meta, StoryObj } from "@storybook/react"
import AdminMapClient from "../../app/t/[slug]/admin/map/viewer/admin-map-client"
import { Toaster } from "@/components/ui/toaster"

// Reuse same mock data pattern
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
    title: "Organisms/Map/AdminMapClient",
    component: AdminMapClient,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: "The main map interface for administrators. It wraps the viewer with admin-specific controls and sidebar logic.\n\n**Used in:** Admin Map Wrapper (`app/t/[slug]/admin/map/viewer/admin-map-wrapper.tsx`)",
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
} satisfies Meta<typeof AdminMapClient>

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

export const MinimalDashboardView: Story = {
    args: {
        ...Default.args,
        minimal: true,
        className: "h-[400px]",
    },
    parameters: {
        docs: {
            description: {
                story: "The `minimal` prop simplifies the UI, hiding sidebars and search, perfect for embedding in dashboards.",
            },
        },
    },
}
