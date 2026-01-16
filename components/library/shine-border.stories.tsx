import type { Meta, StoryObj } from '@storybook/react';
import { ShineBorder } from './shine-border';

const meta = {
    title: 'Atoms/Effects/ShineBorder',
    component: ShineBorder,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Animated shine border effect. \n\n**Status**: Used in `dashboard/page`, `test-magicui`, `login/login-form`.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        shineColor: { control: 'color' },
    },
} satisfies Meta<typeof ShineBorder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <div className="relative size-48 rounded-lg border bg-background text-foreground flex items-center justify-center">
            <ShineBorder {...args} className="absolute inset-0 size-full" />
            <span className="z-10 font-bold">Shine Border</span>
        </div>
    ),
    args: {
        shineColor: ["#A07CFE", "#FE8FB5", "#FFBE7B"],
    },
};
