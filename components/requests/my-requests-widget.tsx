"use client"

import Link from "next/link"
import { ArrowRight, ClipboardList, EyeOff, Plus } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
          <CardDescription>Track your maintenance and service requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              You don't have any active requests.
            </p>
            <Button asChild>
              <Link href={`/t/${tenantSlug}/dashboard/requests/create`}>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mobile: Stack title/badge and buttons | Desktop: Single row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">My Active Requests</h3>
          <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
            {activeRequests.length} Active
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm" className="flex-1 md:flex-none">
            <Link href={`/t/${tenantSlug}/dashboard/requests`}>View All</Link>
          </Button>
          <Button asChild size="sm" className="flex-1 md:flex-none">
            <Link href={`/t/${tenantSlug}/dashboard/requests/create`}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Create Request</span>
              <span className="sm:hidden">Create</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {activeRequests.slice(0, 3).map((request) => (
          <Link
            key={request.id}
            href={`/t/${tenantSlug}/dashboard/requests/${request.id}`}
            className="block group"
          >
            <div className="flex gap-4 p-4 rounded-xl border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary flex-shrink-0 mt-1">
                <RequestTypeIcon type={request.request_type} className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                    {request.title}
                  </h4>
                  <RequestStatusBadge status={request.status} />
                </div>

                <p className="text-sm text-muted-foreground line-clamp-1">
                  {request.description}
                </p>

                <div className="flex items-center gap-2 pt-2 mt-1 text-xs text-muted-foreground">
                  <span>{format(new Date(request.created_at), "MMM d, yyyy")}</span>
                  {request.location?.name && (
                    <>
                      <span>•</span>
                      <span>{request.location.name}</span>
                    </>
                  )}
                  {request.is_anonymous && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <EyeOff className="h-3 w-3" />
                        Anonymous
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}

        {activeRequests.length > 3 && (
          <div className="text-center pt-2">
            <Button variant="link" size="sm" asChild className="text-muted-foreground">
              <Link href={`/t/${tenantSlug}/dashboard/requests`}>
                + {activeRequests.length - 3} more active requests
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
