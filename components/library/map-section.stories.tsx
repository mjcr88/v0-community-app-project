import type { Meta, StoryObj } from '@storybook/react';
import { MapSectionLazy } from '@/components/dashboard/map-section-lazy';

const meta = {
    title: 'Organisms/Dashboard/MapSection',
    component: MapSectionLazy,
    parameters: {
        layout: 'padded',
        nextjs: {
            appDirectory: true,
        },
        docs: {
            description: {
                component: 'Interactive Mapbox community map showing locations and check-ins. Displays user\'s lot, neighborhood, and community locations. \n\n**Status**: Used on dashboard\n\n**Pages**: `/dashboard` (Explore section, shown when map enabled)\n\n**Note**: Requires authenticated API to fetch locations. Will show loading/error state in Storybook. View at `http://localhost:3000/t/ecovilla-san-mateo/dashboard`',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof MapSectionLazy>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        tenantSlug: 'ecovilla-san-mateo',
        tenantId: '1',
        lotLocationId: '1',
        mapCenter: { lat: 9.9281, lng: -84.0907 },
        checkIns: [],
        neighborhoodName: 'Example Neighborhood',
        lotNumber: '123',
    },
    render: (args) => (
        <div className="h-[600px]">
            <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-sm mb-4 rounded-lg">
                ⚠️ This component requires authentication to fetch map data. Visit the live dashboard to see it in action.
            </div>
            <MapSectionLazy {...args} />
        </div>
    ),
};
