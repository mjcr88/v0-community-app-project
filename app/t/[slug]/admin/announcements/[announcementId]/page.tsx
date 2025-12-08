import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Pencil, Archive, Trash2, Send, MapPin, Calendar } from 'lucide-react'
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { AnnouncementTypeIcon } from "@/components/announcements/announcement-type-icon"
import { AnnouncementPriorityBadge } from "@/components/announcements/announcement-priority-badge"
import { UpdatedIndicator } from "@/components/announcements/updated-indicator"
import { DeleteAnnouncementDialog } from "@/components/announcements/delete-announcement-dialog"
import { ArchiveAnnouncementDialog } from "@/components/announcements/archive-announcement-dialog"
import { PublishAnnouncementDialog } from "@/components/announcements/publish-announcement-dialog"

export default async function AdminAnnouncementDetailPage({
  params,
}: {
  params: Promise<{ slug: string; announcementId: string }>
}) {
  const { slug, announcementId } = await params

  const supabase = await createClient()

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
    console.log("Admin Announcement Detail: Tenant not found for slug", slug)
    notFound()
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("is_tenant_admin, role")
    .eq("id", user.id)
    .eq("tenant_id", tenant.id)
    .single()

  const isTenantAdmin = userProfile?.is_tenant_admin || userProfile?.role === "super_admin" || userProfile?.role === "tenant_admin"

  if (!isTenantAdmin) {
    console.log("Admin Announcement Detail: User is not admin", user.id)
    redirect(`/t/${slug}/dashboard`)
  }

  const { data: announcement } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", announcementId)
    .eq("tenant_id", tenant.id)
    .single()

  if (!announcement) {
    console.log("Admin Announcement Detail: Announcement not found", { announcementId, tenantId: tenant.id })
    notFound()
  }

  // Fetch neighborhoods if applicable
  const { data: neighborhoodData } = await supabase
    .from("announcement_neighborhoods")
    .select("neighborhood:neighborhoods(id, name)")
    .eq("announcement_id", announcement.id)

  const neighborhoods = neighborhoodData?.map((n: any) => n.neighborhood).filter(Boolean) || []
  const isCommunityWide = neighborhoods.length === 0

  // Fetch location if applicable
  let location = null
  if (announcement.location_type === "community_location" && announcement.location_id) {
    const { data: locationData } = await supabase
      .from("locations")
      .select("id, name, type")
      .eq("id", announcement.location_id)
      .single()

    location = locationData
  }

  // Fetch linked event if applicable
  let linkedEvent = null
  if (announcement.event_id) {
    const { data: eventData } = await supabase
      .from("events")
      .select("id, title, start_time")
      .eq("id", announcement.event_id)
      .single()

    linkedEvent = eventData
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href={`/t/${slug}/admin/announcements`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Announcements
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {announcement.status === "draft" && (
            <PublishAnnouncementDialog
              announcementId={announcement.id}
              tenantSlug={slug}
              tenantId={tenant.id}
            />
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/t/${slug}/admin/announcements/${announcement.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          {announcement.status === "published" && (
            <ArchiveAnnouncementDialog
              announcementId={announcement.id}
              tenantSlug={slug}
              tenantId={tenant.id}
              redirectAfter
            />
          )}
          <DeleteAnnouncementDialog
            announcementId={announcement.id}
            tenantSlug={slug}
            tenantId={tenant.id}
            redirectAfter
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* Hero Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AnnouncementTypeIcon type={announcement.announcement_type} className="h-12 w-12 mt-1" />
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold">{announcement.title}</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="capitalize">
                        {announcement.announcement_type.replace("_", " ")}
                      </Badge>
                      <AnnouncementPriorityBadge priority={announcement.priority} />
                      <Badge variant={announcement.status === "published" ? "default" : "secondary"}>
                        {announcement.status}
                      </Badge>
                      {announcement.last_edited_at && announcement.published_at && (
                        <UpdatedIndicator
                          publishedAt={announcement.published_at}
                          lastEditedAt={announcement.last_edited_at}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">A</AvatarFallback>
                    </Avatar>
                    <span>Administrator</span>
                  </div>
                  <span>•</span>
                  <span>
                    {announcement.published_at
                      ? `Published ${formatDistanceToNow(new Date(announcement.published_at), { addSuffix: true })}`
                      : `Created ${formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}`}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Section */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: announcement.description }}
            />
          </CardContent>
        </Card>

        {/* Images Section */}
        {announcement.images && announcement.images.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Images</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {announcement.images.map((imageUrl: string, index: number) => (
                  <div key={index} className="relative aspect-video overflow-hidden rounded-lg border">
                    <Image
                      src={imageUrl || "/placeholder.svg"}
                      alt={`Announcement image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Details Section */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Details</h2>

            {/* Scope */}
            <div className="flex items-start gap-3">
              <Send className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">Audience</div>
                <div className="text-sm text-muted-foreground">
                  {isCommunityWide
                    ? "Community-wide"
                    : `${neighborhoods.length} Neighborhood${neighborhoods.length !== 1 ? "s" : ""}`}
                </div>
                {neighborhoods.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {neighborhoods.map((neighborhood: any) => (
                      <Badge key={neighborhood.id} variant="outline">
                        {neighborhood.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            {(announcement.location_type === "community_location" && location) ||
              announcement.location_type === "custom_temporary" ? (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Location</div>
                  <div className="text-sm text-muted-foreground">
                    {announcement.location_type === "community_location" && location
                      ? location.name
                      : announcement.custom_location_name || "Custom location"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Location</div>
                  <div className="text-sm text-muted-foreground">No location specified</div>
                </div>
              </div>
            )}

            {/* Linked Event */}
            {linkedEvent && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Linked Event</div>
                  <Link
                    href={`/t/${slug}/dashboard/events/${linkedEvent.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {linkedEvent.title}
                  </Link>
                </div>
              </div>
            )}

            {/* Auto-Archive Date */}
            {announcement.auto_archive_date && (
              <div className="flex items-start gap-3">
                <Archive className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Auto-Archive Date</div>
                  <div className="text-sm text-muted-foreground">{formatDate(announcement.auto_archive_date)}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
