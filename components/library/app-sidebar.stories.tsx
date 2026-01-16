import type { Meta, StoryObj } from '@storybook/react';
import { AppSidebar } from './app-sidebar';
import { SidebarProvider } from './sidebar';

const meta = {
    title: 'Organisms/Navigation/Sidebar',
    component: AppSidebar,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'The main application sidebar. \n\n**Status**: Used in `dashboard/layout.tsx`.',
            },
        },
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <SidebarProvider>
                <Story />
            </SidebarProvider>
        ),
    ],
} satisfies Meta<typeof AppSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
