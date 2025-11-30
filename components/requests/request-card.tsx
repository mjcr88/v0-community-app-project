"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { RequestStatusBadge } from "./request-status-badge"
import { RequestPriorityBadge } from "./request-priority-badge"
import { RequestTypeIcon } from "./request-type-icon"
import { formatDistanceToNow } from "date-fns"
import { MapPin, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ResidentRequestWithRelations } from "@/types/requests"

interface RequestCardProps {
    request: ResidentRequestWithRelations
    onClick?: () => void
}

const requestTypeLabels: Record<string, string> = {
    maintenance: "Maintenance",
    question: "Question",
    complaint: "Complaint",
    safety: "Safety Issue",
    other: "Other",
}

export function RequestCard({ request, onClick }: RequestCardProps) {
    return (
        <Card
            className={cn(
                "group h-full flex flex-col transition-all duration-200 hover:shadow-md cursor-pointer border-border/60",
                "hover:border-primary/50"
            )}
            onClick={onClick}
        >
            <CardHeader className="p-3 pb-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "h-7 w-7 rounded-md flex items-center justify-center",
                            "bg-muted group-hover:bg-primary/10 transition-colors"
                        )}>
                            <RequestTypeIcon type={request.request_type} className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                            {requestTypeLabels[request.request_type]}
                        </span>
                    </div>
                    <RequestPriorityBadge priority={request.priority} />
                </div>
                <h3 className="font-semibold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors pt-1">
                    {request.title}
                </h3>
            </CardHeader>

            <CardContent className="p-3 py-2 flex-1">
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {request.description}
                </p>

                <div className="flex flex-col gap-1 text-[10px] text-muted-foreground">
                    {(request.location || request.custom_location_name) && (
                        <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">
                                {request.location?.name || request.custom_location_name}
                            </span>
                        </div>
                    )}

                    {request.creator && !request.is_anonymous && (
                        <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>
                                {request.creator.first_name} {request.creator.last_name}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="p-3 pt-2 flex items-center justify-between border-t bg-muted/20 mt-auto">
                <RequestStatusBadge status={request.status} compact />
                <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                </span>
            </CardFooter>
        </Card>
    )
}
