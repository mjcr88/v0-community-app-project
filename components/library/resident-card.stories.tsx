import type { Meta, StoryObj } from '@storybook/react';
import { ResidentCard } from '@/components/directory/ResidentCard';

const meta = {
    title: 'Molecules/Directory/ResidentCard',
    component: ResidentCard,
    parameters: {
        layout: 'padded',
        nextjs: {
            appDirectory: true,
        },
        docs: {
            description: {
                component: 'Individual resident card displayed in directory listing. Shows avatar, name, location (neighborhood/lot), family unit, and privacy badge indicating hidden fields. Respects privacy settings. \n\n**Status**: Core directory component\n\n**Pages**: `/dashboard/neighbours` (directory grid)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ResidentCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseResident = {
    id: '1',
    first_name: 'Maria',
    last_name: 'Rodriguez',
    profile_picture_url: null,
    lots: {
        lot_number: '42',
        neighborhoods: {
            name: 'North Village',
        },
    },
    family_units: {
        name: 'Rodriguez Family',
    },
    family_unit_id: '1',
    user_privacy_settings: {
        show_profile_picture: true,
        show_email: true,
        show_phone: true,
        show_neighborhood: true,
        show_family: true,
        show_interests: true,
        show_skills: true,
    },
};

export const Default: Story = {
    args: {
        resident: baseResident,
        tenantSlug: 'example-community',
        currentUserFamilyId: null,
    },
};

export const WithAvatar: Story = {
    args: {
        resident: {
            ...baseResident,
            profile_picture_url: 'https://github.com/shadcn.png',
        },
        tenantSlug: 'example-community',
        currentUserFamilyId: null,
    },
};

export const WithPrivacyRestrictions: Story = {
    args: {
        resident: {
            ...baseResident,
            user_privacy_settings: {
                show_profile_picture: false,
                show_email: false,
                show_phone: false,
                show_neighborhood: true,
                show_family: false,
                show_interests: false,
                show_skills: false,
            },
        },
        tenantSlug: 'example-community',
        currentUserFamilyId: null,
    },
};

export const FamilyMember: Story = {
    args: {
        resident: baseResident,
        tenantSlug: 'example-community',
        currentUserFamilyId: '1', // Same as resident's family
    },
};
