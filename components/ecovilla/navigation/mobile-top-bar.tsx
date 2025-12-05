"use client"

import React from "react"
import Link from "next/link"
import { LogOut, User, Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/library/avatar"
import { HamburgerMenu } from "./hamburger-menu"
import { AnimatedThemeToggler } from "@/components/library/animated-theme-toggler"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/library/popover"
import { Separator } from "@/components/library/separator"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface MobileTopBarProps {
    tenantSlug: string
    user: {
        name: string
        avatarUrl?: string | null
        unreadAnnouncements?: number
        pendingRequests?: number
    }
    className?: string
}

export function MobileTopBar({ tenantSlug, user, className }: MobileTopBarProps) {
    const supabase = createClient()
    const [isVisible, setIsVisible] = React.useState(false)
    const [lastScrollY, setLastScrollY] = React.useState(0)

    React.useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY

            if (currentScrollY < 10) {
                setIsVisible(false) // Hidden at top
            } else if (currentScrollY > lastScrollY) {
                setIsVisible(false) // Scrolling down
            } else {
                setIsVisible(true) // Scrolling up
            }

            setLastScrollY(currentScrollY)
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [lastScrollY])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = `/t/${tenantSlug}/login`
    }

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-40 h-16 px-4 flex items-center justify-between bg-earth-snow/90 backdrop-blur-md border-b border-earth-pebble/50 transition-transform duration-300 rounded-b-[20px]",
                !isVisible && "-translate-y-full",
                className
            )}
        >
            <HamburgerMenu
                tenantSlug={tenantSlug}
                unreadAnnouncements={user.unreadAnnouncements}
                pendingRequests={user.pendingRequests}
            />

            <div className="flex items-center gap-3">
                <Link href={`/t/${tenantSlug}/dashboard/notifications`}>
                    <button className="p-2 rounded-full text-earth-soil hover:bg-earth-cloud transition-colors relative">
                        <Bell className="w-5 h-5" />
                    </button>
                </Link>

                <Popover>
                    <PopoverTrigger asChild>
                        <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-forest-canopy focus:ring-offset-2">
                            <Avatar className="h-9 w-9 border border-earth-pebble shadow-sm">
                                <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                                <AvatarFallback className="bg-forest-mist text-forest-canopy font-semibold">
                                    {user.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .substring(0, 2)
                                        .toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-56 p-2 backdrop-blur-xl border shadow-lg rounded-xl">
                        <div className="px-2 py-1.5 text-sm font-semibold border-b mb-1">
                            {user.name}
                        </div>
                        <Link
                            href={`/t/${tenantSlug}/dashboard/settings/profile`}
                            className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-accent rounded-lg transition-colors"
                        >
                            <User className="w-4 h-4" />
                            Profile
                        </Link>
                        <div className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-accent rounded-lg transition-colors">
                            <div className="w-4 h-4 flex items-center justify-center">
                                <AnimatedThemeToggler />
                            </div>
                            <span>Theme</span>
                        </div>
                        <Separator className="my-1" />
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-2 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors w-full text-left"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </PopoverContent>
                </Popover>
            </div>
        </header>
    )
}
