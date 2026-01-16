"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Package, CalendarDays, AlertTriangle, Clock } from 'lucide-react'
import { format, isPast, isToday } from "date-fns"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { MarkPickedUpDialog } from "./mark-picked-up-dialog"
import { MarkReturnedDialog } from "./mark-returned-dialog"
import { CancelTransactionDialog } from "./cancel-transaction-dialog"
import { TransactionDetailModal } from "./transaction-detail-modal"
import { ConfirmBorrowDialog } from "@/components/exchange/confirm-borrow-dialog"
import { DeclineBorrowDialog } from "@/components/exchange/decline-borrow-dialog"
import { markItemPickedUp, markItemReturned, cancelTransaction, markTransactionCompleted } from "@/app/actions/exchange-transactions"
import { confirmBorrowRequest, rejectBorrowRequest } from "@/app/actions/exchange-listings"
import { toast } from "@/hooks/use-toast"
import { MarketplaceAnalytics } from "@/lib/analytics"

interface Transaction {
  id: string
  tenant_id: string
  listing_id: string
  borrower_id: string
  lender_id: string
  quantity: number
  status: string
  proposed_pickup_date: string | null
  proposed_return_date: string | null
  confirmed_pickup_date: string | null
  expected_return_date: string | null
  actual_pickup_date: string | null
  actual_return_date: string | null
  borrower_message: string | null
  lender_message: string | null
  rejection_reason: string | null
  return_condition: string | null
  return_notes: string | null
  return_damage_photo_url: string | null
  created_at: string
  updated_at: string
  confirmed_at: string | null
  rejected_at: string | null
  completed_at: string | null
  exchange_listings: {
    id: string
    title: string
    hero_photo: string | null
    category_id: string
    exchange_categories: {
      id: string
      name: string
    } | null
  } | null
  borrower: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
  } | null
  lender: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
  } | null
}

interface TransactionCardProps {
  transaction: Transaction
  role: "borrower" | "lender"
  userId: string
  tenantSlug: string
  tenantId: string
  highlighted?: boolean
}

