import type { Meta, StoryObj } from '@storybook/react';
import { SearchForm } from './search-form';
import { Sidebar } from './sidebar';
import { SidebarProvider } from './sidebar';

const meta = {
    title: 'Molecules/Form/SearchForm',
    component: SearchForm,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Search form for Sidebar. \n\n**Status**: Unused (orphaned in library).',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof SearchForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// SearchForm likely requires Sidebar context
export const Default: Story = {
    render: (args) => (
        <SidebarProvider>
            <div className="w-[300px] p-4 border rounded">
                <SearchForm {...args} />
            </div>
        </SidebarProvider>
    ),
    args: {},
};
