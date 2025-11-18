"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Megaphone } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { updateAnnouncement } from "@/app/actions/announcements"
import { NeighborhoodMultiSelect } from "@/components/event-forms/neighborhood-multi-select"
import { LocationSelector } from "@/components/event-forms/location-selector"
import { PhotoManager } from "@/components/photo-manager"
import { Alert, AlertDescription } from "@/components/ui/alert"

type EditAnnouncementFormProps = {
  announcementId: string
  tenantSlug: string
  tenantId: string
  initialData: {
    title: string
    description: string
    announcement_type: string
    priority: string
    event_id: string | null
    location_type: "community" | "custom" | "none"
    location_id: string | null
    custom_location_name: string
    custom_location_lat: number | null
    custom_location_lng: number | null
    images: string[]
    auto_archive_date: string
  }
  initialNeighborhoods: string[]
}

export function EditAnnouncementForm({
  announcementId,
  tenantSlug,
  tenantId,
  initialData,
  initialNeighborhoods,
}: EditAnnouncementFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    ...initialData,
    selected_neighborhoods: initialNeighborhoods,
  })

  const [photos, setPhotos] = useState<string[]>(initialData.images)
  const [enableAutoArchive, setEnableAutoArchive] = useState(!!initialData.auto_archive_date)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data: any = {
        title: formData.title,
        description: formData.description,
        announcement_type: formData.announcement_type,
        priority: formData.priority,
        event_id: formData.event_id || null,
        location_type: formData.location_type,
        location_id: formData.location_type === "community" ? formData.location_id : null,
        custom_location_name: formData.location_type === "custom" ? formData.custom_location_name : null,
        custom_location_lat: formData.location_type === "custom" ? formData.custom_location_lat : null,
        custom_location_lng: formData.location_type === "custom" ? formData.custom_location_lng : null,
        images: photos,
        auto_archive_date: enableAutoArchive && formData.auto_archive_date ? formData.auto_archive_date : null,
        neighborhood_ids: formData.selected_neighborhoods,
      }

      const result = await updateAnnouncement(announcementId, tenantSlug, tenantId, data)

      if (result.success) {
        toast({
          title: "Announcement updated!",
          description: "Residents will be notified about the update.",
        })
        router.push(`/t/${tenantSlug}/admin/announcements/${announcementId}`)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update announcement",
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
            <Megaphone className="h-5 w-5" />
            Announcement Details
          </CardTitle>
          <CardDescription>Update announcement information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              Editing this announcement will send a notification to all residents who can see it, indicating that it has
              been updated.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Announcement title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide details about this announcement..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">
                Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.announcement_type}
                onValueChange={(value) => setFormData({ ...formData, announcement_type: value })}
                required
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
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

            <div className="space-y-2">
              <Label htmlFor="priority">
                Priority <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
                required
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Target Audience</Label>
            <p className="text-sm text-muted-foreground">
              Select specific neighborhoods or leave empty for community-wide
            </p>
            <NeighborhoodMultiSelect
              tenantId={tenantId}
              selectedNeighborhoodIds={formData.selected_neighborhoods}
              onChange={(ids) => setFormData({ ...formData, selected_neighborhoods: ids })}
            />
          </div>

          <div className="pt-4 border-t">
            <PhotoManager
              photos={photos}
              heroPhoto={null}
              onPhotosChange={setPhotos}
              onHeroPhotoChange={() => {}}
              maxPhotos={10}
              entityType="location"
            />
          </div>

          <LocationSelector
            tenantId={tenantId}
            locationType={formData.location_type}
            communityLocationId={formData.location_id}
            customLocationName={formData.custom_location_name}
            customLocationCoordinates={
              formData.custom_location_lat && formData.custom_location_lng
                ? { lat: formData.custom_location_lat, lng: formData.custom_location_lng }
                : null
            }
            customLocationType={null}
            customLocationPath={null}
            onLocationTypeChange={(type) =>
              setFormData({ ...formData, location_type: type, location_id: null, custom_location_name: "" })
            }
            onCommunityLocationChange={(locationId) => setFormData({ ...formData, location_id: locationId })}
            onCustomLocationNameChange={(name) => setFormData({ ...formData, custom_location_name: name })}
            onCustomLocationChange={(data) => {
              setFormData({
                ...formData,
                custom_location_lat: data.coordinates?.lat || null,
                custom_location_lng: data.coordinates?.lng || null,
              })
            }}
          />

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enable-auto-archive"
                checked={enableAutoArchive}
                onCheckedChange={(checked) => setEnableAutoArchive(checked === true)}
              />
              <Label htmlFor="enable-auto-archive" className="font-normal cursor-pointer">
                Auto-archive this announcement
              </Label>
            </div>

            {enableAutoArchive && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="auto_archive_date">Archive Date</Label>
                <Input
                  id="auto_archive_date"
                  type="datetime-local"
                  value={formData.auto_archive_date}
                  onChange={(e) => setFormData({ ...formData, auto_archive_date: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Announcement will automatically be archived on this date
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Updating..." : "Update Announcement"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/t/${tenantSlug}/admin/announcements/${announcementId}`)}
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
