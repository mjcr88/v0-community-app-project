import type { Meta, StoryObj } from '@storybook/react';
import { WordRotate } from './word-rotate';

const meta = {
    title: 'Atoms/Text/WordRotate',
    component: WordRotate,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Vertical rotating text. \n\n**Status**: Unused (orphaned in library).',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof WordRotate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        words: ["First Word", "Second Word", "Third Word"],
    },
    render: (args) => (
        <div className="text-4xl font-bold flex items-center gap-2">
            <span>I am a</span>
            <WordRotate {...args} />
        </div>
    )
};
