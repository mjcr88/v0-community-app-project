import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertDescription, AlertTitle } from './alert';

const meta = {
    title: 'Molecules/Feedback/Alert',
    component: Alert,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Alert component using legacy ShadCN implementation. \n\n**Status**: **Used** in `login/login-form`. \n\n**Warning**: Shadows `components/ui/alert`.',
            },
            source: {
                type: 'code',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'destructive'],
        },
    },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <Alert className="w-[400px]" {...args}>
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
                You can add components to your app using the cli.
            </AlertDescription>
        </Alert>
    ),
    args: {
        variant: 'default',
    },
};

export const Destructive: Story = {
    render: (args) => (
        <Alert className="w-[400px]" {...args}>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
                Your session has expired. Please log in again.
            </AlertDescription>
        </Alert>
    ),
    args: {
        variant: 'destructive',
    },
};
