import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta = {
    title: 'Atoms/Button/StandardButton',
    component: Button,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Standard ShadCN Button. \n\n**Status**: **Used** in `login-form` and `test-components`. \n\n**Warning**: Shadows `components/ui/button` but with different implementation.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
        },
        size: {
            control: 'select',
            options: ['default', 'sm', 'lg', 'icon'],
        },
    },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'Button',
        variant: 'default',
        size: 'default',
    },
};

export const Outline: Story = {
    args: {
        children: 'Outline',
        variant: 'outline',
    },
};
