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
    action?: React.ReactNode
}

export function ProfileBanner({
    bannerUrl,
    profileUrl,
    name,
    neighborhood,
    lotNumber,
    journeyStage,
    initials,
    action,
}: ProfileBannerProps) {
    return (
        <div className="relative h-48 sm:h-56 w-full overflow-hidden rounded-xl">
            {/* Banner Image */}
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

            {/* Semi-transparent overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Action Button */}
            {action && (
                <div className="absolute top-4 right-4 z-10">
                    {action}
                </div>
            )}

            {/* Profile content inside banner */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <div className="flex items-end gap-4">
                    {/* Profile Photo */}
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background shadow-lg flex-shrink-0">
                        <AvatarImage src={profileUrl || undefined} alt={name} className="object-cover" />
                        <AvatarFallback className="text-2xl sm:text-3xl bg-primary/10 text-primary">
                            {initials || "?"}
                        </AvatarFallback>
                    </Avatar>

                    {/* Name and Info */}
                    <div className="flex-1 pb-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg truncate">
                                {name}
                            </h1>
                            {journeyStage && (
                                <Badge variant="secondary" className="capitalize text-xs sm:text-sm shadow-lg flex-shrink-0">
                                    {journeyStage.replace('_', ' ')}
                                </Badge>
                            )}
                        </div>
                        {(neighborhood || lotNumber) && (
                            <p className="text-sm sm:text-base text-white/90 drop-shadow-lg">
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


