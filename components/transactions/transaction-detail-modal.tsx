"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Package, ArrowLeft, CalendarDays, User, AlertCircle } from 'lucide-react'
import { format } from "date-fns"
import Image from "next/image"
import { getTransactionById } from "@/app/actions/exchange-transactions"
import { cn } from "@/lib/utils"

interface TransactionDetailModalProps {
  transactionId: string
  userId: string
  tenantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionDetailModal({
  transactionId,
  userId,
  tenantId,
  open,
  onOpenChange,
}: TransactionDetailModalProps) {
  const [transaction, setTransaction] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (open && transactionId) {
      loadTransaction()
    }
  }, [open, transactionId])

  async function loadTransaction() {
    setIsLoading(true)
    const result = await getTransactionById(transactionId, userId, tenantId)

    if (result.success && result.data) {
      setTransaction(result.data)
    }
    setIsLoading(false)
  }

  if (isLoading || !transaction) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const listing = transaction.exchange_listings
  const categoryName = listing?.exchange_categories?.name || ""
  const requiresReturn = !["Services & Skills", "Food & Produce"].includes(categoryName)

  const conditionLabels = {
    good: "Good - No issues",
    minor_wear: "Minor Wear - Light use marks",
    damaged: "Damaged - Noticeable damage",
    broken: "Broken - Not functional",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Info */}
          <div className="flex gap-4">
            <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
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
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-semibold">{listing?.title}</h3>
              {categoryName && (
                <Badge variant="secondary">{categoryName}</Badge>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>Quantity: {transaction.quantity}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Parties */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Borrower
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={transaction.borrower?.profile_picture_url || undefined}
                    />
                    <AvatarFallback>
                      {transaction.borrower?.first_name?.[0]}
                      {transaction.borrower?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {transaction.borrower?.first_name}{" "}
                      {transaction.borrower?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.borrower?.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Lender
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={transaction.lender?.profile_picture_url || undefined}
                    />
                    <AvatarFallback>
                      {transaction.lender?.first_name?.[0]}
                      {transaction.lender?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {transaction.lender?.first_name}{" "}
                      {transaction.lender?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.lender?.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="font-semibold">Timeline</h3>

            <div className="space-y-4">
              {/* Requested */}
              <TimelineEvent
                icon={<User className="h-4 w-4" />}
                label="Requested"
                date={transaction.created_at}
                completed={true}
              />

              {/* Confirmed or Rejected */}
              {transaction.confirmed_at && (
                <TimelineEvent
                  icon={<CheckCircle className="h-4 w-4" />}
                  label="Confirmed"
                  date={transaction.confirmed_at}
                  completed={true}
                  message={transaction.lender_message}
                />
              )}

              {transaction.rejected_at && (
                <TimelineEvent
                  icon={<AlertCircle className="h-4 w-4" />}
                  label="Rejected"
                  date={transaction.rejected_at}
                  completed={true}
                  message={transaction.rejection_reason}
                  variant="destructive"
                />
              )}

              {/* Picked Up */}
              {transaction.actual_pickup_date && (
                <TimelineEvent
                  icon={<Package className="h-4 w-4" />}
                  label={requiresReturn ? "Picked Up" : "Completed"}
                  date={transaction.actual_pickup_date}
                  completed={true}
                />
              )}

              {/* Returned */}
              {transaction.actual_return_date && (
                <TimelineEvent
                  icon={<ArrowLeft className="h-4 w-4" />}
                  label="Returned"
                  date={transaction.actual_return_date}
                  completed={true}
                  condition={transaction.return_condition}
                />
              )}

              {/* Completed */}
              {transaction.completed_at && (
                <TimelineEvent
                  icon={<CheckCircle className="h-4 w-4" />}
                  label="Completed"
                  date={transaction.completed_at}
                  completed={true}
                  variant="success"
                />
              )}
            </div>
          </div>

          {/* Dates Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {categoryName === "Services & Skills"
                    ? "Appointment"
                    : "Pickup"}
                  :
                </span>
                <span className="font-medium">
                  {transaction.confirmed_pickup_date ||
                  transaction.proposed_pickup_date
                    ? format(
                        new Date(
                          transaction.confirmed_pickup_date ||
                            transaction.proposed_pickup_date
                        ),
                        "MMM d, yyyy"
                      )
                    : "TBD"}
                </span>
              </div>

              {requiresReturn &&
                (transaction.expected_return_date ||
                  transaction.proposed_return_date) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {["House sitting & Rentals", "Rides & Carpooling"].includes(
                        categoryName
                      )
                        ? "End Date"
                        : "Return"}
                      :
                    </span>
                    <span className="font-medium">
                      {format(
                        new Date(
                          transaction.expected_return_date ||
                            transaction.proposed_return_date
                        ),
                        "MMM d, yyyy"
                      )}
                    </span>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Return Details */}
          {transaction.return_condition && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Return Condition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge
                  variant={
                    transaction.return_condition === "good"
                      ? "default"
                      : transaction.return_condition === "minor_wear"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {conditionLabels[transaction.return_condition as keyof typeof conditionLabels]}
                </Badge>

                {transaction.return_notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                    <p className="text-sm italic">"{transaction.return_notes}"</p>
                  </div>
                )}

                {transaction.return_damage_photo_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Damage Photo:
                    </p>
                    <div className="relative w-full h-48 rounded-md overflow-hidden">
                      <Image
                        src={transaction.return_damage_photo_url || "/placeholder.svg"}
                        alt="Damage photo"
                        fill
                        className="object-contain bg-muted"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Messages */}
          {transaction.borrower_message && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Request Message</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm italic">"{transaction.borrower_message}"</p>
              </CardContent>
            </Card>
          )}

          {transaction.lender_message && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Lender Response</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm italic">"{transaction.lender_message}"</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface TimelineEventProps {
  icon: React.ReactNode
  label: string
  date: string
  completed: boolean
  message?: string | null
  condition?: string | null
  variant?: "default" | "success" | "destructive"
}

function TimelineEvent({
  icon,
  label,
  date,
  completed,
  message,
  condition,
  variant = "default",
}: TimelineEventProps) {
  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          completed && variant === "default" && "bg-primary text-primary-foreground",
          completed && variant === "success" && "bg-green-600 text-white",
          completed && variant === "destructive" && "bg-destructive text-destructive-foreground",
          !completed && "bg-muted text-muted-foreground"
        )}
      >
        {icon}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(date), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        {message && (
          <p className="text-sm text-muted-foreground italic mt-1">"{message}"</p>
        )}
        {condition && (
          <Badge variant="secondary" className="mt-2">
            {condition}
          </Badge>
        )}
      </div>
    </div>
  )
}
