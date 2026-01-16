import type { Meta, StoryObj } from '@storybook/react';
import { FamilyMemberCard } from '@/components/directory/FamilyMemberCard';

const meta = {
    title: 'Molecules/Directory/FamilyMemberCard',
    component: FamilyMemberCard,
    parameters: {
        layout: 'padded',
        nextjs: {
            appDirectory: true,
        },
        docs: {
            description: {
                component: 'Family member card displayed on family detail pages. Shows avatar, name, location, relationship, and "Primary Contact" badge. Supports compact mode for tighter layouts. \n\n**Status**: Used on family pages\n\n**Pages**: `/dashboard/families/[id]` (family detail page)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof FamilyMemberCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseMember = {
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
    family_relationship: 'parent',
    show_profile_picture: true,
    show_neighborhood: true,
};

export const Default: Story = {
    args: {
        member: baseMember,
        currentUserFamilyId: '1',
        tenantSlug: 'example-community',
    },
};

export const PrimaryContact: Story = {
    args: {
        member: baseMember,
        currentUserFamilyId: '1',
        tenantSlug: 'example-community',
        isPrimaryContact: true,
    },
};

export const CurrentUser: Story = {
    args: {
        member: baseMember,
        currentUserFamilyId: '1',
        tenantSlug: 'example-community',
        currentUserId: '1', // Same as member ID
    },
};

export const Compact: Story = {
    args: {
        member: baseMember,
        currentUserFamilyId: '1',
        tenantSlug: 'example-community',
        compact: true,
    },
};

export const WithPrivacy: Story = {
    args: {
        member: {
            ...baseMember,
            show_profile_picture: false,
            show_neighborhood: false,
        },
        currentUserFamilyId: '1',
        tenantSlug: 'example-community',
    },
};
