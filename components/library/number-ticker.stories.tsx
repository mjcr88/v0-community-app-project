import type { Meta, StoryObj } from '@storybook/react';
import { NumberTicker } from './number-ticker';

const meta = {
    title: 'Atoms/Visuals/NumberTicker',
    component: NumberTicker,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Animated number ticking effect. \n\n**Status**: Unused (orphaned in library).',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof NumberTicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <p className="whitespace-pre-wrap text-8xl font-medium tracking-tighter text-black dark:text-white">
            <NumberTicker {...args} />
        </p>
    ),
    args: {
        value: 100,
    },
};
