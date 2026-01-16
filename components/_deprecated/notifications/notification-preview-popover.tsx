"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell } from 'lucide-react'
import Link from "next/link"
import useSWR from "swr"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ExchangeNotificationCard } from "./exchange-notification-card"
import type { NotificationFull } from "@/types/notifications"
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NotificationPreviewPopoverProps {
  tenantSlug: string
  tenantId: string
  userId: string
}

export function NotificationPreviewPopover({ 
  tenantSlug, 
  tenantId, 
  userId 
}: NotificationPreviewPopoverProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const fetcher = async (url: string) => {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch")
        }
        const text = await response.text()
        console.error("[v0] Non-JSON error response:", text)
        throw new Error("Service temporarily unavailable")
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error("[v0] Fetch error:", error)
      throw error
    }
  }

  // Fetch unread count
  const { data: unreadCountData } = useSWR<{ count: number }>(
    `/api/notifications/${tenantId}/unread-count`,
    fetcher,
    {
      refreshInterval: 30000,
      fallbackData: { count: 0 },
      shouldRetryOnError: false,
      onError: (err) => console.error("[v0] Error fetching unread count:", err),
    },
  )

  const unreadCount = unreadCountData?.count || 0

  // Fetch recent notifications for preview (limit 5)
  const { data: notifications, mutate: mutateNotifications } = useSWR<NotificationFull[]>(
    open ? `/api/notifications/${tenantId}?limit=5` : null,
    fetcher,
    {
      fallbackData: [],
      shouldRetryOnError: false,
      onError: (err) => console.error("[v0] Error fetching notifications:", err),
    },
  )

  const popoverNotifications = notifications?.filter(n => 
    !n.is_read || (n.action_required && !n.action_taken)
  )

  const handleUpdate = () => {
    mutateNotifications()
  }

  const handleNotificationClick = (notificationId: string) => {
    setOpen(false)
    router.push(`/t/${tenantSlug}/dashboard/notifications`)
  }

  const contentHeight = popoverNotifications && popoverNotifications.length > 0 
    ? Math.min(popoverNotifications.length * 120, 400) 
    : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-3">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 ? (
            <Badge variant="secondary">{unreadCount} new</Badge>
          ) : null}
        </div>
        <Separator />

        {!popoverNotifications || popoverNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">
              No new notifications
            </p>
            <Button variant="outline" size="sm" asChild onClick={() => setOpen(false)}>
              <Link href={`/t/${tenantSlug}/dashboard/notifications`}>
                View All Notifications
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className={contentHeight ? `h-[${contentHeight}px]` : "max-h-[400px]"} style={{ height: contentHeight }}>
              <div className="p-2 space-y-2">
                {popoverNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    onClick={() => handleNotificationClick(notification.id)}
                    className="cursor-pointer"
                  >
                    <ExchangeNotificationCard
                      notification={notification}
                      tenantSlug={tenantSlug}
                      userId={userId}
                      onUpdate={handleUpdate}
                      compact
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator />
            <div className="p-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-between" 
                asChild
                onClick={() => setOpen(false)}
              >
                <Link href={`/t/${tenantSlug}/dashboard/notifications`}>
                  View All Notifications
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
