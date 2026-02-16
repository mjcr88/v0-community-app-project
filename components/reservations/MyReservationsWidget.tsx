"use client"

import Link from "next/link"
import { useState } from "react"
import { format } from "date-fns"
import { Calendar, Clock, MapPin, Trash2, Home, AlertCircle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cancelReservation } from "@/app/actions/reservations"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { RioEmptyState } from "@/components/dashboard/rio-empty-state"

interface Reservation {
    id: string
    start_time: string
    end_time: string
    status: string
    title: string | null
    location: {
        id: string
        name: string
        type: string
        photos?: string[] | null
    }
}

interface MyReservationsWidgetProps {
    reservations: Reservation[]
    tenantSlug: string
}

export function MyReservationsWidget({ reservations: initialReservations, tenantSlug }: MyReservationsWidgetProps) {
    const [reservations, setReservations] = useState(initialReservations)
    const [cancellingId, setCancellingId] = useState<string | null>(null)

    const handleCancel = async (id: string, e: React.MouseEvent) => {
        e.preventDefault() // Prevent navigation if we wrap in Link later, though currently button is distinct
        try {
            await cancelReservation(id, "User cancelled from dashboard", tenantSlug)
            setReservations(prev => prev.filter(r => r.id !== id)) // Remove from list immediately
            toast.success("Reservation cancelled")
        } catch (error) {
            console.error("Error cancelling reservation:", error)
            toast.error("Failed to cancel reservation")
        }
    }

    if (reservations.length === 0) {
        return (
            <RioEmptyState
                title="No upcoming reservations"
                message="Need a space? Reserve a facility for your next gathering."
                action={
                    <Button asChild>
                        <Link href={`/t/${tenantSlug}/dashboard/community-map`}>
                            Browse Facilities
                        </Link>
                    </Button>
                }
            />
        )
    }

    return (
        <div className="space-y-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">My Reservations</h3>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
                        {reservations.length} Active
                    </Badge>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="ghost" size="sm" className="flex-1 md:flex-none">
                        <Link href={`/t/${tenantSlug}/dashboard/community-map`}>View Map</Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1 md:flex-none">
                        <Link href={`/t/${tenantSlug}/dashboard/community-map`}>
                            <Plus className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">New Reservation</span>
                            <span className="sm:hidden">Create</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* List Section */}
            <div className="grid gap-3">
                {reservations.map((reservation) => (
                    <div key={reservation.id} className="group flex gap-4 p-4 rounded-xl border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200">
                        {/* Date Box */}
                        <div className="flex flex-col items-center justify-center bg-primary/5 rounded-lg px-2 md:px-4 py-2 min-w-[3.5rem] md:min-w-[4.5rem] flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                            <div className="text-xs font-semibold text-primary/80 uppercase tracking-wide">
                                {format(new Date(reservation.start_time), "MMM")}
                            </div>
                            <div className="text-2xl font-bold text-primary leading-none mt-0.5">
                                {format(new Date(reservation.start_time), "d")}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                            <div className="space-y-1">
                                <h4 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                                    {reservation.title || reservation.location.name}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>
                                        {format(new Date(reservation.start_time), "h:mm a")} - {format(new Date(reservation.end_time), "h:mm a")}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span>{reservation.location.name}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center md:items-start justify-end">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Cancel
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Cancel Reservation?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to cancel your reservation for {reservation.location.name}?
                                                This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Keep it</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={(e) => handleCancel(reservation.id, e as any)}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                Yes, Cancel
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
