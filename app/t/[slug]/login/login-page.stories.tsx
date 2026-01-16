import type { Meta, StoryObj } from "@storybook/react"
import { TenantLoginForm } from "./login-form"
import { MockNextNavigation, WithRioFeedback } from "@/components/exchange/storybook-decorators"
import Image from "next/image"

// Wrapper to mimic the page layout from app/t/[slug]/login/page.tsx
const LoginPageWrapper = ({ tenant }: { tenant: any }) => (
    <div className="flex min-h-[100dvh] flex-col lg:grid lg:grid-cols-2">
        {/* Left Panel: Login Form */}
        <div className="flex flex-1 flex-col items-center justify-center p-8 bg-earth-cloud/30 w-full">
            <TenantLoginForm tenant={tenant} />
        </div>

        {/* Right Side - Hero/Brand (Mocked for Storybook) */}
        <div className="hidden lg:block relative h-full overflow-hidden bg-forest-deep">
            <div className="absolute inset-0 flex items-center justify-center bg-forest-canopy/20 mix-blend-overlay">
                <span className="text-white text-opacity-50 font-bold text-4xl transform -rotate-12">
                    Hero Image Placeholder
                </span>
            </div>
        </div>
    </div>
)

const meta: Meta<typeof TenantLoginForm> = {
    title: "Organisms/Auth/LoginPage",
    component: TenantLoginForm,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "The Login Page component (`app/t/[slug]/login/page.tsx`) wrapping the `TenantLoginForm`. This replaces any previous 'dummy' login forms.",
            },
        },
    },
    decorators: [
        (Story) => (
            <div className="h-screen w-full">
                <Story />
            </div>
        ),
        MockNextNavigation,
    ],
}

export default meta
type Story = StoryObj<typeof TenantLoginForm>

const mockTenant = {
    id: "tenant-1",
    name: "EcoVilla San Mateo",
    slug: "ecovilla-san-mateo",
}

export const Default: Story = {
    args: {
        tenant: mockTenant,
    },
    render: (args) => <LoginPageWrapper tenant={args.tenant} />,
}

export const Loading: Story = {
    args: {
        tenant: mockTenant,
    },
    render: (args) => (
        <div className="flex min-h-[100dvh] flex-col lg:grid lg:grid-cols-2">
            <div className="flex flex-1 flex-col items-center justify-center p-8 bg-earth-cloud/30 w-full">
                {/* Manually setting loading state logic would require unwrapping the component or refactoring, 
            so we'll simulate the layout and just show the form for now. 
            For true 'Loading' visual testing without state manipulation, we'd need to control the 'loading' state prop.
            Since 'loading' is internal state, we can't easily force it from here without refactoring. 
            We will simplify to just the Default view which covers the main UI. 
        */}
                <TenantLoginForm tenant={args.tenant} />
            </div>
            <div className="hidden lg:block relative h-full overflow-hidden bg-forest-deep">
                <div className="absolute inset-0 flex items-center justify-center bg-forest-canopy/20 mix-blend-overlay">
                    <span className="text-white text-opacity-50 font-bold text-4xl transform -rotate-12">
                        Hero Image Placeholder
                    </span>
                </div>
            </div>
        </div>
    ),
}
