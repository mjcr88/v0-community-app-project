'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { createAnnouncement } from '@/app/actions/announcements'
import { AnnouncementType, AnnouncementPriority } from '@/types/announcements'
import { AnnouncementTypeIcon } from '@/components/announcements/announcement-type-icon'
import { toast } from 'sonner'
import { NeighborhoodMultiSelect } from '@/components/event-forms/neighborhood-multi-select'
import { LocationSelector } from '@/components/event-forms/location-selector'
import { PhotoManager } from '@/components/photo-manager'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from 'lucide-react'

const ANNOUNCEMENT_TYPES: { value: AnnouncementType; label: string }[] = [
  { value: 'general', label: 'General Information' },
  { value: 'emergency', label: 'Emergency Alert' },
  { value: 'maintenance', label: 'Maintenance Notice' },
  { value: 'event', label: 'Community Event' },
  { value: 'policy', label: 'Policy Update' },
  { value: 'safety', label: 'Safety Warning' },
]

const PRIORITY_OPTIONS: { value: AnnouncementPriority; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'important', label: 'Important' },
  { value: 'urgent', label: 'Urgent' },
]

export function AnnouncementForm({
  slug,
  tenantId,
}: {
  slug: string
  tenantId: string
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    announcementType: 'general' as AnnouncementType,
    priority: 'normal' as AnnouncementPriority,
    scope: 'community' as 'community' | 'neighborhood',
    selectedNeighborhoods: [] as string[],
    eventId: null as string | null,
    locationType: 'none' as 'community' | 'custom' | 'none',
    locationId: null as string | null,
    customLocationName: '',
    customLocationCoordinates: null as { lat: number; lng: number } | null,
    customLocationType: null as 'marker' | 'polygon' | null,
    customLocationPath: null as Array<{ lat: number; lng: number }> | null,
    autoArchiveDate: '',
  })
  const [photos, setPhotos] = useState<string[]>([])
  const [heroPhoto, setHeroPhoto] = useState<string | null>(null)

  const handleSubmit = async (action: 'draft' | 'publish') => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description')
      return
    }

    if (formData.scope === 'neighborhood' && formData.selectedNeighborhoods.length === 0) {
      toast.error('Please select at least one neighborhood')
      return
    }

    if (formData.locationType === 'custom' && !formData.customLocationName.trim()) {
      toast.error('Please provide a name for the custom location')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createAnnouncement({
        tenantId,
        title: formData.title,
        description: formData.description,
        announcementType: formData.announcementType,
        priority: formData.priority,
        status: action === 'draft' ? 'draft' : 'published',
        neighborhoodIds: formData.scope === 'neighborhood' ? formData.selectedNeighborhoods : [],
        eventId: formData.eventId,
        locationType: formData.locationType,
        locationId: formData.locationId,
        customLocationName: formData.customLocationName || null,
        customLocationCoordinates: formData.customLocationCoordinates,
        customLocationType: formData.customLocationType,
        customLocationPath: formData.customLocationPath,
        images: photos,
        autoArchiveDate: formData.autoArchiveDate || null,
      })

      if (result.success) {
        toast.success(
          action === 'draft'
            ? 'Announcement saved as draft'
            : 'Announcement published successfully'
        )
        router.push(`/t/${slug}/admin/announcements`)
      } else {
        toast.error(result.error || 'Failed to create announcement')
      }
    } catch (error) {
      console.error('[v0] Error creating announcement:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
        className="space-y-6"
      >
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Enter announcement title"
            disabled={isSubmitting}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Enter announcement description"
            rows={6}
            disabled={isSubmitting}
          />
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Announcement Type</Label>
          <Select
            value={formData.announcementType}
            onValueChange={(value: AnnouncementType) =>
              setFormData({ ...formData, announcementType: value })
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANNOUNCEMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <AnnouncementTypeIcon type={type.value} className="h-4 w-4" />
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: AnnouncementPriority) =>
              setFormData({ ...formData, priority: value })
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  {priority.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Target Audience</Label>
            <p className="text-sm text-muted-foreground">
              Choose who will receive this announcement
            </p>
          </div>

          <RadioGroup
            value={formData.scope}
            onValueChange={(value: 'community' | 'neighborhood') =>
              setFormData({ ...formData, scope: value, selectedNeighborhoods: [] })
            }
            disabled={isSubmitting}
          >
            <div className="flex items-start space-x-3 rounded-md border p-4">
              <RadioGroupItem value="community" id="community" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="community" className="font-medium cursor-pointer">
                  Community-Wide
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Send to all residents in the community
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 rounded-md border p-4">
              <RadioGroupItem value="neighborhood" id="neighborhood" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="neighborhood" className="font-medium cursor-pointer">
                  Specific Neighborhoods
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Send only to selected neighborhoods
                </p>
              </div>
            </div>
          </RadioGroup>

          {formData.scope === 'neighborhood' && (
            <div className="pl-6 border-l-2 space-y-2">
              <NeighborhoodMultiSelect
                tenantId={tenantId}
                selectedNeighborhoodIds={formData.selectedNeighborhoods}
                onChange={(ids) =>
                  setFormData({ ...formData, selectedNeighborhoods: ids })
                }
              />
            </div>
          )}
        </div>

        {formData.announcementType === 'event' && (
          <div className="space-y-2 pt-4 border-t">
            <Label>Link to Event (Optional)</Label>
            <p className="text-sm text-muted-foreground">
              Coming soon: Link this announcement to an existing community event
            </p>
            {/* TODO: Implement event search/select component in next iteration */}
          </div>
        )}

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

        <div className="pt-4 border-t">
          <LocationSelector
            tenantId={tenantId}
            locationType={formData.locationType}
            communityLocationId={formData.locationId}
            customLocationName={formData.customLocationName}
            customLocationCoordinates={formData.customLocationCoordinates}
            customLocationType={formData.customLocationType}
            customLocationPath={formData.customLocationPath}
            onLocationTypeChange={(type) =>
              setFormData({
                ...formData,
                locationType: type,
                locationId: null,
                customLocationName: '',
                customLocationCoordinates: null,
                customLocationType: null,
                customLocationPath: null,
              })
            }
            onCommunityLocationChange={(locationId) =>
              setFormData({ ...formData, locationId })
            }
            onCustomLocationNameChange={(name) =>
              setFormData({ ...formData, customLocationName: name })
            }
            onCustomLocationChange={(data) =>
              setFormData({
                ...formData,
                customLocationCoordinates: data.coordinates || null,
                customLocationType: data.type || null,
                customLocationPath: data.path || null,
              })
            }
          />
        </div>

        <div className="space-y-2 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-archive"
              checked={!!formData.autoArchiveDate}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  autoArchiveDate: checked ? '' : '',
                })
              }
              disabled={isSubmitting}
            />
            <Label htmlFor="auto-archive" className="cursor-pointer">
              Automatically archive this announcement
            </Label>
          </div>

          {formData.autoArchiveDate !== null && (
            <div className="pl-6 space-y-2">
              <Label htmlFor="archive-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Archive Date
              </Label>
              <Input
                id="archive-date"
                type="datetime-local"
                value={formData.autoArchiveDate}
                onChange={(e) =>
                  setFormData({ ...formData, autoArchiveDate: e.target.value })
                }
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                The announcement will automatically move to archived status on this date
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save as Draft'
            )}
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit('publish')}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish'
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}
