import { notFound, redirect } from 'next/navigation'
import { createServerClient } from "@/lib/supabase/server"
import { ArrowLeft, MapPin, Calendar, User, MessageSquare } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RequestStatusBadge } from "@/components/requests/request-status-badge"
import { RequestPriorityBadge } from "@/components/requests/request-priority-badge"
import { RequestTypeIcon } from "@/components/requests/request-type-icon"
import { format } from "date-fns"
import Image from "next/image"

interface RequestDetailPageProps {
  params: Promise<{ slug: string; requestId: string }>
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0) || ""
  const last = lastName?.charAt(0) || ""
  return (first + last).toUpperCase() || "A"
}

const requestTypeLabels: Record<string, string> = {
  maintenance: "Maintenance Request",
  question: "Question",
  complaint: "Complaint",
  safety: "Safety Issue",
  other: "Other Request",
}

export default async function RequestDetailPage({ params }: RequestDetailPageProps) {
  const { slug, requestId } = await params

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("slug", slug)
    .single()

  if (!tenant) {
    redirect("/")
  }

  const { data: request, error } = await supabase
    .from("resident_requests")
    .select(`
      *,
      location:location_id(id, name, type),
      resolved_by_user:resolved_by(first_name, last_name)
    `)
    .eq("id", requestId)
    .eq("tenant_id", tenant.id)
    .eq("created_by", user.id)
    .single()

  if (error || !request) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto space-y-6">
            <Link href={`/t/${slug}/dashboard/requests`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Requests
              </Button>
            </Link>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <RequestTypeIcon type={request.request_type} className="h-6 w-6" />
                <span className="text-lg font-medium">{requestTypeLabels[request.request_type]}</span>
                <RequestStatusBadge status={request.status} />
                <RequestPriorityBadge priority={request.priority} />
                {request.is_anonymous && (
                  <span className="text-sm text-muted-foreground">(Anonymous)</span>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
                {request.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Request Details</h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground whitespace-pre-wrap text-pretty leading-relaxed">
                {request.description}
              </p>
            </div>
          </div>

          {request.images && request.images.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {request.images.map((imageUrl: string, index: number) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                    <Image
                      src={imageUrl || "/placeholder.svg"}
                      alt={`Request photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-medium">
                      {format(new Date(request.created_at), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(request.location || request.custom_location_name) && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">
                        {request.location?.name || request.custom_location_name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {request.admin_reply && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Admin Response
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground whitespace-pre-wrap">{request.admin_reply}</p>
                {request.first_reply_at && (
                  <p className="text-sm text-muted-foreground">
                    Replied on {format(new Date(request.first_reply_at), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {request.status === 'resolved' && request.resolved_at && (
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">Request Resolved</p>
                    <p className="text-sm text-green-700 mt-1">
                      Resolved on {format(new Date(request.resolved_at), "MMMM d, yyyy 'at' h:mm a")}
                      {request.resolved_by_user && (
                        <> by {request.resolved_by_user.first_name} {request.resolved_by_user.last_name}</>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {request.status === 'rejected' && request.rejection_reason && (
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="pt-6 space-y-3">
                <p className="font-medium text-red-900">Request Rejected</p>
                <p className="text-sm text-red-700">
                  <span className="font-medium">Reason:</span> {request.rejection_reason}
                </p>
                {request.resolved_at && (
                  <p className="text-sm text-red-700">
                    {format(new Date(request.resolved_at), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
