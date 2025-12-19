import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from './slider';

const meta = {
    title: 'Atoms/Form/Slider',
    component: Slider,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Slider component. \n\n**Status**: **Used** in `test-components`. \n\n**Warning**: Shadows `components/ui/slider`.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        defaultValue: [50],
        max: 100,
        step: 1,
        className: "w-[300px]",
    },
};
