"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslation } from "@/lib/i18n"
import {
    Megaphone,
    Users,
    ClipboardList,
    Menu,
    Home,
    Map,
    Calendar,
    ShoppingBag,
    FileText,
} from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/library/sheet"
import { Button } from "@/components/library/button"
import { cn } from "@/lib/utils"

interface HamburgerMenuProps {
    tenantSlug: string
    unreadAnnouncements?: number
    pendingRequests?: number
    trigger?: React.ReactNode
}

export function HamburgerMenu({
    tenantSlug,
    unreadAnnouncements,
    pendingRequests,
    trigger,
}: HamburgerMenuProps) {
    const pathname = usePathname()
    const { t } = useTranslation()
    const [open, setOpen] = React.useState(false)

    type NavItem = {
        icon?: any
        label: string
        href: string
        badge?: number
    }

    const navSections: { title: string; items: NavItem[] }[] = [
        {
            title: t("nav.personal"),
            items: [
                {
                    icon: Home,
                    label: t("nav.dashboard"),
                    href: `/t/${tenantSlug}/dashboard`,
                },
                {
                    icon: FileText,
                    label: t("nav.official"),
                    href: `/t/${tenantSlug}/dashboard/official`,
                    badge: unreadAnnouncements,
                },
            ],
        },
        {
            title: t("nav.community"),
            items: [
                {
                    icon: Users,
                    label: t("nav.neighbours"),
                    href: `/t/${tenantSlug}/dashboard/neighbours`,
                },
                {
                    icon: Map,
                    label: t("nav.map"),
                    href: `/t/${tenantSlug}/dashboard/community-map`,
                },
                {
                    icon: Calendar,
                    label: t("nav.events"),
                    href: `/t/${tenantSlug}/dashboard/events`,
                },
                {
                    icon: ShoppingBag,
                    label: t("nav.exchange"),
                    href: `/t/${tenantSlug}/dashboard/exchange`,
                },
                {
                    icon: ClipboardList,
                    label: t("nav.requests"),
                    href: `/t/${tenantSlug}/dashboard/requests`,
                },
            ],
        },
    ]

    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            trigger || (
                <Button variant="ghost" size="icon" className="text-forest-canopy">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                </Button>
            )
        )
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="text-forest-canopy">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-white dark:bg-neutral-950 p-0 border-r border-earth-pebble overflow-y-auto">
                <SheetHeader className="p-6 border-b border-earth-pebble/50">
                    <SheetTitle className="text-left text-forest-canopy font-bold text-xl">
                        {t("common.menu")}
                    </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col py-4">
                    {navSections.map((section) => (
                        <div key={section.title} className="mb-6 last:mb-0">
                            <h3 className="mb-2 px-6 text-[10px] font-bold text-mist-gray/80 uppercase tracking-widest">
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors hover:bg-earth-cloud",
                                            pathname === item.href
                                                ? "bg-forest-mist text-forest-canopy border-r-4 border-forest-canopy"
                                                : "text-earth-soil"
                                        )}
                                    >
                                        {item.icon && <item.icon className="h-5 w-5" />}
                                        <span className="flex-1">{item.label}</span>
                                        {item.badge && item.badge > 0 && (
                                            <span className="bg-sunrise text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    )
}
