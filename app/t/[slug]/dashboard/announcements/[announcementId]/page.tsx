import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from 'next/navigation'
import { getAnnouncementById } from "@/app/actions/announcements"
import { ArrowLeft, MapPin, Calendar, Clock, User } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { AnnouncementTypeIcon } from "@/components/announcements/announcement-type-icon"
import { AnnouncementPriorityBadge } from "@/components/announcements/announcement-priority-badge"
import { format } from "date-fns"
import { AnnouncementReadTracker } from "@/components/announcements/announcement-read-tracker"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

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

  // Determine location name to display
  const displayLocation = location?.name || announcement.custom_location_name

  return (
    <div className="min-h-screen bg-background pb-20">
      <AnnouncementReadTracker announcementId={announcementId} slug={slug} />

      {/* Top Navigation */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="container max-w-3xl mx-auto px-4 h-14 flex items-center">
          <Link href={`/t/${slug}/dashboard/announcements`}>
            <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Announcements
            </Button>
          </Link>
        </div>
      </div>

      <main className="container max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-8">
        {/* Header Section */}
        <header className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="gap-1.5 py-1 px-3 text-sm font-medium">
              <AnnouncementTypeIcon type={announcement.announcement_type} className="h-4 w-4" />
              <span className="capitalize">{announcement.announcement_type}</span>
            </Badge>
            {announcement.priority !== 'normal' && (
              <AnnouncementPriorityBadge priority={announcement.priority} />
            )}
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(new Date(announcement.published_at || announcement.created_at), "MMM d, yyyy")}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.1] text-balance">
            {announcement.title}
          </h1>

          {/* Author Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={announcement.creator?.profile_picture_url || undefined} />
              <AvatarFallback>
                <User className="h-5 w-5 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium text-foreground">
                {announcement.creator?.first_name} {announcement.creator?.last_name}
              </p>
              <p className="text-muted-foreground">
                Community Administrator
              </p>
            </div>
          </div>
        </header>

        {/* Hero Image */}
        {announcement.images && announcement.images.length > 0 && (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted shadow-sm">
            <Image
              src={announcement.images[0]}
              alt={announcement.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Location Callout (if exists) */}
        {displayLocation && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
            <div className="p-2 rounded-full bg-background border shadow-sm shrink-0">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Location</h3>
              <p className="text-muted-foreground">{displayLocation}</p>
            </div>
          </div>
        )}

        <Separator />

        {/* Content Body */}
        <article className="prose prose-lg prose-neutral dark:prose-invert max-w-none">
          <p className="leading-relaxed whitespace-pre-wrap text-pretty">
            {announcement.description}
          </p>
        </article>

        {/* Footer / Meta */}
        <div className="pt-8 mt-8 border-t flex flex-col sm:flex-row justify-between gap-4 text-sm text-muted-foreground">
          {announcement.auto_archive_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Expires {format(new Date(announcement.auto_archive_date), "MMMM d, yyyy")}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
