"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Neighborhood {
  id: string
  name: string
}

interface Lot {
  id: string
  lot_number: string
  neighborhood_id: string
  address: string | null
}

export default function EditLotForm({
  slug,
  lot,
  neighborhoods,
}: {
  slug: string
  lot: Lot
  neighborhoods: Neighborhood[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    lot_number: lot.lot_number,
    neighborhood_id: lot.neighborhood_id,
    address: lot.address || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createBrowserClient()

      const { error: updateError } = await supabase
        .from("lots")
        .update({
          lot_number: formData.lot_number,
          neighborhood_id: formData.neighborhood_id,
          address: formData.address || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lot.id)

      if (updateError) throw updateError

      router.push(`/t/${slug}/admin/lots`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to update lot")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    setError(null)

    try {
      const supabase = createBrowserClient()

      const { error: deleteError } = await supabase.from("lots").delete().eq("id", lot.id)

      if (deleteError) throw deleteError

      router.push(`/t/${slug}/admin/lots`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to delete lot")
      setDeleteLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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

      <div className="flex gap-2 justify-between">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading || deleteLoading}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={loading || deleteLoading}>
                {deleteLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Lot</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete lot "{lot.lot_number}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="submit" disabled={loading || deleteLoading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  )
}
