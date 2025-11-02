"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"

interface Neighborhood {
  id: string
  name: string
}

export default function CreateLotForm({ slug, neighborhoods }: { slug: string; neighborhoods: Neighborhood[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bulkCreate, setBulkCreate] = useState(false)
  const [formData, setFormData] = useState({
    lot_number: "",
    neighborhood_id: "",
    address: "",
    bulk_count: "1",
    bulk_prefix: "",
    bulk_start_number: "1",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createBrowserClient()

      if (bulkCreate) {
        const count = Number.parseInt(formData.bulk_count)
        const startNumber = Number.parseInt(formData.bulk_start_number) || 1
        const prefix = formData.bulk_prefix

        if (count < 1 || count > 100) {
          throw new Error("Bulk count must be between 1 and 100")
        }

        if (isNaN(startNumber)) {
          throw new Error("Starting number must be a valid number")
        }

        const lotsToInsert = []
        for (let i = 0; i < count; i++) {
          const lotNumber = `${prefix}${startNumber + i}`
          lotsToInsert.push({
            neighborhood_id: formData.neighborhood_id,
            lot_number: lotNumber,
            address: null,
          })
        }

        const { error: insertError } = await supabase.from("lots").insert(lotsToInsert)

        if (insertError) throw insertError
      } else {
        // Single lot creation
        const { error: insertError } = await supabase.from("lots").insert({
          neighborhood_id: formData.neighborhood_id,
          lot_number: formData.lot_number,
          address: formData.address || null,
        })

        if (insertError) throw insertError
      }

      setLoading(false)

      setFormData({
        lot_number: "",
        neighborhood_id: "",
        address: "",
        bulk_count: "1",
        bulk_prefix: "",
        bulk_start_number: "1",
      })

      router.push(`/t/${slug}/admin/lots`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to create lot(s)")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
        <Switch id="bulk-create" checked={bulkCreate} onCheckedChange={setBulkCreate} />
        <Label htmlFor="bulk-create" className="cursor-pointer">
          Bulk create multiple lots
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="neighborhood_id">Neighborhood *</Label>
        <Select
          value={formData.neighborhood_id}
          onValueChange={(value) => setFormData({ ...formData, neighborhood_id: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a neighborhood" />
          </SelectTrigger>
          <SelectContent>
            {neighborhoods.map((neighborhood) => (
              <SelectItem key={neighborhood.id} value={neighborhood.id}>
                {neighborhood.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {bulkCreate ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="bulk_count">Number of Lots *</Label>
            <Input
              id="bulk_count"
              type="number"
              min="1"
              max="100"
              value={formData.bulk_count}
              onChange={(e) => setFormData({ ...formData, bulk_count: e.target.value })}
              placeholder="e.g., 35"
              required
            />
            <p className="text-sm text-muted-foreground">Maximum 100 lots at once</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk_prefix">Naming Prefix *</Label>
            <Input
              id="bulk_prefix"
              value={formData.bulk_prefix}
              onChange={(e) => setFormData({ ...formData, bulk_prefix: e.target.value })}
              placeholder="e.g., F-"
              required
            />
            <p className="text-sm text-muted-foreground">Prefix for all lot numbers</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk_start_number">Starting Number *</Label>
            <Input
              id="bulk_start_number"
              type="number"
              min="1"
              value={formData.bulk_start_number}
              onChange={(e) => setFormData({ ...formData, bulk_start_number: e.target.value })}
              placeholder="e.g., 101"
              required
            />
            <p className="text-sm text-muted-foreground">
              Example: {formData.bulk_prefix || "F-"}
              {formData.bulk_start_number || "101"}, {formData.bulk_prefix || "F-"}
              {(Number.parseInt(formData.bulk_start_number) || 101) + 1}, {formData.bulk_prefix || "F-"}
              {(Number.parseInt(formData.bulk_start_number) || 101) + 2}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="lot_number">Lot Number *</Label>
            <Input
              id="lot_number"
              value={formData.lot_number}
              onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
              placeholder="e.g., A-101"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Optional physical address"
              rows={3}
            />
          </div>
        </>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {bulkCreate ? `Create ${formData.bulk_count} Lots` : "Create Lot"}
        </Button>
      </div>
    </form>
  )
}
