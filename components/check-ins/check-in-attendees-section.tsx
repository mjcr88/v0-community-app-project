import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Check, HelpCircle } from "lucide-react"
import Link from "next/link"
import { getCheckInRsvps } from "@/app/actions/check-ins"

interface CheckInAttendeesSectionProps {
  checkInId: string
  tenantId: string
  tenantSlug: string
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const first = firstName?.charAt(0) || ""
  const last = lastName?.charAt(0) || ""
  return (first + last).toUpperCase() || "U"
}

function AttendeeCard({ attendee, tenantSlug }: { attendee: any; tenantSlug: string }) {
  const fullName = `${attendee.user.first_name || ""} ${attendee.user.last_name || ""}`.trim() || "Unknown User"

  return (
    <Link
      href={`/t/${tenantSlug}/dashboard/neighbours/${attendee.user.id}`}
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={attendee.user.profile_picture_url || undefined} alt={`${fullName}'s avatar`} />
        <AvatarFallback>{getInitials(attendee.user.first_name, attendee.user.last_name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{fullName}</p>
        {attendee.attending_count > 1 && (
          <p className="text-sm text-muted-foreground">+{attendee.attending_count - 1} guest(s)</p>
        )}
      </div>
    </Link>
  )
}

export async function CheckInAttendeesSection({ checkInId, tenantId, tenantSlug }: CheckInAttendeesSectionProps) {
  const result = await getCheckInRsvps(checkInId, tenantId)

  if (!result.success || !result.data) {
    return null
  }

  const attendees = result.data
  const totalAttendees = attendees.yes.length + attendees.maybe.length + attendees.no.length

  if (totalAttendees === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">Who's Coming</h3>
        <Badge variant="secondary">{totalAttendees} response(s)</Badge>
      </div>

      {/* Coming */}
      {attendees.yes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <h4 className="font-medium">Coming ({attendees.yes.length})</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attendees.yes.map((attendee: any) => (
              <AttendeeCard key={attendee.user.id} attendee={attendee} tenantSlug={tenantSlug} />
            ))}
          </div>
        </div>
      )}

      {/* Maybe */}
      {attendees.maybe.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-yellow-600" />
            <h4 className="font-medium">Maybe ({attendees.maybe.length})</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attendees.maybe.map((attendee: any) => (
              <AttendeeCard key={attendee.user.id} attendee={attendee} tenantSlug={tenantSlug} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
