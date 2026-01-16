import type { Meta, StoryObj } from '@storybook/react';
import { MapPreviewWidget } from '@/components/map/map-preview-widget';

const meta = {
    title: 'Organisms/Map/MapPreviewWidget',
    component: MapPreviewWidget,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Interactive map preview widget showing community locations. Displays Mapbox map with location markers, highlights specific locations, and supports customization options (hide sidebar, header, disable auto-scroll). \n\n**Status**: Map visualization component\n\n**Pages**: `/dashboard/families/[id]`, `/dashboard/neighbours/[id]` (location section)\n\n**Note**: Requires Mapbox API access and location data. Will show error state in Storybook without proper configuration.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof MapPreviewWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockLocations = [
    {
        id: '1',
        name: 'Lot D 401',
        type: 'lot',
        coordinates: { lat: 9.8734, lng: -83.9876 },
        lot_id: '1',
    },
    {
        id: '2',
        name: 'Community Center',
        type: 'community',
        coordinates: { lat: 9.8735, lng: -83.9875 },
        lot_id: null,
    },
    {
        id: '3',
        name: 'Garden Area',
        type: 'community',
        coordinates: { lat: 9.8736, lng: -83.9877 },
        lot_id: null,
    },
];

const mockMapCenter = {
    lat: 9.8735,
    lng: -83.9876,
};

export const Default: Story = {
    args: {
        tenantSlug: 'example-community',
        tenantId: '1',
        locations: mockLocations,
        mapCenter: mockMapCenter,
    },
};

export const WithHighlight: Story = {
    args: {
        tenantSlug: 'example-community',
        tenantId: '1',
        locations: mockLocations,
        mapCenter: mockMapCenter,
        highlightLocationId: '1',
    },
};

export const NoSidebar: Story = {
    args: {
        tenantSlug: 'example-community',
        tenantId: '1',
        locations: mockLocations,
        mapCenter: mockMapCenter,
        highlightLocationId: '1',
        hideSidebar: true,
    },
};

export const NoHeader: Story = {
    args: {
        tenantSlug: 'example-community',
        tenantId: '1',
        locations: mockLocations,
        mapCenter: mockMapCenter,
        highlightLocationId: '1',
        hideHeader: true,
    },
};

export const MinimalView: Story = {
    args: {
        tenantSlug: 'example-community',
        tenantId: '1',
        locations: mockLocations,
        mapCenter: mockMapCenter,
        highlightLocationId: '1',
        hideSidebar: true,
        hideHeader: true,
        disableAutoScroll: true,
    },
};
