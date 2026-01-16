"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    Mail, Phone, Calendar, Globe, Languages, Lightbulb, Wrench,
    Users, PawPrint, Eye, EyeOff, MapPin, Home
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"

interface ProfileInfoPanelsProps {
    filteredResident: any
    resident: any
    pets: any[]
    tenantSlug: string
}

function PrivacyBadge({ show, label }: { show: boolean; label: string }) {
    if (show) return null

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <EyeOff className="h-3 w-3" />
                        Hidden
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-xs">{label} is private</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export function ProfileInfoPanels({ filteredResident, resident, pets, tenantSlug }: ProfileInfoPanelsProps) {
    return (
        <div className="space-y-4">
            {/* Contact Information */}
            {((filteredResident.show_email && filteredResident.email) ||
                (filteredResident.show_phone && filteredResident.phone) ||
                !filteredResident.show_email ||
                !filteredResident.show_phone) && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Contact Information</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    {filteredResident.show_email && filteredResident.email ? (
                                        <a href={`mailto:${filteredResident.email}`} className="text-sm hover:underline">
                                            {filteredResident.email}
                                        </a>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Email</span>
                                    )}
                                </div>
                                <PrivacyBadge show={filteredResident.show_email} label="Email" />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    {filteredResident.show_phone && filteredResident.phone ? (
                                        <a href={`tel:${filteredResident.phone}`} className="text-sm hover:underline">
                                            {filteredResident.phone}
                                        </a>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Phone</span>
                                    )}
                                </div>
                                <PrivacyBadge show={filteredResident.show_phone} label="Phone" />
                            </div>
                        </CardContent>
                    </Card>
                )}

            {/* Personal Information */}
            {((filteredResident.show_birth_country && filteredResident.birth_country) ||
                (filteredResident.show_current_country && filteredResident.current_country) ||
                (filteredResident.show_birthday && filteredResident.birthday)) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {filteredResident.show_birthday && filteredResident.birthday && (
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        Birthday: {new Date(filteredResident.birthday).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                            {filteredResident.show_birth_country && filteredResident.birth_country && (
                                <div className="flex items-center gap-3">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">From: {filteredResident.birth_country}</span>
                                </div>
                            )}
                            {filteredResident.show_current_country && filteredResident.current_country && (
                                <div className="flex items-center gap-3">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Currently in: {filteredResident.current_country}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

            {/* Languages */}
            {filteredResident.show_languages && filteredResident.languages && filteredResident.languages.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Languages className="h-5 w-5" />
                            Languages
                        </CardTitle>
                        {filteredResident.show_preferred_language && filteredResident.preferred_language && (
                            <CardDescription>Preferred: {filteredResident.preferred_language}</CardDescription>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {filteredResident.languages.map((language: string) => (
                                <Badge key={language} variant="secondary">
                                    {language}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Interests */}
            {filteredResident.show_interests &&
                filteredResident.user_interests &&
                filteredResident.user_interests.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Lightbulb className="h-5 w-5" />
                                Interests
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {filteredResident.user_interests.map((ui: any) => (
                                    <Badge key={ui.interests.id} variant="secondary">
                                        {ui.interests.name}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

            {/* Skills */}
            {filteredResident.show_skills &&
                filteredResident.user_skills &&
                filteredResident.user_skills.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Wrench className="h-5 w-5" />
                                Skills
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {filteredResident.user_skills.map((us: any) => (
                                    <Badge
                                        key={us.skills.id}
                                        variant={us.open_to_requests ? "default" : "secondary"}
                                    >
                                        {us.skills.name}
                                        {us.open_to_requests && filteredResident.show_open_to_requests && (
                                            <span className="ml-1">✓</span>
                                        )}
                                    </Badge>
                                ))}
                            </div>
                            {filteredResident.show_open_to_requests &&
                                filteredResident.user_skills.some((us: any) => us.open_to_requests) && (
                                    <p className="text-xs text-muted-foreground mt-3">
                                        ✓ = Open to help requests
                                    </p>
                                )}
                        </CardContent>
                    </Card>
                )}

            {/* Family */}
            {filteredResident.show_family && resident.family_units && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5" />
                            Family
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm font-medium">{resident.family_units.name}</p>
                        <Button variant="outline" size="sm" className="w-full" asChild>
                            <Link href={`/t/${tenantSlug}/dashboard/families/${resident.family_unit_id}`}>
                                View Family Profile
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Pets */}
            {filteredResident.show_family && pets && pets.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <PawPrint className="h-5 w-5" />
                            Family Pets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {pets.map((pet: any) => (
                                <div key={pet.id} className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{pet.name}</span>
                                    <span className="text-muted-foreground capitalize">{pet.type}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
