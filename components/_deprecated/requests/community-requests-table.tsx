"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, MapPin, EyeOff } from 'lucide-react'
import { RequestStatusBadge } from "./request-status-badge"
import { RequestPriorityBadge } from "./request-priority-badge"
import { RequestTypeIcon } from "./request-type-icon"
import { format } from "date-fns"
import Link from "next/link"
import type { RequestType, RequestStatus, RequestPriority } from "@/types/requests"

interface Request {
  id: string
  title: string
  request_type: RequestType
  description: string
  status: RequestStatus
  priority: RequestPriority
  created_at: string
  is_anonymous?: boolean
  location?: { name: string } | null
  custom_location_name?: string | null
  creator?: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url?: string | null
  } | null
}

interface CommunityRequestsTableProps {
  requests: Request[]
  tenantSlug: string
}

const requestTypeLabels: Record<RequestType, string> = {
  maintenance: "Maintenance",
  question: "Question",
  complaint: "Complaint",
  safety: "Safety Issue",
  other: "Other",
}

export function CommunityRequestsTable({ requests, tenantSlug }: CommunityRequestsTableProps) {
  if (requests.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed">
        <p className="text-muted-foreground">No community requests yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Maintenance and safety requests from residents will appear here
        </p>
      </Card>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Submitted By</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <RequestTypeIcon type={request.request_type} className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">{requestTypeLabels[request.request_type]}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium max-w-xs truncate">
                {request.title}
              </TableCell>
              <TableCell>
                {request.is_anonymous ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <EyeOff className="h-4 w-4" />
                    </div>
                    <span className="text-sm">Anonymous</span>
                  </div>
                ) : request.creator ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={request.creator.profile_picture_url || undefined} />
                      <AvatarFallback>
                        {request.creator.first_name[0]}{request.creator.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {request.creator.first_name} {request.creator.last_name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Unknown</span>
                )}
              </TableCell>
              <TableCell>
                {request.location?.name || request.custom_location_name ? (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate max-w-[150px]">
                      {request.location?.name || request.custom_location_name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <RequestPriorityBadge priority={request.priority} />
              </TableCell>
              <TableCell>
                <RequestStatusBadge status={request.status} compact />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(request.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/t/${tenantSlug}/dashboard/requests/${request.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
