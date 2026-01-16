import type { Meta, StoryObj } from '@storybook/react';
import { TypingAnimation } from './typing-animation';

const meta = {
    title: 'Atoms/Text/Typing',
    component: TypingAnimation,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Typing effect animation. \n\n**Status**: **Used** in `test-magicui` page.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof TypingAnimation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'Typing Animation Service',
    },
    render: (args) => (
        <div className="text-4xl font-bold font-mono">
            <TypingAnimation {...args} />
        </div>
    )
};
