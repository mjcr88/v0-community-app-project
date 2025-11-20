import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from 'next/navigation'
import { getAnnouncementById, markAnnouncementAsRead } from "@/app/actions/announcements"
import { ArrowLeft, MapPin, Calendar } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { AnnouncementTypeIcon } from "@/components/announcements/announcement-type-icon"
import { AnnouncementPriorityBadge } from "@/components/announcements/announcement-priority-badge"
import { UpdatedIndicator } from "@/components/announcements/updated-indicator"
import { format } from "date-fns"

interface AnnouncementDetailPageProps {
  params: Promise<{ slug: string; announcementId: string }>
}

export default async function AnnouncementDetailPage({ params }: AnnouncementDetailPageProps) {
  const { slug, announcementId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: resident } = await supabase
    .from("users")
    .select("id, tenant_id")
    .eq("id", user.id)
    .single()

  if (!resident) {
    redirect(`/t/${slug}/login`)
  }

  // Get announcement
  const result = await getAnnouncementById(announcementId, resident.tenant_id)

  if (!result.success || !result.data) {
    notFound()
  }

  const announcement = result.data

  // Mark as read
  await markAnnouncementAsRead(announcementId, slug)

  const { data: neighborhoodData } = await supabase
    .from("announcement_neighborhoods")
    .select("neighborhood:neighborhoods(id, name)")
    .eq("announcement_id", announcementId)

  const neighborhoods = neighborhoodData?.map((n: any) => n.neighborhood).filter(Boolean) || []
  const isCommunityWide = neighborhoods.length === 0

  // Get location if exists
  let location = null
  if (announcement.location_type === "community_location" && announcement.location_id) {
    const { data } = await supabase
      .from("locations")
      .select("id, name, type, coordinates")
      .eq("id", announcement.location_id)
      .single()
    location = data
  }

  // Get linked event if exists
  let linkedEvent = null
  if (announcement.event_id) {
    const { data } = await supabase
      .from("events")
      .select("id, title, start_date, start_time")
      .eq("id", announcement.event_id)
      .single()
    linkedEvent = data
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Back Button */}
            <Link href={`/t/${slug}/dashboard/announcements`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Announcements
              </Button>
            </Link>

            {/* Title & Badges */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <AnnouncementTypeIcon type={announcement.announcement_type} className="h-8 w-8" />
                <AnnouncementPriorityBadge priority={announcement.priority} />
                {isCommunityWide ? (
                  <Badge variant="secondary">Community-Wide</Badge>
                ) : (
                  <Badge variant="secondary">Neighborhood-Specific</Badge>
                )}
                <UpdatedIndicator
                  publishedAt={announcement.published_at}
                  lastEditedAt={announcement.last_edited_at}
                />
              </div>

              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
                {announcement.title}
              </h1>

              <p className="text-muted-foreground">
                Published {format(new Date(announcement.published_at), "MMMM d, yyyy 'at' h:mm a")} by Administrator
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed whitespace-pre-wrap text-pretty">
              {announcement.description}
            </p>
          </div>

          {announcement.images && announcement.images.length > 0 && (
            <div className="space-y-4">
              {announcement.images.map((image, index) => (
                <div key={index} className="relative w-full h-64 rounded-lg border overflow-hidden">
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`Announcement image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Info Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {!isCommunityWide && neighborhoods.length > 0 && (
              <div className="p-6 border rounded-lg bg-card space-y-3">
                <h3 className="font-semibold">Visible to Neighborhoods</h3>
                <div className="flex flex-wrap gap-2">
                  {neighborhoods.map((neighborhood) => (
                    <Badge key={neighborhood.id} variant="outline">
                      {neighborhood.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-archive date */}
            {announcement.auto_archive_date && (
              <div className="p-6 border rounded-lg bg-card">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Expires on</p>
                    <p className="font-medium">
                      {format(new Date(announcement.auto_archive_date), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Location */}
          {location && (
            <div className="p-6 border rounded-lg bg-card">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{location.name}</p>
                </div>
              </div>
            </div>
          )}

          {announcement.location_type === "custom_temporary" && announcement.custom_location_name && (
            <div className="p-6 border rounded-lg bg-card">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Custom Location</p>
                  <p className="font-medium">{announcement.custom_location_name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Linked Event */}
          {linkedEvent && (
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="font-semibold mb-3">Related Event</h3>
              <Link href={`/t/${slug}/dashboard/events/${linkedEvent.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-md bg-accent hover:bg-accent/80 transition-colors">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{linkedEvent.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(linkedEvent.start_date), "MMM d, yyyy")}
                      {linkedEvent.start_time && ` at ${format(new Date(`2000-01-01T${linkedEvent.start_time}`), "h:mm a")}`}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
