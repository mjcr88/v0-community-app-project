"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowUpDown, MapPin, Search, X, ChevronDown, AlertCircle } from 'lucide-react'
import Link from "next/link"
import { formatDate } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { RequestStatusBadge } from "@/components/requests/request-status-badge"
import { RequestPriorityBadge } from "@/components/requests/request-priority-badge"
import { RequestTypeIcon } from "@/components/requests/request-type-icon"
import { MarkInProgressDialog } from "@/components/requests/mark-in-progress-dialog"
import { MarkResolvedDialog } from "@/components/requests/mark-resolved-dialog"
import { MarkRejectedDialog } from "@/components/requests/mark-rejected-dialog"

type AdminRequest = {
  id: string
  title: string
  description: string
  request_type: 'maintenance' | 'question' | 'complaint' | 'safety' | 'account_access' | 'other'
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected'
  priority: 'normal' | 'urgent' | 'emergency'
  is_anonymous: boolean
  location_type: string | null
  custom_location_name: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  first_reply_at: string | null
  admin_reply: string | null
  admin_internal_notes: string | null
  rejection_reason: string | null
  tagged_resident_ids: string[] | null
  tagged_pet_ids: string[] | null
  creator: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
  } | null
  location: {
    id: string
    name: string
    type: string
  } | null
  resolved_by_user: {
    first_name: string
    last_name: string
  } | null
}

