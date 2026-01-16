import type { Meta, StoryObj } from '@storybook/react';
import { MyListingsAndTransactionsWidget } from '@/components/exchange/my-listings-and-transactions-widget';

const meta = {
    title: 'Organisms/Dashboard/ExchangeWidget',
    component: MyListingsAndTransactionsWidget,
    parameters: {
        layout: 'padded',
        nextjs: {
            appDirectory: true,
        },
        docs: {
            description: {
                component: 'Complex tabbed widget for managing exchange listings and transactions. Features 3 top-level tabs (Listings, Transactions, Archive) with nested tabs for listing filters (All, Published, Drafts, Paused). Includes inline actions for pause/resume, edit, delete, and archive. \n\n**Status**: Used on dashboard\n\n**Pages**: `/dashboard` (Explore section, shown when exchange enabled)\n\n**Sub-components**:\n- Listings tab with filter tabs (All, Published, Drafts, Paused)\n- Transactions tab (from/to user, status tracking)\n- Archive tab (archived listings + completed transactions)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof MyListingsAndTransactionsWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockListings = [
    {
        id: '1',
        title: 'Garden Tools Set',
        status: 'published' as const,
        is_available: true,
        pricing_type: 'free' as const,
        price: null,
        photos: ['/placeholder.svg'],
        hero_photo: '/placeholder.svg',
        available_quantity: 1,
        category: { id: '1', name: 'Tools & Equipment' },
        location: { id: '1', name: 'Community Shed' },
        created_at: '2024-01-01T00:00:00Z',
        published_at: '2024-01-02T00:00:00Z',
        archived_at: null,
    },
    {
        id: '2',
        title: 'Kids Bicycle',
        status: 'draft' as const,
        is_available: false,
        pricing_type: 'negotiable' as const,
        price: null,
        photos: [],
        hero_photo: null,
        available_quantity: 1,
        category: { id: '2', name: 'Sports & Recreation' },
        location: null,
        created_at: '2024-01-03T00:00:00Z',
        published_at: null,
        archived_at: null,
    },
];

const mockTransactions = [
    {
        id: '1',
        status: 'confirmed' as const,
        listing: {
            id: '1',
            title: 'Ladder',
            hero_photo: null,
        },
        from_user: {
            id: '1',
            first_name: 'John',
            last_name: 'Doe',
            profile_picture_url: null,
        },
        to_user: {
            id: '2',
            first_name: 'Jane',
            last_name: 'Smith',
            profile_picture_url: null,
        },
        created_at: '2024-01-10T00:00:00Z',
        confirmed_at: '2024-01-11T00:00:00Z',
        picked_up_at: null,
        returned_at: null,
        completed_at: null,
    },
];

export const WithListings: Story = {
    args: {
        listings: mockListings,
        transactions: mockTransactions,
        tenantSlug: 'example-community',
        tenantId: '1',
        userId: '1',
        categories: [
            { id: '1', name: 'Tools & Equipment' },
            { id: '2', name: 'Sports & Recreation' },
        ],
        neighborhoods: [{ id: '1', name: 'North Village' }],
        locations: [],
    },
};

export const EmptyState: Story = {
    args: {
        listings: [],
        transactions: [],
        tenantSlug: 'example-community',
        tenantId: '1',
        userId: '1',
        categories: [],
        neighborhoods: [],
        locations: [],
    },
};
