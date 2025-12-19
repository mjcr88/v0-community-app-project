import type { Meta, StoryObj } from "@storybook/react"
import { ProfileEditForm } from "./profile-edit-form"
import { MockNextNavigation, WithRioFeedback } from "@/components/exchange/storybook-decorators"

const meta: Meta<typeof ProfileEditForm> = {
    title: "Organisms/Settings/Profile/ProfileEditForm",
    component: ProfileEditForm,
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component:
                    "The main form for editing a resident's personal profile. Used on the Profile Settings page (`/dashboard/settings/profile`). Handles identity, contact info, bio, journey stage, interests, skills, and photo gallery.",
            },
        },
    },
    decorators: [MockNextNavigation, WithRioFeedback],
    tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof ProfileEditForm>

const mockInterests = [
    { id: "int-1", name: "Gardening" },
    { id: "int-2", name: "Cooking" },
    { id: "int-3", name: "Hiking" },
    { id: "int-4", name: "Technology" },
]

const mockSkills = [
    { id: "skill-1", name: "Carpentry" },
    { id: "skill-2", name: "Web Design" },
    { id: "skill-3", name: "Photography" },
]

const baseResident = {
    id: "res-1",
    tenant_id: "tenant-1",
    first_name: "Jane",
    last_name: "Doe",
    phone: "+1 (555) 123-4567",
    birthday: "1990-01-01",
    birth_country: "Canada",
    current_country: "Costa Rica",
    languages: ["English", "Spanish", "French"],
    preferred_language: "English",
    photos: ["https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80"],
    hero_photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
    profile_picture_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
    banner_image_url: null,
    about: "Digital nomad living the dream. Love hiking and coffee.",
    journey_stage: "integrating",
    estimated_move_in_date: "2024-01-15",
    estimated_construction_start_date: "2023-06-01",
    estimated_construction_end_date: "2023-12-01",
    user_interests: [{ interest_id: "int-1" }, { interest_id: "int-3" }],
    user_skills: [
        { skill_id: "skill-2", skills: { name: "Web Design" }, open_to_requests: true },
        { skill_id: "skill-3", skills: { name: "Photography" }, open_to_requests: false },
    ],
    lot_id: "lot-1",
    lots: {
        lot_number: "42",
        neighborhoods: { name: "Sunny Side" },
    },
}

const baseTenant = {
    features: {
        interests: true,
    },
    map_center_coordinates: {
        lat: 9.9281,
        lng: -84.0907,
    },
}

const mockLocations = [
    {
        id: "loc-1",
        lot_id: "lot-1",
        type: "lot",
        name: "Lot 42",
        coordinates: { lat: 9.9281, lng: -84.0907 },
    },
]

export const Default: Story = {
    args: {
        resident: baseResident,
        tenant: baseTenant,
        availableInterests: mockInterests,
        availableSkills: mockSkills,
        tenantSlug: "demo-tenant",
        locations: mockLocations,
        userEmail: "jane.doe@example.com",
    },
}

export const Incomplete: Story = {
    args: {
        resident: {
            ...baseResident,
            phone: null,
            birthday: null,
            birth_country: null,
            current_country: null,
            languages: [],
            journey_stage: null,
            user_interests: [],
            user_skills: [],
            about: null,
        },
        tenant: baseTenant,
        availableInterests: mockInterests,
        availableSkills: mockSkills,
        tenantSlug: "demo-tenant",
        locations: mockLocations,
        userEmail: "jane.doe@example.com",
    },
}
