import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarProvider, SidebarRail, SidebarTrigger } from './sidebar';

const meta = {
    title: 'Organisms/Layout/SidebarPrimitive',
    component: Sidebar,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Sidebar primitive. \n\n**Status**: **Used** in `app/dashboard/page.tsx` (via SiteHeader? or Layout). \n\n**Note**: This is the ShadCN Sidebar primitive. `AppSidebar` uses this.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <SidebarProvider>
            <div className="flex min-h-screen">
                <Sidebar>
                    <SidebarHeader>Header</SidebarHeader>
                    <SidebarContent>Content</SidebarContent>
                    <SidebarFooter>Footer</SidebarFooter>
                    <SidebarRail />
                </Sidebar>
                <div className="p-4">
                    <SidebarTrigger />
                    Main Content
                </div>
            </div>
        </SidebarProvider>
    ),
};
