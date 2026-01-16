import type { Meta, StoryObj } from "@storybook/react"
import { PrivacySettingsForm } from "./privacy-settings-form"
import { MockNextNavigation, WithRioFeedback } from "@/components/exchange/storybook-decorators"

const meta: Meta<typeof PrivacySettingsForm> = {
    title: "Organisms/Settings/Privacy/PrivacySettingsForm",
    component: PrivacySettingsForm,
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component:
                    "Form for managing user privacy preferences. Used on the Privacy Settings page (`/dashboard/settings/privacy`). Controls visibility of contact info, personal details, journey, and family information to other residents.",
            },
        },
    },
    decorators: [MockNextNavigation, WithRioFeedback],
    tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof PrivacySettingsForm>

const mockPrivacySettings = {
    id: "priv-1",
    user_id: "user-1",
    show_email: true,
    show_phone: false,
    show_birthday: true,
    show_birth_country: true,
    show_current_country: true,
    show_languages: true,
    show_preferred_language: true,
    show_journey_stage: true,
    show_estimated_move_in_date: false,
    show_construction_dates: false,
    show_neighborhood: true,
    show_family: true,
    show_family_relationships: true,
    show_interests: true,
    show_skills: true,
    show_open_to_requests: true,
}

export const Default: Story = {
    args: {
        privacySettings: mockPrivacySettings,
        tenantSlug: "demo-tenant",
    },
}

export const AllHidden: Story = {
    args: {
        privacySettings: {
            ...mockPrivacySettings,
            show_email: false,
            show_phone: false,
            show_birthday: false,
            show_birth_country: false,
            show_current_country: false,
            show_languages: false,
            show_preferred_language: false,
            show_journey_stage: false,
            show_estimated_move_in_date: false,
            show_construction_dates: false,
            show_family: false,
            show_family_relationships: false,
            show_interests: false,
            show_skills: false,
            show_open_to_requests: false,
        },
        tenantSlug: "demo-tenant",
    },
}
