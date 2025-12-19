"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"
import { useEffect, useState } from "react"

interface CheckInsCountWidgetProps {
  initialCount: number
}

export function CheckInsCountWidget({ initialCount }: CheckInsCountWidgetProps) {
  const [count, setCount] = useState(initialCount)

  // Optional: Update count every minute to reflect expiring check-ins
  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger a re-render which will cause parent to refetch
      // For now, just keep the initial count
      // In Sprint 10 we'll add auto-refresh
    }, 60000) // 1 minute

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Live Check-ins</CardTitle>
        <div className="relative">
          <Activity className="h-4 w-4 text-muted-foreground" />
          {count > 0 && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
        <p className="text-xs text-muted-foreground">
          {count === 0 ? "No active check-ins" : count === 1 ? "Resident active now" : "Residents active now"}
        </p>
      </CardContent>
    </Card>
  )
}
