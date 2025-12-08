"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Megaphone, Loader2, Calendar } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { NeighborhoodMultiSelect } from "@/components/event-forms/neighborhood-multi-select"
import { LocationSelector } from "@/components/event-forms/location-selector"
import { PhotoManager } from "@/components/photo-manager"
import { createAnnouncement } from "@/app/actions/announcements"
import { AnnouncementTypeIcon } from "@/components/announcements/announcement-type-icon"
import type { AnnouncementType, AnnouncementPriority } from "@/types/announcements"

type AnnouncementFormProps = {
  tenantSlug: string
  tenantId: string
}

export function AnnouncementForm({ tenantSlug, tenantId }: AnnouncementFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [heroPhoto, setHeroPhoto] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    announcement_type: "general" as AnnouncementType,
    priority: "normal" as AnnouncementPriority,
    visibility_scope: "community" as "community" | "neighborhood",
    selected_neighborhoods: [] as string[],
    location_type: "none" as "community" | "custom" | "none",
    location_id: null as string | null,
    custom_location_name: "",
    custom_location_coordinates: null as { lat: number; lng: number } | null,
    auto_archive_enabled: false,
    auto_archive_date: "",
  })

  const handleSubmit = async (status: "draft" | "published") => {
    setIsSubmitting(true)

    try {
      if (formData.visibility_scope === "neighborhood" && formData.selected_neighborhoods.length === 0) {
        toast({
          title: "Neighborhoods required",
          description: "Please select at least one neighborhood for neighborhood-specific announcements",
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

      const result = await createAnnouncement(tenantSlug, tenantId, {
        title: formData.title,
        description: formData.description || null,
        announcement_type: formData.announcement_type,
        priority: formData.priority,
        status,
        event_id: null,
        location_type: formData.location_type === "none" ? undefined : formData.location_type,
        location_id: formData.location_type === "community" ? formData.location_id : null,
        custom_location_name: formData.location_type === "custom" ? formData.custom_location_name : null,
        custom_location_lat: formData.location_type === "custom" && formData.custom_location_coordinates ?
          formData.custom_location_coordinates.lat : null,
        custom_location_lng: formData.location_type === "custom" && formData.custom_location_coordinates ?
          formData.custom_location_coordinates.lng : null,
        images: photos,
        auto_archive_date: formData.auto_archive_enabled && formData.auto_archive_date ?
          formData.auto_archive_date : null,
        neighborhood_ids: formData.visibility_scope === "neighborhood" ? formData.selected_neighborhoods : [],
      })

      if (result.success) {
        toast({
          title: status === "published" ? "Announcement published!" : "Draft saved!",
          description: status === "published"
            ? "Your announcement has been published to the community."
            : "Your announcement has been saved as a draft.",
        })
        router.push(`/t/${tenantSlug}/admin/announcements`)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create announcement",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error creating announcement:", error)
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
    <form onSubmit={(e) => e.preventDefault()}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Announcement Details
          </CardTitle>
          <CardDescription>Fill in the information about your announcement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Important Community Update"
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
              onChange={(html) => setFormData({ ...formData, description: html })}
              placeholder="Provide details about this announcement..."
              className="min-h-[200px]"
            />
          </div>

          {/* Announcement Type */}
          <div className="space-y-3">
            <Label>
              Announcement Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.announcement_type}
              onValueChange={(value) => setFormData({ ...formData, announcement_type: value as AnnouncementType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">
                  <div className="flex items-center gap-2">
                    <AnnouncementTypeIcon type="general" className="h-4 w-4" />
                    General Information
                  </div>
                </SelectItem>
                <SelectItem value="emergency">
                  <div className="flex items-center gap-2">
                    <AnnouncementTypeIcon type="emergency" className="h-4 w-4" />
                    Emergency Alert
                  </div>
                </SelectItem>
                <SelectItem value="maintenance">
                  <div className="flex items-center gap-2">
                    <AnnouncementTypeIcon type="maintenance" className="h-4 w-4" />
                    Maintenance Notice
                  </div>
                </SelectItem>
                <SelectItem value="event">
                  <div className="flex items-center gap-2">
                    <AnnouncementTypeIcon type="event" className="h-4 w-4" />
                    Community Event
                  </div>
                </SelectItem>
                <SelectItem value="policy">
                  <div className="flex items-center gap-2">
                    <AnnouncementTypeIcon type="policy" className="h-4 w-4" />
                    Policy Update
                  </div>
                </SelectItem>
                <SelectItem value="safety">
                  <div className="flex items-center gap-2">
                    <AnnouncementTypeIcon type="safety" className="h-4 w-4" />
                    Safety Warning
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <Label>
              Priority <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value as AnnouncementPriority })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="normal" />
                <Label htmlFor="normal" className="font-normal cursor-pointer">
                  Normal - Regular community update
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="important" id="important" />
                <Label htmlFor="important" className="font-normal cursor-pointer">
                  Important - Requires attention soon
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="urgent" id="urgent" />
                <Label htmlFor="urgent" className="font-normal cursor-pointer">
                  Urgent - Immediate awareness needed
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* PhotoManager component */}
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

          {/* Location Selector */}
          <div className="pt-4 border-t">
            <Label className="text-base font-semibold mb-3 block">Location (Optional)</Label>
            <LocationSelector
              tenantId={tenantId}
              locationType={formData.location_type}
              communityLocationId={formData.location_id}
              customLocationName={formData.custom_location_name}
              customLocationCoordinates={formData.custom_location_coordinates}
              onLocationTypeChange={(type) =>
                setFormData(prev => ({
                  ...prev,
                  location_type: type,
                  location_id: null,
                  custom_location_name: "",
                  custom_location_coordinates: null,
                }))
              }
              onCommunityLocationChange={(locationId) => setFormData(prev => ({ ...prev, location_id: locationId }))}
              onCustomLocationNameChange={(name) => setFormData(prev => ({ ...prev, custom_location_name: name }))}
              onCustomLocationChange={(data) =>
                setFormData(prev => ({
                  ...prev,
                  custom_location_coordinates: data.coordinates || null,
                }))
              }
            />
          </div>

          {/* Visibility Scope - Community Wide vs Specific Neighborhoods */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Who Can See This Announcement?</Label>
              <p className="text-sm text-muted-foreground">Choose the audience for this announcement</p>
            </div>

            <RadioGroup
              value={formData.visibility_scope}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  visibility_scope: value as "community" | "neighborhood",
                  selected_neighborhoods: value === "community" ? [] : formData.selected_neighborhoods,
                })
              }
            >
              <div className="space-y-3">
                <div className="flex items-start space-x-3 rounded-md border p-4">
                  <RadioGroupItem value="community" id="community-wide" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="community-wide" className="font-medium cursor-pointer">
                      Community-Wide
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      All community members will see this announcement
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-md border p-4">
                  <RadioGroupItem value="neighborhood" id="neighborhood-specific" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="neighborhood-specific" className="font-medium cursor-pointer">
                      Specific Neighborhoods
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Only residents in selected neighborhoods will see this
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
          </div>

          {/* Auto-Archive Settings */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Auto-Archive (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Automatically archive this announcement after a specific date
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto_archive_enabled"
                checked={formData.auto_archive_enabled}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    auto_archive_enabled: checked === true,
                  })
                }
              />
              <Label htmlFor="auto_archive_enabled" className="text-sm font-normal cursor-pointer">
                Enable auto-archive for this announcement
              </Label>
            </div>

            {formData.auto_archive_enabled && (
              <div className="pl-6 border-l-2 space-y-2">
                <Label htmlFor="auto_archive_date">Archive Date</Label>
                <Input
                  id="auto_archive_date"
                  type="datetime-local"
                  value={formData.auto_archive_date}
                  onChange={(e) => setFormData({ ...formData, auto_archive_date: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  The announcement will automatically move to archived status after this date
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={() => handleSubmit("published")}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish Announcement
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit("draft")}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/t/${tenantSlug}/admin/announcements`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
