"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Megaphone } from 'lucide-react'
import Link from "next/link"
import { AnnouncementTypeIcon } from "@/components/announcements/announcement-type-icon"
import { AnnouncementPriorityBadge } from "@/components/announcements/announcement-priority-badge"
import { UpdatedIndicator } from "@/components/announcements/updated-indicator"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import type { Announcement } from "@/types/announcements"

interface AnnouncementWithRead extends Announcement {
  is_read: boolean
  read_at: string | null
}

interface AnnouncementsPageClientProps {
  announcements: AnnouncementWithRead[]
  slug: string
  userId: string
  tenantId: string
}

export function AnnouncementsPageClient({
  announcements,
  slug,
}: AnnouncementsPageClientProps) {
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("active")

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      const matchesSearch =
        search === "" ||
        announcement.title.toLowerCase().includes(search.toLowerCase()) ||
        announcement.description.toLowerCase().includes(search.toLowerCase())

      const now = new Date()
      const isArchived = announcement.auto_archive_date && new Date(announcement.auto_archive_date) < now

      if (activeTab === "active") {
        return matchesSearch && !announcement.is_read && !isArchived
      } else if (activeTab === "read") {
        return matchesSearch && announcement.is_read && !isArchived
      } else {
        return matchesSearch && isArchived
      }
    })
  }, [announcements, search, activeTab])

  const activeCount = announcements.filter((a) => {
    const now = new Date()
    const isArchived = a.auto_archive_date && new Date(a.auto_archive_date) < now
    return !a.is_read && !isArchived
  }).length

  const readCount = announcements.filter((a) => {
    const now = new Date()
    const isArchived = a.auto_archive_date && new Date(a.auto_archive_date) < now
    return a.is_read && !isArchived
  }).length

  const archivedCount = announcements.filter((a) => {
    const now = new Date()
    return a.auto_archive_date && new Date(a.auto_archive_date) < now
  }).length

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search announcements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="gap-2">
            Active
            {activeCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {activeCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read" className="gap-2">
            Read
            {readCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {readCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-2">
            Archived
            {archivedCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {archivedCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredAnnouncements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {search
                    ? "No announcements match your search"
                    : activeTab === "active"
                      ? "No new announcements"
                      : activeTab === "read"
                        ? "No read announcements"
                        : "No archived announcements"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => (
                <Link key={announcement.id} href={`/t/${slug}/dashboard/announcements/${announcement.id}`}>
                  <Card className="hover:bg-accent transition-colors cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Type icon */}
                        <div className="flex-shrink-0 mt-1">
                          <AnnouncementTypeIcon type={announcement.announcement_type} className="h-6 w-6" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-semibold text-lg leading-tight">{announcement.title}</h3>
                            <AnnouncementPriorityBadge priority={announcement.priority} />
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2">{announcement.description}</p>

                          <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
                            <span>{format(new Date(announcement.published_at), "MMM d, yyyy 'at' h:mm a")}</span>
                            {announcement.scope === "community_wide" ? (
                              <Badge variant="secondary" className="text-xs">
                                Community-Wide
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Neighborhood
                              </Badge>
                            )}
                            <UpdatedIndicator
                              publishedAt={announcement.published_at}
                              lastEditedAt={announcement.last_edited_at}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
