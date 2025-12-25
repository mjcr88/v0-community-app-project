import { Button } from "@/components/ui/button"

import { Badge } from "@/components/ui/badge"
import { Pencil, MapPin, Users, Package, DollarSign } from "lucide-react"
import type { ExchangePricingType, ExchangeCondition } from "@/types/exchange"

interface Step5ReviewProps {
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

export function Step5Review({
    formData,
    categories,
    neighborhoods,
    onEditStep,
}: Step5ReviewProps) {
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
            slightly_used: "Slightly Used",
            used: "Used",
            slightly_damaged: "Slightly Damaged",
            maintenance: "Needs Maintenance",
        }
        return conditionMap[formData.condition] || formData.condition
    }

    return (
        <div className="space-y-3">
            {/* Basic Information */}
            <div className="rounded-lg border-2 bg-card text-card-foreground shadow-none">
                <div className="flex flex-row items-center justify-between space-y-0 p-3 pb-0">
                    <div className="font-semibold leading-none tracking-tight text-base">Basic Information</div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditStep(2)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>
                <div className="p-3 pt-2 space-y-3">
                    {/* ... content ... */}
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
                        <div className="flex items-center gap-2 mt-1">
                            {selectedCategory && (
                                <Badge variant="outline">
                                    {selectedCategory.name}
                                </Badge>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => onEditStep(1)}
                            >
                                <Pencil className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                    {formData.description && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {formData.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Pricing & Visibility */}
            <div className="rounded-lg border-2 bg-card text-card-foreground shadow-none">
                <div className="flex flex-row items-center justify-between space-y-0 p-3 pb-0">
                    <div className="font-semibold leading-none tracking-tight text-base">Pricing & Visibility</div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditStep(3)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>
                {/* ... content ... */}
            </div>

            {/* Location */}
            <div className="rounded-lg border-2 bg-card text-card-foreground shadow-none">
                <div className="flex flex-row items-center justify-between space-y-0 p-3 pb-0">
                    <div className="font-semibold leading-none tracking-tight text-base">Location</div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditStep(4)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>
                {/* ... content ... */}
            </div>
        </div>
    )
}
