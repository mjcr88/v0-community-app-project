"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Megaphone, Plus, AlertCircle } from 'lucide-react'
import Link from "next/link"
import { AnnouncementTypeIcon } from "@/components/announcements/announcement-type-icon"
import { AnnouncementPriorityBadge } from "@/components/announcements/announcement-priority-badge"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"
import { RioEmptyState } from "./rio-empty-state"

import { AnnouncementType } from "@/types/announcements"

interface Announcement {
  id: string
  title: string
  announcement_type: AnnouncementType
  priority: "urgent" | "important" | "normal"
  description: string
  published_at: string
  auto_archive_date: string | null
}

interface AnnouncementsWidgetProps {
  slug: string
  tenantId: string
  userId: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AnnouncementsWidget({ slug, tenantId, userId }: AnnouncementsWidgetProps) {
  const { data: announcements, isLoading } = useSWR<{ announcements: Announcement[]; unreadCount: number }>(
    `/api/announcements/unread/${tenantId}`,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: true,
    }
  )

  const recentAnnouncements = announcements?.announcements || []
  const unreadCount = announcements?.unreadCount || 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-muted-foreground">Loading announcements...</div>
      </div>
    )
  }

  if (recentAnnouncements.length === 0) {
    return (
      <RioEmptyState
        title="No new announcements"
        message="You're all caught up! Check the archive for past updates."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={`/t/${slug}/dashboard/announcements`}>View Archive</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Latest Updates</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
              {unreadCount} New
            </Badge>
          )}
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/t/${slug}/dashboard/announcements`}>View All</Link>
        </Button>
      </div>

      <div className="grid gap-3">
        {recentAnnouncements.map((announcement) => (
          <Link key={announcement.id} href={`/t/${slug}/dashboard/announcements/${announcement.id}`}>
            <div className="group flex gap-4 p-4 rounded-xl border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <div className="flex-shrink-0 mt-1">
                <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <AnnouncementTypeIcon type={announcement.announcement_type} className="h-5 w-5" />
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                    {announcement.title}
                  </h4>
                  <AnnouncementPriorityBadge priority={announcement.priority} />
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {announcement.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')}
                </p>

                <div className="flex items-center gap-3 pt-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(announcement.published_at), "MMM d, yyyy")}
                  </span>
                  {announcement.priority === "urgent" && (
                    <span className="text-xs font-medium text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Urgent Action Required
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
