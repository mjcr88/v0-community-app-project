"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from "next/link"
import { toast } from "sonner"
import { NeighborhoodMultiSelect } from "@/components/event-forms/neighborhood-multi-select"
import { LocationSelector } from "@/components/event-forms/location-selector"
import { PhotoManager } from "@/components/photo-manager"
import { updateAnnouncement } from "@/app/actions/announcements"

type Neighborhood = {
  id: string
  name: string
}

type Location = {
  id: string
  name: string
  category: string | null
}

type Announcement = {
  id: string
  title: string
  description: string
  announcement_type: string
  priority: string
  status: string
  visibility_scope: string
  location_type: string | null
  location_id: string | null
  custom_location_name: string | null
  custom_location_lat: number | null
  custom_location_lng: number | null
  images: string[] | null
  auto_archive_date: string | null
  event_id: string | null
}

export function EditAnnouncementForm({
  announcement,
  selectedNeighborhoods,
  neighborhoods,
  locations,
  slug,
  tenantId,
}: {
  announcement: Announcement
  selectedNeighborhoods: string[]
  neighborhoods: Neighborhood[]
  locations: Location[]
  slug: string
  tenantId: string
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [title, setTitle] = useState(announcement.title)
  const [description, setDescription] = useState(announcement.description)
  const [announcementType, setAnnouncementType] = useState(announcement.announcement_type)
  const [priority, setPriority] = useState(announcement.priority)
  const [visibilityScope, setVisibilityScope] = useState<"community" | "neighborhood">(
    announcement.visibility_scope as "community" | "neighborhood"
  )
  const [selectedNeighborhoodIds, setSelectedNeighborhoodIds] = useState<string[]>(selectedNeighborhoods)

  const [locationType, setLocationType] = useState<"none" | "community" | "custom">(
    announcement.location_type === "community_location"
      ? "community"
      : announcement.location_type === "custom_temporary"
      ? "custom"
      : "none"
  )
  const [locationId, setLocationId] = useState(announcement.location_id || "")
  const [customLocationName, setCustomLocationName] = useState(announcement.custom_location_name || "")
  const [customLocationLat, setCustomLocationLat] = useState<number | null>(announcement.custom_location_lat)
  const [customLocationLng, setCustomLocationLng] = useState<number | null>(announcement.custom_location_lng)

  const [images, setImages] = useState<string[]>(announcement.images || [])
  const [heroImageIndex, setHeroImageIndex] = useState(0)

  const [hasAutoArchive, setHasAutoArchive] = useState(!!announcement.auto_archive_date)
  const [autoArchiveDate, setAutoArchiveDate] = useState(
    announcement.auto_archive_date
      ? new Date(announcement.auto_archive_date).toISOString().slice(0, 16)
      : ""
  )

  const handleSubmit = async (shouldPublish: boolean = false) => {
    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }

    if (!description.trim()) {
      toast.error("Please enter a description")
      return
    }

    if (visibilityScope === "neighborhood" && selectedNeighborhoodIds.length === 0) {
      toast.error("Please select at least one neighborhood")
      return
    }

    if (locationType === "community" && !locationId) {
      toast.error("Please select a community location")
      return
    }

    if (locationType === "custom" && !customLocationName.trim()) {
      toast.error("Please enter a custom location name")
      return
    }

    setIsSubmitting(true)

    try {
      const data: any = {
        title: title.trim(),
        description: description.trim(),
        announcement_type: announcementType,
        priority,
        status: shouldPublish ? "published" : announcement.status,
        visibility_scope: visibilityScope,
        neighborhood_ids: visibilityScope === "neighborhood" ? selectedNeighborhoodIds : [],
        location_type: locationType === "none" ? null : locationType,
        location_id: locationType === "community" ? locationId : null,
        custom_location_name: locationType === "custom" ? customLocationName.trim() : null,
        custom_location_lat: locationType === "custom" ? customLocationLat : null,
        custom_location_lng: locationType === "custom" ? customLocationLng : null,
        images: images.length > 0 ? images : null,
        auto_archive_date: hasAutoArchive && autoArchiveDate ? new Date(autoArchiveDate).toISOString() : null,
      }

      const result = await updateAnnouncement(announcement.id, slug, tenantId, data)

      if (result.success) {
        toast.success(shouldPublish ? "Announcement published successfully!" : "Announcement updated successfully!")
        router.push(`/t/${slug}/admin/announcements/${announcement.id}`)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update announcement")
      }
    } catch (error) {
      console.error("Error updating announcement:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href={`/t/${slug}/admin/announcements/${announcement.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Announcement</CardTitle>
          <CardDescription>Update the announcement details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter announcement description"
              rows={6}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select value={announcementType} onValueChange={setAnnouncementType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Information</SelectItem>
                <SelectItem value="emergency">Emergency Alert</SelectItem>
                <SelectItem value="maintenance">Maintenance Notice</SelectItem>
                <SelectItem value="event">Community Event</SelectItem>
                <SelectItem value="policy">Policy Update</SelectItem>
                <SelectItem value="safety">Safety Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="important">Important</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visibility Scope */}
          <div className="space-y-4">
            <Label>Audience *</Label>
            <RadioGroup value={visibilityScope} onValueChange={(value) => setVisibilityScope(value as "community" | "neighborhood")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="community" id="community" />
                <Label htmlFor="community" className="font-normal cursor-pointer">
                  Community-wide (all residents)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="neighborhood" id="neighborhood" />
                <Label htmlFor="neighborhood" className="font-normal cursor-pointer">
                  Specific neighborhoods
                </Label>
              </div>
            </RadioGroup>

            {visibilityScope === "neighborhood" && (
              <NeighborhoodMultiSelect
                neighborhoods={neighborhoods}
                selectedNeighborhoodIds={selectedNeighborhoodIds}
                onSelectionChange={setSelectedNeighborhoodIds}
              />
            )}
          </div>

          {/* Location */}
          <LocationSelector
            tenantId={tenantId}
            locationType={locationType}
            communityLocationId={locationId}
            onCommunityLocationChange={setLocationId}
            customLocationName={customLocationName}
            onCustomLocationNameChange={setCustomLocationName}
            customLocationCoordinates={customLocationLat && customLocationLng ? { lat: customLocationLat, lng: customLocationLng } : null}
            customLocationType="marker"
            customLocationPath={null}
            onCustomLocationChange={(data) => {
              if (data.coordinates) {
                setCustomLocationLat(data.coordinates.lat)
                setCustomLocationLng(data.coordinates.lng)
              }
            }}
            onLocationTypeChange={setLocationType}
          />

          {/* Images */}
          <div className="space-y-2">
            <Label>Images (Optional)</Label>
            <PhotoManager
              photos={images}
              onPhotosChange={setImages}
              heroImageIndex={heroImageIndex}
              onHeroImageChange={setHeroImageIndex}
              maxPhotos={10}
            />
          </div>

          {/* Auto-Archive */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-archive"
                checked={hasAutoArchive}
                onCheckedChange={(checked) => setHasAutoArchive(checked as boolean)}
              />
              <Label htmlFor="auto-archive" className="font-normal cursor-pointer">
                Automatically archive this announcement on a specific date
              </Label>
            </div>

            {hasAutoArchive && (
              <div className="space-y-2">
                <Label htmlFor="archive-date">Archive Date</Label>
                <Input
                  id="archive-date"
                  type="datetime-local"
                  value={autoArchiveDate}
                  onChange={(e) => setAutoArchiveDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button type="button" onClick={() => handleSubmit(false)} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            {announcement.status === "draft" && (
              <Button type="button" onClick={() => handleSubmit(true)} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish
              </Button>
            )}
            <Button type="button" variant="outline" asChild>
              <Link href={`/t/${slug}/admin/announcements/${announcement.id}`}>Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
