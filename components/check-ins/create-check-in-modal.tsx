"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createCheckIn } from "@/app/actions/check-ins"
import { Loader2, Plus, Minus } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useRioFeedback } from "@/components/feedback/rio-feedback-provider"
import { NeighborhoodMultiSelect } from "@/components/event-forms/neighborhood-multi-select"
import { ResidentInviteSelector } from "@/components/event-forms/resident-invite-selector"
import { LocationSelector } from "@/components/event-forms/location-selector"
import { CHECK_IN_ACTIVITIES } from "@/lib/check-in-activities"

interface CreateCheckInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantSlug: string
  tenantId: string
  initialLocation?: {
    id: string
    name: string
    type: string
  } | null
}

export function CreateCheckInModal({
  open,
  onOpenChange,
  tenantSlug,
  tenantId,
  initialLocation,
}: CreateCheckInModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { showFeedback } = useRioFeedback()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    activity_type: "",
    description: "",
    duration_minutes: 60, // Default 1 hour
    start_time_offset: 0, // Minutes from now (0 = now, up to 60 = 1 hour future)
    visibility_scope: "community" as "community" | "neighborhood" | "private",
    selected_neighborhoods: [] as string[],
    selected_residents: [] as string[],
    selected_families: [] as string[],
    location_type: (initialLocation ? "community" : "community") as "community" | "custom",
    location_id: initialLocation?.id || null,
    custom_location_name: "",
    custom_location_coordinates: null as { lat: number; lng: number } | null,
    custom_location_type: null as "marker" | "polygon" | null,
    custom_location_path: null as Array<{ lat: number; lng: number }> | null,
  })

  const handleCustomLocationNameChange = useCallback((name: string) => {
    console.log("[v0] Custom location name changed:", name)
    setFormData((prev) => ({ ...prev, custom_location_name: name }))
  }, [])

  const handleCustomLocationChange = useCallback(
    (data: {
      coordinates?: { lat: number; lng: number } | null
      type?: "marker" | "polygon" | null
      path?: Array<{ lat: number; lng: number }> | null
    }) => {
      console.log("[v0] Custom location data changed in modal:", {
        hasCoordinates: !!data.coordinates,
        coordinates: data.coordinates,
        type: data.type,
        hasPath: !!data.path,
        pathLength: data.path?.length || 0,
      })
      setFormData((prev) => ({
        ...prev,
        custom_location_coordinates: data.coordinates || null,
        custom_location_type: data.type || null,
        custom_location_path: data.path || null,
      }))
    },
    [],
  )

  const increaseDuration = () => {
    setFormData((prev) => ({
      ...prev,
      duration_minutes: Math.min(prev.duration_minutes + 30, 480), // Max 8 hours
    }))
  }

  const decreaseDuration = () => {
    setFormData((prev) => ({
      ...prev,
      duration_minutes: Math.max(prev.duration_minutes - 30, 30), // Min 30 minutes
    }))
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const increaseStartTime = () => {
    setFormData((prev) => ({
      ...prev,
      start_time_offset: Math.min(prev.start_time_offset + 15, 60), // Max 1 hour
    }))
  }

  const decreaseStartTime = () => {
    setFormData((prev) => ({
      ...prev,
      start_time_offset: Math.max(prev.start_time_offset - 15, 0), // Min now
    }))
  }

  const formatStartTime = (offsetMinutes: number) => {
    if (offsetMinutes === 0) return "Now"
    return `In ${offsetMinutes}m`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (formData.visibility_scope === "neighborhood" && formData.selected_neighborhoods.length === 0) {
        toast({
          title: "Neighborhoods required",
          description: "Please select at least one neighborhood for neighborhood-only check-ins",
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
          description: "Please invite at least one resident or family for private check-ins",
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

      if (formData.location_type === "custom") {
        console.log("[v0] SUBMITTING CUSTOM CHECK-IN - VALIDATION:", {
          locationName: formData.custom_location_name,
          hasCoordinates: !!formData.custom_location_coordinates,
          coordinates: formData.custom_location_coordinates,
          locationType: formData.custom_location_type,
          hasPath: !!formData.custom_location_path,
          pathLength: formData.custom_location_path?.length || 0,
        })

        if (!formData.custom_location_coordinates) {
          console.error("[v0] ERROR: No coordinates set for custom location!")
          toast({
            title: "Location marker required",
            description: "Please drop a marker on the map to set your location",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }

        if (!formData.custom_location_coordinates.lat || !formData.custom_location_coordinates.lng) {
          console.error("[v0] ERROR: Invalid coordinates:", formData.custom_location_coordinates)
          toast({
            title: "Invalid location coordinates",
            description: "Please drop a new marker on the map",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      const startTime = new Date()
      startTime.setMinutes(startTime.getMinutes() + formData.start_time_offset)

      const dbLocationType = formData.location_type === "community" ? "community_location" : "custom_temporary"

      const checkInData = {
        title: formData.title,
        activity_type: formData.activity_type,
        description: formData.description || null,
        start_time: startTime.toISOString(),
        duration_minutes: formData.duration_minutes,
        visibility_scope: formData.visibility_scope,
        neighborhood_ids: formData.selected_neighborhoods,
        invitee_ids: formData.selected_residents,
        family_unit_ids: formData.selected_families,
        location_type: dbLocationType,
        location_id: formData.location_type === "community" ? formData.location_id : null,
        custom_location_name: formData.location_type === "custom" ? formData.custom_location_name : null,
        custom_location_coordinates: formData.location_type === "custom" ? formData.custom_location_coordinates : null,
        custom_location_type: formData.location_type === "custom" ? formData.custom_location_type : null,
      }

      console.log("[v0] CHECK-IN DATA BEING SENT TO SERVER:", {
        ...checkInData,
        hasCustomCoordinates: !!checkInData.custom_location_coordinates,
        customCoordinatesDetail: checkInData.custom_location_coordinates,
      })

      const result = await createCheckIn(tenantSlug, tenantId, checkInData)

      if (result.success) {
        showFeedback({
          title: "Checked In!",
          description: "Your check-in is now live for the community. Have fun!",
          variant: "success",
          image: "/rio/rio_check_in_created.png"
        })
        onOpenChange(false)
        router.refresh()
      } else {
        console.error("[v0] CHECK-IN CREATION FAILED:", {
          error: result.error,
          sentData: checkInData,
        })
        showFeedback({
          title: "Couldn't check in",
          description: result.error || "Something went wrong. Please try again.",
          variant: "error",
          image: "/rio/rio_no_results_confused.png"
        })
      }
    } catch (error) {
      console.error("[v0] CHECK-IN CREATION EXCEPTION:", error)
      showFeedback({
        title: "Something went wrong",
        description: "An unexpected error occurred. Please try again.",
        variant: "error",
        image: "/rio/rio_no_results_confused.png"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Check-in</DialogTitle>
          <DialogDescription>Let your community know where you are and what you're doing</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="space-y-6 pt-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  What are you doing? <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Morning coffee, working on laptop, playing frisbee..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Activity Type */}
              <div className="space-y-2">
                <Label htmlFor="activity">
                  Activity Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.activity_type}
                  onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
                  required
                >
                  <SelectTrigger id="activity">
                    <SelectValue placeholder="Select an activity" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHECK_IN_ACTIVITIES.map((activity) => {
                      const IconComponent = activity.icon
                      return (
                        <SelectItem key={activity.value} value={activity.value}>
                          <span className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {activity.label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Additional Details</Label>
                <Textarea
                  id="description"
                  placeholder="Add more context about what you're up to..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Optional: Share more about your activity</p>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label>
                  How long will you be here? <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={decreaseDuration}
                    disabled={formData.duration_minutes <= 30}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold">{formatDuration(formData.duration_minutes)}</div>
                    <p className="text-xs text-muted-foreground">Adjust in 30-minute intervals</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={increaseDuration}
                    disabled={formData.duration_minutes >= 480}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Start Time */}
              <div className="space-y-2">
                <Label>When are you starting?</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={decreaseStartTime}
                    disabled={formData.start_time_offset <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold">{formatStartTime(formData.start_time_offset)}</div>
                    <p className="text-xs text-muted-foreground">Schedule up to 1 hour ahead</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={increaseStartTime}
                    disabled={formData.start_time_offset >= 60}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
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
                    location_type: type as "community" | "custom",
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

              {/* Visibility */}
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Who Can See This Check-in?</Label>
                  <p className="text-sm text-muted-foreground">Control who can see where you are</p>
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
                        <p className="text-sm text-muted-foreground mt-1">
                          All community members can see this check-in
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 rounded-md border p-4">
                      <RadioGroupItem value="neighborhood" id="neighborhood" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="neighborhood" className="font-medium cursor-pointer">
                          Neighborhood Only
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Only residents in selected neighborhoods can see this
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
                          Only invited residents and families can see this
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

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Creating..." : "Create Check-in"}
                </Button>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </DialogContent>
    </Dialog>
  )
}
