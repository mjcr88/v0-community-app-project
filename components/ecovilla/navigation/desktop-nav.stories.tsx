import type { Meta, StoryObj } from "@storybook/react"
import { DesktopNav } from "./desktop-nav"
import { MockNextNavigation, WithRioFeedback } from "@/components/exchange/storybook-decorators"

const meta: Meta<typeof DesktopNav> = {
    title: "Organisms/Navigation/DesktopNav",
    component: DesktopNav,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "The main desktop sidebar navigation. Used in `DashboardLayoutClient` within `app/t/[slug]/dashboard/layout.tsx`. Handles navigation between dashboard sections (Personal, Community) and displays user profile and logout options.",
            },
        },
    },
    decorators: [MockNextNavigation, WithRioFeedback],
    tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof DesktopNav>

const mockUser = {
    name: "Jane Doe",
    avatarUrl: "https://i.pravatar.cc/150?u=jane",
    unreadAnnouncements: 3,
    unreadNotifications: 5,
}

import { useArgs } from "@storybook/preview-api"

export const Default: Story = {
    args: {
        tenantSlug: "demo-tenant",
        tenantName: "EcoVilla",
        tenantLogoUrl: "https://via.placeholder.com/150",
        user: mockUser,
        isCollapsed: false,
        onToggleCollapse: () => { },
    },
    render: function Render(args) {
        const [{ isCollapsed }, updateArgs] = useArgs()

        function onToggleCollapse() {
            updateArgs({ isCollapsed: !isCollapsed })
        }

        return <DesktopNav {...args} isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />
    },
}

export const Collapsed: Story = {
    args: {
        ...Default.args,
        isCollapsed: true,
    },
    render: Default.render,
}

export const NoBadges: Story = {
    args: {
        ...Default.args,
        user: {
            ...mockUser,
            unreadAnnouncements: 0,
            unreadNotifications: 0,
        },
    },
}