export function AdminRequestsTable({
  requests,
  slug,
  tenantId,
}: {
  requests: AdminRequest[]
  slug: string
  tenantId: string
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortedRequests, setSortedRequests] = useState<AdminRequest[]>(requests)
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedRequests, setSelectedRequests] = useState<string[]>([])

  const [requestTypeFilter, setRequestTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [taggedFilter, setTaggedFilter] = useState<string>("all")

  const filteredRequests = useMemo(() => {
    let filtered = requests

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((request) => {
        if (request.title.toLowerCase().includes(query)) return true
        if (request.description.toLowerCase().includes(query)) return true
        if (request.request_type.toLowerCase().includes(query)) return true
        if (request.status.toLowerCase().includes(query)) return true
        if (request.creator) {
          const creatorName = `${request.creator.first_name} ${request.creator.last_name}`.toLowerCase()
          if (creatorName.includes(query)) return true
        }
        if (request.location?.name.toLowerCase().includes(query)) return true
        if (request.custom_location_name?.toLowerCase().includes(query)) return true
        return false
      })
    }

    if (requestTypeFilter !== "all") {
      filtered = filtered.filter((request) => request.request_type === requestTypeFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter)
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((request) => request.priority === priorityFilter)
    }

    if (taggedFilter !== "all") {
      filtered = filtered.filter((request) => {
        if (taggedFilter === "has_tagged") {
          return (
            (request.tagged_resident_ids && request.tagged_resident_ids.length > 0) ||
            (request.tagged_pet_ids && request.tagged_pet_ids.length > 0)
          )
        }
        return true
      })
    }

    return filtered
  }, [requests, searchQuery, requestTypeFilter, statusFilter, priorityFilter, taggedFilter])

  useEffect(() => {
    setSortedRequests(filteredRequests)
  }, [filteredRequests])

  const handleSort = (field: string) => {
    const direction = sortField === field && sortDirection === "asc" ? "desc" : "asc"
    setSortField(field)
    setSortDirection(direction)

    const sorted = [...filteredRequests].sort((a, b) => {
      let aVal: any = a[field as keyof AdminRequest]
      let bVal: any = b[field as keyof AdminRequest]

      if (field === "creator") {
        aVal = a.creator ? `${a.creator.last_name} ${a.creator.first_name}`.toLowerCase() : ""
        bVal = b.creator ? `${b.creator.last_name} ${b.creator.first_name}`.toLowerCase() : ""
      } else if (field === "location") {
        aVal = (a.custom_location_name || a.location?.name || "").toLowerCase()
        bVal = (b.custom_location_name || b.location?.name || "").toLowerCase()
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

    setSortedRequests(sorted)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(sortedRequests.map((r) => r.id))
    } else {
      setSelectedRequests([])
    }
  }

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    if (checked) {
      setSelectedRequests([...selectedRequests, requestId])
    } else {
      setSelectedRequests(selectedRequests.filter((id) => id !== requestId))
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setRequestTypeFilter("all")
    setStatusFilter("all")
    setPriorityFilter("all")
    setTaggedFilter("all")
  }

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    requestTypeFilter !== "all" ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    taggedFilter !== "all"

  const getRequestDate = (request: AdminRequest) => {
    try {
      const date = new Date(request.created_at)
      return formatDate(date, "MMM d, yyyy")
    } catch {
      return request.created_at
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const getLocationDisplay = (request: AdminRequest) => {
    if (request.custom_location_name) return request.custom_location_name
    if (request.location) return request.location.name
    return "—"
  }

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      maintenance: "Maintenance",
      question: "Question",
      complaint: "Complaint",
      safety: "Safety",
      account_access: "App Access",
      other: "Other",
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            {filteredRequests.length} of {requests.length} request{requests.length !== 1 ? "s" : ""}
          </div>
        )}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear all filters
          </Button>
        )}
      </div>

      {selectedRequests.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedRequests.length} request{selectedRequests.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <MarkInProgressDialog
              requestIds={selectedRequests}
              tenantId={tenantId}
              tenantSlug={slug}
            />
            <MarkResolvedDialog
              requestIds={selectedRequests}
              tenantId={tenantId}
              tenantSlug={slug}
            />
            <MarkRejectedDialog
              requestIds={selectedRequests}
              tenantId={tenantId}
              tenantSlug={slug}
            />
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRequests.length === sortedRequests.length && sortedRequests.length > 0}
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
                      {requestTypeFilter !== "all" && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setRequestTypeFilter("all")}>All types</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRequestTypeFilter("maintenance")}>Maintenance</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRequestTypeFilter("question")}>Question</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRequestTypeFilter("complaint")}>Complaint</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRequestTypeFilter("safety")}>Safety</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRequestTypeFilter("account_access")}>App Access</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRequestTypeFilter("other")}>Other</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("creator")} className="-ml-3">
                  Resident
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("location")} className="-ml-3">
                  Location
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
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
                    <DropdownMenuItem onClick={() => setPriorityFilter("urgent")}>Urgent</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPriorityFilter("emergency")}>Emergency</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-3">
                      Status
                      <ChevronDown className="ml-2 h-4 w-4" />
                      {statusFilter !== "all" && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("pending")}>Pending</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("in_progress")}>In Progress</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("resolved")}>Resolved</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>Rejected</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-3">
                      Tagged
                      <ChevronDown className="ml-2 h-4 w-4" />
                      {taggedFilter !== "all" && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Filter by tagged</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setTaggedFilter("all")}>All</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTaggedFilter("has_tagged")}>
                      Has Tagged Residents/Pets
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("created_at")} className="-ml-3">
                  Date
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground">
                  {hasActiveFilters ? "No requests found matching your filters" : "No requests found"}
                </TableCell>
              </TableRow>
            ) : (
              sortedRequests.map((request) => (
                <TableRow
                  key={request.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button, input, a')) return
                    window.location.href = `/t/${slug}/admin/requests/${request.id}`
                  }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedRequests.includes(request.id)}
                      onCheckedChange={(checked) => handleSelectRequest(request.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <RequestTypeIcon type={request.request_type} className="h-5 w-5" />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium line-clamp-1">
                      {request.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getRequestTypeLabel(request.request_type)}</Badge>
                  </TableCell>
                  <TableCell>
                    {request.is_anonymous ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Anonymous</span>
                        {request.creator && (
                          <span className="text-xs">({request.creator.first_name} {request.creator.last_name})</span>
                        )}
                      </div>
                    ) : request.creator ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {request.creator.profile_picture_url ? (
                            <AvatarImage src={request.creator.profile_picture_url || "/placeholder.svg"} alt={`${request.creator.first_name} ${request.creator.last_name}`} />
                          ) : (
                            <AvatarFallback className="text-xs">
                              {getInitials(request.creator.first_name, request.creator.last_name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-sm">
                          {request.creator.first_name} {request.creator.last_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getLocationDisplay(request) !== "—" ? (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="line-clamp-1">{getLocationDisplay(request)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <RequestPriorityBadge priority={request.priority} />
                  </TableCell>
                  <TableCell>
                    <RequestStatusBadge status={request.status} />
                  </TableCell>
                  <TableCell>
                    {((request.tagged_resident_ids && request.tagged_resident_ids.length > 0) ||
                      (request.tagged_pet_ids && request.tagged_pet_ids.length > 0)) && (
                        <Badge variant="secondary" className="text-xs">
                          {(request.tagged_resident_ids?.length || 0) + (request.tagged_pet_ids?.length || 0)}
                        </Badge>
                      )}
                  </TableCell>
                  <TableCell className="text-sm">{getRequestDate(request)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
