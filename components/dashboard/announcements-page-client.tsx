"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Inbox, CheckCircle2, Archive } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AnnouncementList } from "@/components/announcements/announcement-list"
import { AnnouncementEmptyState } from "@/components/announcements/announcement-empty-state"
import { cn } from "@/lib/utils"
import type { AnnouncementWithRelations } from "@/types/announcements"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface AnnouncementWithRead extends AnnouncementWithRelations {
  is_read?: boolean
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
  userId,
}: AnnouncementsPageClientProps) {
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<string>("new")
  const [localAnnouncements, setLocalAnnouncements] = useState<AnnouncementWithRead[]>(announcements)

  // Sync local state with props when they change (e.g. on router.refresh())
  useEffect(() => {
    console.log("AnnouncementsPageClient received:", announcements.length, "announcements")
    announcements.forEach(a => {
      if (a.status === 'archived') console.log("Received archived:", a.title)
    })
    setLocalAnnouncements(announcements)
  }, [announcements])

  const handleMarkAsRead = (id: string) => {
    setLocalAnnouncements((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, is_read: true, reads: [...(a.reads || []), { user_id: userId }] }
          : a
      )
    )
  }

  const filteredAnnouncements = useMemo(() => {
    return localAnnouncements.filter((announcement) => {
      const matchesSearch =
        search === "" ||
        announcement.title.toLowerCase().includes(search.toLowerCase()) ||
        announcement.description?.toLowerCase().includes(search.toLowerCase())

      const now = new Date()
      const isArchived = announcement.auto_archive_date && new Date(announcement.auto_archive_date) < now
      const isRead = announcement.is_read

      if (activeTab === "new") {
        return matchesSearch && !isRead && !isArchived && announcement.status !== "archived"
      } else if (activeTab === "read") {
        return matchesSearch && isRead && !isArchived && announcement.status !== "archived"
      } else {
        // archived
        return matchesSearch && (isArchived || announcement.status === "archived")
      }
    })
  }, [localAnnouncements, search, activeTab])

  const counts = useMemo(() => {
    const now = new Date()
    return {
      new: localAnnouncements.filter((a) => {
        const isArchived = a.auto_archive_date && new Date(a.auto_archive_date) < now
        return !a.is_read && !isArchived && a.status !== "archived"
      }).length,
      read: localAnnouncements.filter((a) => {
        const isArchived = a.auto_archive_date && new Date(a.auto_archive_date) < now
        return a.is_read && !isArchived && a.status !== "archived"
      }).length,
      archived: localAnnouncements.filter((a) => {
        return (a.auto_archive_date && new Date(a.auto_archive_date) < now) || a.status === "archived"
      }).length,
    }
  }, [localAnnouncements])

  const tabs = [
    { value: "new", label: "New", count: counts.new, icon: Inbox },
    { value: "read", label: "Read", count: counts.read, icon: CheckCircle2 },
    { value: "archived", label: "Archived", count: counts.archived, icon: Archive },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 pb-12">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Community Announcements
        </h1>
        <p className="text-muted-foreground text-lg">
          Stay updated with what's happening in your neighborhood
        </p>
      </div>

      {/* Search & Tabs Section */}
      <div className="space-y-4">
        {/* Custom Tabs - Moved above Search */}
        <div className="flex flex-wrap gap-2 items-center">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="bg-muted/30 p-1 rounded-full h-auto flex w-full sm:w-auto overflow-x-auto no-scrollbar gap-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-full px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all whitespace-nowrap flex-none"
                >
                  <span className="flex items-center gap-2">
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    {tab.count > 0 && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "px-1.5 py-0.5 text-[10px] h-auto min-w-[1.25rem] justify-center",
                          activeTab === tab.value
                            ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                      >
                        {tab.count}
                      </Badge>
                    )}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Search - Left Aligned */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background border-input focus:bg-background transition-colors"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border"></div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {filteredAnnouncements.length} {filteredAnnouncements.length === 1 ? 'Announcement' : 'Announcements'}
        </h2>
        <div className="h-px flex-1 bg-border"></div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {filteredAnnouncements.length > 0 ? (
          <AnnouncementList
            announcements={filteredAnnouncements}
            slug={slug}
            onMarkAsRead={handleMarkAsRead}
          />
        ) : (
          <AnnouncementEmptyState
            type={search ? "search" : (activeTab as "new" | "read" | "archived")}
            onClearSearch={() => setSearch("")}
          />
        )}
      </div>
    </div>
  )
}
