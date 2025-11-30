"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Home, Star } from "lucide-react"

interface FamilyMemberCardProps {
    member: any
    currentUserFamilyId: string
    tenantSlug: string
    compact?: boolean
    currentUserId?: string
    isPrimaryContact?: boolean
}

export function FamilyMemberCard({
    member,
    currentUserFamilyId,
    tenantSlug,
    compact = false,
    currentUserId,
    isPrimaryContact
}: FamilyMemberCardProps) {
    const router = useRouter()
    const isCurrentUser = currentUserId && member.id === currentUserId

    // Get initials for avatar fallback
    const initials = `${member.first_name?.[0] || ""}${member.last_name?.[0] || ""}`.toUpperCase()

    // Check if location should be shown (based on privacy)
    const showLocation = member.show_neighborhood !== false

    return (
        <Card
            className={`hover:shadow-md transition-all duration-200 cursor-pointer relative ${compact ? "h-auto" : ""} ${isCurrentUser ? "border-2 border-primary/50 shadow-md" : ""
                }`}
            onClick={() => router.push(`/t/${tenantSlug}/dashboard/neighbours/${member.id}`)}
        >
            <CardContent className={compact ? "p-3" : "p-4"}>
                <div className="flex gap-3 items-center">
                    {/* Avatar - smaller in compact mode */}
                    <Avatar className={compact ? "h-12 w-12" : "h-16 w-16"}>
                        <AvatarImage
                            src={member.show_profile_picture !== false ? member.profile_picture_url : undefined}
                            alt={`${member.first_name} ${member.last_name}`}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                            {/* Name */}
                            <h4 className={`font-semibold truncate ${compact ? "text-sm" : "text-base"}`}>
                                {member.first_name} {member.last_name}
                            </h4>
                            {isPrimaryContact && (
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                    Primary Contact
                                </Badge>
                            )}
                        </div>

                        {/* Location - Only show if allowed by privacy */}
                        {showLocation && (member.lots?.neighborhoods?.name || member.lots?.lot_number) && (
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {member.lots?.neighborhoods?.name && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span className="truncate">{member.lots.neighborhoods.name}</span>
                                    </div>
                                )}
                                {member.lots?.lot_number && (
                                    <div className="flex items-center gap-1">
                                        <Home className="h-3 w-3" />
                                        <span>Lot {member.lots.lot_number}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Relationship if available */}
                        {member.family_relationship && (
                            <p className="text-xs text-muted-foreground capitalize">
                                {member.family_relationship}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
