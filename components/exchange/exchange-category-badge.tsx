import { Badge } from "@/components/ui/badge"

interface ExchangeCategoryBadgeProps {
  categoryName: string
  compact?: boolean
}

export function ExchangeCategoryBadge({ categoryName, compact = false }: ExchangeCategoryBadgeProps) {
  return (
    <Badge variant="secondary" className={compact ? "text-xs" : ""}>
      {categoryName}
    </Badge>
  )
}
