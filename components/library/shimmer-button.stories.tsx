import type { Meta, StoryObj } from '@storybook/react';
import { ShimmerButton } from './shimmer-button';

const meta = {
    title: 'Atoms/Button/Shimmer',
    component: ShimmerButton,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Button with a shimmer border effect. \n\n**Status**: Unused (orphaned in library).',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ShimmerButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'Shimmer Action',
    },
    render: (args) => (
        <div className="bg-black p-8 rounded-lg">
            <ShimmerButton {...args} />
        </div>
    )
};
