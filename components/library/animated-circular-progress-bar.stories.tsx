import type { Meta, StoryObj } from '@storybook/react';
import { AnimatedCircularProgressBar } from './animated-circular-progress-bar';

const meta = {
    title: 'Atoms/Visuals/AnimatedCircularProgressBar',
    component: AnimatedCircularProgressBar,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Circular progress bar with animation. \n\n**Status**: Unused (orphaned in library).',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        gaugePrimaryColor: { control: 'color' },
        gaugeSecondaryColor: { control: 'color' },
    },
} satisfies Meta<typeof AnimatedCircularProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        value: 65,
        min: 0,
        max: 100,
        gaugePrimaryColor: '#000000',
        gaugeSecondaryColor: 'rgba(0, 0, 0, 0.1)',
    },
};
