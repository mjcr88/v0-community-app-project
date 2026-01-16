import type { Meta, StoryObj } from '@storybook/react';
import { PublishAnnouncementDialog } from '@/components/announcements/publish-announcement-dialog';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

const meta = {
    title: 'Organisms/Announcements/PublishDialog',
    component: PublishAnnouncementDialog,
    parameters: {
        layout: 'centered',
        nextjs: {
            appDirectory: true,
        },
        docs: {
            description: {
                component: 'Confirmation dialog for publishing announcements and sending notifications. \n\n**Status**: Used on admin announcement pages\n\n**Pages**: `/admin/announcements`, `/admin/announcements/create`, `/admin/announcements/[id]/edit`',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof PublishAnnouncementDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        announcementId: '1',
        tenantSlug: 'example-community',
        tenantId: '1',
    },
};

export const CustomTrigger: Story = {
    args: {
        announcementId: '1',
        tenantSlug: 'example-community',
        tenantId: '1',
        trigger: (
            <Button variant="default" size="lg">
                <Send className="mr-2 h-4 w-4" />
                Publish & Notify Residents
            </Button>
        ),
    },
};
