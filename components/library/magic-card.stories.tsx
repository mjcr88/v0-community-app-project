import type { Meta, StoryObj } from '@storybook/react';
import { MagicCard } from './magic-card';

const meta = {
    title: 'Molecules/Cards/MagicCard',
    component: MagicCard,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Card with interactive gradient effect. \n\n**Status**: **Used** in `test-magicui` and `login-form`.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        gradientColor: { control: 'color' },
    },
} satisfies Meta<typeof MagicCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <MagicCard
            className="cursor-pointer flex-col items-center justify-center shadow-2xl whitespace-nowrap text-4xl"
            gradientColor={"#D9D9D955"}
            {...args}
        >
            <div className="p-10">Magic Card</div>
        </MagicCard>
    ),
};
