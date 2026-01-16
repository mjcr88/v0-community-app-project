import type { Meta, StoryObj } from '@storybook/react';
import { SiteHeader } from './site-header';

const meta = {
    title: 'Organisms/Layout/SiteHeader',
    component: SiteHeader,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Site header component. \n\n**Status**: **Used** in `app/dashboard/page.tsx`.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => <SiteHeader />,
};
