"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { markAsRead, archiveNotification } from "@/app/actions/notifications"
import { toast } from "sonner"
import type { NotificationFull } from "@/types/notifications"
import { formatDistanceToNow } from "date-fns"
import { Archive, Check, X } from 'lucide-react'
import { cn } from "@/lib/utils"

interface NotificationCardProps {
  notification: NotificationFull
  tenantSlug: string
  onUpdate?: () => void
}

export function NotificationCard({ notification, tenantSlug, onUpdate }: NotificationCardProps) {
  const actorName = notification.actor
    ? `${notification.actor.first_name} ${notification.actor.last_name}`
    : null
  const actorInitials = notification.actor
    ? `${notification.actor.first_name[0]}${notification.actor.last_name[0]}`
    : "?"

  const handleMarkAsRead = async () => {
    const result = await markAsRead(notification.id, tenantSlug)
    if (result.success) {
      toast.success("Marked as read")
      onUpdate?.()
    } else {
      toast.error(result.error || "Failed to mark as read")
    }
  }

  const handleArchive = async () => {
    const result = await archiveNotification(notification.id, tenantSlug)
    if (result.success) {
      toast.success("Archived")
      onUpdate?.()
    } else {
      toast.error(result.error || "Failed to archive")
    }
  }

  // Auto-mark as read when card is clicked
  const handleCardClick = () => {
    if (!notification.is_read) {
      handleMarkAsRead()
    }
  }

  return (
    <Card
      className={cn(
        "transition-colors cursor-pointer",
        !notification.is_read && "bg-accent/50 border-l-4 border-l-primary",
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          {/* Actor avatar and content */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {notification.actor && (
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={notification.actor.profile_picture_url || undefined} />
                <AvatarFallback>{actorInitials}</AvatarFallback>
              </Avatar>
            )}
            
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm leading-tight">{notification.title}</h3>
                {!notification.is_read && (
                  <Badge variant="secondary" className="text-xs">
                    New
                  </Badge>
                )}
                {notification.action_required && !notification.action_taken && (
                  <Badge variant="destructive" className="text-xs">
                    Action Required
                  </Badge>
                )}
                {notification.action_taken && notification.action_response && (
                  <>
                    {notification.action_response === 'confirmed' && (
                      <Badge variant="default" className="text-xs bg-green-600">
                        <Check className="mr-1 h-3 w-3" />
                        Confirmed
                      </Badge>
                    )}
                    {notification.action_response === 'rejected' && (
                      <Badge variant="secondary" className="text-xs">
                        <X className="mr-1 h-3 w-3" />
                        Declined
                      </Badge>
                    )}
                    {notification.action_response === 'approved' && (
                      <Badge variant="default" className="text-xs bg-green-600">
                        <Check className="mr-1 h-3 w-3" />
                        Approved
                      </Badge>
                    )}
                    {notification.action_response === 'declined' && (
                      <Badge variant="secondary" className="text-xs">
                        <X className="mr-1 h-3 w-3" />
                        Declined
                      </Badge>
                    )}
                  </>
                )}
              </div>

              {notification.message && (
                <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
              )}

              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {!notification.is_read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleMarkAsRead()
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleArchive()
              }}
            >
              <Archive className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Show listing thumbnail if exchange-related */}
      {notification.exchange_listing && notification.exchange_listing.hero_photo && (
        <CardContent className="pt-0">
          <div className="flex items-center gap-3">
            <img
              src={notification.exchange_listing.hero_photo || "/placeholder.svg"}
              alt={notification.exchange_listing.title}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{notification.exchange_listing.title}</p>
              {notification.exchange_listing.category && (
                <p className="text-xs text-muted-foreground">{notification.exchange_listing.category.name}</p>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
