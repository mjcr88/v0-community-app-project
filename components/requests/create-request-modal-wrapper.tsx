"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateRequestModal } from "./create-request-modal"

interface CreateRequestModalWrapperProps {
    tenantSlug: string
    tenantId: string
}

export function CreateRequestModalWrapper({ tenantSlug, tenantId }: CreateRequestModalWrapperProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
                <Plus className="mr-2 h-4 w-4" />
                New Request
            </Button>

            <CreateRequestModal
                open={open}
                onOpenChange={setOpen}
                tenantSlug={tenantSlug}
                tenantId={tenantId}
            />
        </>
    )
}
