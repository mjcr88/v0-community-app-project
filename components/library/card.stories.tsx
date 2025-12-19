import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from './button';

const meta = {
    title: 'Molecules/Cards/StandardCard',
    component: Card,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Standard ShadCN Card. \n\n**Status**: **Used** in `component-inventory`, `test-cultui`, `test-components`. \n\n**Warning**: Shadows `components/ui/card`.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <Card className="w-[350px]" {...args}>
            <CardHeader>
                <CardTitle>Create project</CardTitle>
                <CardDescription>Deploy your new project in one-click.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Your project has been created.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button>Deploy</Button>
            </CardFooter>
        </Card>
    ),
    args: {},
};
