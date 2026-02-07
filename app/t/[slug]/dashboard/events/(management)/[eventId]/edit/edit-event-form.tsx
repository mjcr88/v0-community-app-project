"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { updateEvent, saveEventImages } from "@/app/actions/events"
import { Calendar, Loader2, AlertTriangle, CheckCircle2, CalendarDays } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { NeighborhoodMultiSelect } from "@/components/event-forms/neighborhood-multi-select"
import { ResidentInviteSelector } from "@/components/event-forms/resident-invite-selector"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LocationSelector } from "@/components/event-forms/location-selector"
import { PhotoManager } from "@/components/photo-manager"
import { EventsAnalytics, ErrorAnalytics } from "@/lib/analytics"

type Category = {
  id: string
  name: string
  icon: string | null
}

type EditEventFormProps = {
  eventId: string
  tenantSlug: string
  tenantId: string
  categories: Category[]
  initialData: {
    title: string
    description: string
    category_id: string
    start_date: string
    start_time: string
    end_date: string
    end_time: string
    is_all_day: boolean
    event_type: "resident" | "official"
    status: "draft" | "published" | "cancelled"
    requires_rsvp: boolean
    rsvp_deadline: string
    max_attendees: number | null
    visibility_scope: "community" | "neighborhood" | "private"
    location_type: "community" | "custom" | "none" | null
    location_id: string | null
    custom_location_name: string | null
    custom_location_coordinates: { lat: number; lng: number } | null
    custom_location_type: "marker" | "polygon" | null
    parent_event_id: string | null
    recurrence_rule: string | null
  }
  initialNeighborhoods: string[]
  initialResidents: string[]
  initialFamilies: string[]
  initialPhotos?: string[]
  initialHeroPhoto?: string | null
}

