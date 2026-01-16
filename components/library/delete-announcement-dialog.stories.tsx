import type { Meta, StoryObj } from '@storybook/react';
import { DeleteAnnouncementDialog } from '@/components/announcements/delete-announcement-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const meta = {
    title: 'Organisms/Announcements/DeleteDialog',
    component: DeleteAnnouncementDialog,
    parameters: {
        layout: 'centered',
        nextjs: {
            appDirectory: true,
        },
        docs: {
            description: {
                component: 'Confirmation dialog for permanently deleting announcements. \n\n**Status**: Used on admin announcement pages\n\n**Pages**: `/admin/announcements`, `/admin/announcements/[id]`',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof DeleteAnnouncementDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        announcementId: '1',
        tenantSlug: 'example-community',
        tenantId: '1',
        redirectAfter: false,
    },
};

export const CustomTrigger: Story = {
    args: {
        announcementId: '1',
        tenantSlug: 'example-community',
        tenantId: '1',
        redirectAfter: false,
        trigger: (
            <Button variant="ghost" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Permanently
            </Button>
        ),
    },
};
