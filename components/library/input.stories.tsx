import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';

const meta = {
    title: 'Atoms/Form/StandardInput',
    component: Input,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Input component (Standard ShadCN). \n\n**Status**: **Used** in `login/login-form`. \n\n**CRITICAL WARNING**: This component shadows `components/ui/input` but uses a DIFFERENT implementation. \n- **Library Version**: Standard ShadCN. \n- **UI Version**: Custom Design System with `getInputStateClasses`. \n\n**Action Item**: Consider migrating `login-form` to `components/ui/input`.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        type: 'email',
        placeholder: 'Email',
        className: 'w-[300px]',
    },
};
