import type { Meta, StoryObj } from '@storybook/react';
import { Calendar } from './calendar';

const meta = {
    title: 'Molecules/Date/Calendar',
    component: Calendar,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Calendar component. \n\n**Status**: **Used** in `test-components`. \n\n**Warning**: Shadows `components/ui/calendar`.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        mode: 'single',
        selected: new Date(),
        className: "rounded-md border",
    },
};
