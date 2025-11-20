"use client"

import { useState, useCallback } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { createResidentRequest } from "@/app/actions/resident-requests"
import { LocationSelector } from "@/components/event-forms/location-selector"
import { PhotoManager } from "@/components/photo-manager"
import { RequestTypeIcon } from "./request-type-icon"
import { ResidentPetSelector } from "./resident-pet-selector"
import type { RequestType, RequestPriority } from "@/types/requests"

interface CreateRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantSlug: string
  tenantId: string
  requestType: RequestType
}

const requestTypeLabels: Record<RequestType, { title: string; description: string; titlePlaceholder: string; descriptionPlaceholder: string }> = {
  maintenance: {
    title: "Maintenance Request",
    description: "Report something that needs fixing or repair",
    titlePlaceholder: "Brief description of what needs fixing",
    descriptionPlaceholder: "Please provide details about the maintenance issue...",
  },
  question: {
    title: "Question",
    description: "Ask about processes, policies, or community information",
    titlePlaceholder: "Brief description of your question",
    descriptionPlaceholder: "Please provide details about your question...",
  },
  complaint: {
    title: "Complaint",
    description: "Report an issue or concern about the community or neighbors",
    titlePlaceholder: "Brief description of your complaint",
    descriptionPlaceholder: "Please provide details about your complaint...",
  },
  safety: {
    title: "Safety Issue",
    description: "Report urgent safety concerns that need immediate attention",
    titlePlaceholder: "Brief description of the safety issue",
    descriptionPlaceholder: "Please provide details about the safety concern...",
  },
  other: {
    title: "Other Request",
    description: "Submit a request that doesn't fit other categories",
    titlePlaceholder: "Brief description of your request",
    descriptionPlaceholder: "Please provide details about your request...",
  },
}

const getPriorityDescriptions = (requestType: RequestType) => {
  switch (requestType) {
    case 'maintenance':
      return {
        normal: "Standard request, no rush",
        urgent: "Needs quick attention (broken AC, water leak, appliance failure)",
        emergency: "Safety concern requiring immediate response (gas leak, electrical hazard)",
      }
    case 'question':
      return {
        normal: "General inquiry, no rush",
        urgent: "Need answer soon for planning purposes",
        emergency: "Time-sensitive question requiring immediate answer",
      }
    case 'complaint':
      return {
        normal: "General concern to be addressed",
        urgent: "Ongoing disturbance or recurring issue",
        emergency: "Severe disturbance or immediate threat to well-being",
      }
    case 'safety':
      return {
        normal: "Safety concern to be reviewed",
        urgent: "Hazard that should be addressed soon",
        emergency: "Immediate danger requiring urgent response",
      }
    case 'other':
      return {
        normal: "Standard request, no rush",
        urgent: "Needs attention within a few days",
        emergency: "Requires immediate attention",
      }
  }
}

