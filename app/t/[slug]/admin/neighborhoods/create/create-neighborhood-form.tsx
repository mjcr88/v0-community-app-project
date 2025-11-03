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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Map } from "lucide-react"
import Link from "next/link"

export default function CreateNeighborhoodForm({ slug, tenantId }: { slug: string; tenantId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log("[v0] Starting neighborhood creation...")

    try {
      const supabase = createBrowserClient()

      console.log("[v0] Inserting neighborhood:", formData)

      const { error: insertError } = await supabase.from("neighborhoods").insert({
        tenant_id: tenantId,
        name: formData.name,
        description: formData.description,
      })

      if (insertError) {
        console.log("[v0] Insert error:", insertError)
        throw insertError
      }

      console.log("[v0] Neighborhood created successfully")

      setLoading(false)

      toast({
        title: "Success",
        description: "Neighborhood created successfully",
      })

      setFormData({
        name: "",
        description: "",
      })

      console.log("[v0] Redirecting to neighborhoods list...")
      router.push(`/t/${slug}/admin/neighborhoods`)
      router.refresh()
    } catch (err: any) {
      console.log("[v0] Error caught:", err)
      setError(err.message || "Failed to create neighborhood")
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

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/t/${slug}/admin/map/locations/create`}>
            <Map className="mr-2 h-4 w-4" />
            Add Location on Map
          </Link>
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Neighborhood
        </Button>
      </div>
    </form>
  )
}
