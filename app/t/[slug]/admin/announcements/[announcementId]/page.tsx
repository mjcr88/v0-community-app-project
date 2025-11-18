import { createServerClient } from "@/lib/supabase/server"
import { redirect, notFound } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Calendar, MapPin, Pencil, ImageIcon, Users } from 'lucide-react'
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

  const { data: tenant } = await supabase.from("tenants").select("id, name").eq("slug", slug).single()

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

  const { data: announcement, error } = await supabase
    .from("announcements")
    .select(
      `
      *,
      creator:users!created_by(id, first_name, last_name, profile_picture_url)
    `,
    )
    .eq("id", announcementId)
    .eq("tenant_id", tenant.id)
    .single()

  if (error || !announcement) {
    notFound()
  }

  const { data: announcementNeighborhoods } = await supabase
    .from("announcement_neighborhoods")
    .select("neighborhood:neighborhoods(id, name)")
    .eq("announcement_id", announcementId)

  let locationData = null
  if (announcement.location_type === "community" && announcement.location_id) {
    const { data: location } = await supabase
      .from("locations")
      .select("id, name, type")
      .eq("id", announcement.location_id)
      .single()
    locationData = location
  }

  let eventData = null
  if (announcement.event_id) {
    const { data: event } = await supabase.from("events").select("id, title").eq("id", announcement.event_id).single()
    eventData = event
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "?"
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const getLocationDisplay = () => {
    if (announcement.custom_location_name) return announcement.custom_location_name
    if (locationData) return locationData.name
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
  const neighborhoods = announcementNeighborhoods?.map((n: any) => n.neighborhood) || []
  const isCommunityWide = neighborhoods.length === 0

  return (
    <div className="min-h-screen bg-background">
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto space-y-6">
            <Link href={`/t/${slug}/admin/announcements`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Announcements
              </Button>
            </Link>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <AnnouncementTypeIcon type={announcement.announcement_type} className="h-8 w-8" />
                <Badge variant="outline" className="text-sm">
                  {announcement.announcement_type}
                </Badge>
                <Badge variant={statusBadge.variant as any}>{statusBadge.label}</Badge>
                <AnnouncementPriorityBadge priority={announcement.priority} />
                {isCommunityWide && (
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    Community-Wide
                  </Badge>
                )}
                {announcement.last_edited_at && announcement.published_at && (
                  <UpdatedIndicator lastEditedAt={announcement.last_edited_at} publishedAt={announcement.published_at} />
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">{announcement.title}</h1>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/t/${slug}/admin/announcements/${announcementId}/edit`}>
                <Button variant="default" size="sm" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
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
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Image Gallery */}
          {announcement.images && announcement.images.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Images ({announcement.images.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcement.images.map((url: string, index: number) => (
                  <img
                    key={index}
                    src={url || "/placeholder.svg"}
                    alt={`Image ${index + 1}`}
                    className="rounded-lg border object-cover aspect-video w-full"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {announcement.description && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Details</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap text-pretty leading-relaxed">
                  {announcement.description}
                </p>
              </div>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Date Card */}
            <div className="p-6 border rounded-lg bg-card space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(new Date(announcement.created_at), "MMM d, yyyy")}</p>
                </div>
              </div>
              {announcement.published_at && (
                <div className="pl-13 space-y-1 pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="text-sm font-medium">{formatDate(new Date(announcement.published_at), "MMM d, yyyy")}</p>
                </div>
              )}
              {announcement.auto_archive_date && (
                <div className="pl-13 space-y-1 pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Auto-Archives</p>
                  <p className="text-sm font-medium">
                    {formatDate(new Date(announcement.auto_archive_date), "MMM d, yyyy")}
                  </p>
                </div>
              )}
            </div>

            {/* Creator Card */}
            <div className="p-6 border rounded-lg bg-card">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={announcement.creator?.profile_picture_url || undefined} />
                  <AvatarFallback>
                    {getInitials(announcement.creator?.first_name, announcement.creator?.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Created by</p>
                  <Link
                    href={`/t/${slug}/admin/residents/${announcement.creator?.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {announcement.creator?.first_name} {announcement.creator?.last_name}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Location Section */}
          {announcement.location_type !== "none" && (
            <div className="p-6 border rounded-lg bg-card space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{getLocationDisplay()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Linked Event */}
          {eventData && (
            <div className="p-6 border rounded-lg bg-card space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Linked Event</p>
                  <Link
                    href={`/t/${slug}/dashboard/events/${eventData.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {eventData.title}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Target Neighborhoods */}
          {neighborhoods.length > 0 && (
            <div className="p-6 border rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Neighborhood Visibility</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Visible to residents in:</p>
                <div className="flex flex-wrap gap-2">
                  {neighborhoods.map((neighborhood: any) => (
                    <Badge key={neighborhood.id} variant="outline">
                      {neighborhood.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
