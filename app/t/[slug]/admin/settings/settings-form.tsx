"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

type Tenant = {
  id: string
  name: string
  slug: string
  events_enabled?: boolean
}

export function SettingsForm({ tenant }: { tenant: Tenant }) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(false)
  const [eventsEnabled, setEventsEnabled] = useState(tenant.events_enabled ?? false)

  const handleSave = async () => {
    setLoading(true)

    try {
      const { error } = await supabase.from("tenants").update({ events_enabled: eventsEnabled }).eq("id", tenant.id)

      if (error) {
        console.error("[v0] Error saving settings:", error)
        alert("Failed to save settings")
        return
      }

      router.refresh()
    } catch (error) {
      console.error("[v0] Error:", error)
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Features</CardTitle>
        <CardDescription>Enable or disable features for your community</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Events</h3>
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="events" className="text-base font-medium">
                Community Events
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow residents to create and manage community events with RSVPs and calendar integration
              </p>
            </div>
            <Switch id="events" checked={eventsEnabled} onCheckedChange={setEventsEnabled} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
