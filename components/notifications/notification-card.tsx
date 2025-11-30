"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { markAsRead, archiveNotification } from "@/app/actions/notifications"
import { toast } from "sonner"
import type { NotificationFull } from "@/types/notifications"
import { formatDistanceToNow } from "date-fns"
import { Archive, Check, X, Megaphone, Users } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface NotificationCardProps {
  notification: NotificationFull
  tenantSlug: string
  onUpdate?: () => void
}

export function NotificationCard({ notification, tenantSlug, onUpdate }: NotificationCardProps) {
  const router = useRouter()

  const actorName = notification.actor
    ? `${notification.actor.first_name} ${notification.actor.last_name}`
    : null
  const actorInitials = notification.actor
    ? `${notification.actor.first_name[0]}${notification.actor.last_name[0]}`
    : "?"

  const handleMarkAsRead = async () => {
    const result = await markAsRead(notification.id, tenantSlug)
    if (result.success) {
      onUpdate?.()
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

    if (notification.action_url) {
      router.push(notification.action_url)
    } else if (notification.type === 'announcement' && notification.announcement_id) {
      router.push(`/t/${tenantSlug}/dashboard/announcements/${notification.announcement_id}`)
    }
  }

  const isAnnouncement = notification.type === 'announcement'

  return (
    <Card
      className={cn(
        "transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md rounded-lg overflow-hidden group",
        !notification.is_read ? "border-2 border-secondary" : "bg-card border-border",
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex gap-3">
          {/* Actor avatar and content */}
          <div className="flex-shrink-0">
            {notification.actor ? (
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={notification.actor.profile_picture_url || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground">{actorInitials}</AvatarFallback>
              </Avatar>
            ) : isAnnouncement ? (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm leading-tight text-foreground">{notification.title}</h3>
                  {!notification.is_read && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-secondary/10 text-secondary hover:bg-secondary/20 border-secondary/20">
                      New
                    </Badge>
                  )}
                  {notification.action_required && !notification.action_taken && (
                    <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                      Action Required
                    </Badge>
                  )}
                  {notification.action_taken && notification.action_response && (
                    <>
                      {notification.action_response === 'confirmed' && (
                        <Badge variant="default" className="text-[10px] h-5 px-1.5 bg-green-600 hover:bg-green-700">
                          <Check className="mr-1 h-3 w-3" />
                          Confirmed
                        </Badge>
                      )}
                      {notification.action_response === 'rejected' && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                          <X className="mr-1 h-3 w-3" />
                          Declined
                        </Badge>
                      )}
                      {notification.action_response === 'approved' && (
                        <Badge variant="default" className="text-[10px] h-5 px-1.5 bg-green-600 hover:bg-green-700">
                          <Check className="mr-1 h-3 w-3" />
                          Approved
                        </Badge>
                      )}
                      {notification.action_response === 'declined' && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                          <X className="mr-1 h-3 w-3" />
                          Declined
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleArchive()
                  }}
                  title="Archive"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {notification.message && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{notification.message}</p>
            )}

            {/* Show listing thumbnail if exchange-related */}
            {notification.exchange_listing && notification.exchange_listing.hero_photo && (
              <div className="flex items-center gap-3 p-2 rounded-md bg-muted/30 border border-border/50 mt-2">
                <img
                  src={notification.exchange_listing.hero_photo || "/placeholder.svg"}
                  alt={notification.exchange_listing.title}
                  className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{notification.exchange_listing.title}</p>
                  {notification.exchange_listing.category && (
                    <p className="text-xs text-muted-foreground">{notification.exchange_listing.category.name}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

