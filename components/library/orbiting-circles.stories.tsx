import type { Meta, StoryObj } from '@storybook/react';
import { OrbitingCircles } from './orbiting-circles';

const meta = {
    title: 'Atoms/Visuals/OrbitingCircles',
    component: OrbitingCircles,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Circles orbiting a central point. \n\n**Status**: Unused (orphaned in library).',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof OrbitingCircles>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <div className="relative flex h-[300px] w-[300px] flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl">
            <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300 bg-clip-text text-center text-4xl font-semibold leading-none text-transparent dark:from-white dark:to-black">
                Center
            </span>
            <OrbitingCircles
                className="size-[30px] border-none bg-transparent"
                duration={20}
                delay={20}
                radius={80}
                {...args}
            >
                <div className="h-4 w-4 rounded-full bg-blue-500" />
            </OrbitingCircles>
            <OrbitingCircles
                className="size-[30px] border-none bg-transparent"
                duration={20}
                delay={10}
                radius={80}
                {...args}
            >
                <div className="h-4 w-4 rounded-full bg-red-500" />
            </OrbitingCircles>
            {/* Outer Circles (reverse) */}
            <OrbitingCircles
                className="size-[50px] border-none bg-transparent"
                radius={140}
                duration={20}
                reverse
                {...args}
            >
                <div className="h-4 w-4 rounded-full bg-green-500" />
            </OrbitingCircles>
        </div>
    ),
    args: {
        iconSize: 40,
    },
};
