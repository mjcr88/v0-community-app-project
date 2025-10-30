"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"

export function CreateInterestForm({ slug, tenantId }: { slug: string; tenantId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createBrowserClient()

    const { error } = await supabase.from("interests").insert({
      tenant_id: tenantId,
      name: formData.name,
      description: formData.description || null,
    })

    if (error) {
      console.error("Error creating interest:", error)
      setLoading(false)
      return
    }

    setFormData({ name: "", description: "" })
    setLoading(false)

    router.push(`/t/${slug}/admin/interests`)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interest Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Gardening, Cooking, Photography"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this interest"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/t/${slug}/admin/interests`)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner className="mr-2" />}
              {loading ? "Creating..." : "Create Interest"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
