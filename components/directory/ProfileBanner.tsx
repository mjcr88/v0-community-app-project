"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface ProfileBannerProps {
    bannerUrl?: string | null
    profileUrl?: string | null
    name: string
    neighborhood?: string
    lotNumber?: string
    journeyStage?: string
    initials: string
}

export function ProfileBanner({
    bannerUrl,
    profileUrl,
    name,
    neighborhood,
    lotNumber,
    journeyStage,
    initials,
}: ProfileBannerProps) {
    return (
        <div className="relative">
            {/* Banner Image - 160px height */}
            <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
                {bannerUrl ? (
                    <Image
                        src={bannerUrl}
                        alt="Profile banner"
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#6B9B47] to-[#D97742]" />
                )}
            </div>

            {/* Profile Photo & Info - Overlapping section */}
            <div className="px-6 pb-6">
                <div className="flex items-end gap-4 -mt-8">
                    {/* Profile Photo - 110px, left-aligned, 60px overlap */}
                    <Avatar className="h-28 w-28 ring-4 ring-background">
                        <AvatarImage src={profileUrl || undefined} alt={name} />
                        <AvatarFallback className="text-2xl font-semibold">
                            {initials || "?"}
                        </AvatarFallback>
                    </Avatar>

                    {/* Name and Info - Inline to right of photo */}
                    <div className="flex-1 min-w-0 pb-2">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl font-bold truncate">{name}</h1>
                            {journeyStage && (
                                <Badge variant="secondary" className="capitalize">
                                    {journeyStage.replace('_', ' ')}
                                </Badge>
                            )}
                        </div>
                        {(neighborhood || lotNumber) && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {neighborhood && <span>{neighborhood}</span>}
                                {neighborhood && lotNumber && <span> • </span>}
                                {lotNumber && <span>Lot {lotNumber}</span>}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
