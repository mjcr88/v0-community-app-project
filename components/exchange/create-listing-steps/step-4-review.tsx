import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, MapPin, Users, Package, DollarSign } from "lucide-react"
import type { ExchangePricingType, ExchangeCondition } from "@/types/exchange"

interface Step4ReviewProps {
    formData: {
        title: string
        description: string
        category_id: string
        pricing_type: ExchangePricingType
        price: string
        condition: ExchangeCondition | ""
        available_quantity: string
        visibility_scope: "community" | "neighborhood"
        neighborhood_ids: string[]
        location_type: "none" | "community" | "custom"
        location_id: string | null
        custom_location_name: string
        photos: string[]
    }
    categories: Array<{ id: string; name: string }>
    neighborhoods: Array<{ id: string; name: string }>
    onEditStep: (step: number) => void
}

export function Step4Review({
    formData,
    categories,
    neighborhoods,
    onEditStep,
}: Step4ReviewProps) {
    const selectedCategory = categories.find((c) => c.id === formData.category_id)
    const selectedNeighborhoods = neighborhoods.filter((n) =>
        formData.neighborhood_ids.includes(n.id)
    )

    const getPricingDisplay = () => {
        if (formData.pricing_type === "free") return "Free"
        if (formData.pricing_type === "pay_what_you_want") return "Pay What You Want"
        return `$${formData.price || "0"}`
    }

    const getConditionDisplay = () => {
        if (!formData.condition) return null
        const conditionMap: Record<string, string> = {
            new: "New",
            like_new: "Like New",
            good: "Good",
            fair: "Fair",
            damaged: "Damaged/For Parts",
        }
        return conditionMap[formData.condition] || formData.condition
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Review your listing details before publishing
            </p>

            {/* Basic Information */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base">Basic Information</CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditStep(1)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {formData.photos.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {formData.photos.map((photo, index) => (
                                <img
                                    key={index}
                                    src={photo}
                                    alt={`Photo ${index + 1}`}
                                    className="h-20 w-20 rounded-lg object-cover border"
                                />
                            ))}
                        </div>
                    )}
                    <div>
                        <p className="font-semibold text-lg">{formData.title}</p>
                        {selectedCategory && (
                            <Badge variant="outline" className="mt-1">
                                {selectedCategory.name}
                            </Badge>
                        )}
                    </div>
                    {formData.description && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {formData.description}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Pricing & Visibility */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base">Pricing & Visibility</CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditStep(2)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{getPricingDisplay()}</span>
                    </div>
                    {getConditionDisplay() && (
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Condition: {getConditionDisplay()}</span>
                        </div>
                    )}
                    {formData.available_quantity && (
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Quantity: {formData.available_quantity}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t mt-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            {formData.visibility_scope === "community" && "Entire community"}
                            {formData.visibility_scope === "neighborhood" &&
                                `${selectedNeighborhoods.length} neighborhood(s)`}
                        </span>
                    </div>
                    {selectedNeighborhoods.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1 pl-6">
                            {selectedNeighborhoods.map((n) => (
                                <Badge key={n.id} variant="secondary" className="text-xs">
                                    {n.name}
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Location */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base">Location</CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditStep(3)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            {formData.location_type === "none" && "No location specified"}
                            {formData.location_type === "community" && "Community location"}
                            {formData.location_type === "custom" &&
                                (formData.custom_location_name || "Custom location")}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
