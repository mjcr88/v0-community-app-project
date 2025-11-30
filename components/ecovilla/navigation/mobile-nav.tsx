"use client"

import React from "react"
import { MobileTopBar } from "./mobile-top-bar"
import { MobileDock } from "./mobile-dock"

interface MobileNavProps {
    tenantSlug: string
    user: {
        name: string
        avatarUrl?: string | null
        unreadAnnouncements?: number
        pendingRequests?: number
        unreadEvents?: number
    }
    tenantId: string
    categories: Array<{ id: string; name: string }>
    neighborhoods: Array<{ id: string; name: string }>
}

export function MobileNav({ tenantSlug, user, tenantId, categories, neighborhoods }: MobileNavProps) {
    return (
        <div className="md:hidden">
            <MobileTopBar tenantSlug={tenantSlug} user={user} />

            <MobileDock
                tenantSlug={tenantSlug}
                unreadEvents={user.unreadEvents}
                tenantId={tenantId}
                categories={categories}
                neighborhoods={neighborhoods}
            />
        </div>
    )
}
