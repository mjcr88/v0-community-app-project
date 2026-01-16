import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Home, Users } from "lucide-react"
import Image from "next/image"

interface ProfileHeroSectionProps {
    resident: any
    filteredData: any
    isFamily: boolean
    coverPhoto?: string | null
}

export function ProfileHeroSection({ resident, filteredData, isFamily, coverPhoto }: ProfileHeroSectionProps) {
    const initials = `${resident.first_name?.[0] || ""}${resident.last_name?.[0] || ""}`.toUpperCase()
    const displayName = `${filteredData.first_name || ""} ${filteredData.last_name || ""}`.trim()

    return (
        <Card className="overflow-hidden">
            {/* Cover Photo */}
            <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5">
                {coverPhoto && (
                    <Image
                        src={coverPhoto}
                        alt="Cover photo"
                        fill
                        className="object-cover"
                    />
                )}
            </div>

            <CardContent className="relative -mt-16 px-6 pb-6">
                {/* Avatar */}
                <div className="flex items-end justify-between mb-4">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                        <AvatarImage
                            src={filteredData.show_profile_picture ? resident.profile_picture_url : undefined}
                            alt={displayName}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    {isFamily && (
                        <Badge variant="default" className="mb-2">
                            <Users className="h-3 w-3 mr-1" />
                            Family Member
                        </Badge>
                    )}
                </div>

                {/* Name and Basic Info */}
                <div className="space-y-3">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
                        {filteredData.show_family && resident.family_units?.name && (
                            <p className="text-muted-foreground mt-1">{resident.family_units.name}</p>
                        )}
                    </div>

                    {/* Location */}
                    {filteredData.show_neighborhood && (resident.lots?.neighborhoods?.name || resident.lots?.lot_number) && (
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {resident.lots?.neighborhoods?.name && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{resident.lots.neighborhoods.name}</span>
                                </div>
                            )}
                            {resident.lots?.lot_number && (
                                <div className="flex items-center gap-2">
                                    <Home className="h-4 w-4" />
                                    <span>Lot {resident.lots.lot_number}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
