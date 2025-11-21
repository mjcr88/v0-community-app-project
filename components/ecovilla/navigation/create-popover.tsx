"use client"

import React from "react"
import Link from "next/link"
import { MapPin, Calendar, ShoppingBag, ClipboardList } from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/library/popover"
import { Button } from "@/components/library/button"
import { cn } from "@/lib/utils"

interface CreatePopoverProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tenantSlug: string
    children: React.ReactNode
    align?: "center" | "end" | "start"
    side?: "top" | "bottom" | "left" | "right"
}

export function CreatePopover({
    open,
    onOpenChange,
    tenantSlug,
    children,
    align = "center",
    side = "top"
}: CreatePopoverProps) {
    const actions = [
        {
            icon: MapPin,
            title: "Check-in",
            description: "Share location",
            href: `/t/${tenantSlug}/dashboard/locations`,
            color: "text-sky-600",
            bgColor: "bg-sky-50",
            borderColor: "border-sky-100",
        },
        {
            icon: Calendar,
            title: "Event",
            description: "Organize",
            href: `/t/${tenantSlug}/dashboard/events/create`,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
            borderColor: "border-purple-100",
        },
        {
            icon: ShoppingBag,
            title: "Listing",
            description: "Share/Borrow",
            href: `/t/${tenantSlug}/dashboard/exchange`,
            color: "text-green-600",
            bgColor: "bg-green-50",
            borderColor: "border-green-100",
        },
        {
            icon: ClipboardList,
            title: "Request",
            description: "Report issue",
            href: `/t/${tenantSlug}/dashboard/requests`,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
            borderColor: "border-orange-100",
        },
    ]

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent
                side={side}
                align={align}
                className="w-72 p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-earth-pebble shadow-xl"
                sideOffset={16}
            >
                <div className="mb-3 px-1">
                    <h3 className="font-bold text-forest-canopy text-lg">Create</h3>
                    <p className="text-xs text-mist-gray">Contribute to your community</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {actions.map((action) => (
                        <Link
                            key={action.title}
                            href={action.href}
                            onClick={() => onOpenChange(false)}
                            className={cn(
                                "flex items-center gap-3 p-2.5 rounded-xl border transition-all hover:shadow-md active:scale-[0.98]",
                                action.bgColor,
                                action.borderColor
                            )}
                        >
                            <div className={cn("p-2 rounded-full bg-white shadow-sm", action.color)}>
                                <action.icon className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className={cn("font-semibold text-sm", action.color)}>{action.title}</h4>
                                <p className="text-[10px] text-earth-soil/70">{action.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}
