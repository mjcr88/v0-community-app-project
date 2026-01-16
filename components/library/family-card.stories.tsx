import type { Meta, StoryObj } from '@storybook/react';
import { FamilyCard } from '@/components/directory/FamilyCard';

const meta = {
    title: 'Molecules/Directory/FamilyCard',
    component: FamilyCard,
    parameters: {
        layout: 'padded',
        nextjs: {
            appDirectory: true,
        },
        docs: {
            description: {
                component: 'Family unit card displayed in directory listing. Shows family avatar/initials, name, location, member count, and pet count. Highlights user\'s own family with border and badge. \n\n**Status**: Core directory component\n\n**Pages**: `/dashboard/neighbours` (families tab)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof FamilyCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseFamily = {
    id: '1',
    name: 'Rodriguez Family',
    profile_picture_url: null,
    users: [
        {
            id: '1',
            first_name: 'Maria',
            last_name: 'Rodriguez',
            lots: {
                lot_number: '42',
                neighborhoods: {
                    name: 'North Village',
                },
            },
        },
        {
            id: '2',
            first_name: 'Carlos',
            last_name: 'Rodriguez',
            lots: null,
        },
    ],
    pets: [
        { id: '1', name: 'Max' },
        { id: '2', name: 'Luna' },
    ],
};

export const Default: Story = {
    args: {
        family: baseFamily,
        tenantSlug: 'example-community',
        currentUserFamilyId: null,
    },
};

export const YourFamily: Story = {
    args: {
        family: baseFamily,
        tenantSlug: 'example-community',
        currentUserFamilyId: '1', // Same as family ID
    },
};

export const WithAvatar: Story = {
    args: {
        family: {
            ...baseFamily,
            profile_picture_url: 'https://github.com/shadcn.png',
        },
        tenantSlug: 'example-community',
        currentUserFamilyId: null,
    },
};

export const NoPets: Story = {
    args: {
        family: {
            ...baseFamily,
            pets: [],
        },
        tenantSlug: 'example-community',
        currentUserFamilyId: null,
    },
};

export const SingleMember: Story = {
    args: {
        family: {
            ...baseFamily,
            users: [baseFamily.users[0]],
            pets: [],
        },
        tenantSlug: 'example-community',
        currentUserFamilyId: null,
    },
};
