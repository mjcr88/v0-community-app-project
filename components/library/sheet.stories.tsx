import type { Meta, StoryObj } from '@storybook/react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from './sheet';
import { Button } from './button';

const meta = {
    title: 'Molecules/Overlay/Sheet',
    component: Sheet,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Sheet (Side drawer). \n\n**Status**: Unused (orphaned in library). Shadows `components/ui/sheet`.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline">Open Sheet</Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Edit profile</SheetTitle>
                    <SheetDescription>
                        Make changes to your profile here. Click save when you're done.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                    Content here
                </div>
            </SheetContent>
        </Sheet>
    ),
};
