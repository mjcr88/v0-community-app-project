"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Settings2 } from "lucide-react"
import { updateTenantMapSettings } from "@/lib/location-utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface MapSettingsDialogProps {
  tenantId: string
  currentCenter: { lat: number; lng: number } | null
  currentZoom: number | null
}

export function MapSettingsDialog({ tenantId, currentCenter, currentZoom }: MapSettingsDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [lat, setLat] = useState(currentCenter?.lat?.toString() || "")
  const [lng, setLng] = useState(currentCenter?.lng?.toString() || "")
  const [zoom, setZoom] = useState(currentZoom?.toString() || "14")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)

    const latNum = Number.parseFloat(lat)
    const lngNum = Number.parseFloat(lng)
    const zoomNum = Number.parseInt(zoom)

    if (isNaN(latNum) || isNaN(lngNum) || isNaN(zoomNum)) {
      toast.error("Please enter valid numbers for all fields")
      setSaving(false)
      return
    }

    const result = await updateTenantMapSettings(tenantId, { lat: latNum, lng: lngNum }, zoomNum)

    if (result.success) {
      toast.success("Map settings updated successfully")
      setOpen(false)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to update map settings")
    }

    setSaving(false)
  }

  const handleClear = async () => {
    setSaving(true)

    const result = await updateTenantMapSettings(tenantId, null, null)

    if (result.success) {
      toast.success("Map settings cleared - will auto-calculate from locations")
      setLat("")
      setLng("")
      setZoom("14")
      setOpen(false)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to clear map settings")
    }

    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Map Settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Map Center Settings</DialogTitle>
          <DialogDescription>
            Set the default center point and zoom level for your community map. Leave empty to auto-calculate from
            locations.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lat">Latitude</Label>
            <Input
              id="lat"
              type="number"
              step="0.000001"
              placeholder="e.g., 9.9567"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng">Longitude</Label>
            <Input
              id="lng"
              type="number"
              step="0.000001"
              placeholder="e.g., -84.5333"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zoom">Default Zoom (10-18)</Label>
            <Input
              id="zoom"
              type="number"
              min="10"
              max="18"
              placeholder="e.g., 14"
              value={zoom}
              onChange={(e) => setZoom(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClear} disabled={saving}>
            Clear (Auto-calculate)
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
