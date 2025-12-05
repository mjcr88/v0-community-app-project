import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"

import type { ExchangePricingType, ExchangeCondition } from "@/types/exchange"

interface Step2PricingVisibilityProps {
    formData: {
        pricing_type: ExchangePricingType
        price: string
        condition: ExchangeCondition | ""
        available_quantity: string
        category_id: string
        visibility_scope: "community" | "neighborhood"
        neighborhood_ids: string[]
    }
    categories: Array<{ id: string; name: string }>
    neighborhoods: Array<{ id: string; name: string }>
    onUpdate: (data: Partial<Step2PricingVisibilityProps["formData"]>) => void
}

export function Step2PricingVisibility({
    formData,
    categories,
    neighborhoods,
    onUpdate,
}: Step2PricingVisibilityProps) {
    // Determine which fields to show based on category
    const selectedCategory = categories.find((c) => c.id === formData.category_id)
    const categoryName = selectedCategory?.name || ""

    const showCondition = categoryName === "Tools & Equipment"
    const showQuantity =
        categoryName === "Tools & Equipment" || categoryName === "Food & Produce"

    return (
        <div className="space-y-6">
            {/* Pricing Type */}
            <div className="space-y-3">
                <Label>Pricing <span className="text-destructive">*</span></Label>
                <RadioGroup
                    value={formData.pricing_type}
                    onValueChange={(value) =>
                        onUpdate({ pricing_type: value as ExchangePricingType })
                    }
                >
                    <div className="space-y-2">
                        <div className={`rounded-lg border-2 bg-card text-card-foreground shadow-none overflow-hidden ${formData.pricing_type === "free" ? "border-primary" : "border-border"}`}>
                            <label className="flex items-center gap-3 p-3 cursor-pointer">
                                <RadioGroupItem value="free" id="pricing-free" />
                                <div className="flex-1">
                                    <div className="font-medium">Free</div>
                                    <div className="text-xs text-muted-foreground">
                                        Share this item for free
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div className={`rounded-lg border-2 bg-card text-card-foreground shadow-none overflow-hidden ${formData.pricing_type === "fixed_price" ? "border-primary" : "border-border"}`}>
                            <label className="flex items-center gap-3 p-3 cursor-pointer">
                                <RadioGroupItem value="fixed_price" id="pricing-fixed" />
                                <div className="flex-1">
                                    <div className="font-medium">Fixed Price</div>
                                    <div className="text-xs text-muted-foreground">
                                        Set a specific price
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div
                            className={`rounded-lg border-2 bg-card text-card-foreground shadow-none overflow-hidden ${formData.pricing_type === "pay_what_you_want" ? "border-primary" : "border-border"}`}
                        >
                            <label className="flex items-center gap-3 p-3 cursor-pointer">
                                <RadioGroupItem value="pay_what_you_want" id="pricing-pwyw" />
                                <div className="flex-1">
                                    <div className="font-medium">Pay What You Want</div>
                                    <div className="text-xs text-muted-foreground">
                                        Let borrowers decide
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                </RadioGroup>
            </div>

            {/* Price (conditional) */}
            {formData.pricing_type === "fixed_price" && (
                <div className="space-y-2">
                    <Label htmlFor="price">
                        Price <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                        </span>
                        <Input
                            id="price"
                            type="number"
                            value={formData.price}
                            onChange={(e) => onUpdate({ price: e.target.value })}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="pl-7"
                            required
                        />
                    </div>
                </div>
            )}

            {/* Condition (conditional) */}
            {showCondition && (
                <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Select
                        value={formData.condition}
                        onValueChange={(value) =>
                            onUpdate({ condition: value as ExchangeCondition })
                        }
                    >
                        <SelectTrigger id="condition">
                            <SelectValue placeholder="Select condition (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="like_new">Like New</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="damaged">Damaged/For Parts</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Available Quantity (conditional) */}
            {showQuantity && (
                <div className="space-y-2">
                    <Label htmlFor="quantity">Available Quantity</Label>
                    <Input
                        id="quantity"
                        type="number"
                        value={formData.available_quantity || "1"}
                        onChange={(e) => onUpdate({ available_quantity: e.target.value })}
                        placeholder="1"
                        min="1"
                    />
                    <p className="text-xs text-muted-foreground">
                        How many of this item do you have available?
                    </p>
                </div>
            )}

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
                        <div className={`rounded-lg border-2 bg-card text-card-foreground shadow-none overflow-hidden ${formData.visibility_scope === "community" ? "border-primary" : "border-border"}`}>
                            <label className="flex items-center gap-3 p-3 cursor-pointer">
                                <RadioGroupItem value="community" id="visibility-community" />
                                <div className="flex-1">
                                    <div className="font-medium">Entire Community</div>
                                    <div className="text-xs text-muted-foreground">
                                        All community members can see this listing
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div className={`rounded-lg border-2 bg-card text-card-foreground shadow-none overflow-hidden ${formData.visibility_scope === "neighborhood" ? "border-primary" : "border-border"}`}>
                            <label className="flex items-center gap-3 p-3 cursor-pointer">
                                <RadioGroupItem value="neighborhood" id="visibility-neighborhood" />
                                <div className="flex-1">
                                    <div className="font-medium">Specific Neighborhoods</div>
                                    <div className="text-xs text-muted-foreground">
                                        Only selected neighborhoods can see this
                                    </div>
                                </div>
                            </label>
                        </div>
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
