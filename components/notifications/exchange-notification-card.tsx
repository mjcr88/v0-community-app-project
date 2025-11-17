"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { confirmBorrowRequest, rejectBorrowRequest } from "@/app/actions/exchange-listings"
import { markItemPickedUp, markItemReturned } from "@/app/actions/exchange-transactions"
import { toast } from "sonner"
import type { NotificationFull } from "@/types/notifications"
import { formatDistanceToNow, format } from "date-fns"
import { Archive, Check, X, CheckCircle, XCircle, Package, ArrowLeft, Clock, AlertTriangle } from 'lucide-react'
import { cn } from "@/lib/utils"
import { markAsRead, archiveNotification } from "@/app/actions/notifications"
import { ConfirmBorrowDialog } from "@/components/exchange/confirm-borrow-dialog"
import { DeclineBorrowDialog } from "@/components/exchange/decline-borrow-dialog"
import { MarkPickedUpDialog } from "@/components/transactions/mark-picked-up-dialog"
import { MarkReturnedDialog } from "@/components/transactions/mark-returned-dialog"

interface ExchangeNotificationCardProps {
  notification: NotificationFull
  tenantSlug: string
  userId: string
  onUpdate?: () => void
  compact?: boolean
}

export function ExchangeNotificationCard({ 
  notification, 
  tenantSlug,
  userId,
  onUpdate,
  compact = false
}: ExchangeNotificationCardProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showDeclineDialog, setShowDeclineDialog] = useState(false)
  const [showPickupDialog, setShowPickupDialog] = useState(false)
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [isMarkingPickup, setIsMarkingPickup] = useState(false)
  const [isMarkingReturn, setIsMarkingReturn] = useState(false)

  const actorName = notification.actor
    ? `${notification.actor.first_name} ${notification.actor.last_name}`
    : "Someone"
  const actorInitials = notification.actor
    ? `${notification.actor.first_name[0]}${notification.actor.last_name[0]}`
    : "?"

  const transaction = notification.exchange_transaction
  const listing = notification.exchange_listing

  const categoryName = listing?.category?.name
  const showReturnDate = categoryName && 
    !['Services & Skills', 'Food & Produce'].includes(categoryName) &&
    transaction?.proposed_return_date

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'Tools & Equipment':
        return 'default'
      case 'Services & Skills':
        return 'secondary'
      case 'Food & Produce':
        return 'outline'
      case 'House sitting & Rentals':
        return 'default'
      case 'Rides & Carpooling':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const handleMarkAsRead = async () => {
    const result = await markAsRead(notification.id, tenantSlug)
    if (result.success) {
      onUpdate?.()
    }
  }

  const handleArchive = async () => {
    const result = await archiveNotification(notification.id, tenantSlug)
    if (result.success) {
      toast.success("Archived")
      onUpdate?.()
    } else {
      toast.error(result.error || "Failed to archive")
    }
  }

  const handleConfirm = async (message?: string) => {
    if (!transaction?.id) return

    setIsConfirming(true)
    const result = await confirmBorrowRequest(
      transaction.id, 
      tenantSlug, 
      notification.tenant_id,
      message
    )

    if (result.success) {
      toast.success("Request confirmed!")
      if (!notification.is_read) {
        await handleMarkAsRead()
      }
      onUpdate?.()
    } else {
      toast.error(result.error || "Failed to confirm request")
    }
    setIsConfirming(false)
  }

  const handleReject = async (message?: string) => {
    if (!transaction?.id) return

    setIsRejecting(true)
    const result = await rejectBorrowRequest(
      transaction.id, 
      tenantSlug, 
      notification.tenant_id,
      message
    )

    if (result.success) {
      toast.success("Request declined")
      if (!notification.is_read) {
        await handleMarkAsRead()
      }
      onUpdate?.()
    } else {
      toast.error(result.error || "Failed to decline request")
    }
    setIsRejecting(false)
  }

  const handlePickupConfirm = async () => {
    if (!transaction?.id) return

    setIsMarkingPickup(true)
    const result = await markItemPickedUp(
      transaction.id,
      userId,
      notification.tenant_id,
      tenantSlug
    )

    if (result.success) {
      toast.success("Item marked as picked up!")
      if (!notification.is_read) {
        await handleMarkAsRead()
      }
      onUpdate?.()
    } else {
      toast.error(result.error || "Failed to mark as picked up")
    }
    setIsMarkingPickup(false)
  }

  const handleReturnConfirm = async (data: {
    return_condition: "good" | "minor_wear" | "damaged" | "broken"
    return_notes?: string
    return_damage_photo_url?: string
  }) => {
    if (!transaction?.id) return

    setIsMarkingReturn(true)
    const result = await markItemReturned(
      transaction.id,
      userId,
      notification.tenant_id,
      tenantSlug,
      data
    )

    if (result.success) {
      toast.success("Item marked as returned!")
      if (!notification.is_read) {
        await handleMarkAsRead()
      }
      onUpdate?.()
    } else {
      toast.error(result.error || "Failed to mark as returned")
    }
    setIsMarkingReturn(false)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || 
        (e.target as HTMLElement).closest('[role="dialog"]')) {
      return
    }
    
    if (!notification.is_read) {
      handleMarkAsRead()
    }
    
    if (notification.exchange_transaction_id) {
      window.location.href = `/t/${tenantSlug}/dashboard?tab=transactions&highlight=${notification.exchange_transaction_id}`
    }
  }

  // Determine if this is a request that needs action
  const isRequestNeedingAction =
    notification.type === "exchange_request" &&
    notification.action_required &&
    !notification.action_taken

  const isBorrowerResponseNotification = 
    (notification.type === "exchange_confirmed" || notification.type === "exchange_rejected")

  const showResponseBadge = 
    notification.type === "exchange_request" && 
    notification.action_taken && 
    notification.action_response

  const isPickupNotification = 
    transaction?.status === "confirmed" &&
    (notification.type === "exchange_confirmed" || notification.type === "exchange_request")

  const isReturnNotification =
    transaction?.status === "picked_up" &&
    transaction?.lender_id === userId &&
    notification.type === "exchange_picked_up"

  const isReminderNotification = notification.type === "exchange_reminder"
  const isOverdueNotification = notification.type === "exchange_overdue"

  console.log("[v0] Notification card debug:", {
    notificationType: notification.type,
    transactionStatus: transaction?.status,
    isPickupNotification,
    isReturnNotification,
    userId,
    lenderId: transaction?.lender_id,
    borrowerId: transaction?.borrower_id
  })

  return (
    <>
      <Card
        className={cn(
          "transition-colors",
          !notification.is_read && "bg-accent/50 border-l-4 border-l-primary",
          isOverdueNotification && "border-l-red-500",
        )}
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {notification.actor && (
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={notification.actor.profile_picture_url || undefined} />
                  <AvatarFallback>{actorInitials}</AvatarFallback>
                </Avatar>
              )}

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm leading-tight">{notification.title}</h3>
                  {!notification.is_read && (
                    <Badge variant="secondary" className="text-xs">
                      New
                    </Badge>
                  )}
                  {categoryName && (
                    <Badge variant={getCategoryBadgeVariant(categoryName)} className="text-xs">
                      {categoryName}
                    </Badge>
                  )}
                  {isBorrowerResponseNotification && (
                    <>
                      {notification.type === "exchange_confirmed" && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          <Check className="mr-1 h-3 w-3" />
                          Approved
                        </Badge>
                      )}
                      {notification.type === "exchange_rejected" && (
                        <Badge variant="secondary" className="text-xs bg-red-600 text-white">
                          <X className="mr-1 h-3 w-3" />
                          Declined
                        </Badge>
                      )}
                    </>
                  )}
                  {showResponseBadge && (
                    <>
                      {notification.action_response === "confirmed" && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          <Check className="mr-1 h-3 w-3" />
                          Confirmed
                        </Badge>
                      )}
                      {notification.action_response === "declined" && (
                        <Badge variant="secondary" className="text-xs bg-gray-600 text-white">
                          <X className="mr-1 h-3 w-3" />
                          Declined
                        </Badge>
                      )}
                    </>
                  )}
                  {isRequestNeedingAction && (
                    <Badge variant="destructive" className="text-xs">
                      Action Required
                    </Badge>
                  )}
                  {isReminderNotification && (
                    <Badge variant="default" className="text-xs bg-yellow-600">
                      <Clock className="mr-1 h-3 w-3" />
                      Reminder
                    </Badge>
                  )}
                  {isOverdueNotification && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Overdue
                    </Badge>
                  )}
                </div>

                {isBorrowerResponseNotification && transaction?.lender_message && (
                  <p className="text-sm italic text-muted-foreground">
                    &ldquo;{transaction.lender_message}&rdquo;
                  </p>
                )}

                {notification.message && (
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                )}

                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {!compact && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleArchive()
                  }}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {(listing || transaction) && (
          <CardContent className="pt-0 space-y-4">
            {!compact && listing && listing.hero_photo && (
              <div className="flex items-center gap-3">
                <img
                  src={listing.hero_photo || "/placeholder.svg"}
                  alt={listing.title}
                  className="w-16 h-16 object-cover rounded flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{listing.title}</p>
                  {listing.category && (
                    <p className="text-xs text-muted-foreground">{listing.category.name}</p>
                  )}
                </div>
              </div>
            )}

            {transaction && notification.type === "exchange_request" && !compact && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Quantity:</strong> {transaction.quantity}</span>
                </div>
                <div className={cn("grid gap-2", showReturnDate ? "grid-cols-2" : "grid-cols-1")}>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {categoryName === 'Services & Skills' ? 'Appointment Date' : 'Pickup Date'}
                    </p>
                    <p className="font-medium">
                      {format(new Date(transaction.proposed_pickup_date!), "MMM d, yyyy")}
                    </p>
                  </div>
                  {showReturnDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {['House sitting & Rentals', 'Rides & Carpooling'].includes(categoryName!) 
                          ? 'End Date' 
                          : 'Return Date'}
                      </p>
                      <p className="font-medium">
                        {format(new Date(transaction.proposed_return_date!), "MMM d, yyyy")}
                      </p>
                    </div>
                  )}
                </div>
                {transaction.borrower_message && (
                  <div>
                    <p className="text-xs text-muted-foreground">Message from {actorName}</p>
                    <p className="text-sm italic mt-1">&ldquo;{transaction.borrower_message}&rdquo;</p>
                  </div>
                )}
                {notification.action_taken && transaction.lender_message && (
                  <div>
                    <p className="text-xs text-muted-foreground">Your Reply</p>
                    <p className="text-sm italic mt-1">&ldquo;{transaction.lender_message}&rdquo;</p>
                  </div>
                )}
              </div>
            )}

            {isRequestNeedingAction && (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowConfirmDialog(true)
                  }}
                  disabled={isConfirming || isRejecting}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeclineDialog(true)
                  }}
                  disabled={isConfirming || isRejecting}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              </div>
            )}

            {isPickupNotification && (
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPickupDialog(true)
                }}
                disabled={isMarkingPickup}
                className="w-full"
              >
                <Package className="h-4 w-4 mr-2" />
                Mark as Picked Up
              </Button>
            )}

            {isReturnNotification && (
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowReturnDialog(true)
                }}
                disabled={isMarkingReturn}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Mark as Returned
              </Button>
            )}

            {(isReminderNotification || isOverdueNotification) && transaction && (
              <div className={cn(
                "p-3 rounded-lg border-2",
                isReminderNotification && "bg-yellow-50 border-yellow-200",
                isOverdueNotification && "bg-red-50 border-red-200"
              )}>
                <div className="flex items-start gap-3">
                  {isReminderNotification && <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />}
                  {isOverdueNotification && <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium mb-2",
                      isReminderNotification && "text-yellow-800",
                      isOverdueNotification && "text-red-800"
                    )}>
                      {transaction.expected_return_date && (
                        <>
                          {isReminderNotification && `Due ${format(new Date(transaction.expected_return_date), "MMM d, yyyy")}`}
                          {isOverdueNotification && `Was due ${format(new Date(transaction.expected_return_date), "MMM d, yyyy")}`}
                        </>
                      )}
                    </p>
                    <p className={cn(
                      "text-xs",
                      isReminderNotification && "text-yellow-700",
                      isOverdueNotification && "text-red-700"
                    )}>
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Confirm dialog */}
      <ConfirmBorrowDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirm}
        borrowerName={actorName}
        listingTitle={listing?.title || "this item"}
        isLoading={isConfirming}
      />

      {/* Decline dialog */}
      <DeclineBorrowDialog
        open={showDeclineDialog}
        onOpenChange={setShowDeclineDialog}
        onDecline={handleReject}
        borrowerName={actorName}
        listingTitle={listing?.title || "this item"}
        isLoading={isRejecting}
      />

      <MarkPickedUpDialog
        open={showPickupDialog}
        onOpenChange={setShowPickupDialog}
        onConfirm={handlePickupConfirm}
        itemName={listing?.title || "this item"}
        isLoading={isMarkingPickup}
      />

      <MarkReturnedDialog
        open={showReturnDialog}
        onOpenChange={setShowReturnDialog}
        onConfirm={handleReturnConfirm}
        itemName={listing?.title || "this item"}
        transactionId={transaction?.id || ""}
      />
    </>
  )
}
