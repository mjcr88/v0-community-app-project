import { Badge } from "@/components/ui/badge"
import { DollarSign, Gift, HandCoins, MessageCircle } from 'lucide-react'
import { cn } from "@/lib/utils"
import type { ExchangePricingType } from "@/types/exchange"

interface ExchangePriceBadgeProps {
  pricingType: ExchangePricingType | string
  price?: number | null
  compact?: boolean
  className?: string
}

export function ExchangePriceBadge({ pricingType, price, compact = false, className }: ExchangePriceBadgeProps) {
  if (pricingType === "free") {
    return (
      <Badge
        variant="default"
        className={cn(
          compact ? "text-xs gap-1" : "gap-1",
          "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 border-[hsl(var(--success))]",
          className
        )}
      >
        <Gift className="h-3 w-3" />
        Free
      </Badge>
    )
  }

  if (pricingType === "pay_what_you_want") {
    return (
      <Badge
        variant="outline"
        className={cn(
          compact ? "text-xs gap-1" : "gap-1",
          "bg-[hsl(var(--sky))]/10 text-[hsl(var(--sky))] border-[hsl(var(--sky))]/20",
          className
        )}
      >
        <HandCoins className="h-3 w-3" />
        PWYW
      </Badge>
    )
  }

  if (pricingType === "negotiable") {
    return (
      <Badge
        variant="outline"
        className={cn(
          compact ? "text-xs gap-1" : "gap-1",
          "bg-[hsl(var(--river))]/10 text-[hsl(var(--river))] border-[hsl(var(--river))]/20",
          className
        )}
      >
        <MessageCircle className="h-3 w-3" />
        Negotiable
      </Badge>
    )
  }

  // fixed_price
  return (
    <Badge
      variant="outline"
      className={cn(
        compact ? "text-xs gap-1" : "gap-1 font-semibold",
        "bg-[hsl(var(--sunrise))]/10 text-[hsl(var(--sunrise))] border-[hsl(var(--sunrise))]/20",
        className
      )}
    >
      <DollarSign className="h-3 w-3" />
      {price ? `$${price.toFixed(2)}` : "Price TBD"}
    </Badge>
  )
}
