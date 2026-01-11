"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, CalendarX, User as UserIcon } from "lucide-react"
import { CancelReservationDialog } from "@/components/reservations/CancelReservationDialog"

interface Reservation {
    id: string
    title: string | null
    start_time: string
    end_time: string
    status: string
    user_id: string
    user?: {
        first_name: string
        last_name: string
        email: string
        profile_picture_url: string | null
    } | null
    location?: {
        name: string
    } | null
}

interface AdminReservationsTableProps {
    reservations: Reservation[]
    tenantSlug: string
}

export function AdminReservationsTable({ reservations, tenantSlug }: AdminReservationsTableProps) {
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
    const [isCancelOpen, setIsCancelOpen] = useState(false)

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "confirmed":
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200">Confirmed</Badge>
            case "cancelled":
                return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100/80 border-red-200">Cancelled</Badge>
            case "rejected":
                return <Badge variant="destructive">Rejected</Badge>
            case "pending":
                return <Badge variant="secondary">Pending</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Facility</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reservations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No reservations found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            reservations.map((reservation) => (
                                <TableRow key={reservation.id}>
                                    <TableCell className="font-medium">
                                        {reservation.title || "Untitled Reservation"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={reservation.user?.profile_picture_url || undefined} />
                                                <AvatarFallback>
                                                    <UserIcon className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    {reservation.user?.first_name} {reservation.user?.last_name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {reservation.user?.email}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{reservation.location?.name || "Unknown Location"}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span>{format(new Date(reservation.start_time), "MMM d, yyyy")}</span>
                                            <span className="text-muted-foreground">
                                                {format(new Date(reservation.start_time), "h:mm a")} - {format(new Date(reservation.end_time), "h:mm a")}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    onSelect={() => {
                                                        setSelectedReservation(reservation)
                                                        setIsCancelOpen(true)
                                                    }}
                                                    className="text-destructive focus:text-destructive"
                                                    disabled={reservation.status === 'cancelled'}
                                                >
                                                    <CalendarX className="mr-2 h-4 w-4" />
                                                    Cancel Reservation
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedReservation && (
                <CancelReservationDialog
                    open={isCancelOpen}
                    onOpenChange={setIsCancelOpen}
                    reservationId={selectedReservation.id}
                    tenantSlug={tenantSlug}
                    reservationTitle={selectedReservation.title || undefined}
                />
            )}
        </>
    )
}
