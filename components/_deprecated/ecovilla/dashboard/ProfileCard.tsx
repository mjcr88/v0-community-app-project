import { Card, CardContent } from "@/components/library/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/library/avatar"
import { MapPin } from "lucide-react"

interface ProfileCardProps {
    user: {
        name: string
        username: string
        avatarUrl?: string
        neighborhood?: string
        lot?: string
    }
    checkIn?: {
        location: string
        timestamp: string
    }
}

export function ProfileCard({ user, checkIn }: ProfileCardProps) {
    return (
        <Card className="overflow-hidden h-full">
            <div className="h-16 bg-gradient-to-r from-blue-400 to-teal-400" />
            <CardContent className="relative pt-0 pb-4 px-4 text-center flex flex-col items-center h-full">
                <div className="relative -mt-8 mb-3">
                    <Avatar className="h-16 w-16 border-4 border-background shadow-md">
                        <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                        <AvatarFallback className="text-lg bg-muted">
                            {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>

                <div className="space-y-1 mb-3">
                    <h3 className="font-bold text-lg leading-tight">{user.name}</h3>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                    {(user.neighborhood || user.lot) && (
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-1">
                            {user.neighborhood && <span>{user.neighborhood}</span>}
                            {user.neighborhood && user.lot && <span>•</span>}
                            {user.lot && <span>{user.lot}</span>}
                        </div>
                    )}
                </div>

                {checkIn ? (
                    <div className="mt-auto inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                        </span>
                        <span className="font-medium truncate max-w-[150px]">{checkIn.location}</span>
                    </div>
                ) : (
                    <div className="mt-auto inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 text-muted-foreground rounded-full text-xs">
                        <MapPin className="w-3 h-3" />
                        <span>Not checked in</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
