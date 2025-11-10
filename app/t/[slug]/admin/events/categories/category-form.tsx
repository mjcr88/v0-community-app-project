"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { createEventCategory, updateEventCategory } from "@/app/actions/event-categories"

type Category = {
  id: string
  name: string
  description: string | null
  icon: string | null
}

export function CategoryForm({
  tenantId,
  tenantSlug,
  category,
}: {
  tenantId: string
  tenantSlug: string
  category?: Category
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(category?.name || "")
  const [description, setDescription] = useState(category?.description || "")
  const [icon, setIcon] = useState(category?.icon || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (category) {
        await updateEventCategory(category.id, { name, description, icon })
      } else {
        await createEventCategory(tenantId, { name, description, icon })
      }

      router.push(`/t/${tenantSlug}/admin/events/categories`)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save category")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{category ? "Edit Category" : "Create Category"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Social, Maintenance, Educational"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this category"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <Input
              id="icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="e.g., calendar, users, wrench (lucide icon name)"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Optional: Enter a Lucide icon name (e.g., calendar, users, music)
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {category ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
