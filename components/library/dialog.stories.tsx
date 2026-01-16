import type { Meta, StoryObj } from '@storybook/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from './dialog';
import { Button } from './button';

const meta = {
    title: 'Molecules/Overlay/Dialog',
    component: Dialog,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Dialog overlay. \n\n**Status**: Unused (orphaned in library). Shadows `components/ui/dialog`.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit profile</DialogTitle>
                    <DialogDescription>
                        Make changes to your profile here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Form content would go here */}
                    <p className="text-sm text-muted-foreground">Form inputs...</p>
                </div>
                <DialogFooter>
                    <Button type="submit">Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ),
};
