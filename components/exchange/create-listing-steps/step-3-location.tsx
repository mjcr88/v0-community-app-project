import { Label } from "@/components/ui/label"
import { LocationSelector } from "@/components/event-forms/location-selector"

interface Step3LocationProps {
    formData: {
        location_type: "none" | "community" | "custom"
        location_id: string | null
        custom_location_name: string
        custom_location_lat: number | null
        custom_location_lng: number | null
    }
    tenantId: string
    initialLocation?: { id: string; name: string }
    onUpdate: (data: Partial<Step3LocationProps["formData"]>) => void
}

export function Step3Location({
    formData,
    tenantId,
    initialLocation,
    onUpdate,
}: Step3LocationProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <Label>Location (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                    Where can people find this item or service?
                </p>

                <LocationSelector
                    tenantId={tenantId}
                    locationType={formData.location_type}
                    communityLocationId={formData.location_id}
                    customLocationName={formData.custom_location_name}
                    customLocationCoordinates={
                        formData.custom_location_lat && formData.custom_location_lng
                            ? {
                                lat: formData.custom_location_lat,
                                lng: formData.custom_location_lng,
                            }
                            : null
                    }
                    onLocationTypeChange={(type) => onUpdate({ location_type: type })}
                    onCommunityLocationChange={(locationId) =>
                        onUpdate({ location_id: locationId })
                    }
                    onCustomLocationNameChange={(name) =>
                        onUpdate({ custom_location_name: name })
                    }
                    onCustomLocationChange={(data) => {
                        if (data.coordinates) {
                            onUpdate({
                                custom_location_lat: data.coordinates.lat,
                                custom_location_lng: data.coordinates.lng,
                            })
                        }
                    }}
                />
            </div>
        </div>
    )
}
