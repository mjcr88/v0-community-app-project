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
import type { RequestType, RequestPriority } from "@/types/requests"

interface CreateRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantSlug: string
  tenantId: string
  requestType: RequestType
}

const requestTypeLabels: Record<RequestType, { title: string; description: string }> = {
  maintenance: {
    title: "Maintenance Request",
    description: "Report something that needs fixing or repair",
  },
  question: {
    title: "Question",
    description: "Ask about processes, policies, or community information",
  },
  complaint: {
    title: "Complaint",
    description: "Report an issue or concern about the community or neighbors",
  },
  safety: {
    title: "Safety Issue",
    description: "Report urgent safety concerns that need immediate attention",
  },
  other: {
    title: "Other Request",
    description: "Submit a request that doesn't fit other categories",
  },
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
    location_type: "community" as "community" | "custom" | null,
    location_id: null as string | null,
    custom_location_name: "",
    custom_location_lat: null as number | null,
    custom_location_lng: null as number | null,
    is_anonymous: false,
    images: [] as string[],
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
                  placeholder="Brief description of your request"
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
                  placeholder="Please provide details about your request..."
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
                          Standard request, no rush
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
                          Needs quick attention (e.g., broken AC, water leak)
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
                          Safety concern requiring immediate response
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
                  onHeroPhotoChange={() => {}}
                  maxPhotos={5}
                  entityType="request"
                />
                <p className="text-sm text-muted-foreground">
                  Add photos to help us understand the issue better
                </p>
              </div>

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

              {requestType === 'complaint' && (
                <div className="flex items-center space-x-2 pt-4 border-t">
                  <Checkbox
                    id="anonymous"
                    checked={formData.is_anonymous}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked as boolean })}
                  />
                  <Label htmlFor="anonymous" className="cursor-pointer text-sm font-normal">
                    Submit anonymously (admins will not see your name)
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
