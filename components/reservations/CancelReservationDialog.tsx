"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cancelReservation } from "@/app/actions/reservations"

interface CancelReservationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    reservationId: string
    tenantSlug: string
    reservationTitle?: string
}

export function CancelReservationDialog({
    open,
    onOpenChange,
    reservationId,
    tenantSlug,
    reservationTitle
}: CancelReservationDialogProps) {
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleCancel = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a cancellation reason")
            return
        }

        setLoading(true)
        try {
            await cancelReservation(reservationId, reason, tenantSlug)
            toast.success("Reservation cancelled successfully")
            onOpenChange(false)
            setReason("") // Reset reason
            router.refresh()
        } catch (error) {
            console.error("Error cancelling reservation:", error)
            toast.error("Failed to cancel reservation")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Reservation</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to cancel the reservation "{reservationTitle || 'Untitled'}"?
                        This action cannot be undone and the user will be notified.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="reason">Cancellation Reason</Label>
                        <Textarea
                            id="reason"
                            placeholder="Please explain why this reservation is being cancelled..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Keep Reservation</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault() // Prevent auto-close
                            handleCancel()
                        }}
                        disabled={loading || !reason.trim()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {loading ? "Cancelling..." : "Cancel Reservation"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
