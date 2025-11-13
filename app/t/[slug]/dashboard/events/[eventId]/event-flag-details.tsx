"use client"

import { AlertTriangle, Flag, Calendar, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { dismissEventFlag } from "@/app/actions/events"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface FlagDetail {
  id: string
  reason: string
  created_at: string
  flagged_by: string
  user: {
    id: string
    first_name: string | null
    last_name: string | null
    profile_picture_url: string | null
  } | null
}

interface EventFlagDetailsProps {
  flags: FlagDetail[]
  tenantSlug: string
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0) || ""
  const last = lastName?.charAt(0) || ""
  return (first + last).toUpperCase() || "U"
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function EventFlagDetails({ flags, tenantSlug }: EventFlagDetailsProps) {
  const router = useRouter()
  const [dismissingFlags, setDismissingFlags] = useState<Set<string>>(new Set())
  const [localFlags, setLocalFlags] = useState(flags)

  const handleDismiss = async (flagId: string) => {
    setDismissingFlags((prev) => new Set(prev).add(flagId))

    setLocalFlags((prev) => prev.filter((f) => f.id !== flagId))

    const result = await dismissEventFlag(flagId, tenantSlug)

    if (result.success) {
      toast.success("Flag dismissed successfully")
      router.refresh()
    } else {
      setLocalFlags(flags)
      toast.error(result.error || "Failed to dismiss flag")
    }

    setDismissingFlags((prev) => {
      const next = new Set(prev)
      next.delete(flagId)
      return next
    })
  }

  if (localFlags.length === 0) {
    return null
  }

  return (
    <Card className="p-6 border-destructive/50 bg-destructive/5">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-destructive">Event Flagged by Residents</h3>
            <p className="text-sm text-muted-foreground">
              This event has been flagged {localFlags.length} {localFlags.length === 1 ? "time" : "times"} for admin
              review
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          {localFlags.map((flag) => (
            <div key={flag.id} className="space-y-3 p-4 rounded-lg bg-background border relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDismiss(flag.id)}
                disabled={dismissingFlags.has(flag.id)}
                title="Dismiss this flag"
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="flex items-start justify-between gap-4 pr-10">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage
                      src={flag.user?.profile_picture_url || undefined}
                      alt={`${flag.user?.first_name || "User"}'s avatar`}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(flag.user?.first_name, flag.user?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    {flag.user ? (
                      <Link
                        href={`/t/${tenantSlug}/dashboard/neighbours/${flag.user.id}`}
                        className="font-medium text-sm hover:underline text-primary truncate block"
                      >
                        {flag.user.first_name} {flag.user.last_name}
                      </Link>
                    ) : (
                      <span className="font-medium text-sm text-muted-foreground">Unknown User</span>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(flag.created_at)}
                    </div>
                  </div>
                </div>
                <Badge variant="destructive" className="gap-1 flex-shrink-0">
                  <Flag className="h-3 w-3" />
                  Flagged
                </Badge>
              </div>
              <div className="pl-11">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{flag.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
