"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from 'lucide-react'
import { format } from "date-fns"
import Image from "next/image"

interface CompletedTransaction {
  id: string
  borrower_id: string
  lender_id: string
  actual_pickup_date: string | null
  actual_return_date: string | null
  completed_at: string
  exchange_listings: {
    id: string
    title: string
    hero_photo: string | null
  } | null
  borrower: {
    id: string
    first_name: string
    last_name: string
  } | null
  lender: {
    id: string
    first_name: string
    last_name: string
  } | null
}

interface CompletedTransactionsTableProps {
  transactions: CompletedTransaction[]
  userId: string
  tenantSlug: string
  tenantId: string
}

export function CompletedTransactionsTable({
  transactions,
  userId,
  tenantSlug,
  tenantId,
}: CompletedTransactionsTableProps) {
  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const isBorrower = transaction.borrower_id === userId
        const role = isBorrower ? "Borrowed" : "Lent"
        const otherParty = isBorrower 
          ? `${transaction.lender?.first_name} ${transaction.lender?.last_name}`
          : `${transaction.borrower?.first_name} ${transaction.borrower?.last_name}`

        const pickupDate = transaction.actual_pickup_date 
          ? format(new Date(transaction.actual_pickup_date), "MMM d")
          : "N/A"
        const returnDate = transaction.actual_return_date
          ? format(new Date(transaction.actual_return_date), "MMM d, yyyy")
          : "N/A"

        return (
          <div
            key={transaction.id}
            className="flex gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
          >
            {transaction.exchange_listings?.hero_photo ? (
              <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                <Image 
                  src={transaction.exchange_listings.hero_photo || "/placeholder.svg"} 
                  alt={transaction.exchange_listings.title || "Item"} 
                  fill 
                  className="object-cover" 
                />
              </div>
            ) : (
              <div className="w-16 h-16 flex-shrink-0 rounded-md bg-muted" />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <h4 className="font-medium text-sm leading-tight truncate flex-1">
                  {transaction.exchange_listings?.title || "Unknown Item"}
                </h4>
                <Badge variant={isBorrower ? "default" : "secondary"} className="text-xs">
                  {role}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground mt-1">
                {isBorrower ? "Lender" : "Borrower"}: {otherParty}
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                {pickupDate} → {returnDate}
              </p>

              <Badge variant="outline" className="text-xs mt-2">
                Completed
              </Badge>
            </div>
          </div>
        )
      })}
    </div>
  )
}
