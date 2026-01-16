import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card } from "@/components/ui/card"
import type { ExchangePricingType, ExchangeCondition } from "@/types/exchange"

interface Step2DetailsPricingProps {
    formData: {
        pricing_type: ExchangePricingType
        price: string
        condition: ExchangeCondition | ""
        available_quantity: string
        category_id: string
    }
    categories: Array<{ id: string; name: string }>
    onUpdate: (data: Partial<Step2DetailsPricingProps["formData"]>) => void
}

export function Step2DetailsPricing({
    formData,
    categories,
    onUpdate,
}: Step2DetailsPricingProps) {
    // Determine which fields to show based on category
    const selectedCategory = categories.find((c) => c.id === formData.category_id)
    const categoryName = selectedCategory?.name || ""

    const showCondition = categoryName === "Tools & Equipment" || categoryName === "Household items"
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
                        <Card className={formData.pricing_type === "free" ? "border-primary" : ""}>
                            <label className="flex items-center gap-3 p-3 cursor-pointer">
                                <RadioGroupItem value="free" id="pricing-free" />
                                <div className="flex-1">
                                    <div className="font-medium">Free</div>
                                    <div className="text-xs text-muted-foreground">
                                        Share this item for free
                                    </div>
                                </div>
                            </label>
                        </Card>

                        <Card className={formData.pricing_type === "fixed_price" ? "border-primary" : ""}>
                            <label className="flex items-center gap-3 p-3 cursor-pointer">
                                <RadioGroupItem value="fixed_price" id="pricing-fixed" />
                                <div className="flex-1">
                                    <div className="font-medium">Fixed Price</div>
                                    <div className="text-xs text-muted-foreground">
                                        Set a specific price
                                    </div>
                                </div>
                            </label>
                        </Card>

                        <Card
                            className={
                                formData.pricing_type === "pay_what_you_want" ? "border-primary" : ""
                            }
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
                        </Card>
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
                            <SelectItem value="slightly_used">Slightly Used</SelectItem>
                            <SelectItem value="used">Used</SelectItem>
                            <SelectItem value="slightly_damaged">Slightly Damaged</SelectItem>
                            <SelectItem value="maintenance">Needs Maintenance</SelectItem>
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
                        value={formData.available_quantity}
                        onChange={(e) => onUpdate({ available_quantity: e.target.value })}
                        placeholder="1"
                        min="1"
                    />
                    <p className="text-xs text-muted-foreground">
                        How many of this item do you have available?
                    </p>
                </div>
            )}
        </div>
    )
}
