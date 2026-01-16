import type { Meta, StoryObj } from '@storybook/react';
import { Field, FieldLabel, FieldContent, FieldTitle, FieldDescription } from './field';
import { Button } from './button';

const meta = {
    title: 'Molecules/Form/Field',
    component: Field,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Custom form field layout primitive. \n\n**Status**: Unused (orphaned in library).',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <div className="w-[400px]">
            <Field {...args}>
                <FieldLabel>
                    <FieldTitle>Field Title</FieldTitle>
                    <FieldDescription>Description of this field.</FieldDescription>
                </FieldLabel>
                <FieldContent>
                    <div className="p-4 border rounded bg-gray-50 dark:bg-gray-800">
                        Input or Content Slot
                    </div>
                </FieldContent>
            </Field>
        </div>
    ),
    args: {},
};
