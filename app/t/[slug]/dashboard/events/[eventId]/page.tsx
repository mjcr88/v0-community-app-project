import { notFound, redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { getEvent } from "@/app/actions/events"
import { ArrowLeft, Calendar, Share2, Pencil, Users, Lock, Flag } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DeleteEventButton } from "./delete-event-button"
import { EventRsvpSection } from "./event-rsvp-section"
import { SaveEventButton } from "./save-event-button"
import { EventAttendeesSection } from "./event-attendees-section"
import { EventLocationSection } from "./event-location-section"
import { EventImagesGallery } from "./event-images-gallery"
import { getEventAttendees } from "@/app/actions/events"
import { canUserViewEvent } from "@/lib/visibility-filter"
import { FlagEventDialog } from "./flag-event-dialog"
import { getEventFlagDetails } from "@/app/actions/events"
import { EventFlagDetails } from "./event-flag-details"
import { CancelEventDialog } from "./cancel-event-dialog"
import { UncancelEventButton } from "./uncancel-event-button"

interface EventDetailPageProps {
  params: Promise<{ slug: string; eventId: string }>
}

function formatEventDate(
  startDate: string,
  endDate: string | null,
  startTime: string | null,
  endTime: string | null,
  isAllDay: boolean,
) {
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : null

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }

  if (isAllDay) {
    if (end && endDate !== startDate) {
      return `${start.toLocaleDateString("en-US", dateOptions)} - ${end.toLocaleDateString("en-US", dateOptions)}`
    }
    return start.toLocaleDateString("en-US", dateOptions)
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }

  const startTimeStr = startTime ? new Date(`2000-01-01T${startTime}`).toLocaleTimeString("en-US", timeOptions) : ""
  const endTimeStr = endTime ? new Date(`2000-01-01T${endTime}`).toLocaleTimeString("en-US", timeOptions) : ""

  if (end && endDate !== startDate) {
    return `${start.toLocaleDateString("en-US", dateOptions)} ${startTimeStr} - ${end.toLocaleDateString("en-US", dateOptions)} ${endTimeStr}`
  }

  if (startTimeStr && endTimeStr) {
    return `${start.toLocaleDateString("en-US", dateOptions)} • ${startTimeStr} - ${endTimeStr}`
  }

  if (startTimeStr) {
    return `${start.toLocaleDateString("en-US", dateOptions)} • ${startTimeStr}`
  }

  return start.toLocaleDateString("en-US", dateOptions)
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0) || ""
  const last = lastName?.charAt(0) || ""
  return (first + last).toUpperCase() || "U"
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug, eventId } = await params

  const supabase = await createServerClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  // Get tenant
  const { data: tenant } = await supabase.from("tenants").select("id, name").eq("slug", slug).single()

  if (!tenant) {
    redirect("/")
  }

  const { data: userData } = await supabase
    .from("users")
    .select("id, role, is_tenant_admin, lot_id, family_unit_id")
    .eq("id", user.id)
    .single()

  console.log("[v0] Event detail page - user data:", {
    userId: user.id,
    role: userData?.role,
    isTenantAdmin: userData?.is_tenant_admin,
    lotId: userData?.lot_id,
    familyUnitId: userData?.family_unit_id,
  })

  const canView = await canUserViewEvent(eventId, {
    userId: user.id,
    tenantId: tenant.id,
    userLotId: userData?.lot_id,
    userFamilyUnitId: userData?.family_unit_id,
  })

  console.log("[v0] Can view event result:", canView)

  if (!canView) {
    console.log("[v0] Access denied - redirecting to notFound")
    notFound()
  }

  // Get event
  const result = await getEvent(eventId, tenant.id)

  if (!result.success || !result.data) {
    notFound()
  }

  const event = result.data
  const isPastEvent = new Date(event.start_date) < new Date()

  let canManageEvent = false
  let isCreator = false
  if (userData) {
    isCreator = event.created_by === user.id
    const isAdmin = userData.is_tenant_admin || userData.role === "super_admin" || userData.role === "tenant_admin"
    canManageEvent = isCreator || isAdmin
  }

  const eventTypeLabel = event.event_type === "official" ? "Official Event" : "Community Event"
  const eventTypeVariant = event.event_type === "official" ? "default" : "secondary"

  const statusLabel =
    event.status === "cancelled"
      ? "Cancelled"
      : event.status === "draft"
        ? "Draft"
        : isPastEvent
          ? "Past Event"
          : "Upcoming"

  const statusVariant =
    event.status === "cancelled"
      ? "destructive"
      : event.status === "draft"
        ? "outline"
        : isPastEvent
          ? "secondary"
          : "default"

  let attendees = null
  if (canManageEvent && event.requires_rsvp) {
    const attendeesResult = await getEventAttendees(eventId, tenant.id)
    if (attendeesResult.success && attendeesResult.data) {
      attendees = attendeesResult.data
    }
  }

  let visibilityDetails = null
  if (canManageEvent) {
    if (event.visibility_scope === "neighborhood") {
      const { data: neighborhoods } = await supabase
        .from("event_neighborhoods")
        .select("neighborhood:neighborhoods(id, name)")
        .eq("event_id", eventId)
      visibilityDetails = {
        type: "neighborhood",
        data: neighborhoods?.map((n: any) => n.neighborhood) || [],
      }
    } else if (event.visibility_scope === "private") {
      const { data: invites } = await supabase
        .from("event_invites")
        .select(
          `
          invitee:users!invitee_id(id, first_name, last_name),
          family:family_units!family_unit_id(id, name)
        `,
        )
        .eq("event_id", eventId)

      const individuals = invites?.filter((i: any) => i.invitee).map((i: any) => i.invitee) || []
      const families = invites?.filter((i: any) => i.family).map((i: any) => i.family) || []

      visibilityDetails = {
        type: "private",
        individuals,
        families,
      }
    }
  }

  const { data: eventImages } = await supabase
    .from("event_images")
    .select("id, image_url, is_hero, display_order")
    .eq("event_id", eventId)
    .order("display_order")

  const { data: flagCountData, error: flagCountError } = await supabase.rpc("get_event_flag_count", {
    p_event_id: eventId,
    p_tenant_id: tenant.id,
  })

  const flagCount = flagCountData ?? 0

  const { data: hasUserFlaggedData, error: userFlagError } = await supabase.rpc("has_user_flagged_event", {
    p_event_id: eventId,
    p_user_id: user.id,
    p_tenant_id: tenant.id,
  })

  const hasUserFlagged = hasUserFlaggedData ?? false

  let flagDetails = null
  if (canManageEvent && flagCount > 0) {
    const isAdmin = userData.is_tenant_admin || userData.role === "super_admin" || userData.role === "tenant_admin"
    if (isAdmin) {
      const flagDetailsResult = await getEventFlagDetails(eventId, tenant.id)
      if (flagDetailsResult.success && flagDetailsResult.data) {
        flagDetails = flagDetailsResult.data
      }
    }
  }

  let locationData = null
  if (event.location_type === "community_location" && event.location_id) {
    const { data: location } = await supabase
      .from("locations")
      .select("id, name, type, coordinates, boundary_coordinates, path_coordinates")
      .eq("id", event.location_id)
      .single()

    if (location) {
      locationData = location
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Back Button */}
            <Link href={`/t/${slug}/dashboard/events`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Events
              </Button>
            </Link>

            {/* Title & Badges */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {event.category?.icon && (
                  <span className="text-3xl" aria-hidden="true">
                    {event.category.icon}
                  </span>
                )}
                <Badge variant="outline" className="text-sm">
                  {event.category?.name || "Uncategorized"}
                </Badge>
                <Badge variant={eventTypeVariant as any}>{eventTypeLabel}</Badge>
                <Badge variant={statusVariant as any}>{statusLabel}</Badge>
                {flagCount > 0 && (
                  <Badge variant="destructive" className="gap-1.5">
                    <Flag className="h-3 w-3" />
                    Flagged ({flagCount})
                  </Badge>
                )}
                {event.visibility_scope === "neighborhood" && (
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    Neighborhood
                  </Badge>
                )}
                {event.visibility_scope === "private" && (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Private
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">{event.title}</h1>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <SaveEventButton eventId={eventId} userId={user?.id || null} />
              {canManageEvent && event.status !== "cancelled" && (
                <>
                  <Link href={`/t/${slug}/dashboard/events/${eventId}/edit`}>
                    <Button variant="default" size="sm" className="gap-2">
                      <Pencil className="h-4 w-4" />
                      Edit Event
                    </Button>
                  </Link>
                  <CancelEventDialog eventId={eventId} tenantSlug={slug} eventTitle={event.title} />
                  {isCreator && (
                    <DeleteEventButton
                      eventId={eventId}
                      tenantId={tenant.id}
                      tenantSlug={slug}
                      eventTitle={event.title}
                    />
                  )}
                </>
              )}
              {canManageEvent && event.status === "cancelled" && userData?.is_tenant_admin && (
                <UncancelEventButton eventId={eventId} tenantSlug={slug} />
              )}
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Share2 className="h-4 w-4" />
                Share Event
              </Button>
              {event.status !== "cancelled" && (
                <FlagEventDialog
                  eventId={eventId}
                  tenantSlug={slug}
                  triggerLabel={hasUserFlagged ? "Flagged" : "Flag Event"}
                  triggerVariant={hasUserFlagged ? "secondary" : "outline"}
                  triggerSize="sm"
                  disabled={hasUserFlagged}
                  initialFlagCount={flagCount}
                  initialHasUserFlagged={hasUserFlagged}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {flagDetails && flagDetails.length > 0 && <EventFlagDetails flags={flagDetails} tenantSlug={slug} />}

          {canManageEvent && visibilityDetails && (
            <div className="p-6 border rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center gap-2">
                {visibilityDetails.type === "neighborhood" ? (
                  <Users className="h-5 w-5 text-primary" />
                ) : (
                  <Lock className="h-5 w-5 text-primary" />
                )}
                <h3 className="font-semibold">
                  {visibilityDetails.type === "neighborhood" ? "Neighborhood Visibility" : "Private Event"}
                </h3>
              </div>
              {visibilityDetails.type === "neighborhood" && visibilityDetails.data.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Visible to residents in:</p>
                  <div className="flex flex-wrap gap-2">
                    {visibilityDetails.data.map((neighborhood: any) => (
                      <Badge key={neighborhood.id} variant="outline">
                        {neighborhood.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {visibilityDetails.type === "private" && (
                <div className="space-y-3">
                  {visibilityDetails.individuals && visibilityDetails.individuals.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Invited residents ({visibilityDetails.individuals.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {visibilityDetails.individuals.slice(0, 5).map((person: any) => (
                          <Badge key={person.id} variant="outline">
                            {person.first_name} {person.last_name}
                          </Badge>
                        ))}
                        {visibilityDetails.individuals.length > 5 && (
                          <Badge variant="outline">+{visibilityDetails.individuals.length - 5} more</Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {visibilityDetails.families && visibilityDetails.families.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Invited families ({visibilityDetails.families.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {visibilityDetails.families.map((family: any) => (
                          <Badge key={family.id} variant="outline">
                            {family.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Image Gallery Section */}
          {eventImages && eventImages.length > 0 && <EventImagesGallery images={eventImages} />}

          {/* Description Section */}
          {event.description && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">About This Event</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap text-pretty leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>
          )}

          {/* Event Info Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Date & Time Card */}
            <div className="p-6 border rounded-lg bg-card space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">When</p>
                  <p className="font-medium text-pretty">
                    {formatEventDate(
                      event.start_date,
                      event.end_date,
                      event.start_time,
                      event.end_time,
                      event.is_all_day,
                    )}
                  </p>
                </div>
              </div>
              {event.is_all_day && <p className="text-sm text-muted-foreground pl-13">All-day event</p>}
            </div>

            {/* Organizer Card */}
            <div className="p-6 border rounded-lg bg-card">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={event.creator?.profile_picture_url || undefined}
                    alt={`${event.creator?.first_name || "User"}'s avatar`}
                  />
                  <AvatarFallback>{getInitials(event.creator?.first_name, event.creator?.last_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Organized by</p>
                  <Link
                    href={`/t/${slug}/dashboard/neighbours/${event.created_by}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {event.creator?.first_name} {event.creator?.last_name}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* RSVP Section */}
          <EventRsvpSection
            eventId={eventId}
            tenantId={tenant.id}
            requiresRsvp={event.requires_rsvp || false}
            rsvpDeadline={event.rsvp_deadline}
            maxAttendees={event.max_attendees}
            userId={user?.id || null}
          />

          {/* Attendees Section */}
          {attendees && <EventAttendeesSection attendees={attendees} tenantSlug={slug} />}

          {/* Location Section */}
          {event.location_type && (
            <div className="p-6 border rounded-lg bg-card space-y-4">
              <EventLocationSection
                locationType={event.location_type}
                locationId={event.location_id}
                customLocationName={event.custom_location_name}
                customLocationCoordinates={event.custom_location_coordinates}
                customLocationType={event.custom_location_type}
                location={locationData}
                tenantSlug={slug}
                tenantId={tenant.id}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
