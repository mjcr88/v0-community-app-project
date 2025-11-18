import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

export function UpdatedIndicator({ lastEditedAt }: { lastEditedAt: string }) {
  const timeAgo = formatDistanceToNow(new Date(lastEditedAt), { addSuffix: true })

  return (
    <Badge variant="outline" className="text-xs">
      Updated {timeAgo}
    </Badge>
  )
}
