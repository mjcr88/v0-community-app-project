import type { Meta, StoryObj } from '@storybook/react';
import { PulsatingButton } from './pulsating-button';

const meta = {
    title: 'Atoms/Button/Pulsating',
    component: PulsatingButton,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Button with pulsating animation. \n\n**Status**: **Used** in `event-form` and `events-list`.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        pulseColor: { control: 'color' },
        duration: { control: 'text' },
    },
} satisfies Meta<typeof PulsatingButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'Join Event',
        pulseColor: '#44ce1b',
    },
};
