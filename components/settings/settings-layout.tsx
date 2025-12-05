"use client"

import { SettingsTabs } from "@/components/settings-tabs"

interface SettingsLayoutProps {
    children: React.ReactNode
    tenantSlug: string
    title: string
    description?: string
}

export function SettingsLayout({ children, tenantSlug }: SettingsLayoutProps) {
    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            <SettingsTabs tenantSlug={tenantSlug} />
            {children}
        </div>
    )
}
