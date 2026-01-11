import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Info } from "lucide-react"
import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UpcomingReservationsSectionProps {
    locationId: string
}

export async function UpcomingReservationsSection({ locationId }: UpcomingReservationsSectionProps) {
    const supabase = await createClient()
    const now = new Date().toISOString()

    const { data: reservations } = await supabase
        .from("reservations")
        .select(`
            id,
            start_time,
            end_time,
            title,
            status,
            user_id,
            user:users!user_id (
                first_name,
                last_name,
                profile_picture_url
            )
        `)
        .eq("location_id", locationId)
        .in("status", ["confirmed"])
        .gte("end_time", now)
        .order("start_time", { ascending: true })
        .limit(5)

    if (!reservations || reservations.length === 0) {
        return null
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Upcoming Reservations
                        </CardTitle>
                        <CardDescription>
                            Scheduled events at this facility
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {reservations.length} Upcoming
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="grid gap-3">
                {reservations.map((res: any) => {
                    const startDate = new Date(res.start_time)
                    const endDate = new Date(res.end_time)

                    return (
                        <div key={res.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex gap-4">
                                {/* Date Box */}
                                <div className="flex flex-col items-center justify-center bg-muted rounded-md px-3 py-1.5 min-w-[3.5rem] flex-shrink-0">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase">{format(startDate, "MMM")}</div>
                                    <div className="text-xl font-bold text-foreground leading-none mt-0.5">{format(startDate, "d")}</div>
                                </div>

                                <div className="space-y-1">
                                    <h4 className="font-medium text-foreground leading-tight">
                                        {res.title || "Reserved Event"}
                                    </h4>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>
                                            {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {res.user && (
                                <div className="flex items-center gap-2 mt-3 sm:mt-0 pl-4 sm:pl-0 sm:border-l-0 border-l-2 border-muted sm:ml-0 ml-[4.5rem]">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={res.user.profile_picture_url} />
                                        <AvatarFallback>
                                            {res.user.first_name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {res.user.first_name} {res.user.last_name}
                                    </span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}


