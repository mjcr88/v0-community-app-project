
import type { Meta, StoryObj } from "@storybook/react"
import { ResidentInviteSelector } from "./resident-invite-selector"
import { useState } from "react"

const meta = {
    title: "Molecules/Event Forms/ResidentInviteSelector",
    component: ResidentInviteSelector,
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component: "A multi-select component for inviting residents and families to an event.\n\n**Used in:** EventForm (`event-form.tsx`), EditEventForm (`edit-event-form.tsx`)",
            },
        },
    },
    tags: ["autodocs"],
} satisfies Meta<typeof ResidentInviteSelector>

export default meta
type Story = StoryObj<typeof meta>

const mockResidents = [
    { id: "1", first_name: "John", last_name: "Doe", profile_picture_url: null, family_unit_id: "f1" },
    { id: "2", first_name: "Jane", last_name: "Smith", profile_picture_url: null, family_unit_id: "f2" },
    { id: "3", first_name: "Alice", last_name: "Johnson", profile_picture_url: null, family_unit_id: null },
]

const mockFamilies = [
    { id: "f1", name: "Doe Family", profile_picture_url: null, member_count: 4 },
    { id: "f2", name: "Smith Family", profile_picture_url: null, member_count: 2 },
]

export const Default: Story = {
    args: {
        tenantId: "tenant-1",
        selectedResidentIds: [],
        selectedFamilyIds: [],
        initialResidents: mockResidents,
        initialFamilies: mockFamilies,
        onResidentsChange: () => { },
        onFamiliesChange: () => { },
    },
    render: function Render(args) {
        const [selectedResidents, setSelectedResidents] = useState(args.selectedResidentIds)
        const [selectedFamilies, setSelectedFamilies] = useState(args.selectedFamilyIds)
        return (
            <ResidentInviteSelector
                {...args}
                selectedResidentIds={selectedResidents}
                selectedFamilyIds={selectedFamilies}
                onResidentsChange={setSelectedResidents}
                onFamiliesChange={setSelectedFamilies}
                initialResidents={mockResidents}
                initialFamilies={mockFamilies}
            />
        )
    },
}

export const WithSelection: Story = {
    args: {
        tenantId: "tenant-1",
        selectedResidentIds: ["1"],
        selectedFamilyIds: ["f2"],
        initialResidents: mockResidents,
        initialFamilies: mockFamilies,
        onResidentsChange: () => { },
        onFamiliesChange: () => { },
    },
    render: function Render(args) {
        const [selectedResidents, setSelectedResidents] = useState(args.selectedResidentIds)
        const [selectedFamilies, setSelectedFamilies] = useState(args.selectedFamilyIds)
        return (
            <ResidentInviteSelector
                {...args}
                selectedResidentIds={selectedResidents}
                selectedFamilyIds={selectedFamilies}
                onResidentsChange={setSelectedResidents}
                onFamiliesChange={setSelectedFamilies}
                initialResidents={mockResidents}
                initialFamilies={mockFamilies}
            />
        )
    },
}
