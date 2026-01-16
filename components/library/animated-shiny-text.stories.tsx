import type { Meta, StoryObj } from '@storybook/react';
import { AnimatedShinyText } from './animated-shiny-text';

const meta = {
    title: 'Atoms/Text/AnimatedShiny',
    component: AnimatedShinyText,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Text with a moving shine effect. \n\n**Status**: **Used** in `test-magicui` page.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof AnimatedShinyText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'Shiny Text Effect',
    },
    render: (args) => (
        <div className="text-4xl font-bold bg-black p-4 rounded">
            <AnimatedShinyText {...args} />
        </div>
    )
};
