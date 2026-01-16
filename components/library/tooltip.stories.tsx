import type { Meta, StoryObj } from '@storybook/react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from './tooltip';
import { Button } from './button';

const meta = {
    title: 'Atoms/Overlay/Tooltip',
    component: Tooltip,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Tooltip component. \n\n**Status**: Unused (orphaned in library). Shadows `components/ui/tooltip`.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline">Hover</Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Add to library</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    ),
};
