import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CalendarX } from "lucide-react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export default async function AdminFacilityReservationsPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>
}) {
    const { slug, id } = await params
    const supabase = await createClient()

    // Verify auth
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect(`/t/${slug}/login`)

    // Get Facility details
    const { data: facility, error: facilityError } = await supabase
        .from("locations")
        .select("*")
        .eq("id", id)
        .single()

    if (facilityError || !facility) {
        notFound()
    }

    // Get Reservations
    const { data: reservations, error: reservationsError } = await supabase
        .from("reservations")
        .select(`
        *,
        user:users(first_name, last_name, email, profile_picture_url)
    `)
        .eq("location_id", id)
        .order("start_time", { ascending: false })

    if (reservationsError) {
        console.error("Error fetching reservations:", reservationsError)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href={`/t/${slug}/admin/facilities`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{facility.name} - Reservations</h2>
                    <p className="text-muted-foreground">View and manage reservations for this facility</p>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Resident</TableHead>
                            <TableHead>Start Time</TableHead>
                            <TableHead>End Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Reason (if cancelled)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!reservations || reservations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No reservations found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            reservations.map((reservation) => (
                                <TableRow key={reservation.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {reservation.user?.profile_picture_url && (
                                                <img src={reservation.user.profile_picture_url} alt="" className="w-6 h-6 rounded-full" />
                                            )}
                                            <span>{reservation.user?.first_name} {reservation.user?.last_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{format(new Date(reservation.start_time), "MMM d, yyyy h:mm a")}</TableCell>
                                    <TableCell>{format(new Date(reservation.end_time), "h:mm a")}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            reservation.status === 'confirmed' ? 'default' :
                                                reservation.status === 'cancelled' ? 'destructive' : 'secondary'
                                        }>
                                            {reservation.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {reservation.cancellation_reason || '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}

                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
