import type { Meta, StoryObj } from '@storybook/react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible';
import { Button } from './button'; // Using library button for consistency

const meta = {
    title: 'Molecules/Disclosure/Collapsible',
    component: Collapsible,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Interactive collapsible element. \n\n**Status**: Unused (orphaned in library). Shadows `components/ui/collapsible`.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <Collapsible className="w-[350px] space-y-2" {...args}>
            <div className="flex items-center justify-between space-x-4 px-4">
                <h4 className="text-sm font-semibold">
                    @peduarte starred 3 repositories
                </h4>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                        Toggle
                    </Button>
                </CollapsibleTrigger>
            </div>
            <div className="rounded-md border px-4 py-3 font-mono text-sm">
                @radix-ui/primitives
            </div>
            <CollapsibleContent className="space-y-2">
                <div className="rounded-md border px-4 py-3 font-mono text-sm">
                    @radix-ui/colors
                </div>
                <div className="rounded-md border px-4 py-3 font-mono text-sm">
                    @stitches/react
                </div>
            </CollapsibleContent>
        </Collapsible>
    ),
};
