"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, MapPin, PawPrint } from "lucide-react"
import { cn } from "@/lib/utils"

interface FamilyCardProps {
    family: any
    tenantSlug: string
    currentUserFamilyId: string | null
}

export function FamilyCard({ family, tenantSlug, currentUserFamilyId }: FamilyCardProps) {
    const isYourFamily = family.id === currentUserFamilyId

    // Get lot info from first member
    const firstMember = Array.isArray(family.users) && family.users.length > 0 ? family.users[0] : null
    const neighborhood = firstMember?.lots?.neighborhoods?.name
    const lotNumber = firstMember?.lots?.lot_number

    const memberCount = Array.isArray(family.users) ? family.users.length : 0
    const petCount = Array.isArray(family.pets) ? family.pets.length : 0

    const initials = family.name
        .split(" ")
        .map((word: string) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()

    return (
        <Link href={`/t/${tenantSlug}/dashboard/families/${family.id}`}>
            <Card className={cn(
                "hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden",
                isYourFamily && "border-2 border-primary/50 shadow-lg"
            )}>
                <CardContent className="p-4">
                    <div className="flex gap-4 items-center">
                        {/* Avatar */}
                        <Avatar className="h-16 w-16 flex-shrink-0">
                            <AvatarImage src={family.profile_picture_url} alt={family.name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                            {/* Family Name */}
                            <div className="space-y-1">
                                <h3 className="font-semibold text-base truncate">{family.name}</h3>
                                {isYourFamily && (
                                    <Badge variant="default" className="bg-primary text-xs">
                                        Your Family
                                    </Badge>
                                )}
                            </div>

                            {/* Location */}
                            {neighborhood && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">
                                        {neighborhood}
                                        {lotNumber && ` - Lot ${lotNumber}`}
                                    </span>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="flex gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>{memberCount} {memberCount === 1 ? "member" : "members"}</span>
                                </div>
                                {petCount > 0 && (
                                    <div className="flex items-center gap-1">
                                        <PawPrint className="h-3 w-3" />
                                        <span>{petCount} {petCount === 1 ? "pet" : "pets"}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
