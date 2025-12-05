"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreateExchangeListingModal } from "./create-exchange-listing-modal"
import { Plus } from 'lucide-react'

interface CreateExchangeListingButtonProps {
  tenantSlug: string
  tenantId: string
  categories: Array<{ id: string; name: string }>
  neighborhoods: Array<{ id: string; name: string }>
  variant?: "default" | "outline" | "ghost" | "link"
  className?: string
  initialLocation?: {
    id: string
    name: string
  }
}

export function CreateExchangeListingButton({
  tenantSlug,
  tenantId,
  categories,
  neighborhoods,
  variant = "default",
  className,
  initialLocation,
}: CreateExchangeListingButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)} className={className}>
        <Plus className="h-4 w-4 mr-2" />
        <span className="md:hidden">Create</span>
        <span className="hidden md:inline">Create Listing</span>
      </Button>
      <CreateExchangeListingModal
        open={open}
        onOpenChange={setOpen}
        tenantSlug={tenantSlug}
        tenantId={tenantId}
        categories={categories}
        neighborhoods={neighborhoods}
        initialLocation={initialLocation}
      />
    </>
  )
}
