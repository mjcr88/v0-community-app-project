import { Clock } from 'lucide-react'
import { formatDistanceToNow } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface UpdatedIndicatorProps {
  publishedAt: string | null
  lastEditedAt: string
}

export function UpdatedIndicator({ publishedAt, lastEditedAt }: UpdatedIndicatorProps) {
  if (!publishedAt) return null

  const updated = new Date(lastEditedAt)
  const published = new Date(publishedAt)

  // Only show if updated at least 1 minute after publishing
  if (updated.getTime() - published.getTime() < 60000) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" />
            <span>Updated</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Updated {formatDistanceToNow(updated, { addSuffix: true })}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
