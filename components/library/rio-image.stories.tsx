import type { Meta, StoryObj } from '@storybook/react';
import { RioImage } from './rio-image';

const meta = {
    title: 'Atoms/Media/RioImage',
    component: RioImage,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Custom Image wrapper. \n\n**Status**: **Used** in `dashboard/events` list and calendar. \n\n**Note**: Seems to provide fallback or specific styling for Rio app.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof RioImage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        src: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba",
        alt: "Demo Image",
        width: 300,
        height: 200,
        className: "rounded-lg object-cover",
    },
};
