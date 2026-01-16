import type { Meta, StoryObj } from '@storybook/react';
import { RainbowButton } from './rainbow-button';

const meta = {
    title: 'Atoms/Button/Rainbow',
    component: RainbowButton,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Button with a rainbow gradient animation. \n\n**Status**: Used in `test-magicui` page.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof RainbowButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'Get Access',
    },
};
