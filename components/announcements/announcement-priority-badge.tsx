import { Badge } from "@/components/ui/badge"

type Priority = "normal" | "important" | "urgent"

export function AnnouncementPriorityBadge({ priority }: { priority: Priority }) {
  const variants = {
    normal: { variant: "secondary" as const, label: "Normal" },
    important: { variant: "default" as const, label: "Important" },
    urgent: { variant: "destructive" as const, label: "Urgent" },
  }

  const config = variants[priority] || variants.normal

  return <Badge variant={config.variant}>{config.label}</Badge>
}
