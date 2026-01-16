import type { Meta, StoryObj } from "@storybook/react"
import { FamilyManagementForm } from "./family-management-form"
import { MockNextNavigation, WithRioFeedback } from "@/components/exchange/storybook-decorators"

const meta: Meta<typeof FamilyManagementForm> = {
    title: "Organisms/Settings/Family/FamilyManagementForm",
    component: FamilyManagementForm,
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component:
                    "Form for managing family members and pets. Used on the Family Settings page (`/dashboard/settings/family`). Allows adding/removing members, defining relationships, and managing pet profiles.",
            },
        },
    },
    decorators: [MockNextNavigation, WithRioFeedback],
    tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof FamilyManagementForm>

const baseResident = {
    id: "res-1",
    tenant_id: "tenant-1",
    family_unit_id: "family-1",
    lot_id: "lot-1",
}

const baseFamilyUnit = {
    id: "family-1",
    name: "The Does",
    description: "A fun-loving family from Canada.",
    photos: [],
    hero_photo: null,
    profile_picture_url: null,
    banner_image_url: null,
}

const mockFamilyMembers = [
    {
        id: "res-1",
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@example.com",
        profile_picture_url: "https://i.pravatar.cc/150?u=jane",
    },
    {
        id: "res-2",
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        profile_picture_url: "https://i.pravatar.cc/150?u=john",
    },
]

const mockRelationships = [
    {
        id: "rel-1",
        user_id: "res-1",
        related_user_id: "res-2",
        relationship_type: "spouse",
    },
]

const mockPets = [
    {
        id: "pet-1",
        name: "Buddy",
        species: "Dog",
        breed: "Golden Retriever",
        hero_photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80",
        photos: ["https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80"],
    },
]

const mockLotResidents = [
    ...mockFamilyMembers,
    {
        id: "res-3",
        first_name: "Grandma",
        last_name: "Doe",
        email: "grandma@example.com",
        profile_picture_url: null,
    },
]

export const Default: Story = {
    args: {
        resident: baseResident,
        familyUnit: baseFamilyUnit,
        familyMembers: mockFamilyMembers,
        relationships: mockRelationships,
        pets: mockPets,
        lotResidents: mockLotResidents,
        petsEnabled: true,
        tenantSlug: "demo-tenant",
        isPrimaryContact: true,
    },
}

export const NoPets: Story = {
    args: {
        resident: baseResident,
        familyUnit: baseFamilyUnit,
        familyMembers: mockFamilyMembers,
        relationships: mockRelationships,
        pets: [],
        lotResidents: mockLotResidents,
        petsEnabled: false,
        tenantSlug: "demo-tenant",
        isPrimaryContact: true,
    },
}

export const NoFamilyUnit: Story = {
    args: {
        resident: { ...baseResident, family_unit_id: null },
        familyUnit: null,
        familyMembers: [],
        relationships: [],
        pets: [],
        lotResidents: [],
        petsEnabled: true,
        tenantSlug: "demo-tenant",
        isPrimaryContact: true,
    },
}
