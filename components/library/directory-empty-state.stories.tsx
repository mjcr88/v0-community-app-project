import type { Meta, StoryObj } from '@storybook/react';
import { DirectoryEmptyState } from '@/components/directory/DirectoryEmptyState';

const meta = {
    title: 'Organisms/Directory/DirectoryEmptyState',
    component: DirectoryEmptyState,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Empty state for directory with Rio mascot. Shows different messages for residents vs families, and with/without active filters. Includes clear filters/search actions. \n\n**Status**: Core directory component\n\n**Pages**: `/dashboard/neighbours` (shown when no results)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof DirectoryEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ResidentsNoFilters: Story = {
    args: {
        type: 'residents',
        hasActiveFilters: false,
        onClearFilters: () => console.log('Clear filters'),
        onClearSearch: () => console.log('Clear search'),
    },
};

export const ResidentsWithFilters: Story = {
    args: {
        type: 'residents',
        hasActiveFilters: true,
        onClearFilters: () => console.log('Clear filters'),
        onClearSearch: () => console.log('Clear search'),
    },
};

export const FamiliesNoFilters: Story = {
    args: {
        type: 'families',
        hasActiveFilters: false,
        onClearFilters: () => console.log('Clear filters'),
        onClearSearch: () => console.log('Clear search'),
    },
};

export const FamiliesWithFilters: Story = {
    args: {
        type: 'families',
        hasActiveFilters: true,
        onClearFilters: () => console.log('Clear filters'),
        onClearSearch: () => console.log('Clear search'),
    },
};
