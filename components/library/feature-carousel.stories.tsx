import type { Meta, StoryObj } from '@storybook/react';
import FeatureCarousel from './feature-carousel';

const meta = {
    title: 'Organisms/Carousel/FeatureCarousel',
    component: FeatureCarousel,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Full screen animated feature carousel. \n\n**Status**: Used in `test-cultui`.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof FeatureCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockImageSet = {
    step1light1: "https://placehold.co/600x400/png",
    step1light2: "https://placehold.co/600x400/png",
    step2light1: "https://placehold.co/600x400/png",
    step2light2: "https://placehold.co/600x400/png",
    step3light: "https://placehold.co/600x400/png",
    step4light: "https://placehold.co/600x400/png",
    alt: "Placeholder"
};

export const Default: Story = {
    args: {
        title: "Feature Demo",
        description: "A demo description",
        image: mockImageSet
    },
};
