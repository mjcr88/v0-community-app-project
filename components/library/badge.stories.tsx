import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

const meta = {
    title: 'Atoms/DataDisplay/Badge',
    component: Badge,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Status badge component. \n\n**Status**: **Used** in `component-inventory` and `test-components`. \n\n**Warning**: Shadows `components/ui/badge`.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'secondary', 'destructive', 'outline'],
        },
    },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'Badge',
        variant: 'default',
    },
};

export const Secondary: Story = {
    args: {
        children: 'Secondary',
        variant: 'secondary',
    },
};
