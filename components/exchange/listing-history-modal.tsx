"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Calendar, User } from 'lucide-react'
import { format, differenceInDays } from "date-fns"
import { getListingHistory } from "@/app/actions/exchange-history"
import Image from "next/image"

interface ListingHistoryModalProps {
  listingId: string
  listingName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  tenantId: string
  tenantSlug: string
}

export function ListingHistoryModal({
  listingId,
  listingName,
  open,
  onOpenChange,
  userId,
  tenantId,
  tenantSlug,
}: ListingHistoryModalProps) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (open) {
      loadHistory()
    }
  }, [open])

  const loadHistory = async () => {
    setLoading(true)
    const result = await getListingHistory(listingId, userId, tenantId, 0, 10)
    
    if (result.error) {
      alert(result.error)
      onOpenChange(false)
      return
    }

    setTransactions(result.transactions)
    setHasMore(result.hasMore)
    setTotal(result.total)
    setOffset(0)
    setLoading(false)
  }

  const loadMore = async () => {
    setLoadingMore(true)
    const newOffset = offset + 10
    const result = await getListingHistory(listingId, userId, tenantId, newOffset, 10)
    
    setTransactions([...transactions, ...result.transactions])
    setOffset(newOffset)
    setHasMore(result.hasMore)
    setLoadingMore(false)
  }

  const totalDays = transactions.reduce((sum, t) => {
    if (t.actual_pickup_date && t.actual_return_date) {
      return sum + differenceInDays(
        new Date(t.actual_return_date),
        new Date(t.actual_pickup_date)
      )
    }
    return sum
  }, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction History: {listingName}</DialogTitle>
          <DialogDescription>
            Complete history of all transactions for this listing
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-semibold">{total}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Time Borrowed</p>
                <p className="text-2xl font-semibold">{totalDays} days</p>
              </div>
            </div>

            <div className="space-y-4">
              {transactions.map((transaction, index) => {
                const duration = transaction.actual_pickup_date && transaction.actual_return_date
                  ? differenceInDays(
                      new Date(transaction.actual_return_date),
                      new Date(transaction.actual_pickup_date)
                    )
                  : 0

                return (
                  <div key={transaction.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={transaction.borrower_avatar_url || undefined} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{transaction.borrower_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Transaction #{total - index}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Completed</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Pickup Date
                        </p>
                        <p className="font-medium">
                          {transaction.actual_pickup_date 
                            ? format(new Date(transaction.actual_pickup_date), "MMM d, yyyy")
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Return Date
                        </p>
                        <p className="font-medium">
                          {transaction.actual_return_date
                            ? format(new Date(transaction.actual_return_date), "MMM d, yyyy")
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-medium">{duration} days</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <p className="font-medium">{transaction.quantity}</p>
                      </div>
                      {transaction.return_condition && (
                        <div>
                          <p className="text-xs text-muted-foreground">Return Condition</p>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {transaction.return_condition.replace("_", " ")}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {transaction.return_damage_photo_url && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Damage Photos</p>
                        <div className="relative w-32 h-32 rounded-md overflow-hidden border">
                          <Image
                            src={transaction.return_damage_photo_url || "/placeholder.svg"}
                            alt="Damage photo"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {transaction.return_notes && (
                      <div>
                        <p className="text-xs text-muted-foreground">Return Notes</p>
                        <p className="text-sm italic">&ldquo;{transaction.return_notes}&rdquo;</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