export function TransactionCard({
  transaction,
  role,
  userId,
  tenantSlug,
  tenantId,
  highlighted = false
}: TransactionCardProps) {
  const listing = transaction.exchange_listings
  const categoryName = listing?.exchange_categories?.name || ""
  const otherParty =
    role === "borrower" ? transaction.lender : transaction.borrower
  const otherPartyName = otherParty
    ? `${otherParty.first_name} ${otherParty.last_name}`
    : "Unknown"
  const otherPartyInitials = otherParty
    ? `${otherParty.first_name[0]}${otherParty.last_name[0]}`
    : "?"

  // Determine if category requires return date
  const requiresReturn = !["Services & Skills", "Food & Produce"].includes(
    categoryName
  )

  // Get relevant dates
  const pickupDate =
    transaction.actual_pickup_date ||
    transaction.confirmed_pickup_date ||
    transaction.proposed_pickup_date
  const returnDate =
    transaction.actual_return_date ||
    transaction.expected_return_date ||
    transaction.proposed_return_date

  // Check if overdue
  const isOverdue =
    requiresReturn &&
    returnDate &&
    transaction.status === "picked_up" &&
    isPast(new Date(returnDate)) &&
    !isToday(new Date(returnDate))

  // Check if due soon (within 2 days)
  const isDueSoon =
    requiresReturn &&
    returnDate &&
    transaction.status === "picked_up" &&
    !isOverdue &&
    (() => {
      const daysUntilDue = Math.ceil(
        (new Date(returnDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysUntilDue <= 2 && daysUntilDue >= 0
    })()

  // Status badge configuration
  const getStatusBadge = () => {
    switch (transaction.status) {
      case "confirmed":
        return {
          label: "Scheduled",
          variant: "default" as const,
          className: "bg-blue-600",
        }
      case "picked_up":
        return {
          label: "Active",
          variant: "default" as const,
          className: "bg-purple-600",
        }
      case "returned":
        return {
          label: "Returned",
          variant: "default" as const,
          className: "bg-orange-600",
        }
      case "completed":
        return {
          label: "Complete",
          variant: "default" as const,
          className: "bg-green-600",
        }
      default:
        return {
          label: transaction.status,
          variant: "secondary" as const,
          className: "",
        }
    }
  }

  const statusBadge = getStatusBadge()

  // Category badge color mapping
  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case "Tools & Equipment":
        return "default"
      case "Services & Skills":
        return "secondary"
      case "Food & Produce":
        return "outline"
      case "House sitting & Rentals":
        return "default"
      case "Rides & Carpooling":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Progress indicator based on status
  const getProgressSteps = () => {
    const steps = [
      { label: "Pickup", completed: transaction.actual_pickup_date !== null },
      {
        label: requiresReturn ? "Return" : "Complete",
        completed: transaction.actual_return_date !== null || !requiresReturn,
      },
      { label: "Done", completed: transaction.status === "completed" },
    ]

    return steps
  }

  const progressSteps = getProgressSteps()

  const [pickupDialogOpen, setPickupDialogOpen] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)

  const handlePickupConfirm = async () => {
    const result = await markItemPickedUp(transaction.id, userId, tenantId, tenantSlug)

    if (result.success) {
      if (!requiresReturn) {
        MarketplaceAnalytics.transactionCompleted(transaction.id, 'service_completion')
      }
      toast({
        title: requiresReturn ? "Pickup confirmed" : "Completion confirmed",
        description: requiresReturn
          ? "The item has been marked as picked up"
          : "The service/appointment has been marked as complete",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to confirm pickup",
        variant: "destructive",
      })
    }
  }

  const handleReturnConfirm = async (returnData: {
    return_condition: "good" | "minor_wear" | "damaged" | "broken"
    return_notes?: string
    return_damage_photo_url?: string
  }) => {
    const result = await markItemReturned(
      transaction.id,
      userId,
      tenantId,
      tenantSlug,
      returnData
    )

    if (result.success) {
      MarketplaceAnalytics.transactionCompleted(transaction.id, 'item_return')
      toast({
        title: "Return recorded",
        description: "The item return has been documented",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to record return",
        variant: "destructive",
      })
    }
  }

  const handleCancelConfirm = async (cancelReason?: string) => {
    const result = await cancelTransaction(
      transaction.id,
      userId,
      tenantId,
      tenantSlug,
      cancelReason
    )

    if (result.success) {
      toast({
        title: "Transaction cancelled",
        description: "The request has been cancelled successfully",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to cancel transaction",
        variant: "destructive",
      })
    }
  }

  const handleCompleteConfirm = async () => {
    const result = await markTransactionCompleted(
      transaction.id,
      userId,
      tenantId,
      tenantSlug
    )

    if (result.success) {
      toast({
        title: "Transaction completed",
        description: "The item has been returned to your listings",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to complete transaction",
        variant: "destructive",
      })
    }
  }

  const handleConfirmRequest = async (message?: string) => {
    setIsConfirming(true)
    const result = await confirmBorrowRequest(transaction.id, tenantSlug, tenantId, message)

    if (result.success) {
      MarketplaceAnalytics.transactionResponded(transaction.id, 'confirmed')
      toast({
        title: "Request confirmed",
        description: "The borrower has been notified",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to confirm request",
        variant: "destructive",
      })
    }
    setIsConfirming(false)
  }

  const handleDeclineRequest = async (message?: string) => {
    setIsDeclining(true)
    const result = await rejectBorrowRequest(transaction.id, tenantSlug, tenantId, message)

    if (result.success) {
      MarketplaceAnalytics.transactionResponded(transaction.id, 'rejected')
      toast({
        title: "Request declined",
        description: "The borrower has been notified",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to decline request",
        variant: "destructive",
      })
    }
    setIsDeclining(false)
  }

  return (
    <>
      <Card
        className={cn(
          "transition-all hover:shadow-md cursor-pointer",
          isOverdue && "border-red-500 border-2",
          highlighted && "ring-2 ring-primary ring-offset-2"
        )}
        onClick={() => setDetailModalOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Item Image */}
            <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
              {listing?.hero_photo ? (
                <Image
                  src={listing.hero_photo || "/placeholder.svg"}
                  alt={listing.title || "Item"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Title and Badges */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-base leading-tight">
                    {listing?.title || "Unknown Item"}
                  </h4>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {categoryName && (
                      <Badge
                        variant={getCategoryBadgeVariant(categoryName)}
                        className="text-xs"
                      >
                        {categoryName}
                      </Badge>
                    )}
                    <Badge
                      variant={statusBadge.variant}
                      className={cn("text-xs", statusBadge.className)}
                    >
                      {statusBadge.label}
                    </Badge>
                    {isOverdue && (
                      <Badge variant="destructive" className="text-xs gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Overdue
                      </Badge>
                    )}
                    {isDueSoon && !isOverdue && (
                      <Badge variant="default" className="text-xs gap-1 bg-yellow-600">
                        <Clock className="h-3 w-3" />
                        Due Soon
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Other Party Info */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={otherParty?.profile_picture_url || undefined}
                    />
                    <AvatarFallback className="text-xs">
                      {otherPartyInitials}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-muted-foreground">
                    {role === "borrower" ? "Lent by" : "Borrowed by"}{" "}
                    {otherPartyName}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {progressSteps.map((step, index) => (
                    <div key={index} className="flex items-center flex-1">
                      {/* Circle */}
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full flex-shrink-0",
                          step.completed
                            ? "bg-primary"
                            : "bg-muted border-2 border-muted-foreground"
                        )}
                      />
                      {/* Line */}
                      {index < progressSteps.length - 1 && (
                        <div
                          className={cn(
                            "flex-1 h-0.5 mx-1",
                            step.completed ? "bg-primary" : "bg-muted"
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {progressSteps.map((step, index) => (
                    <span key={index} className="flex-1 text-center">
                      {step.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dates and Quantity */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">
                      {categoryName === "Services & Skills"
                        ? "Appointment"
                        : "Pickup"}
                      :{" "}
                    </span>
                    <span className={cn(isOverdue && "text-red-600")}>
                      {pickupDate
                        ? format(new Date(pickupDate), "MMM d")
                        : "TBD"}
                    </span>
                  </div>
                </div>

                {requiresReturn && returnDate && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">
                      {["House sitting & Rentals", "Rides & Carpooling"].includes(
                        categoryName
                      )
                        ? "End"
                        : "Return"}
                      :{" "}
                    </span>
                    <span className={cn(
                      isOverdue && "text-red-600 font-medium",
                      isDueSoon && "text-yellow-600 font-medium"
                    )}>
                      {format(new Date(returnDate), "MMM d")}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Qty: {transaction.quantity}
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                {transaction.status === "requested" && role === "lender" && (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => setConfirmDialogOpen(true)}
                      disabled={isConfirming || isDeclining}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setDeclineDialogOpen(true)}
                      disabled={isConfirming || isDeclining}
                    >
                      Decline
                    </Button>
                  </div>
                )}

                {transaction.status === "requested" && role === "borrower" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    disabled
                  >
                    Waiting for lender response
                  </Button>
                )}

                {transaction.status === "confirmed" && (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPickupDialogOpen(true)}
                    >
                      {requiresReturn ? "Mark as Picked Up" : "Confirm Completion"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {transaction.status === "picked_up" && role === "lender" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => setReturnDialogOpen(true)}
                  >
                    Mark as Returned
                  </Button>
                )}

                {transaction.status === "picked_up" && role === "borrower" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    disabled
                  >
                    Waiting for lender to confirm return
                  </Button>
                )}

                {transaction.status === "completed" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    View Details
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <MarkPickedUpDialog
        open={pickupDialogOpen}
        onOpenChange={setPickupDialogOpen}
        onConfirm={handlePickupConfirm}
        itemName={listing?.title || "Item"}
        categoryName={categoryName}
      />

      <MarkReturnedDialog
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        onConfirm={handleReturnConfirm}
        itemName={listing?.title || "Item"}
        transactionId={transaction.id}
      />

      <CancelTransactionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancelConfirm}
        itemName={listing?.title || "Item"}
      />

      <TransactionDetailModal
        transactionId={transaction.id}
        userId={userId}
        tenantId={tenantId}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />

      <ConfirmBorrowDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmRequest}
        borrowerName={otherPartyName}
        listingTitle={listing?.title || "Item"}
        isLoading={isConfirming}
      />

      <DeclineBorrowDialog
        open={declineDialogOpen}
        onOpenChange={setDeclineDialogOpen}
        onDecline={handleDeclineRequest}
        borrowerName={otherPartyName}
        listingTitle={listing?.title || "Item"}
        isLoading={isDeclining}
      />
    </>
  )
}
