import { Badge } from "@/components/ui/badge"
import { DollarSign, Gift, HandCoins } from 'lucide-react'

type PricingType = "free" | "fixed_price" | "pay_what_you_want"

interface ExchangePriceBadgeProps {
  pricingType: PricingType
  price?: number | null
  compact?: boolean
}

export function ExchangePriceBadge({ pricingType, price, compact = false }: ExchangePriceBadgeProps) {
  if (pricingType === "free") {
    return (
      <Badge variant="default" className={compact ? "text-xs gap-1 bg-green-600" : "gap-1 bg-green-600"}>
        <Gift className="h-3 w-3" />
        Free
      </Badge>
    )
  }

  if (pricingType === "pay_what_you_want") {
    return (
      <Badge variant="secondary" className={compact ? "text-xs gap-1" : "gap-1"}>
        <HandCoins className="h-3 w-3" />
        PWYW
      </Badge>
    )
  }

  // fixed_price
  return (
    <Badge variant="outline" className={compact ? "text-xs gap-1" : "gap-1"}>
      <DollarSign className="h-3 w-3" />
      {price ? `${price.toFixed(2)}` : "Price TBD"}
    </Badge>
  )
}
