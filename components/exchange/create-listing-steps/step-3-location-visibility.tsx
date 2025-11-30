import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { LocationSelector } from "@/components/event-forms/location-selector"

interface Step3LocationVisibilityProps {
    formData: {
        location_type: "none" | "community" | "custom"
        location_id: string | null
        custom_location_name: string
        custom_location_lat: number | null
        custom_location_lng: number | null
        visibility_scope: "community" | "neighborhood"
        neighborhood_ids: string[]
    }
    tenantId: string
    initialLocation?: { id: string; name: string }
    neighborhoods: Array<{ id: string; name: string }>
    onUpdate: (data: Partial<Step3LocationVisibilityProps["formData"]>) => void
}

export function Step3LocationVisibility({
    formData,
    tenantId,
    initialLocation,
    neighborhoods,
    onUpdate,
}: Step3LocationVisibilityProps) {
    return (
        <div className="space-y-6">
            {/* Location */}
            <div className="space-y-3">
                <Label>Location (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                    Where can people find this item or service?
                </p>

                <LocationSelector
                    tenantId={tenantId}
                    selected={
                        formData.location_type === "none"
                            ? null
                            : formData.location_type === "community"
                                ? {
                                    type: "community_location" as const,
                                    locationId: formData.location_id || "",
                                }
                                : {
                                    type: "custom_location" as const,
                                    name: formData.custom_location_name,
                                    coordinates: {
                                        lat: formData.custom_location_lat || 0,
                                        lng: formData.custom_location_lng || 0,
                                    },
                                }
                    }
                    onChange={(location) => {
                        if (!location) {
                            onUpdate({
                                location_type: "none",
                                location_id: null,
                                custom_location_name: "",
                                custom_location_lat: null,
                                custom_location_lng: null,
                            })
                        } else if (location.type === "community_location") {
                            onUpdate({
                                location_type: "community",
                                location_id: location.locationId,
                                custom_location_name: "",
                                custom_location_lat: null,
                                custom_location_lng: null,
                            })
                        } else {
                            onUpdate({
                                location_type: "custom",
                                location_id: null,
                                custom_location_name: location.name,
                                custom_location_lat: location.coordinates.lat,
                                custom_location_lng: location.coordinates.lng,
                            })
                        }
                    }}
                    initialLocation={initialLocation}
                />
            </div>

            {/* Visibility Scope */}
            <div className="space-y-3">
                <Label>Who can see this listing? <span className="text-destructive">*</span></Label>
                <RadioGroup
                    value={formData.visibility_scope}
                    onValueChange={(value) =>
                        onUpdate({
                            visibility_scope: value as "community" | "neighborhood",
                            // Clear neighborhood selection if switching to community
                            neighborhood_ids: value === "community" ? [] : formData.neighborhood_ids,
                        })
                    }
                >
                    <div className="space-y-2">
                        <Card className={formData.visibility_scope === "community" ? "border-primary" : ""}>
                            <label className="flex items-center gap-3 p-4 cursor-pointer">
                                <RadioGroupItem value="community" id="visibility-community" />
                                <div className="flex-1">
                                    <div className="font-medium">Entire Community</div>
                                    <div className="text-sm text-muted-foreground">
                                        All community members can see this listing
                                    </div>
                                </div>
                            </label>
                        </Card>

                        <Card className={formData.visibility_scope === "neighborhood" ? "border-primary" : ""}>
                            <label className="flex items-center gap-3 p-4 cursor-pointer">
                                <RadioGroupItem value="neighborhood" id="visibility-neighborhood" />
                                <div className="flex-1">
                                    <div className="font-medium">Specific Neighborhoods</div>
                                    <div className="text-sm text-muted-foreground">
                                        Only selected neighborhoods can see this
                                    </div>
                                </div>
                            </label>
                        </Card>
                    </div>
                </RadioGroup>
            </div>

            {/* Neighborhood Selection (conditional) */}
            {formData.visibility_scope === "neighborhood" && (
                <div className="space-y-3">
                    <Label>
                        Select Neighborhoods <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Choose at least one neighborhood
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                        {neighborhoods.map((neighborhood) => (
                            <div key={neighborhood.id} className="flex items-center gap-2">
                                <Checkbox
                                    id={`neighborhood-${neighborhood.id}`}
                                    checked={formData.neighborhood_ids.includes(neighborhood.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            onUpdate({
                                                neighborhood_ids: [
                                                    ...formData.neighborhood_ids,
                                                    neighborhood.id,
                                                ],
                                            })
                                        } else {
                                            onUpdate({
                                                neighborhood_ids: formData.neighborhood_ids.filter(
                                                    (id) => id !== neighborhood.id
                                                ),
                                            })
                                        }
                                    }}
                                />
                                <Label
                                    htmlFor={`neighborhood-${neighborhood.id}`}
                                    className="cursor-pointer font-normal flex-1"
                                >
                                    {neighborhood.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