export function EditEventForm({
  eventId,
  tenantSlug,
  tenantId,
  categories,
  initialData,
  initialNeighborhoods,
  initialResidents,
  initialFamilies,
  initialPhotos = [],
  initialHeroPhoto = null,
}: EditEventFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const mapDbToFormLocationType = (dbType: string | null): "community" | "custom" | "none" => {
    if (dbType === "community_location") return "community"
    if (dbType === "custom_temporary") return "custom"
    return "none"
  }

  const [formData, setFormData] = useState({
    ...initialData,
    max_attendees: initialData.max_attendees?.toString() || "",
    selected_neighborhoods: initialNeighborhoods,
    selected_residents: initialResidents,
    selected_families: initialFamilies,
    location_type: mapDbToFormLocationType(initialData.location_type),
    location_id: initialData.location_id,
    custom_location_name: initialData.custom_location_name || "",
  })

  const [showVisibilityWarning, setShowVisibilityWarning] = useState(false)
  const [visibilityChangeType, setVisibilityChangeType] = useState<"expanding" | "reducing" | null>(null)

  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [heroPhoto, setHeroPhoto] = useState<string | null>(initialHeroPhoto)
  const [showScopeDialog, setShowScopeDialog] = useState(false)
  const isSeries = !!initialData.parent_event_id || !!initialData.recurrence_rule

  const handleCustomLocationNameChange = useCallback((name: string) => {
    setFormData((prev) => ({ ...prev, custom_location_name: name }))
  }, [])

  const handleCustomLocationChange = useCallback(
    (data: {
      coordinates?: { lat: number; lng: number } | null
      type?: "marker" | "polygon" | null
      path?: Array<{ lat: number; lng: number }> | null
    }) => {
      console.log("[v0] Custom location updated in form:", data)
      setFormData((prev) => ({
        ...prev,
        custom_location_coordinates: data.coordinates || null,
        custom_location_type: data.type || null,
      }))
    },
    [],
  )

  useEffect(() => {
    const original = initialData.visibility_scope
    const current = formData.visibility_scope

    if (original !== current) {
      const scopeOrder = { private: 0, neighborhood: 1, community: 2 }
      const originalLevel = scopeOrder[original]
      const currentLevel = scopeOrder[current]

      if (currentLevel > originalLevel) {
        setVisibilityChangeType("expanding")
        setShowVisibilityWarning(true)
      } else if (currentLevel < originalLevel) {
        setVisibilityChangeType("reducing")
        setShowVisibilityWarning(true)
      } else {
        setShowVisibilityWarning(false)
        setVisibilityChangeType(null)
      }
    } else {
      setShowVisibilityWarning(false)
      setVisibilityChangeType(null)
    }
  }, [formData.visibility_scope, initialData.visibility_scope])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSeries && !showScopeDialog) {
      setShowScopeDialog(true)
      return
    }

    await performUpdate("this")
  }

  const performUpdate = async (scope: "this" | "series") => {
    setShowScopeDialog(false)
    setIsSubmitting(true)

    try {
      let neighborhoodIds = formData.selected_neighborhoods
      let inviteeIds = formData.selected_residents
      let familyUnitIds = formData.selected_families

      if (initialData.visibility_scope === "neighborhood" && formData.visibility_scope !== "neighborhood") {
        neighborhoodIds = []
      }

      if (initialData.visibility_scope === "private" && formData.visibility_scope !== "private") {
        inviteeIds = []
        familyUnitIds = []
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

      const result = await updateEvent(eventId, tenantSlug, tenantId, {
        title: formData.title,
        description: formData.description || null,
        category_id: formData.category_id,
        event_type: formData.event_type,
        start_date: formData.start_date,
        start_time: formData.is_all_day ? null : formData.start_time || null,
        end_date: formData.end_date || null,
        end_time: formData.is_all_day ? null : formData.end_time || null,
        is_all_day: formData.is_all_day,
        status: initialData.status,
        requires_rsvp: formData.requires_rsvp,
        rsvp_deadline: formData.rsvp_deadline || null,
        max_attendees: formData.max_attendees ? Number.parseInt(formData.max_attendees) : null,
        visibility_scope: formData.visibility_scope,
        neighborhood_ids: neighborhoodIds,
        invitee_ids: inviteeIds,
        family_unit_ids: familyUnitIds,
        location_type: formData.location_type,
        location_id: formData.location_type === "community" ? formData.location_id : null,
        custom_location_name: formData.location_type === "custom" ? formData.custom_location_name : null,
      }, scope)

      if (result.success) {
        const imageResult = await saveEventImages(eventId, tenantSlug, photos, heroPhoto)

        if (!imageResult.success) {
          console.error("[v0] Failed to save event images:", imageResult.error)
          toast({
            title: "Warning",
            description: "Event updated but some images failed to save",
            variant: "destructive",
          })
        }

        EventsAnalytics.edited(eventId)

        let description = "Your changes have been saved successfully."

        if (visibilityChangeType === "expanding") {
          description += " This event is now visible to more people."
        } else if (visibilityChangeType === "reducing") {
          description += " This event is now only visible to a restricted audience."
        }

        toast({
          title: "Event updated!",
          description,
        })

        if (initialData.visibility_scope === "private" && formData.visibility_scope === "community") {
          setTimeout(() => {
            toast({
              title: "Visibility Expanded",
              description:
                "This event is now visible to all community members. Everyone can now see and RSVP to this event.",
              duration: 5000,
            })
          }, 1000)
        }

        router.refresh()

        await new Promise((resolve) => setTimeout(resolve, 100))

        router.push(`/t/${tenantSlug}/dashboard/events/${eventId}`)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update event",
          variant: "destructive",
        })
        ErrorAnalytics.actionFailed('update_event', result.error || "Failed to update event")
      }
    } catch (error) {
      ErrorAnalytics.actionFailed('update_event', error instanceof Error ? error.message : "Unexpected error")
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
    <>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Details
            </CardTitle>
            <CardDescription>Update the information about your event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Tell your neighbors about this event..."
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">Optional: Add more details about what to expect</p>
            </div>

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

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_date">
                    Start Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => {
                      const newStartDate = e.target.value
                      setFormData({
                        ...formData,
                        start_date: newStartDate,
                        end_date:
                          !formData.end_date || formData.end_date < newStartDate ? newStartDate : formData.end_date,
                      })
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    disabled={formData.is_all_day}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    min={formData.start_date}
                  />
                  <p className="text-xs text-muted-foreground">Optional: Leave empty for single-day event</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    disabled={formData.is_all_day}
                  />
                </div>
              </div>
            </div>

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

            <div className="pt-4 border-t">
              <PhotoManager
                photos={photos}
                heroPhoto={heroPhoto}
                onPhotosChange={setPhotos}
                onHeroPhotoChange={setHeroPhoto}
                maxPhotos={10}
                entityType="location"
              />
            </div>

            <LocationSelector
              tenantId={tenantId}
              locationType={formData.location_type}
              communityLocationId={formData.location_id}
              customLocationName={formData.custom_location_name}
              customLocationCoordinates={initialData.custom_location_coordinates}
              customLocationType={initialData.custom_location_type}
              customLocationPath={null}
              onLocationTypeChange={(type) =>
                setFormData({ ...formData, location_type: type, location_id: null, custom_location_name: "" })
              }
              onCommunityLocationChange={(locationId) => setFormData({ ...formData, location_id: locationId })}
              onCustomLocationNameChange={handleCustomLocationNameChange}
              onCustomLocationChange={handleCustomLocationChange}
            />

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Who Can See This Event?</Label>
                <p className="text-sm text-muted-foreground">Control who has access to view and RSVP to this event</p>
              </div>

              {showVisibilityWarning && (
                <Alert variant={visibilityChangeType === "reducing" ? "destructive" : "default"}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Visibility Change Warning</AlertTitle>
                  <AlertDescription>
                    {visibilityChangeType === "expanding" && (
                      <>
                        You're expanding who can see this event from <strong>{initialData.visibility_scope}</strong> to{" "}
                        <strong>{formData.visibility_scope}</strong>. More people will be able to view and RSVP to this
                        event.
                      </>
                    )}
                    {visibilityChangeType === "reducing" && (
                      <>
                        You're restricting who can see this event from <strong>{initialData.visibility_scope}</strong> to{" "}
                        <strong>{formData.visibility_scope}</strong>. People who previously had access may no longer see
                        this event, and their RSVPs will remain but they won't receive updates.
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <RadioGroup
                value={formData.visibility_scope}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    visibility_scope: value as "community" | "neighborhood" | "private",
                  })
                }
              >
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 rounded-md border p-4">
                    <RadioGroupItem value="community" id="community" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="community" className="font-medium cursor-pointer">
                        Community-Wide
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">All community members can see this event</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 rounded-md border p-4">
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

                  <div className="flex items-start space-x-3 rounded-md border p-4">
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

              {formData.visibility_scope === "neighborhood" && (
                <div className="pl-6 border-l-2 space-y-2">
                  <NeighborhoodMultiSelect
                    tenantId={tenantId}
                    selectedNeighborhoodIds={formData.selected_neighborhoods}
                    onChange={(ids) => setFormData({ ...formData, selected_neighborhoods: ids })}
                  />
                </div>
              )}

              {formData.visibility_scope === "private" && (
                <div className="pl-6 border-l-2 space-y-2">
                  <ResidentInviteSelector
                    tenantId={tenantId}
                    selectedResidentIds={formData.selected_residents}
                    selectedFamilyIds={formData.selected_families}
                    onResidentsChange={(ids) => setFormData({ ...formData, selected_residents: ids })}
                    onFamiliesChange={(ids) => setFormData({ ...formData, selected_families: ids })}
                  />
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label className="text-base font-semibold">RSVP Settings</Label>
                <p className="text-sm text-muted-foreground">Collect attendance responses from community members</p>
              </div>

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

              {formData.requires_rsvp && (
                <div className="space-y-4 pl-6 border-l-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="rsvp_deadline">RSVP Deadline</Label>
                      <Input
                        id="rsvp_deadline"
                        type="datetime-local"
                        value={formData.rsvp_deadline}
                        onChange={(e) => setFormData({ ...formData, rsvp_deadline: e.target.value })}
                        max={formData.start_date ? `${formData.start_date}T${formData.start_time || "23:59"}` : undefined}
                      />
                      <p className="text-xs text-muted-foreground">Optional: When RSVPs close</p>
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
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Updating..." : "Update Event"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/t/${tenantSlug}/dashboard/events/${eventId}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <ResponsiveDialog
        isOpen={showScopeDialog}
        setIsOpen={setShowScopeDialog}
        title="Edit Recurring Event"
        description="This event is part of a series. How would you like to apply your changes?"
        className="px-0 sm:px-6"
      >
        <div className="flex flex-col gap-3 py-4 px-4">
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3"
            onClick={() => performUpdate("this")}
          >
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">Only this event</span>
              <span className="text-xs text-muted-foreground">Changes will only apply to this occurrence</span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3"
            onClick={() => performUpdate("series")}
          >
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">This and future events</span>
              <span className="text-xs text-muted-foreground">Apply changes to this and all following occurrences</span>
            </div>
          </Button>
        </div>
        <div className="hidden sm:flex sm:justify-end sm:gap-2">
          <Button type="button" variant="secondary" onClick={() => setShowScopeDialog(false)}>
            Cancel
          </Button>
        </div>
      </ResponsiveDialog>
    </>
  )
}
