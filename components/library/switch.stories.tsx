import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './switch';
import { Label } from './label';

const meta = {
    title: 'Atoms/Form/Switch',
    component: Switch,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Switch toggle. \n\n**Status**: **Used** in `test-components`. \n\n**Warning**: Shadows `components/ui/switch`.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <div className="flex items-center space-x-2">
            <Switch id="airplane-mode" {...args} />
            <Label htmlFor="airplane-mode">Airplane Mode</Label>
        </div>
    ),
    args: {},
};
