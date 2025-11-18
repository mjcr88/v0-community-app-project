"use client"

import Link from "next/link"
import { ArrowRight, ClipboardList, EyeOff } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RequestTypeIcon } from "./request-type-icon"
import { RequestStatusBadge } from "./request-status-badge"
import { format } from "date-fns"

interface MyRequestsWidgetProps {
  requests: any[]
  tenantSlug: string
}

export function MyRequestsWidget({ requests, tenantSlug }: MyRequestsWidgetProps) {
  // Only show active requests (pending or in_progress)
  const activeRequests = requests.filter(
    (r) => r.status === "pending" || r.status === "in_progress"
  )

  if (activeRequests.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          <h3 className="font-semibold">My Active Requests</h3>
          <Badge variant="secondary">{activeRequests.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/t/${tenantSlug}/dashboard/requests`}>
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="space-y-2">
        {activeRequests.slice(0, 3).map((request) => (
          <Link
            key={request.id}
            href={`/t/${tenantSlug}/dashboard/requests/${request.id}`}
            className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <RequestTypeIcon type={request.request_type} className="h-4 w-4" />
                  <span className="font-medium">{request.title}</span>
                  {request.is_anonymous && (
                    <Badge variant="outline" className="text-xs">
                      <EyeOff className="mr-1 h-3 w-3" />
                      Anonymous
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {request.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{format(new Date(request.created_at), "MMM d")}</span>
                  {request.location?.name && <span>• {request.location.name}</span>}
                </div>
              </div>
              <RequestStatusBadge status={request.status} />
            </div>
          </Link>
        ))}
      </div>

      {activeRequests.length > 3 && (
        <p className="text-center text-sm text-muted-foreground">
          + {activeRequests.length - 3} more active request
          {activeRequests.length - 3 !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}
