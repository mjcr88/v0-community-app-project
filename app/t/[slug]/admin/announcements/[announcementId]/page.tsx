import { createServerClient } from "@/lib/supabase/server"
import { redirect, notFound } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Calendar, MapPin, Pencil, ImageIcon } from 'lucide-react'
import Link from "next/link"
import { formatDate } from "date-fns"
import { AnnouncementTypeIcon } from "@/components/announcements/announcement-type-icon"
import { AnnouncementPriorityBadge } from "@/components/announcements/announcement-priority-badge"
import { UpdatedIndicator } from "@/components/announcements/updated-indicator"
import { ArchiveAnnouncementDialog } from "@/components/announcements/archive-announcement-dialog"
import { DeleteAnnouncementDialog } from "@/components/announcements/delete-announcement-dialog"
import { PublishAnnouncementDialog } from "@/components/announcements/publish-announcement-dialog"

export default async function AdminAnnouncementDetailPage({
  params,
}: {
  params: Promise<{ slug: string; announcementId: string }>
}) {
  const { slug, announcementId } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    redirect("/backoffice/login")
  }

  // Verify admin
  const { data: userData } = await supabase
    .from("users")
    .select("role, is_tenant_admin")
    .eq("id", user.id)
    .eq("tenant_id", tenant.id)
    .single()

  if (!userData || (!["tenant_admin", "super_admin"].includes(userData.role) && !userData.is_tenant_admin)) {
    redirect(`/t/${slug}/dashboard`)
  }

  // Fetch announcement details with relationships
  const { data: announcement, error } = await supabase
    .from("announcements")
    .select(
      `
      *,
      creator:users!created_by(id, first_name, last_name, profile_picture_url),
      location:locations(id, name, type),
      event:events(id, title),
      neighborhoods:announcement_neighborhoods(neighborhood:neighborhoods(id, name))
    `,
    )
    .eq("id", announcementId)
    .eq("tenant_id", tenant.id)
    .single()

  if (error || !announcement) {
    notFound()
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "?"
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const getLocationDisplay = () => {
    if (announcement.custom_location_name) return announcement.custom_location_name
    if (announcement.location) return announcement.location.name
    return "No location specified"
  }

  const getStatusBadge = () => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "Draft", variant: "outline" },
      published: { label: "Published", variant: "default" },
      archived: { label: "Archived", variant: "secondary" },
      deleted: { label: "Deleted", variant: "destructive" },
    }
    return statusMap[announcement.status] || { label: announcement.status, variant: "outline" }
  }

  const statusBadge = getStatusBadge()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/t/${slug}/admin/announcements`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {announcement.title}
            {announcement.last_edited_at && announcement.published_at && (
              <UpdatedIndicator lastEditedAt={announcement.last_edited_at} publishedAt={announcement.published_at} />
            )}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/t/${slug}/admin/announcements/${announcementId}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          {announcement.status === "draft" && (
            <PublishAnnouncementDialog
              announcementIds={[announcement.id]}
              announcementTitle={announcement.title}
              tenantId={tenant.id}
              tenantSlug={slug}
            />
          )}
          {announcement.status !== "archived" && (
            <ArchiveAnnouncementDialog
              announcementIds={[announcement.id]}
              announcementTitle={announcement.title}
              tenantId={tenant.id}
              tenantSlug={slug}
            />
          )}
          <DeleteAnnouncementDialog
            announcementIds={[announcement.id]}
            announcementTitle={announcement.title}
            tenantId={tenant.id}
            tenantSlug={slug}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <AnnouncementTypeIcon type={announcement.announcement_type} className="h-12 w-12" />
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {announcement.announcement_type}
                    <Badge variant={statusBadge.variant as any}>{statusBadge.label}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Created {formatDate(new Date(announcement.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </CardDescription>
                </div>
              </div>
              <AnnouncementPriorityBadge priority={announcement.priority} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {announcement.description || "No description provided"}
              </p>
            </div>

            {announcement.images && announcement.images.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images ({announcement.images.length})
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {announcement.images.map((url: string, index: number) => (
                    <img
                      key={index}
                      src={url || "/placeholder.svg"}
                      alt={`Attachment ${index + 1}`}
                      className="rounded-lg border object-cover aspect-video"
                    />
                  ))}
                </div>
              </div>
            )}

            {announcement.event && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Linked Event</h3>
                <Link
                  href={`/t/${slug}/dashboard/events/${announcement.event.id}`}
                  className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{announcement.event.title}</span>
                </Link>
              </div>
            )}

            {announcement.neighborhoods && announcement.neighborhoods.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Target Neighborhoods</h3>
                <div className="flex flex-wrap gap-2">
                  {announcement.neighborhoods.map((n: any) => (
                    <Badge key={n.neighborhood.id} variant="outline">
                      {n.neighborhood.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Announcement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(new Date(announcement.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              {announcement.published_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Published</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(new Date(announcement.published_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              )}

              {announcement.auto_archive_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Auto-Archive</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(new Date(announcement.auto_archive_date), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{getLocationDisplay()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Created By</CardTitle>
            </CardHeader>
            <CardContent>
              {announcement.creator ? (
                <Link
                  href={`/t/${slug}/admin/residents/${announcement.creator.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Avatar>
                    {announcement.creator.profile_picture_url ? (
                      <AvatarImage src={announcement.creator.profile_picture_url || "/placeholder.svg"} />
                    ) : (
                      <AvatarFallback>
                        {getInitials(announcement.creator.first_name, announcement.creator.last_name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {announcement.creator.first_name} {announcement.creator.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">Click to view profile</p>
                  </div>
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">Unknown</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
