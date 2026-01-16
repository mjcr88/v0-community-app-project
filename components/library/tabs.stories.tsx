import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta = {
    title: 'Molecules/Navigation/Tabs',
    component: Tabs,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Tabs component. \n\n**Status**: **Used** in `test-components`. \n\n**Warning**: Shadows `components/ui/tabs`.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <Tabs defaultValue="account" className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
                <div className="p-4 border rounded-b-md">Account changes here.</div>
            </TabsContent>
            <TabsContent value="password">
                <div className="p-4 border rounded-b-md">Password changes here.</div>
            </TabsContent>
        </Tabs>
    ),
};
