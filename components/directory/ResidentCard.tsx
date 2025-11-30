"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, MapPin, Home } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { filterPrivateData } from "@/lib/privacy-utils"

interface ResidentCardProps {
    resident: any
    tenantSlug: string
    currentUserFamilyId: string | null
}

export function ResidentCard({ resident, tenantSlug, currentUserFamilyId }: ResidentCardProps) {
    const router = useRouter()

    const privacySettings = Array.isArray(resident.user_privacy_settings)
        ? resident.user_privacy_settings[0]
        : resident.user_privacy_settings

    const isFamily = resident.family_unit_id === currentUserFamilyId
    const filteredData = filterPrivateData(resident, privacySettings, isFamily)

    // Count hidden fields
    const hiddenFieldsCount = [
        !filteredData.show_email,
        !filteredData.show_phone,
        !filteredData.show_neighborhood,
        !filteredData.show_family,
        !filteredData.show_interests,
        !filteredData.show_skills,
    ].filter(Boolean).length

    const showPrivacyBadge = hiddenFieldsCount > 0 && !isFamily

    // Get initials for avatar fallback
    const initials = `${resident.first_name?.[0] || ""}${resident.last_name?.[0] || ""}`.toUpperCase()

    return (
        <Card
            className="hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden group"
            onClick={() => router.push(`/t/${tenantSlug}/dashboard/neighbours/${resident.id}`)}
        >
            {showPrivacyBadge && (
                <div className="absolute top-3 right-3 z-10">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Badge variant="secondary" className="gap-1">
                                    <EyeOff className="h-3 w-3" />
                                    {hiddenFieldsCount}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs">{hiddenFieldsCount} private field{hiddenFieldsCount > 1 ? "s" : ""}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )}

            <CardContent className="p-4">
                <div className="flex gap-4 items-center">
                    {/* Avatar */}
                    <Avatar className="h-16 w-16 flex-shrink-0">
                        <AvatarImage
                            src={filteredData.show_profile_picture ? resident.profile_picture_url : undefined}
                            alt={`${resident.first_name} ${resident.last_name}`}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                        {/* Name */}
                        <h3 className="font-semibold text-base truncate">
                            {resident.first_name} {resident.last_name}
                        </h3>

                        {/* Location - Only show if not private */}
                        {filteredData.show_neighborhood && (resident.lots?.neighborhoods?.name || resident.lots?.lot_number) && (
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {resident.lots?.neighborhoods?.name && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span className="truncate">{resident.lots.neighborhoods.name}</span>
                                    </div>
                                )}
                                {resident.lots?.lot_number && (
                                    <div className="flex items-center gap-1">
                                        <Home className="h-3 w-3" />
                                        <span>Lot {resident.lots.lot_number}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Family - Always render to maintain consistent height */}
                        <div className="text-xs text-muted-foreground truncate min-h-[1.25rem]">
                            {filteredData.show_family && resident.family_units?.name ? (
                                resident.family_units.name
                            ) : (
                                <span className="opacity-0">-</span>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
