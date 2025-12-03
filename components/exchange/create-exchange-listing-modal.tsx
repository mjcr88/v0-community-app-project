"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createExchangeListing } from "@/app/actions/exchange-listings"
import { useToast } from "@/hooks/use-toast"
import { useRioFeedback } from "@/components/feedback/rio-feedback-provider"
import { useRouter } from 'next/navigation'
import type { ExchangePricingType, ExchangeCondition } from "@/types/exchange"
import { StepProgress } from "./create-listing-steps/step-progress"
import { StepNavigation } from "./create-listing-steps/step-navigation"
import { Step1BasicInfo } from "./create-listing-steps/step-1-basic-info"
import { Step2PricingVisibility } from "./create-listing-steps/step-2-pricing-visibility"
import { Step3Location } from "./create-listing-steps/step-3-location"
import { Step4Review } from "./create-listing-steps/step-4-review"

interface CreateExchangeListingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantSlug: string
  tenantId: string
  categories: Array<{ id: string; name: string }>
  neighborhoods: Array<{ id: string; name: string }>
  initialLocation?: {
    id: string
    name: string
  }
}

export function CreateExchangeListingModal({
  open,
  onOpenChange,
  tenantSlug,
  tenantId,
  categories,
  neighborhoods,
  initialLocation,
}: CreateExchangeListingModalProps) {
  const { toast } = useToast()
  const { showFeedback } = useRioFeedback()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    pricing_type: "free" as ExchangePricingType,
    price: "",
    condition: "" as ExchangeCondition | "",
    available_quantity: "",
    visibility_scope: "community" as "community" | "neighborhood",
    neighborhood_ids: [] as string[],
    location_type: "none" as "none" | "community" | "custom",
    location_id: null as string | null,
    custom_location_name: "",
    custom_location_lat: null as number | null,
    custom_location_lng: null as number | null,
    status: "draft" as "draft" | "published",
    photos: [] as string[],
    hero_photo: null as string | null,
  })

  // Initialize location from prop
  useEffect(() => {
    if (initialLocation && open) {
      setFormData(prev => ({
        ...prev,
        location_type: "community",
        location_id: initialLocation.id,
      }))
    }
  }, [initialLocation, open])

  // Reset form and step when modal opens/closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1)
    }
  }, [open])

  const steps = [
    { number: 1, title: "Basic Information" },
    { number: 2, title: "Pricing & Visibility" },
    { number: 3, title: "Location" },
    { number: 4, title: "Review & Publish" },
  ]

  const hasUnsavedChanges = useCallback(() => {
    return (
      formData.title.trim() !== "" ||
      formData.description.trim() !== "" ||
      formData.category_id !== "" ||
      formData.photos.length > 0 ||
      formData.pricing_type !== "free" ||
      formData.price !== "" ||
      formData.condition !== "" ||
      formData.available_quantity !== "" ||
      formData.neighborhood_ids.length > 0 ||
      formData.location_type !== "none" ||
      formData.custom_location_name !== ""
    )
  }, [formData])

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      description: "",
      category_id: "",
      pricing_type: "free",
      price: "",
      condition: "",
      available_quantity: "",
      visibility_scope: "community",
      neighborhood_ids: [],
      location_type: "none",
      location_id: null,
      custom_location_name: "",
      custom_location_lat: null,
      custom_location_lng: null,
      status: "draft",
      photos: [],
      hero_photo: null,
    })
    setCurrentStep(1)
  }, [])

  const handleModalClose = useCallback((newOpenState: boolean) => {
    if (!newOpenState && hasUnsavedChanges()) {
      setShowUnsavedWarning(true)
      return
    }

    if (!newOpenState) {
      resetForm()
    }
    onOpenChange(newOpenState)
  }, [hasUnsavedChanges, onOpenChange, resetForm])

  const handleDiscardChanges = useCallback(() => {
    setShowUnsavedWarning(false)
    resetForm()
    onOpenChange(false)
  }, [onOpenChange, resetForm])

  // Update form data
  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  // Step validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.title.trim().length >= 3 && formData.category_id !== ""
      case 2:
        // Validate pricing
        if (formData.pricing_type === "fixed_price") {
          const priceNum = parseFloat(formData.price)
          if (formData.price === "" || isNaN(priceNum) || priceNum <= 0) {
            return false
          }
        }
        // Validate visibility/neighborhoods
        if (formData.visibility_scope === "neighborhood") {
          return formData.neighborhood_ids.length > 0
        }
        return true
      case 3:
        // Location is optional, always valid
        return true
      case 4:
        return true
      default:
        return false
    }
  }

  const canProceed = validateStep(currentStep)

  const handleNext = () => {
    if (canProceed && currentStep < 4) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleEditStep = (step: number) => {
    setCurrentStep(step)
  }

  const handleSubmitListing = async (publishNow: boolean) => {
    setIsSubmitting(true)

    try {
      const listingData = {
        title: formData.title.trim(),
        description: formData.description.trim() || "",
        category_id: formData.category_id,
        pricing_type: formData.pricing_type,
        price: formData.pricing_type === "fixed_price" ? parseFloat(formData.price) : null,
        condition: formData.condition || null,
        available_quantity:
          formData.available_quantity ? parseInt(formData.available_quantity, 10) : null,
        visibility_scope: formData.visibility_scope,
        neighborhood_ids: formData.visibility_scope === "neighborhood" ? formData.neighborhood_ids : [],
        location_id: formData.location_type === "community" ? formData.location_id : null,
        custom_location_name: formData.location_type === "custom" ? formData.custom_location_name : null,
        custom_location_lat: formData.location_type === "custom" ? formData.custom_location_lat : null,
        custom_location_lng: formData.location_type === "custom" ? formData.custom_location_lng : null,
        status: publishNow ? ("published" as const) : ("draft" as const),
        photos: formData.photos,
        hero_photo: formData.hero_photo,
      }

      const result = await createExchangeListing(tenantSlug, tenantId, listingData)

      if (result.success) {
        showFeedback({
          title: publishNow ? "Listing Published!" : "Draft Saved",
          description: publishNow
            ? "Your listing is now visible to the community. Thank you!"
            : "You can publish it later from your listings.",
          variant: "success",
          image: "/rio/rio_clapping.png"
        })
        resetForm()
        onOpenChange(false)
        router.refresh()
      } else {
        showFeedback({
          title: "Couldn't create listing",
          description: result.error || "Something went wrong. Please try again.",
          variant: "error",
          image: "/rio/rio_no_results_confused.png"
        })
      }
    } catch (error) {
      console.error("Error creating listing:", error)
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

  const handleSaveDraft = () => handleSubmitListing(false)
  const handlePublish = () => handleSubmitListing(true)

  return (
    <>
      <Dialog open={open} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Listing</DialogTitle>
            <DialogDescription>
              Share an item or service with your community
            </DialogDescription>
          </DialogHeader>

          <StepProgress currentStep={currentStep} steps={steps} />

          <div className="min-h-[400px]">
            {currentStep === 1 && (
              <Step1BasicInfo
                formData={formData}
                categories={categories}
                tenantId={tenantId}
                onUpdate={updateFormData}
              />
            )}
            {currentStep === 2 && (
              <Step2PricingVisibility
                formData={formData}
                categories={categories}
                neighborhoods={neighborhoods}
                onUpdate={updateFormData}
              />
            )}
            {currentStep === 3 && (
              <Step3Location
                formData={formData}
                tenantId={tenantId}
                initialLocation={initialLocation}
                onUpdate={updateFormData}
              />
            )}
            {currentStep === 4 && (
              <Step4Review
                formData={formData}
                categories={categories}
                neighborhoods={neighborhoods}
                onEditStep={handleEditStep}
              />
            )}
          </div>

          <StepNavigation
            currentStep={currentStep}
            totalSteps={4}
            canProceed={canProceed}
            onBack={handleBack}
            onNext={handleNext}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Unsaved changes warning */}
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardChanges}>
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
