"use client"

import { Card, CardContent } from "@/components/ui/card"
import { EyeOff } from "lucide-react"

interface PrivacyMessageProps {
    icon?: React.ReactNode
    message?: string
}

export function PrivacyMessage({
    icon,
    message = "This information is private"
}: PrivacyMessageProps) {
    return (
        <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-6 text-center">
                {icon || <EyeOff className="h-8 w-8 mx-auto text-muted-foreground mb-2" />}
                <p className="text-sm text-muted-foreground">
                    {message}
                </p>
            </CardContent>
        </Card>
    )
}
