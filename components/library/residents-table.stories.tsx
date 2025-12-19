import type { Meta, StoryObj } from '@storybook/react';
import { ResidentsTable } from '@/app/t/[slug]/admin/residents/residents-table';

const meta = {
    title: 'Organisms/Admin/ResidentsTable',
    component: ResidentsTable,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Comprehensive admin table for managing residents and pets. Features search, filtering (show pets, show only with complaints), sorting, bulk selection/deletion, and status badges (Created/Invited/Active). Shows complaints count with links to admin requests page. \n\n**Status**: Core admin component\n\n**Pages**: `/admin/residents`',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ResidentsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockResidents = [
    {
        id: '1',
        first_name: 'Maria',
        last_name: 'Rodriguez',
        email: 'maria@example.com',
        phone: '+1234567890',
        created_at: '2024-01-01T00:00:00Z',
        invited_at: '2024-01-02T00:00:00Z',
        onboarding_completed: true,
        lots: {
            id: '1',
            lot_number: '42',
            neighborhoods: {
                id: '1',
                name: 'North Village',
            },
        },
        family_units: {
            id: '1',
            name: 'Rodriguez Family',
        },
    },
    {
        id: '2',
        first_name: 'John',
        last_name: 'Smith',
        email: null,
        phone: null,
        created_at: '2024-01-10T00:00:00Z',
        invited_at: null,
        onboarding_completed: false,
        lots: {
            id: '2',
            lot_number: '43',
            neighborhoods: {
                id: '1',
                name: 'North Village',
            },
        },
        family_units: null,
    },
];

const mockPets = [
    {
        id: 'p1',
        name: 'Max',
        species: 'Dog',
        breed: 'Golden Retriever',
        created_at: '2024-01-15T00:00:00Z',
        lots: {
            id: '1',
            lot_number: '42',
            neighborhoods: {
                id: '1',
                name: 'North Village',
            },
        },
        family_units: {
            id: '1',
            name: 'Rodriguez Family',
        },
    },
];

const mockFamilyUnits = [
    { id: '1', primary_contact_id: '1' },
];

const mockResidentComplaints = new Map([
    ['1', { active: 1, total: 3 }],
]);

const mockPetComplaints = new Map([
    ['p1', { active: 0, total: 1 }],
]);

export const Default: Story = {
    args: {
        residents: mockResidents,
        pets: mockPets,
        slug: 'example-community',
        familyUnits: mockFamilyUnits,
        residentComplaints: mockResidentComplaints,
        petComplaints: mockPetComplaints,
    },
};

export const ResidentsOnly: Story = {
    args: {
        residents: mockResidents,
        pets: [],
        slug: 'example-community',
        familyUnits: mockFamilyUnits,
        residentComplaints: mockResidentComplaints,
        petComplaints: new Map(),
    },
};

export const Empty: Story = {
    args: {
        residents: [],
        pets: [],
        slug: 'example-community',
        familyUnits: [],
        residentComplaints: new Map(),
        petComplaints: new Map(),
    },
};
