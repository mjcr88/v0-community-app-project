import type { Meta, StoryObj } from '@storybook/react';
import { AnimatedBeam } from './animated-beam';
import { useRef } from 'react';

const AnimatedBeamDemo = (args: any) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const fromRef = useRef<HTMLDivElement>(null);
    const toRef = useRef<HTMLDivElement>(null);

    return (
        <div
            className="relative flex h-[200px] w-[400px] items-center justify-between rounded-lg border bg-background p-10 shadow-sm"
            ref={containerRef}
        >
            <div
                ref={fromRef}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200"
            >
                A
            </div>
            <div
                ref={toRef}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200"
            >
                B
            </div>
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={fromRef}
                toRef={toRef}
                {...args}
            />
        </div>
    );
};

const meta = {
    title: 'Atoms/Visuals/AnimatedBeam',
    component: AnimatedBeam,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Animated beam connecting two elements. \n\n**Status**: Unused (orphaned in library).',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof AnimatedBeam>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => <AnimatedBeamDemo {...args} />,
    args: {},
};
