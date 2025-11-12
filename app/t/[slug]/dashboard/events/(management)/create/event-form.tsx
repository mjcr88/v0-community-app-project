"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createEvent, saveEventImages } from "@/app/actions/events"
import { Calendar, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { NeighborhoodMultiSelect } from "@/components/event-forms/neighborhood-multi-select"
import { ResidentInviteSelector } from "@/components/event-forms/resident-invite-selector"
import { LocationSelector } from "@/components/event-forms/location-selector"
import { PhotoManager } from "@/components/photo-manager"

type Category = {
  id: string
  name: string
  icon: string | null
}

type EventFormProps = {
  tenantSlug: string
  tenantId: string
  categories: Category[]
}

export function EventForm({ tenantSlug, tenantId, categories }: EventFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [heroPhoto, setHeroPhoto] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    is_all_day: false,
    event_type: "resident" as "resident" | "official",
    requires_rsvp: false,
    rsvp_deadline: "",
    max_attendees: "",
    visibility_scope: "community" as "community" | "neighborhood" | "private",
    selected_neighborhoods: [] as string[],
    selected_residents: [] as string[],
    selected_families: [] as string[],
    location_type: "none" as "community" | "custom" | "none",
    location_id: null as string | null,
    custom_location_name: "",
    custom_location_coordinates: null as { lat: number; lng: number } | null,
    custom_location_type: null as "pin" | "polygon" | null,
    custom_location_path: null as Array<{ lat: number; lng: number }> | null,
  })

  const handleCustomLocationNameChange = useCallback((name: string) => {
    setFormData((prev) => ({ ...prev, custom_location_name: name }))
  }, [])

  const handleCustomLocationChange = useCallback(
    (data: {
      coordinates?: { lat: number; lng: number } | null
      type?: "pin" | "polygon" | null
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
        custom_location_type: formData.location_type === "custom" ? formData.custom_location_type : null,
      })

      if (result.success) {
        if (photos.length > 0 && result.data?.id) {
          const imageResult = await saveEventImages(result.data.id, tenantSlug, photos, heroPhoto)

          if (!imageResult.success) {
            console.error("[v0] Failed to save event images:", imageResult.error)
            toast({
              title: "Warning",
              description: "Event created but some images failed to upload",
              variant: "destructive",
            })
          }
        }

        toast({
          title: "Event created!",
          description: "Your event has been published to the community.",
        })
        router.push(`/t/${tenantSlug}/dashboard/events`)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create event",
          variant: "destructive",
        })
      }
    } catch (error) {
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
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Details
          </CardTitle>
          <CardDescription>Fill in the information about your event</CardDescription>
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell your neighbors about this event..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">Optional: Add more details about what to expect</p>
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

          {/* Date and Time */}
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
              entityType="location"
            />
          </div>

          {/* Location Selector */}
          <LocationSelector
            tenantId={tenantId}
            locationType={formData.location_type}
            communityLocationId={formData.location_id}
            customLocationName={formData.custom_location_name}
            customLocationCoordinates={formData.custom_location_coordinates}
            customLocationType={formData.custom_location_type}
            customLocationPath={formData.custom_location_path}
            onLocationTypeChange={(type) =>
              setFormData({
                ...formData,
                location_type: type,
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

          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Who Can See This Event?</Label>
              <p className="text-sm text-muted-foreground">Control who has access to view and RSVP to this event</p>
            </div>

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

            {/* Neighborhood Selector */}
            {formData.visibility_scope === "neighborhood" && (
              <div className="pl-6 border-l-2 space-y-2">
                <NeighborhoodMultiSelect
                  tenantId={tenantId}
                  selectedNeighborhoodIds={formData.selected_neighborhoods}
                  onChange={(ids) => setFormData({ ...formData, selected_neighborhoods: ids })}
                />
              </div>
            )}

            {/* Invite Selector */}
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

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
