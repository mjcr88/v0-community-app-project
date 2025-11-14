"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreateCheckInModal } from "./create-check-in-modal"

interface CreateCheckInButtonProps {
  tenantSlug: string
  tenantId: string
  variant?: "default" | "outline" | "ghost" | "link"
  className?: string
  initialLocation?: {
    id: string
    name: string
    type: string
  } | null
}

export function CreateCheckInButton({
  tenantSlug,
  tenantId,
  variant = "outline",
  className,
  initialLocation,
}: CreateCheckInButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)} className={className}>
        Create Check-in
      </Button>
      <CreateCheckInModal
        open={open}
        onOpenChange={setOpen}
        tenantSlug={tenantSlug}
        tenantId={tenantId}
        initialLocation={initialLocation}
      />
    </>
  )
}
