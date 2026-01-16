import type { Meta, StoryObj } from '@storybook/react';
import { AuroraText } from './aurora-text';

const meta = {
    title: 'Atoms/Text/Aurora',
    component: AuroraText,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Text with an aurora borealis color effect. \n\n**Status**: Unused (orphaned in library).',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof AuroraText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'Aurora Text',
    },
    render: (args) => (
        <div className="text-6xl font-bold bg-black p-8 rounded block">
            <AuroraText {...args} />
        </div>
    )
};
