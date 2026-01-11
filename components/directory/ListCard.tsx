"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users } from "lucide-react"
import { cn } from "@/lib/utils"
// Import type from actions - effectively just type import
import type { NeighborList } from "@/app/actions/neighbor-lists"

interface ListCardProps {
    list: NeighborList
    onClick?: () => void
}

export function ListCard({ list, onClick }: ListCardProps) {
    const members = list.members || []

    // Create overlapping avatars effect
    const displayedMembers = members.slice(0, 5)
    const remainingCount = list.member_count > 5 ? list.member_count - 5 : 0

    return (
        <Card
            className="h-full hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden group border-muted"
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex gap-4 items-center">
                    {/* Emoji Icon */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-2xl group-hover:scale-105 transition-transform">
                        {list.emoji}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                        {/* Header */}
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-base truncate">{list.name}</h3>
                            {list.is_shared && (
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">
                                    Shared
                                </Badge>
                            )}
                        </div>

                        {/* Description */}
                        {list.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{list.description}</p>
                        )}

                        {/* Footer: Stats & Avatars */}
                        <div className="flex items-center justify-between pt-1">
                            {/* Member Count Badge */}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>{list.member_count} {list.member_count === 1 ? "neighbor" : "neighbors"}</span>
                            </div>

                            {/* Avatars */}
                            {members.length > 0 && (
                                <div className="flex -space-x-2">
                                    {displayedMembers.map((member) => (
                                        <Avatar key={member.id} className="h-6 w-6 border-2 border-background ring-offset-background">
                                            <AvatarImage src={member.profile_picture_url || ""} alt={`${member.first_name} ${member.last_name}`} />
                                            <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">
                                                {member.first_name[0]}{member.last_name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                    ))}
                                    {remainingCount > 0 && (
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[8px] font-medium text-muted-foreground ring-offset-background z-10">
                                            +{remainingCount}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
