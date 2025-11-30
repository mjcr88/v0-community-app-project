import { Badge } from "@/components/ui/badge"
import { Wrench, Apple, Briefcase, Home, Car, Shirt, Book, Heart, Sparkles } from 'lucide-react'
import { cn } from "@/lib/utils"
import { getCategoryEmoji } from "@/lib/exchange-category-emojis"

interface ExchangeCategoryBadgeProps {
  categoryName: string
  compact?: boolean
  className?: string
  showEmoji?: boolean
}

// Map category names to icons and colors
const categoryConfig: Record<string, { icon: React.ReactNode; className: string }> = {
  "Tools & Equipment": {
    icon: <Wrench className="h-3 w-3" />,
    className: "bg-[hsl(var(--forest-growth))]/10 text-[hsl(var(--forest-growth))] border-[hsl(var(--forest-growth))]/20",
  },
  "Food & Produce": {
    icon: <Apple className="h-3 w-3" />,
    className: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20",
  },
  "Services & Skills": {
    icon: <Briefcase className="h-3 w-3" />,
    className: "bg-[hsl(var(--sky))]/10 text-[hsl(var(--sky))] border-[hsl(var(--sky))]/20",
  },
  "House sitting & Rentals": {
    icon: <Home className="h-3 w-3" />,
    className: "bg-[hsl(var(--sunrise))]/10 text-[hsl(var(--sunrise))] border-[hsl(var(--sunrise))]/20",
  },
  "Rides & Carpooling": {
    icon: <Car className="h-3 w-3" />,
    className: "bg-[hsl(var(--river))]/10 text-[hsl(var(--river))] border-[hsl(var(--river))]/20",
  },
  "Clothing & Accessories": {
    icon: <Shirt className="h-3 w-3" />,
    className: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
  "Books & Media": {
    icon: <Book className="h-3 w-3" />,
    className: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  },
  "Health & Wellness": {
    icon: <Heart className="h-3 w-3" />,
    className: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
}

// Default fallback
const defaultConfig = {
  icon: <Sparkles className="h-3 w-3" />,
  className: "bg-muted text-muted-foreground border-border",
}

export function ExchangeCategoryBadge({ categoryName, compact = false, className, showEmoji = true }: ExchangeCategoryBadgeProps) {
  const config = categoryConfig[categoryName] || defaultConfig
  const emoji = getCategoryEmoji(categoryName)

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium border",
        compact ? "text-xs" : "",
        config.className,
        className
      )}
    >
      {showEmoji && <span className="text-base leading-none">{emoji}</span>}
      {categoryName}
    </Badge>
  )
}
