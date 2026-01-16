import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './label';

const meta = {
    title: 'Atoms/Form/Label',
    component: Label,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Label component. \n\n**Status**: **Used** in `login/login-form`. \n\n**Warning**: Shadows `components/ui/label`.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'Accept terms',
        htmlFor: 'terms',
    },
};
