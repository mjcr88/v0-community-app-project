import type { Meta, StoryObj } from '@storybook/react';
import { SkillsList } from '@/components/directory/SkillsList';

const meta = {
    title: 'Molecules/Directory/SkillsList',
    component: SkillsList,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Skills badge list with "Available to help" indicator. Shows checkmark icon for skills where user is open to requests. \n\n**Status**: Used on profile pages\n\n**Pages**: `/dashboard/neighbours/[id]` (profile detail)',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof SkillsList>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockSkills = [
    { name: 'Plumbing', open_to_requests: true },
    { name: 'Gardening', open_to_requests: true },
    { name: 'Electrical Work', open_to_requests: false },
    { name: 'Carpentry', open_to_requests: false },
];

export const Default: Story = {
    args: {
        skills: mockSkills,
        showOpenToRequests: true,
    },
};

export const WithoutAvailability: Story = {
    args: {
        skills: mockSkills,
        showOpenToRequests: false,
    },
};

export const AllAvailable: Story = {
    args: {
        skills: mockSkills.map(s => ({ ...s, open_to_requests: true })),
        showOpenToRequests: true,
    },
};

export const NoneAvailable: Story = {
    args: {
        skills: mockSkills.map(s => ({ ...s, open_to_requests: false })),
        showOpenToRequests: true,
    },
};

export const FewSkills: Story = {
    args: {
        skills: mockSkills.slice(0, 2),
        showOpenToRequests: true,
    },
};
