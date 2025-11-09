"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Trash2, Map } from "lucide-react"
import Link from "next/link"
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

type Neighborhood = {
  id: string
  name: string
  description: string | null
}

export default function EditNeighborhoodForm({ slug, neighborhood }: { slug: string; neighborhood: Neighborhood }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: neighborhood.name,
    description: neighborhood.description || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createBrowserClient()

      const { error: updateError } = await supabase
        .from("neighborhoods")
        .update({
          name: formData.name,
          description: formData.description,
        })
        .eq("id", neighborhood.id)

      if (updateError) throw updateError

      router.push(`/t/${slug}/admin/neighborhoods`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to update neighborhood")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    setError(null)

    try {
      const supabase = createBrowserClient()

      const { error: deleteError } = await supabase.from("neighborhoods").delete().eq("id", neighborhood.id)

      if (deleteError) throw deleteError

      window.location.href = `/t/${slug}/admin/neighborhoods`
    } catch (err: any) {
      setError(err.message || "Failed to delete neighborhood")
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
        <Label htmlFor="name">Neighborhood Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., North Village"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description of the neighborhood"
          rows={4}
        />
      </div>

      <div className="flex gap-2 justify-between">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading || deleteLoading}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href={`/t/${slug}/admin/map/locations/create?neighborhoodId=${neighborhood.id}`}>
              <Map className="mr-2 h-4 w-4" />
              Add Location on Map
            </Link>
          </Button>
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
                <AlertDialogTitle>Delete Neighborhood</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{neighborhood.name}"? This action cannot be undone and will also
                  delete all lots in this neighborhood.
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
