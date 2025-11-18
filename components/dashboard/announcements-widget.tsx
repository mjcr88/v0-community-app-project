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

interface Announcement {
  id: string
  title: string
  type: "general" | "maintenance" | "event" | "alert" | "community_update" | "resource"
  priority: "urgent" | "important" | "normal"
  content: string
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
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: false,
    }
  )

  const unreadAnnouncements = announcements?.announcements || []
  const unreadCount = announcements?.unreadCount || 0

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Community Announcements</CardTitle>
          <CardDescription>Loading announcements...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (unreadAnnouncements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Community Announcements</CardTitle>
          <CardDescription>Stay updated with official community news</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              No new announcements at the moment
            </p>
            <Button asChild variant="outline">
              <Link href={`/t/${slug}/dashboard/announcements`}>View All Announcements</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            Community Announcements
            {unreadCount > 0 && (
              <Badge variant="default" className="ml-2">
                {unreadCount} New
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Latest updates from community management
          </CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/t/${slug}/dashboard/announcements`}>View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {unreadAnnouncements.map((announcement) => (
            <Link key={announcement.id} href={`/t/${slug}/dashboard/announcements/${announcement.id}`}>
              <div className="flex gap-3 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                {/* Type icon */}
                <div className="flex-shrink-0 mt-0.5">
                  <AnnouncementTypeIcon type={announcement.type} className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm leading-tight line-clamp-1">{announcement.title}</h4>
                    <AnnouncementPriorityBadge priority={announcement.priority} />
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {announcement.content}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{format(new Date(announcement.published_at), "MMM d, yyyy")}</span>
                    {announcement.priority === "urgent" && (
                      <Badge variant="destructive" className="h-5 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
