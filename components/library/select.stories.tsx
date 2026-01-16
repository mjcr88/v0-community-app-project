import type { Meta, StoryObj } from '@storybook/react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './select';

const meta = {
    title: 'Atoms/Form/Select',
    component: Select,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Select dropdown. \n\n**Status**: Unused (orphaned in library). Shadows `components/ui/select`.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <Select>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
            </SelectContent>
        </Select>
    ),
};
