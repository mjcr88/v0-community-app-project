"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createBorrowRequest } from "@/app/actions/exchange-listings"
import { Calendar } from 'lucide-react'

const createBorrowRequestSchema = (requiresReturnDate: boolean) => z.object({
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  proposed_pickup_date: z.string().min(1, "Date is required"),
  proposed_return_date: requiresReturnDate 
    ? z.string().min(1, "Return date is required")
    : z.string().optional(),
  borrower_message: z.string().optional(),
})

type BorrowRequestFormData = {
  quantity: number
  proposed_pickup_date: string
  proposed_return_date?: string
  borrower_message?: string
}

interface RequestBorrowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listingId: string
  listingTitle: string
  listingCategory: string
  pricingType: string
  price?: number | null
  availableQuantity: number
  tenantSlug: string
  tenantId: string
  onSuccess?: () => void
}

function getCategoryConfig(categoryName: string) {
  const isToolsEquipment = categoryName === "Tools & Equipment"
  const isFoodProduce = categoryName === "Food & Produce"
  const isServices = categoryName === "Services & Skills"
  const isHouseSitting = categoryName === "House sitting & Rentals"
  const isRides = categoryName === "Rides & Carpooling"

  // Categories that need return dates
  const needsReturnDate = isToolsEquipment || isHouseSitting || isRides
  
  // Categories that show quantity
  const showsQuantity = isToolsEquipment || isFoodProduce
  
  // Button text
  let buttonText = "Request to Borrow"
  if (isServices) buttonText = "Request Service"
  else if (isHouseSitting) buttonText = "Request to Rent"
  else if (isRides) buttonText = "Request Ride"
  else if (isFoodProduce) buttonText = "Request"

  // Date labels
  let pickupLabel = "Proposed Pickup Date"
  let returnLabel = "Proposed Return Date"
  
  if (isServices) {
    pickupLabel = "Preferred Appointment Date"
  } else if (isHouseSitting || isRides) {
    pickupLabel = "Start Date"
    returnLabel = "End Date"
  } else if (isFoodProduce) {
    pickupLabel = "Pickup Date"
  }

  return {
    needsReturnDate,
    showsQuantity,
    buttonText,
    pickupLabel,
    returnLabel,
    isServices,
    isFoodProduce,
    isHouseSitting,
    isRides,
  }
}

export function RequestBorrowDialog({
  open,
  onOpenChange,
  listingId,
  listingTitle,
  listingCategory,
  pricingType,
  price,
  availableQuantity,
  tenantSlug,
  tenantId,
  onSuccess,
}: RequestBorrowDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const config = getCategoryConfig(listingCategory)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<BorrowRequestFormData>({
    resolver: zodResolver(createBorrowRequestSchema(config.needsReturnDate)),
    defaultValues: {
      quantity: 1,
      proposed_pickup_date: "",
      proposed_return_date: "",
      borrower_message: "",
    },
  })

  const pickupDate = watch("proposed_pickup_date")

  const onSubmit = async (data: BorrowRequestFormData) => {
    setIsSubmitting(true)

    if (config.needsReturnDate && data.proposed_return_date) {
      const pickup = new Date(data.proposed_pickup_date)
      const returnDate = new Date(data.proposed_return_date)

      if (returnDate <= pickup) {
        toast.error(`${config.returnLabel} must be after ${config.pickupLabel.toLowerCase()}`)
        setIsSubmitting(false)
        return
      }
    }

    if (config.showsQuantity && data.quantity > availableQuantity) {
      toast.error(`Only ${availableQuantity} available`)
      setIsSubmitting(false)
      return
    }

    const result = await createBorrowRequest(listingId, tenantSlug, tenantId, {
      quantity: data.quantity,
      proposed_pickup_date: data.proposed_pickup_date,
      proposed_return_date: data.proposed_return_date || null,
      borrower_message: data.borrower_message,
    })

    if (result.success) {
      toast.success("Request sent!")
      reset()
      onOpenChange(false)
      onSuccess?.()
    } else {
      toast.error(result.error || "Failed to send request")
    }

    setIsSubmitting(false)
  }

  const today = new Date()
  const minDate = today.toISOString().split("T")[0]

  // Get min return/end date (day after pickup or tomorrow)
  const minReturnDate = pickupDate
    ? new Date(new Date(pickupDate).getTime() + 86400000).toISOString().split("T")[0]
    : new Date(today.getTime() + 86400000).toISOString().split("T")[0]

  const showPriceReminder = pricingType !== "free" && price

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{config.buttonText}</DialogTitle>
          <DialogDescription>
            Send a request for <strong>{listingTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        {showPriceReminder && (
          <div className="p-3 bg-muted rounded-lg border">
            <p className="text-sm">
              <strong>Price:</strong>{" "}
              {pricingType === "pay_what_you_want" 
                ? "Pay what you want" 
                : `$${price?.toFixed(2)}`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Please coordinate payment details with the {config.isServices ? "service provider" : "lender"}.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {config.showsQuantity && (
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-muted-foreground text-sm">(Available: {availableQuantity})</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={availableQuantity}
                {...register("quantity")}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="pickup_date">
              {config.pickupLabel}
            </Label>
            <div className="relative">
              <Input
                id="pickup_date"
                type="date"
                min={minDate}
                {...register("proposed_pickup_date")}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {errors.proposed_pickup_date && (
              <p className="text-sm text-destructive">{errors.proposed_pickup_date.message}</p>
            )}
          </div>

          {config.needsReturnDate && (
            <div className="space-y-2">
              <Label htmlFor="return_date">
                {config.returnLabel}
              </Label>
              <div className="relative">
                <Input
                  id="return_date"
                  type="date"
                  min={minReturnDate}
                  {...register("proposed_return_date")}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              {errors.proposed_return_date && (
                <p className="text-sm text-destructive">{errors.proposed_return_date.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">
              Message (optional)
            </Label>
            <Textarea
              id="message"
              placeholder={
                config.isServices 
                  ? "Describe what you need help with..."
                  : config.isFoodProduce
                  ? "Any special requests or notes..."
                  : "Let them know why you need this..."
              }
              rows={3}
              {...register("borrower_message")}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
