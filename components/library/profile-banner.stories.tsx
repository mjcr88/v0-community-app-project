import type { Meta, StoryObj } from '@storybook/react';
import { ProfileBanner } from '@/components/directory/ProfileBanner';

const meta = {
    title: 'Organisms/Directory/ProfileBanner',
    component: ProfileBanner,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Profile banner component for family detail pages. Shows cover photo, large avatar, name, and location. Similar to ProfileHeroSection but simpler design for family profiles. \n\n**Status**: Family profile header\n\n**Pages**: `/dashboard/families/[id]` (family profile header)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ProfileBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        name: 'Jedamski Chacon',
        neighborhood: 'Dalia',
        lotNumber: 'D 401',
        initials: 'JC',
    },
};

export const WithBanner: Story = {
    args: {
        bannerUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        name: 'Rodriguez Family',
        neighborhood: 'North Village',
        lotNumber: '42',
        initials: 'RF',
    },
};

export const WithProfilePicture: Story = {
    args: {
        profileUrl: 'https://github.com/shadcn.png',
        name: 'Smith Family',
        neighborhood: 'South Bay',
        lotNumber: '15',
        initials: 'SF',
    },
};

export const WithBoth: Story = {
    args: {
        bannerUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        profileUrl: 'https://github.com/shadcn.png',
        name: 'Johnson Family',
        neighborhood: 'East Gardens',
        lotNumber: 'A 123',
        initials: 'JF',
    },
};

export const MinimalInfo: Story = {
    args: {
        name: 'Williams Family',
        initials: 'WF',
    },
};
