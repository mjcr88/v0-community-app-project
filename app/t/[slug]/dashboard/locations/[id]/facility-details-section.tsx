"use client"

import { useState } from "react"
import { sanitizeHtml } from "@/lib/sanitize-html"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, Users, Calendar, ChevronDown } from "lucide-react"

interface FacilityDetailsSectionProps {
    location: {
        capacity?: number | null
        max_occupancy?: number | null
        hours?: string | null
        amenities?: string[] | null
        parking_spaces?: number | null
        accessibility_features?: string | null
        rules?: string | null
    }
}

export function FacilityDetailsSection({ location }: FacilityDetailsSectionProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <Info className="h-5 w-5" />
                                <CardTitle className="text-lg font-semibold">Facility Details</CardTitle>
                            </div>
                            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="space-y-6 pt-0">
                        {(location.capacity || location.max_occupancy) && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Capacity & Occupancy
                                </h4>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    {location.capacity && <div>Capacity: {location.capacity} people</div>}
                                    {location.max_occupancy && <div>Max Occupancy: {location.max_occupancy} people</div>}
                                </div>
                            </div>
                        )}

                        {location.hours && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Operating Hours
                                </h4>
                                <div className="text-sm text-muted-foreground whitespace-pre-line">{location.hours}</div>
                            </div>
                        )}

                        {location.amenities && location.amenities.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold mb-3">Amenities ({location.amenities.length})</h4>
                                <div className="flex flex-wrap gap-2">
                                    {location.amenities.map((amenity) => (
                                        <Badge key={amenity} variant="secondary">
                                            {amenity}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {location.parking_spaces !== null && location.parking_spaces !== undefined && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2">Parking</h4>
                                <div className="text-sm text-muted-foreground">
                                    {location.parking_spaces > 0
                                        ? `${location.parking_spaces} parking spaces available`
                                        : "No parking available"}
                                </div>
                            </div>
                        )}

                        {location.accessibility_features && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2">Accessibility Features</h4>
                                <div className="text-sm text-muted-foreground">
                                    {location.accessibility_features.split(" | ").map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <span className="text-primary mt-1">•</span>
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {location.rules && (
                            <div>
                                <h4 className="text-sm font-semibold mb-3">Rules & Guidelines</h4>
                                <div
                                    className="prose prose-sm max-w-none text-sm text-muted-foreground"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(location.rules) }}
                                />
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}
