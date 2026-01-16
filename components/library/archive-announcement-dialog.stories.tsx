import type { Meta, StoryObj } from '@storybook/react';
import { ArchiveAnnouncementDialog } from '@/components/announcements/archive-announcement-dialog';
import { Button } from '@/components/ui/button';
import { Archive } from 'lucide-react';

const meta = {
    title: 'Organisms/Announcements/ArchiveDialog',
    component: ArchiveAnnouncementDialog,
    parameters: {
        layout: 'centered',
        nextjs: {
            appDirectory: true,
        },
        docs: {
            description: {
                component: 'Confirmation dialog for archiving announcements. \n\n**Status**: Used on admin announcement pages\n\n**Pages**: `/admin/announcements`, `/admin/announcements/[id]`',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ArchiveAnnouncementDialog>;

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
                <Archive className="mr-2 h-4 w-4" />
                Move to Archive
            </Button>
        ),
    },
};
