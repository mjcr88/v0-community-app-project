"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SettingsTabs } from "@/components/settings-tabs"

interface SettingsLayoutProps {
    children: React.ReactNode
    tenantSlug: string
    title: string
    description?: string
}

export function SettingsLayout({ children, tenantSlug, title, description }: SettingsLayoutProps) {
    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/t/${tenantSlug}/dashboard`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                        {description && <p className="text-muted-foreground text-sm">{description}</p>}
                    </div>
                </div>

                <SettingsTabs tenantSlug={tenantSlug} />
            </div>

            <Separator />

            {/* Content */}
            <div className="animate-in fade-in-50 duration-500">
                {children}
            </div>
        </div>
    )
}
