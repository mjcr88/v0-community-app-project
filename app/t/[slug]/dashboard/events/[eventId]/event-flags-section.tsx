"use client"

import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { adminUnflagEvent } from "@/app/actions/events"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface EventFlag {
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

interface EventFlagsSectionProps {
  flags: EventFlag[]
  eventId: string
  tenantId: string
  tenantSlug: string
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const first = firstName?.charAt(0) || ""
  const last = lastName?.charAt(0) || ""
  return (first + last).toUpperCase() || "U"
}

export function EventFlagsSection({ flags, eventId, tenantId, tenantSlug }: EventFlagsSectionProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemoveAllFlags = async () => {
    setIsRemoving(true)

    const result = await adminUnflagEvent(eventId, tenantId, tenantSlug)

    setIsRemoving(false)

    if (result.success) {
      toast({
        title: "Flags removed",
        description: "All flags have been removed from this event.",
      })
      router.refresh()
    } else {
      toast({
        title: "Failed to remove flags",
        description: result.error || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Flagged Event</CardTitle>
              <CardDescription>
                This event has been flagged {flags.length} {flags.length === 1 ? "time" : "times"} for admin review
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveAllFlags}
            disabled={isRemoving}
            className="shrink-0 bg-transparent"
          >
            <X className="h-4 w-4 mr-2" />
            {isRemoving ? "Removing..." : "Remove All Flags"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {flags.map((flag, index) => (
          <div key={flag.id} className="p-4 border rounded-lg bg-background">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={flag.user?.profile_picture_url || undefined} alt="User avatar" />
                  <AvatarFallback className="text-xs">
                    {getInitials(flag.user?.first_name, flag.user?.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="shrink-0">
                      Flag #{index + 1}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Flagged by{" "}
                    <span className="font-medium">
                      {flag.user?.first_name || "Unknown"} {flag.user?.last_name || "User"}
                    </span>{" "}
                    on{" "}
                    {new Date(flag.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm pl-11">{flag.reason}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
