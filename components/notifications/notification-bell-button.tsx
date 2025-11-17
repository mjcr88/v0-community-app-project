"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell } from 'lucide-react'
import Link from "next/link"
import useSWR from "swr"

interface NotificationBellButtonProps {
  tenantSlug: string
  tenantId: string
  userId: string
}

export function NotificationBellButton({ tenantSlug, tenantId, userId }: NotificationBellButtonProps) {
  // Fetch unread count with SWR
  const { data: unreadCount } = useSWR<number>(
    `/api/notifications/${tenantId}/unread-count`,
    async () => {
      const response = await fetch(`/api/notifications/${tenantId}/unread-count`)
      if (!response.ok) return 0
      const data = await response.json()
      return data.count || 0
    },
    {
      refreshInterval: 30000, // Poll every 30 seconds
      fallbackData: 0,
    },
  )

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link href={`/t/${tenantSlug}/dashboard/notifications`}>
        <Bell className="h-5 w-5" />
        {unreadCount && unreadCount > 0 ? (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        ) : null}
      </Link>
    </Button>
  )
}
