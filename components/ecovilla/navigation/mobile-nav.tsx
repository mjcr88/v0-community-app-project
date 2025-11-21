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
}

export function MobileNav({ tenantSlug, user }: MobileNavProps) {
    return (
        <div className="md:hidden">
            <MobileTopBar tenantSlug={tenantSlug} user={user} />

            <MobileDock
                tenantSlug={tenantSlug}
                unreadEvents={user.unreadEvents}
            />
        </div>
    )
}
