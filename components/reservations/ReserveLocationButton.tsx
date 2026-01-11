"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"
import { ReservationForm } from "@/components/reservations/ReservationForm"

interface ReserveLocationButtonProps {
    locationId: string
    locationName: string
    tenantSlug: string
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
    size?: "default" | "sm" | "lg" | "icon"
    className?: string
}

export function ReserveLocationButton({
    locationId,
    locationName,
    tenantSlug,
    variant = "default",
    size = "default",
    className
}: ReserveLocationButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant={variant} size={size} className={className}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Reserve Facility
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>Reserve {locationName}</DialogTitle>
                    <DialogDescription>
                        Fill out the form below to reserve this facility.
                    </DialogDescription>
                </DialogHeader>
                <ReservationForm
                    locationId={locationId}
                    tenantSlug={tenantSlug}
                    onSuccess={() => setIsOpen(false)}
                    onCancel={() => setIsOpen(false)}
                />
            </DialogContent>
        </Dialog>
    )
}
