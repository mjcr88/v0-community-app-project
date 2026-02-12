"use client"

import type React from "react"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createEvent, saveEventImages, checkLocationAvailability } from "@/app/actions/events"
import { Calendar, Loader2, MapPin, Users, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRioFeedback } from "@/components/feedback/rio-feedback-provider"
import { NeighborhoodMultiSelect } from "@/components/event-forms/neighborhood-multi-select"
import { ResidentInviteSelector } from "@/components/event-forms/resident-invite-selector"
import { LocationSelector } from "@/components/event-forms/location-selector"
import { PhotoManager } from "@/components/photo-manager"
import { PulsatingButton } from "@/components/library/pulsating-button"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { EventsAnalytics, ErrorAnalytics } from "@/lib/analytics"

type Category = {
  id: string
  name: string
  icon: string | null
}

type EventFormProps = {
  tenantSlug: string
  tenantId: string
  categories: Category[]
  initialLocation?: {
    id: string
    name: string
    type: string
    coordinates: { lat: number; lng: number } | null
  } | null
}

export function EventForm({ tenantSlug, tenantId, categories, initialLocation }: EventFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { showFeedback } = useRioFeedback()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [heroPhoto, setHeroPhoto] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1) // Step 1, 2, or 3

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    is_all_day: false,
    location_type: (initialLocation ? "community" : "none") as "community" | "custom" | "none",
    location_id: null as string | null,
    custom_location_name: "",
    custom_location_coordinates: null as { lat: number; lng: number } | null,
    custom_location_type: null as "marker" | "polygon" | null,
    custom_location_path: null as Array<{ lat: number; lng: number }> | null,
    event_type: "resident" as "official" | "resident",
    visibility_scope: "community" as "community" | "neighborhood" | "private",
    selected_neighborhoods: [] as string[],
    selected_residents: [] as string[],
    selected_families: [] as string[],
    requires_rsvp: false,
    rsvp_deadline: "",
    max_attendees: "",
    // Recurrence State
    is_recurring: false,
    recurrence_frequency: "weekly" as "daily" | "weekly" | "monthly",
    recurrence_interval: "1",
    recurrence_end_type: "count" as "count" | "date",
    recurrence_count: "4",
    recurrence_until: "",
    rsvp_offset_hours: "24",
  })

  const handleCustomLocationNameChange = useCallback((name: string) => {
    setFormData((prev) => ({ ...prev, custom_location_name: name }))
  }, [])

  const handleCustomLocationChange = useCallback(
    (data: {
      coordinates?: { lat: number; lng: number } | null
      type?: "marker" | "polygon" | null
      path?: Array<{ lat: number; lng: number }> | null
    }) => {
      setFormData((prev) => ({
        ...prev,
        custom_location_coordinates: data.coordinates || null,
        custom_location_type: data.type || null,
        custom_location_path: data.path || null,
      }))
    },
    [],
  )
  const [conflictWarning, setConflictWarning] = useState<string | null>(null)
  const [hasConflict, setHasConflict] = useState(false)
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)

  // Ref to track the latest request ID to prevent race conditions
  const lastRequestRef = useRef<number>(0)

  const checkAvailability = useCallback(async () => {
    if (
      formData.location_type === "community" &&
      formData.location_id &&
      formData.start_date
    ) {
      // Increment request ID
      const requestId = ++lastRequestRef.current

      setIsCheckingAvailability(true)
      setConflictWarning(null)
      setHasConflict(false)

      console.log("[v0] Checking availability for:", {
        locationId: formData.location_id,
        start: formData.start_date,
        time: formData.start_time
      })

      const result = await checkLocationAvailability({
        locationId: formData.location_id,
        tenantId,
        startDate: formData.start_date,
        endDate: formData.end_date || formData.start_date,
        startTime: formData.is_all_day ? null : formData.start_time || null,
        endTime: formData.is_all_day ? null : formData.end_time || null,
      })

      // If this is not the latest request, ignore the result
      if (requestId !== lastRequestRef.current) {
        console.log("[v0] Ignoring stale availability check result", { requestId, current: lastRequestRef.current })
        return
      }

      setIsCheckingAvailability(false)

      if (result.hasConflict) {
        setConflictWarning("This location has another event scheduled during this time.")
        setHasConflict(true)
      } else if (result.error) {
        console.error("[v0] Availability check error:", result.error)
      }
    } else {
      setConflictWarning(null)
      setHasConflict(false)
    }
  }, [
    formData.location_type,
    formData.location_id,
    formData.start_date,
    formData.end_date,
    formData.start_time,
    formData.end_time,
    formData.is_all_day,
    tenantId
  ])

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAvailability()
    }, 500)
    return () => clearTimeout(timer)
  }, [checkAvailability])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (formData.visibility_scope === "neighborhood" && formData.selected_neighborhoods.length === 0) {
        toast({
          title: "Neighborhoods required",
          description: "Please select at least one neighborhood for neighborhood-only events",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      if (
        formData.visibility_scope === "private" &&
        formData.selected_residents.length === 0 &&
        formData.selected_families.length === 0
      ) {
        toast({
          title: "Invites required",
          description: "Please invite at least one resident or family for private events",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      if (formData.location_type === "community" && !formData.location_id) {
        toast({
          title: "Location required",
          description: "Please select a community location",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      if (formData.location_type === "custom" && !formData.custom_location_name.trim()) {
        toast({
          title: "Location name required",
          description: "Please provide a name for your custom location",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      if (!formData.description.trim()) {
        toast({
          title: "Description required",
          description: "Please provide a description for your event",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      const result = await createEvent(tenantSlug, tenantId, {
        title: formData.title,
        description: formData.description || null,
        category_id: formData.category_id,
        event_type: formData.event_type,
        start_date: formData.start_date,
        start_time: formData.is_all_day ? null : formData.start_time || null,
        end_date: formData.end_date || null,
        end_time: formData.is_all_day ? null : formData.end_time || null,
        is_all_day: formData.is_all_day,
        visibility_scope: formData.visibility_scope,
        status: "published",
        requires_rsvp: formData.requires_rsvp,
        rsvp_deadline: formData.rsvp_deadline || null,
        max_attendees: formData.max_attendees ? Number.parseInt(formData.max_attendees) : null,
        neighborhood_ids: formData.selected_neighborhoods,
        invitee_ids: formData.selected_residents,
        family_unit_ids: formData.selected_families,
        location_type: formData.location_type,
        location_id: formData.location_type === "community" ? formData.location_id : null,
        custom_location_name: formData.location_type === "custom" ? formData.custom_location_name : null,
        custom_location_coordinates: formData.location_type === "custom" ? formData.custom_location_coordinates : null,
        custom_location_type: formData.location_type === "custom" ? (formData.custom_location_type === "marker" ? "pin" : formData.custom_location_type) : null,
        recurrence: formData.is_recurring
          ? {
            frequency: formData.recurrence_frequency,
            interval: parseInt(formData.recurrence_interval) || 1,
            count: formData.recurrence_end_type === "count" ? parseInt(formData.recurrence_count) : undefined,
            until: formData.recurrence_end_type === "date" ? formData.recurrence_until : undefined,
            rsvp_offset_hours: formData.requires_rsvp ? parseInt(formData.rsvp_offset_hours) : undefined,
          }
          : null,
      })

      if (result.success) {
        EventsAnalytics.created({
          event_type: formData.event_type,
          category_id: formData.category_id,
          category_name: categories.find(c => c.id === formData.category_id)?.name || 'unknown',
          visibility: formData.visibility_scope,
          has_rsvp: formData.requires_rsvp,
          has_location: formData.location_type !== "none",
        })
        if (photos.length > 0 && result.data?.id) {
          const imageResult = await saveEventImages(result.data.id, tenantSlug, photos, heroPhoto)

          if (!imageResult.success) {
            console.error("[v0] Failed to save event images:", imageResult.error)
            showFeedback({
              title: "Images not saved",
              description: "Your event was created, but we couldn't save the images. You can try adding them again later.",
              variant: "warning",
              image: "/rio/rio_missing_details.png"
            })
          }
        }

        showFeedback({
          title: "Event Created!",
          description: "Your event has been published to the community. Enjoy your time together",
          variant: "success",
          image: "/rio/rio_event_created.png"
        })
        router.push(`/t/${tenantSlug}/dashboard/events`)
      } else {
        ErrorAnalytics.actionFailed('create_event', result.error || "Failed to create event")
        toast({
          title: "Error",
          description: result.error || "Failed to create event",
          variant: "destructive",
        })
      }
    } catch (error) {
      ErrorAnalytics.actionFailed('create_event', error instanceof Error ? error.message : "Unexpected error")
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Event Details */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Basic Info & Photos
                </CardTitle>
                <CardDescription>Tell us about your event</CardDescription>
              </div>
              <Badge variant="outline">Step 1 of 4</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Event Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Community BBQ, Book Club Meeting, etc."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Tell your neighbors about this event..."
                className="min-h-[200px]"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                required
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center gap-2">
                        {category.icon && <span>{category.icon}</span>}
                        {category.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Event Type */}
            <div className="space-y-3">
              <Label>
                Event Type <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={formData.event_type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    event_type: value as "resident" | "official",
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="resident" id="resident" />
                  <Label htmlFor="resident" className="font-normal cursor-pointer">
                    Resident-Created
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="official" id="official" />
                  <Label htmlFor="official" className="font-normal cursor-pointer">
                    Official Community Event
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">Official events are managed by community administrators</p>
            </div>

            {/* PhotoManager component for image uploads */}
            <div className="pt-4 border-t">
              <PhotoManager
                photos={photos}
                heroPhoto={heroPhoto}
                onPhotosChange={setPhotos}
                onHeroPhotoChange={setHeroPhoto}
                maxPhotos={10}
                entityType="event"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Scheduling & RSVP */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  When & RSVP
                </CardTitle>
                <CardDescription>Set the date, time, and attendance options</CardDescription>
              </div>
              <Badge variant="outline">Step 2 of 4</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date and Time */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Start Date & Time <span className="text-destructive">*</span>
                </Label>
                <DateTimePicker
                  date={formData.start_date ? new Date(formData.start_date + (formData.start_time ? `T${formData.start_time}` : 'T12:00')) : undefined}
                  setDate={(date) => {
                    if (date) {
                      const dateStr = format(date, 'yyyy-MM-dd')
                      const timeStr = format(date, 'HH:mm')
                      setFormData({
                        ...formData,
                        start_date: dateStr,
                        start_time: timeStr,
                        end_date: !formData.end_date || formData.end_date < dateStr ? dateStr : formData.end_date,
                      })
                    } else {
                      setFormData({ ...formData, start_date: '', start_time: '' })
                    }
                  }}
                  placeholder="Pick start date"
                  showTime={!formData.is_all_day}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date & Time</Label>
                <DateTimePicker
                  date={formData.end_date ? new Date(formData.end_date + (formData.end_time ? `T${formData.end_time}` : 'T12:00')) : undefined}
                  setDate={(date) => {
                    if (date) {
                      setFormData({
                        ...formData,
                        end_date: format(date, 'yyyy-MM-dd'),
                        end_time: format(date, 'HH:mm'),
                      })
                    } else {
                      setFormData({ ...formData, end_date: '', end_time: '' })
                    }
                  }}
                  placeholder="Pick end date (optional)"
                  showTime={!formData.is_all_day}
                />
                <p className="text-xs text-muted-foreground">Optional: Leave empty for single-day event</p>
              </div>
            </div>

            {/* All Day Event */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_all_day"
                checked={formData.is_all_day}
                onCheckedChange={(checked) => {
                  setFormData({
                    ...formData,
                    is_all_day: checked === true,
                    start_time: checked === true ? "" : formData.start_time,
                    end_time: checked === true ? "" : formData.end_time,
                  })
                }}
              />
              <Label htmlFor="is_all_day" className="text-sm font-normal cursor-pointer">
                This is an all-day event
              </Label>
            </div>

            {/* Recurrence Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      is_recurring: checked === true,
                    })
                  }}
                />
                <Label htmlFor="is_recurring" className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  Repeat this event
                </Label>
              </div>

              {formData.is_recurring && (
                <div className="space-y-4 pl-6 border-l-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select
                        value={formData.recurrence_frequency}
                        onValueChange={(value: "daily" | "weekly" | "monthly") =>
                          setFormData({ ...formData, recurrence_frequency: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Interval (Every X {formData.recurrence_frequency === 'daily' ? 'days' : formData.recurrence_frequency === 'weekly' ? 'weeks' : 'months'})</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.recurrence_interval}
                        onChange={(e) => setFormData({ ...formData, recurrence_interval: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>End condition</Label>
                    <RadioGroup
                      value={formData.recurrence_end_type}
                      onValueChange={(value: "count" | "date") =>
                        setFormData({ ...formData, recurrence_end_type: value })
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="count" id="end_count" />
                        <Label htmlFor="end_count" className="font-normal cursor-pointer w-24">
                          After
                        </Label>
                        <Input
                          type="number"
                          min="2"
                          max="12"
                          className="w-20 h-8"
                          disabled={formData.recurrence_end_type !== "count"}
                          value={formData.recurrence_count}
                          onChange={(e) => {
                            let val = parseInt(e.target.value) || 0;
                            if (val > 12) val = 12; // Enforce max 12
                            setFormData({ ...formData, recurrence_count: val.toString() })
                          }}
                        />
                        <span className="text-sm">occurrences (Max 12)</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="date" id="end_date" />
                        <Label htmlFor="end_date" className="font-normal cursor-pointer w-24">
                          On Date
                        </Label>
                        <div className={formData.recurrence_end_type !== "date" ? "opacity-50 pointer-events-none" : ""}>
                          <DateTimePicker
                            date={formData.recurrence_until ? new Date(formData.recurrence_until) : undefined}
                            setDate={(date) => {
                              if (date) {
                                setFormData({
                                  ...formData,
                                  recurrence_until: format(date, 'yyyy-MM-dd'),
                                })
                              } else {
                                setFormData({ ...formData, recurrence_until: '' })
                              }
                            }}
                            placeholder="Pick end date"
                            showTime={false}
                          />
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}
            </div>

            {/* RSVP Settings Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label className="text-base font-semibold">RSVP Settings</Label>
                <p className="text-sm text-muted-foreground">Collect attendance responses from community members</p>
              </div>

              {/* Enable RSVPs Toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires_rsvp"
                  checked={formData.requires_rsvp}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      requires_rsvp: checked === true,
                    })
                  }}
                />
                <Label htmlFor="requires_rsvp" className="text-sm font-normal cursor-pointer">
                  Enable RSVPs for this event
                </Label>
              </div>

              {/* RSVP Deadline and Max Attendees (shown when RSVP is enabled) */}
              {formData.requires_rsvp && (
                <div className="space-y-4 pl-6 border-l-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="rsvp_deadline">RSVP Deadline</Label>
                    {formData.is_recurring ? (
                      <div className="space-y-1">
                        <Select
                          value={formData.rsvp_offset_hours}
                          onValueChange={(value) => setFormData({ ...formData, rsvp_offset_hours: value })}
                        >
                          <SelectTrigger id="rsvp_deadline">
                            <SelectValue placeholder="Select deadline relative to event" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 hour before event start</SelectItem>
                            <SelectItem value="24">24 hours (1 day) before event start</SelectItem>
                            <SelectItem value="48">48 hours (2 days) before event start</SelectItem>
                            <SelectItem value="72">72 hours (3 days) before event start</SelectItem>
                            <SelectItem value="168">1 week before event start</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Deadline will be calculated relative to each event instance.</p>
                      </div>
                    ) : (
                      <>
                        <DateTimePicker
                          date={formData.rsvp_deadline ? new Date(formData.rsvp_deadline) : undefined}
                          setDate={(date) => {
                            if (date) {
                              setFormData({
                                ...formData,
                                rsvp_deadline: format(date, "yyyy-MM-dd'T'HH:mm"),
                              })
                            } else {
                              setFormData({ ...formData, rsvp_deadline: "" })
                            }
                          }}
                          placeholder="Pick RSVP deadline"
                          showTime={true}
                        />
                        <p className="text-xs text-muted-foreground">Optional: Last date to RSVP</p>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_attendees">Maximum Attendees</Label>
                    <Input
                      id="max_attendees"
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={formData.max_attendees}
                      onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Optional: Capacity limit</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Event Location */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Event Location
                </CardTitle>
                <CardDescription>Where will this event take place?</CardDescription>
              </div>
              <Badge variant="outline">Step 3 of 4</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {conflictWarning && (
              <div className="mb-4 rounded-md border-l-4 border-yellow-500 bg-yellow-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      {conflictWarning}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <LocationSelector
              tenantId={tenantId}
              locationType={formData.location_type}
              communityLocationId={formData.location_id}
              customLocationName={formData.custom_location_name}
              customLocationCoordinates={formData.custom_location_coordinates}
              customLocationType={formData.custom_location_type as "marker" | "polygon" | null}
              customLocationPath={formData.custom_location_path}
              onLocationTypeChange={(type) =>
                setFormData({
                  ...formData,
                  location_type: type as "community" | "custom" | "none",
                  location_id: null,
                  custom_location_name: "",
                  custom_location_coordinates: null,
                  custom_location_type: null,
                  custom_location_path: null,
                })
              }
              onCommunityLocationChange={(locationId) => setFormData({ ...formData, location_id: locationId })}
              onCustomLocationNameChange={handleCustomLocationNameChange}
              onCustomLocationChange={handleCustomLocationChange}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 4: Who is Invited */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Who is Invited
                </CardTitle>
                <CardDescription>Control who can see and attend this event</CardDescription>
              </div>
              <Badge variant="outline">Step 4 of 4</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={formData.visibility_scope}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  visibility_scope: value as "community" | "neighborhood" | "private",
                  selected_neighborhoods: value === "neighborhood" ? formData.selected_neighborhoods : [],
                  selected_residents: value === "private" ? formData.selected_residents : [],
                  selected_families: value === "private" ? formData.selected_families : [],
                })
              }
            >
              <div className="space-y-3">
                <div className="flex items-start space-x-3 rounded-md border p-4 transition-colors hover:bg-accent/50">
                  <RadioGroupItem value="community" id="community" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="community" className="font-medium cursor-pointer">
                      Community-Wide
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">All community members can see this event</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-md border p-4 transition-colors hover:bg-accent/50">
                  <RadioGroupItem value="neighborhood" id="neighborhood" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="neighborhood" className="font-medium cursor-pointer">
                      Neighborhood Only
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Only residents in selected neighborhoods can see this event
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-md border p-4 transition-colors hover:bg-accent/50">
                  <RadioGroupItem value="private" id="private" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="private" className="font-medium cursor-pointer">
                      Private / Invitation Only
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Only invited residents and families can see this event
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>

            {/* Neighborhood Selector with smooth transition */}
            {formData.visibility_scope === "neighborhood" && (
              <div className="pl-6 border-l-2 space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <NeighborhoodMultiSelect
                  tenantId={tenantId}
                  selectedNeighborhoodIds={formData.selected_neighborhoods}
                  onChange={(ids) => setFormData({ ...formData, selected_neighborhoods: ids })}
                />
              </div>
            )}

            {/* Invite Selector with smooth transition */}
            {formData.visibility_scope === "private" && (
              <div className="pl-6 border-l-2 space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <ResidentInviteSelector
                  tenantId={tenantId}
                  selectedResidentIds={formData.selected_residents}
                  selectedFamilyIds={formData.selected_families}
                  onResidentsChange={(ids) => setFormData({ ...formData, selected_residents: ids })}
                  onFamiliesChange={(ids) => setFormData({ ...formData, selected_families: ids })}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 justify-between">
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>

          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        {currentStep < 4 ? (
          <Button
            type="button"
            onClick={() => {
              // Block progress if there's a conflict in Step 3
              if (currentStep === 3) {
                if (isCheckingAvailability) return
                if (hasConflict) {
                  toast({
                    title: "Location Unavailable",
                    description: "Please select a different location or time.",
                    variant: "destructive",
                  })
                  return
                }
                if (formData.location_type === "community" && !formData.location_id) {
                  toast({
                    title: "Location required",
                    description: "Please select a community location",
                    variant: "destructive",
                  })
                  return
                }
              }
              setCurrentStep(currentStep + 1)
            }}
            className="flex gap-2"
            disabled={currentStep === 3 && (isCheckingAvailability || hasConflict)}
          >
            {currentStep === 3 && isCheckingAvailability ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <PulsatingButton type="submit" disabled={isSubmitting || hasConflict}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Event...
              </>
            ) : (
              "Create Event"
            )}
          </PulsatingButton>
        )}
      </div>
    </form>
  )
}