export function CreateRequestModal({
  open,
  onOpenChange,
  tenantSlug,
  tenantId,
  requestType,
}: CreateRequestModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "normal" as RequestPriority,
    location_type: null as "community" | "custom" | null,
    location_id: null as string | null,
    custom_location_name: "",
    custom_location_lat: null as number | null,
    custom_location_lng: null as number | null,
    is_anonymous: false,
    images: [] as string[],
    tagged_resident_ids: [] as string[],
    tagged_pet_ids: [] as string[],
  })

  const handleLocationTypeChange = useCallback((type: "community" | "custom" | "none") => {
    setFormData(prev => ({
      ...prev,
      location_type: type === "none" ? null : type,
      location_id: null,
      custom_location_name: "",
      custom_location_lat: null,
      custom_location_lng: null,
    }))
  }, [])

  const handleCommunityLocationChange = useCallback((locationId: string) => {
    setFormData(prev => ({ ...prev, location_id: locationId }))
  }, [])

  const handleCustomLocationNameChange = useCallback((name: string) => {
    setFormData(prev => ({ ...prev, custom_location_name: name }))
  }, [])

  const handleCustomLocationChange = useCallback((data: {
    coordinates?: { lat: number; lng: number } | null
    type?: "marker" | "polygon" | null
    path?: Array<{ lat: number; lng: number }> | null
  }) => {
    setFormData(prev => ({
      ...prev,
      custom_location_lat: data.coordinates?.lat || null,
      custom_location_lng: data.coordinates?.lng || null,
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.title.trim()) {
        toast({
          title: "Title required",
          description: "Please enter a title for your request",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      if (!formData.description.trim()) {
        toast({
          title: "Description required",
          description: "Please describe your request",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      const requestData = {
        title: formData.title.trim(),
        request_type: requestType,
        description: formData.description.trim(),
        priority: formData.priority,
        location_type: formData.location_type,
        location_id: formData.location_type === "community" ? formData.location_id : null,
        custom_location_name: formData.location_type === "custom" ? formData.custom_location_name : null,
        custom_location_lat: formData.location_type === "custom" ? formData.custom_location_lat : null,
        custom_location_lng: formData.location_type === "custom" ? formData.custom_location_lng : null,
        is_anonymous: formData.is_anonymous,
        images: formData.images,
        tagged_resident_ids: formData.tagged_resident_ids,
        tagged_pet_ids: formData.tagged_pet_ids,
      }

      const result = await createResidentRequest(tenantId, tenantSlug, requestData)

      if (result.success) {
        toast({
          title: "Request submitted!",
          description: "Your request has been sent to the community administration.",
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to submit request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Request submission error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const typeInfo = requestTypeLabels[requestType]
  const priorityDescriptions = getPriorityDescriptions(requestType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RequestTypeIcon type={requestType} />
            {typeInfo.title}
          </DialogTitle>
          <DialogDescription>{typeInfo.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder={typeInfo.titlePlaceholder}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder={typeInfo.descriptionPlaceholder}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Priority</Label>
                  <p className="text-sm text-muted-foreground">How urgent is this request?</p>
                </div>

                <RadioGroup
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as RequestPriority })}
                >
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 rounded-md border p-4">
                      <RadioGroupItem value="normal" id="normal" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="normal" className="font-medium cursor-pointer">
                          Normal
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {priorityDescriptions.normal}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 rounded-md border p-4 border-orange-200 bg-orange-50/50">
                      <RadioGroupItem value="urgent" id="urgent" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="urgent" className="font-medium cursor-pointer">
                          Urgent
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {priorityDescriptions.urgent}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 rounded-md border p-4 border-red-200 bg-red-50/50">
                      <RadioGroupItem value="emergency" id="emergency" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="emergency" className="font-medium cursor-pointer">
                          Emergency
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {priorityDescriptions.emergency}
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label>Photos (Optional)</Label>
                <PhotoManager
                  photos={formData.images}
                  heroPhoto={null}
                  onPhotosChange={(photos) => setFormData(prev => ({ ...prev, images: photos }))}
                  onHeroPhotoChange={() => { }}
                  maxPhotos={5}
                  entityType={"request" as any}
                />
                <p className="text-sm text-muted-foreground">
                  Add photos to help us understand the issue better
                </p>
              </div>

              {requestType === 'complaint' && (
                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-base font-semibold">Tag Residents or Pets (Optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    If your complaint involves specific residents or pets, you can tag them here
                  </p>
                  <ResidentPetSelector
                    tenantId={tenantId}
                    selectedResidentIds={formData.tagged_resident_ids}
                    selectedPetIds={formData.tagged_pet_ids}
                    onResidentsChange={(ids) => setFormData({ ...formData, tagged_resident_ids: ids })}
                    onPetsChange={(ids) => setFormData({ ...formData, tagged_pet_ids: ids })}
                  />
                </div>
              )}

              <div className="space-y-2 pt-4 border-t">
                <Label className="text-base font-semibold">Location (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Where is this request related to?
                </p>
                <LocationSelector
                  tenantId={tenantId}
                  locationType={formData.location_type || "none"}
                  communityLocationId={formData.location_id}
                  customLocationName={formData.custom_location_name}
                  customLocationCoordinates={
                    formData.custom_location_lat && formData.custom_location_lng
                      ? { lat: formData.custom_location_lat, lng: formData.custom_location_lng }
                      : null
                  }
                  customLocationType="marker"
                  customLocationPath={null}
                  onLocationTypeChange={handleLocationTypeChange}
                  onCommunityLocationChange={handleCommunityLocationChange}
                  onCustomLocationNameChange={handleCustomLocationNameChange}
                  onCustomLocationChange={handleCustomLocationChange}
                />
              </div>

              {requestType === 'complaint' && (
                <div className="flex items-center space-x-2 pt-4 border-t">
                  <Checkbox
                    id="anonymous"
                    checked={formData.is_anonymous}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked as boolean })}
                  />
                  <Label htmlFor="anonymous" className="cursor-pointer text-sm font-normal">
                    Submit anonymously (your identity will be hidden from other residents, but visible to admins)
                  </Label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
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
