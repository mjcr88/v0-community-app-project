import type { Meta, StoryObj } from '@storybook/react';
import { Confetti, ConfettiButton } from './confetti';

const meta = {
    title: 'Atoms/Visuals/Confetti',
    component: Confetti,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Confetti animation component. \n\n**Status**: Unused (orphaned in library).',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Confetti>;

export default meta;
type Story = StoryObj<typeof meta>;

// Confetti requires a canvas, but the button version is easier to demonstrate
export const DemoButton: Story = {
    render: () => (
        <div className="relative h-[200px] w-full flex items-center justify-center">
            <ConfettiButton className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2">
                Fire Confetti
            </ConfettiButton>
        </div>
    ),
};
