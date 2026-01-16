"use client"

import React from "react"
import Link from "next/link"
import { MapPin, Calendar, ShoppingBag, ClipboardList } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/library/sheet"
import { Button } from "@/components/library/button"
import { cn } from "@/lib/utils"

interface CreateModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tenantSlug: string
}

export function CreateModal({ open, onOpenChange, tenantSlug }: CreateModalProps) {
    const actions = [
        {
            icon: MapPin,
            title: "Check-in",
            description: "Share your location",
            href: `/t/${tenantSlug}/dashboard/locations`, // Using locations for now
            color: "text-sky-500",
            bgColor: "bg-sky-50",
        },
        {
            icon: Calendar,
            title: "Event",
            description: "Organize something",
            href: `/t/${tenantSlug}/dashboard/events/create`,
            color: "text-purple-500",
            bgColor: "bg-purple-50",
        },
        {
            icon: ShoppingBag,
            title: "Listing",
            description: "Share or borrow",
            href: `/t/${tenantSlug}/dashboard/exchange`, // Using exchange root for now
            color: "text-green-500",
            bgColor: "bg-green-50",
        },
        {
            icon: ClipboardList,
            title: "Request",
            description: "Report an issue",
            href: `/t/${tenantSlug}/dashboard/requests`, // Using requests root for now
            color: "text-orange-500",
            bgColor: "bg-orange-50",
        },
    ]

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="rounded-t-xl bg-earth-snow p-6">
                <SheetHeader className="mb-6 text-left">
                    <SheetTitle className="text-xl font-bold text-forest-canopy">
                        What would you like to create?
                    </SheetTitle>
                    <SheetDescription>
                        Choose an action to contribute to your community.
                    </SheetDescription>
                </SheetHeader>

                <div className="grid grid-cols-1 gap-4 mb-6">
                    {actions.map((action) => (
                        <Link
                            key={action.title}
                            href={action.href}
                            onClick={() => onOpenChange(false)}
                            className="flex items-center gap-4 p-4 rounded-xl border border-earth-pebble bg-white hover:shadow-md transition-all active:scale-[0.98]"
                        >
                            <div className={cn("p-3 rounded-full", action.bgColor)}>
                                <action.icon className={cn("w-6 h-6", action.color)} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-earth-soil">{action.title}</h3>
                                <p className="text-sm text-mist-gray">{action.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>

                <Button
                    variant="outline"
                    className="w-full rounded-xl py-6 text-base"
                    onClick={() => onOpenChange(false)}
                >
                    Cancel
                </Button>
            </SheetContent>
        </Sheet>
    )
}
