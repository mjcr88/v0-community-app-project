"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Ban, Trash2, Flag } from "lucide-react"
import { CancelEventDialog } from "./cancel-event-dialog"
import { UncancelEventButton } from "./uncancel-event-button"
import { DeleteEventButton } from "./delete-event-button"
import { FlagEventDialog } from "./flag-event-dialog"

interface EventActionsMenuProps {
    eventId: string
    slug: string
    tenantId: string
    eventTitle: string
    eventStatus: string
    canManageEvent: boolean
    isCreator: boolean
    hasUserFlagged: boolean
    flagCount: number
    isTenantAdmin: boolean
    isSeries?: boolean
}

export function EventActionsMenu({
    eventId,
    slug,
    tenantId,
    eventTitle,
    eventStatus,
    canManageEvent,
    isCreator,
    hasUserFlagged,
    flagCount,
    isTenantAdmin,
    isSeries = false,
}: EventActionsMenuProps) {
    const [flagDialogOpen, setFlagDialogOpen] = useState(false)
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

    if (!canManageEvent && (eventStatus === "cancelled" || hasUserFlagged)) {
        return null
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {canManageEvent && eventStatus !== "cancelled" && (
                    <>
                        <DropdownMenuItem asChild>
                            <Link href={`/t/${slug}/dashboard/events/${eventId}/edit`} className="w-full cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Event
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setCancelDialogOpen(true)}>
                            <div className="flex w-full items-center text-destructive cursor-pointer">
                                <Ban className="mr-2 h-4 w-4" />
                                Cancel Event
                            </div>
                        </DropdownMenuItem>
                        {isCreator && (
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <DeleteEventButton
                                    eventId={eventId}
                                    tenantId={tenantId}
                                    tenantSlug={slug}
                                    eventTitle={eventTitle}
                                    isSeries={isSeries}
                                    customTrigger={
                                        <div className="flex w-full items-center px-2 py-1.5 text-sm text-destructive focus:bg-destructive/10 cursor-pointer">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Event
                                        </div>
                                    }
                                />
                            </DropdownMenuItem>
                        )}
                    </>
                )}

                {canManageEvent && eventStatus === "cancelled" && isTenantAdmin && (
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <UncancelEventButton eventId={eventId} tenantSlug={slug} />
                    </DropdownMenuItem>
                )}

                {eventStatus !== "cancelled" && (
                    <>
                        {canManageEvent && <DropdownMenuSeparator />}
                        <DropdownMenuItem onSelect={() => setFlagDialogOpen(true)}>
                            <div className="flex items-center w-full cursor-pointer">
                                <Flag className="mr-2 h-4 w-4" />
                                {hasUserFlagged ? "Flagged" : "Flag Event"}
                            </div>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>

            <CancelEventDialog
                eventId={eventId}
                tenantSlug={slug}
                eventTitle={eventTitle}
                isSeries={isSeries}
                open={cancelDialogOpen}
                onOpenChange={setCancelDialogOpen}
            />

            <FlagEventDialog
                eventId={eventId}
                tenantSlug={slug}
                initialFlagCount={flagCount}
                initialHasUserFlagged={hasUserFlagged}
                open={flagDialogOpen}
                onOpenChange={setFlagDialogOpen}
            />
        </DropdownMenu>
    )
}
