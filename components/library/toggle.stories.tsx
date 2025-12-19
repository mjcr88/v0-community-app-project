import type { Meta, StoryObj } from '@storybook/react';
import { Toggle } from './toggle';
import { Bold } from "lucide-react"

const meta = {
    title: 'Atoms/Button/Toggle',
    component: Toggle,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Toggle button. \n\n**Status**: Unused (orphaned in library). Shadows `components/ui/toggle`.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <Toggle aria-label="Toggle bold" {...args}>
            <Bold className="h-4 w-4" />
        </Toggle>
    ),
    args: {},
};
