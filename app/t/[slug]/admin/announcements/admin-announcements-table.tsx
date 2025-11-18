"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowUpDown, Search, X, ChevronDown, Eye, Pencil } from 'lucide-react'
import Link from "next/link"
import { formatDate } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { AnnouncementTypeIcon } from "@/components/announcements/announcement-type-icon"
import { AnnouncementPriorityBadge } from "@/components/announcements/announcement-priority-badge"
import { UpdatedIndicator } from "@/components/announcements/updated-indicator"
import { useRouter } from 'next/navigation'

type AdminAnnouncement = {
  id: string
  title: string
  description: string
  announcement_type: "general" | "emergency" | "maintenance" | "event" | "policy" | "safety"
  priority: "normal" | "important" | "urgent"
  status: "draft" | "published" | "archived"
  visibility_scope: "community" | "neighborhood"
  published_at: string | null
  last_edited_at: string | null
  created_at: string
  creator: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
  } | null
  neighborhood_count: number
}

export function AdminAnnouncementsTable({
  announcements,
  slug,
  tenantId,
}: {
  announcements: AdminAnnouncement[]
  slug: string
  tenantId: string
}) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortedAnnouncements, setSortedAnnouncements] = useState<AdminAnnouncement[]>(announcements)
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedAnnouncements, setSelectedAnnouncements] = useState<string[]>([])

  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [scopeFilter, setScopeFilter] = useState<string>("all")

  const filteredAnnouncements = useMemo(() => {
    let filtered = announcements

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((announcement) => {
        if (announcement.title.toLowerCase().includes(query)) return true
        if (announcement.description.toLowerCase().includes(query)) return true
        if (announcement.announcement_type.toLowerCase().includes(query)) return true
        if (announcement.creator) {
          const creatorName = `${announcement.creator.first_name} ${announcement.creator.last_name}`.toLowerCase()
          if (creatorName.includes(query)) return true
        }
        return false
      })
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((a) => a.announcement_type === typeFilter)
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((a) => a.priority === priorityFilter)
    }

    if (scopeFilter !== "all") {
      filtered = filtered.filter((a) => a.visibility_scope === scopeFilter)
    }

    return filtered
  }, [announcements, searchQuery, typeFilter, priorityFilter, scopeFilter])

  useEffect(() => {
    setSortedAnnouncements(filteredAnnouncements)
  }, [filteredAnnouncements])

  const handleSort = (field: string) => {
    const direction = sortField === field && sortDirection === "asc" ? "desc" : "asc"
    setSortField(field)
    setSortDirection(direction)

    const sorted = [...filteredAnnouncements].sort((a, b) => {
      let aVal: any = a[field as keyof AdminAnnouncement]
      let bVal: any = b[field as keyof AdminAnnouncement]

      if (field === "creator") {
        aVal = a.creator ? `${a.creator.last_name} ${a.creator.first_name}`.toLowerCase() : ""
        bVal = b.creator ? `${b.creator.last_name} ${b.creator.first_name}`.toLowerCase() : ""
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase()
      }

      if (typeof bVal === "string") {
        bVal = bVal.toLowerCase()
      }

      if (aVal < bVal) return direction === "asc" ? -1 : 1
      if (aVal > bVal) return direction === "asc" ? 1 : -1
      return 0
    })

    setSortedAnnouncements(sorted)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAnnouncements(sortedAnnouncements.map((a) => a.id))
    } else {
      setSelectedAnnouncements([])
    }
  }

  const handleSelectAnnouncement = (announcementId: string, checked: boolean) => {
    if (checked) {
      setSelectedAnnouncements([...selectedAnnouncements, announcementId])
    } else {
      setSelectedAnnouncements(selectedAnnouncements.filter((id) => id !== announcementId))
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setTypeFilter("all")
    setPriorityFilter("all")
    setScopeFilter("all")
  }

  const hasActiveFilters =
    searchQuery.trim() !== "" || typeFilter !== "all" || priorityFilter !== "all" || scopeFilter !== "all"

  const getAnnouncementDate = (announcement: AdminAnnouncement) => {
    try {
      const date = new Date(announcement.published_at || announcement.created_at)
      return formatDate(date, "MMM d, yyyy")
    } catch {
      return announcement.created_at
    }
  }

  const getInitials = (firstName: string | null, lastName: string | null) => {
    if (!firstName || !lastName) return "?"
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const getScopeDisplay = (announcement: AdminAnnouncement) => {
    if (announcement.visibility_scope === "community") {
      return "Community-wide"
    }
    return `${announcement.neighborhood_count} Neighborhood${announcement.neighborhood_count !== 1 ? "s" : ""}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            {filteredAnnouncements.length} of {announcements.length} announcement
            {announcements.length !== 1 ? "s" : ""}
          </div>
        )}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear all filters
          </Button>
        )}
      </div>


      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedAnnouncements.length === sortedAnnouncements.length && sortedAnnouncements.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("title")} className="-ml-3">
                  Title
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-3">
                      Type
                      <ChevronDown className="ml-2 h-4 w-4" />
                      {typeFilter !== "all" && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setTypeFilter("all")}>All types</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTypeFilter("general")}>General</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTypeFilter("emergency")}>Emergency</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTypeFilter("maintenance")}>Maintenance</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTypeFilter("event")}>Community Event</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTypeFilter("policy")}>Policy Update</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTypeFilter("safety")}>Safety</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-3">
                      Priority
                      <ChevronDown className="ml-2 h-4 w-4" />
                      {priorityFilter !== "all" && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by priority</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setPriorityFilter("all")}>All</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPriorityFilter("normal")}>Normal</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPriorityFilter("important")}>Important</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPriorityFilter("urgent")}>Urgent</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("creator")} className="-ml-3">
                  Creator
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-3">
                      Scope
                      <ChevronDown className="ml-2 h-4 w-4" />
                      {scopeFilter !== "all" && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by scope</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setScopeFilter("all")}>All</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setScopeFilter("community")}>Community-wide</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setScopeFilter("neighborhood")}>Neighborhoods</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("created_at")} className="-ml-3">
                  Date
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAnnouncements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  {hasActiveFilters ? "No announcements found matching your filters" : "No announcements found"}
                </TableCell>
              </TableRow>
            ) : (
              sortedAnnouncements.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedAnnouncements.includes(announcement.id)}
                      onCheckedChange={(checked) => handleSelectAnnouncement(announcement.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <AnnouncementTypeIcon type={announcement.announcement_type} className="h-5 w-5" />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/t/${slug}/admin/announcements/${announcement.id}`}
                      className="font-medium hover:underline line-clamp-2 block"
                    >
                      {announcement.title}
                    </Link>
                    {announcement.last_edited_at && announcement.published_at && (
                      <UpdatedIndicator
                        publishedAt={announcement.published_at}
                        lastEditedAt={announcement.last_edited_at}
                        className="mt-1"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {announcement.announcement_type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <AnnouncementPriorityBadge priority={announcement.priority} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        {announcement.creator?.profile_picture_url ? (
                          <AvatarImage
                            src={announcement.creator.profile_picture_url || "/placeholder.svg"}
                            alt={`${announcement.creator.first_name} ${announcement.creator.last_name}`}
                          />
                        ) : (
                          <AvatarFallback className="text-xs">
                            {getInitials(announcement.creator?.first_name || null, announcement.creator?.last_name || null)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-sm">
                        {announcement.creator
                          ? `${announcement.creator.first_name} ${announcement.creator.last_name}`
                          : "Unknown"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{getScopeDisplay(announcement)}</span>
                  </TableCell>
                  <TableCell className="text-sm">{getAnnouncementDate(announcement)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/t/${slug}/admin/announcements/${announcement.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/t/${slug}/admin/announcements/${announcement.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
