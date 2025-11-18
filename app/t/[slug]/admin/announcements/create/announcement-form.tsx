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
  })

  const handleSubmit = async (action: 'draft' | 'publish') => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description')
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
        neighborhoodIds: [], // Community-wide for now
        images: [],
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
