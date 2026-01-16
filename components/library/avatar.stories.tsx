import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

const meta = {
    title: 'Atoms/DataDisplay/Avatar',
    component: Avatar,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Avatar image component. \n\n**Status**: **Used** in `test-components`. \n\n**Warning**: Shadows `components/ui/avatar`.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <Avatar {...args}>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
        </Avatar>
    ),
    args: {},
};
